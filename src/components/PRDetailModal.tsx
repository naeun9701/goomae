import React, { useState } from 'react';
import { EvaluatedQuoteRecord } from '../types';
import { X, Copy, Check, Award, AlertTriangle, ArrowRightLeft } from 'lucide-react';

interface PRDetailModalProps {
  prNo: string;
  quotes: EvaluatedQuoteRecord[];
  onClose: () => void;
  onToggleStatus: (quoteId: string, currentStatus: '견적' | '발주') => void;
}

export const PRDetailModal: React.FC<PRDetailModalProps> = ({
  prNo,
  quotes,
  onClose,
  onToggleStatus,
}) => {
  const [copied, setCopied] = useState(false);
  const prQuotes = quotes.filter(q => q.pr_no === prNo);
  if (prQuotes.length === 0) return null;

  const first = prQuotes[0];

  const handleCopyClipboard = () => {
    let text = `[구매요청 비교표] PR번호: ${prNo}\n품목: ${first.item_code} - ${first.item_name} (수량: ${first.qty} ${first.unit})\n\n`;
    text += `공급사\t견적단가(KRW)\t편차율\t견적일\t약속납기\t납기판정\t상태\t최저가여부\n`;
    prQuotes.forEach(q => {
      text += `${q.supplier}\t${q.unit_price ?? '-'}\t${q.deviationPercent !== null ? q.deviationPercent + '%' : '-'}\t${q.quote_date}\t${q.promised_date || '-'}\t${q.deliveryState}\t${q.status}\t${q.isLowestPrice ? '최저가' : ''}\n`;
    });

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-slate-900">{prNo}</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700">
                {first.item_code}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">품목명: <strong className="text-slate-700">{first.item_name}</strong> (수량: {first.qty} {first.unit})</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyClipboard}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-medium flex items-center gap-1.5 transition-all cursor-pointer"
              title="비교표 텍스트 클립보드 복사"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              {copied ? '복사완료!' : '비교표 복사'}
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-200 rounded-xl text-slate-500 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          <div className="text-xs text-slate-500 mb-2">
            동일 구매요청(PR)에 접수된 공급사별 견적 단가 및 납기 비교 내역입니다. 최저가 후보 및 이상치 여부를 확인하세요.
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/70 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">견적ID</th>
                  <th className="py-3 px-4">공급사</th>
                  <th className="py-3 px-4 text-right">견적단가 (KRW)</th>
                  <th className="py-3 px-4 text-center">중앙값 대비 편차</th>
                  <th className="py-3 px-4">견적 접수일</th>
                  <th className="py-3 px-4">약속 납기일</th>
                  <th className="py-3 px-4 text-center">납기 판정</th>
                  <th className="py-3 px-4 text-center">현재 상태</th>
                  <th className="py-3 px-4 text-center">발주 전환</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {prQuotes.map(q => (
                  <tr key={q.quote_id} className={`hover:bg-slate-50 transition-colors ${q.isLowestPrice ? 'bg-blue-50/40' : ''}`}>
                    <td className="py-3.5 px-4 font-mono text-slate-700">{q.quote_id}</td>
                    <td className="py-3.5 px-4 font-medium text-slate-900 flex items-center gap-2">
                      {q.supplier}
                      {q.isLowestPrice && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          <Award className="w-3 h-3 text-blue-600" /> 최저가 추천
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                      {q.unit_price !== null ? q.unit_price.toLocaleString() : <span className="text-slate-400 font-normal">미기재</span>}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {q.deviationPercent !== null ? (
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md font-medium ${
                          q.priceState === '이상치' ? 'bg-red-50 text-red-700 border border-red-200' : 'text-slate-600'
                        }`}>
                          {q.deviationPercent > 0 ? `+${q.deviationPercent}%` : `${q.deviationPercent}%`}
                          {q.priceState === '이상치' && <span className="ml-1 text-[10px] font-bold text-red-600">이상치 경고</span>}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-mono">{q.quote_date}</td>
                    <td className="py-3.5 px-4 text-slate-600 font-mono">
                      {q.promised_date || <span className="text-slate-400">미기재</span>}
                      {q.isExceedRequiredDate && (
                        <span className="block text-[10px] text-amber-600 font-semibold mt-0.5">필요일 초과</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                        q.deliveryState === '지연' ? 'bg-red-100 text-red-700' :
                        q.deliveryState === '임박' ? 'bg-amber-100 text-amber-800' :
                        q.deliveryState === '정상' ? 'bg-emerald-100 text-emerald-800' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {q.dDayString !== '-' ? `${q.dDayString} (${q.deliveryState})` : q.deliveryState}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-bold ${
                        q.status === '발주' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {q.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => onToggleStatus(q.quote_id, q.status)}
                        className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                          q.status === '발주'
                            ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200'
                            : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200'
                        }`}
                      >
                        {q.status === '발주' ? '견적으로 변경' : '발주로 지정'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Remarks */}
          {prQuotes.some(q => q.remark) && (
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <h4 className="text-xs font-semibold text-slate-700 mb-2">비고 및 특이사항</h4>
              <ul className="space-y-1 text-xs text-slate-600">
                {prQuotes.filter(q => q.remark).map(q => (
                  <li key={q.quote_id} className="flex items-center gap-2">
                    <span className="font-mono font-semibold text-indigo-600">{q.supplier}:</span>
                    <span>{q.remark}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-medium transition-all cursor-pointer"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
