import React from 'react';
import { EvaluatedQuoteRecord } from '../types';
import { Award, AlertTriangle, Layers, ExternalLink, Edit2, Trash2 } from 'lucide-react';

interface QuoteTableProps {
  quotes: EvaluatedQuoteRecord[];
  isGroupedByPr: boolean;
  onSelectPr: (prNo: string) => void;
  onEditQuote: (quote: EvaluatedQuoteRecord) => void;
  onDeleteQuote: (quoteId: string) => void;
}

export const QuoteTable: React.FC<QuoteTableProps> = ({
  quotes,
  isGroupedByPr,
  onSelectPr,
  onEditQuote,
  onDeleteQuote,
}) => {
  if (quotes.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
        <div className="text-slate-400 mb-2 font-medium">검색 결과가 없거나 반입된 데이터가 없습니다.</div>
        <p className="text-xs text-slate-400">필터 조건을 변경하거나 새로운 견적 데이터를 반입해 주세요.</p>
      </div>
    );
  }

  // If grouped by PR
  if (isGroupedByPr) {
    const prGroups: Record<string, EvaluatedQuoteRecord[]> = {};
    quotes.forEach(q => {
      if (!prGroups[q.pr_no]) prGroups[q.pr_no] = [];
      prGroups[q.pr_no].push(q);
    });

    return (
      <div className="space-y-6">
        {Object.entries(prGroups).map(([prNo, group]) => {
          const first = group[0];
          const hasAnomaly = group.some(g => g.priceState === '이상치' || g.isNameMismatch);
          const hasDelayed = group.some(g => g.deliveryState === '지연');
          const hasImminent = group.some(g => g.deliveryState === '임박');

          return (
            <div key={prNo} className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              {/* PR Header */}
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-slate-900 text-base">{prNo}</span>
                  <span className="text-sm font-medium text-slate-600 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                    {first.item_code} / {first.item_name}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">수량: {first.qty} {first.unit}</span>
                  {first.isNameMismatch && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                      <Layers className="w-3 h-3" /> 표기 상이
                    </span>
                  )}
                  {hasDelayed && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700">납기 지연</span>
                  )}
                  {hasImminent && !hasDelayed && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700">납기 임박</span>
                  )}
                </div>
                <button
                  onClick={() => onSelectPr(prNo)}
                  className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> 공급사 비교표 상세보기
                </button>
              </div>

              {/* Quotes inside PR */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100/70 text-slate-500 font-semibold uppercase tracking-wider">
                      <th className="py-3 px-4">견적ID</th>
                      <th className="py-3 px-4">공급사</th>
                      <th className="py-3 px-4 text-right">견적단가 (KRW)</th>
                      <th className="py-3 px-4 text-center">중앙값 대비</th>
                      <th className="py-3 px-4">견적일</th>
                      <th className="py-3 px-4">약속납기</th>
                      <th className="py-3 px-4 text-center">납기판정</th>
                      <th className="py-3 px-4 text-center">상태</th>
                      <th className="py-3 px-4 text-right">관리</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {group.map(q => (
                      <tr key={q.quote_id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono font-medium text-slate-700">{q.quote_id}</td>
                        <td className="py-3 px-4 font-medium text-slate-900 flex items-center gap-2">
                          {q.supplier}
                          {q.isLowestPrice && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                              <Award className="w-3 h-3 text-blue-600" /> 최저가
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                          {q.unit_price !== null ? q.unit_price.toLocaleString() : <span className="text-slate-400 font-normal">미기재</span>}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {q.deviationPercent !== null ? (
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-md font-medium ${
                              q.priceState === '이상치' ? 'bg-red-50 text-red-700 border border-red-200' : 'text-slate-600'
                            }`}>
                              {q.deviationPercent > 0 ? `+${q.deviationPercent}%` : `${q.deviationPercent}%`}
                              {q.priceState === '이상치' && <span className="ml-1 text-[10px] font-bold text-red-600">이상치</span>}
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-600 font-mono">{q.quote_date}</td>
                        <td className="py-3 px-4 text-slate-600 font-mono">
                          {q.promised_date || <span className="text-slate-400">미기재</span>}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                            q.deliveryState === '지연' ? 'bg-red-100 text-red-700' :
                            q.deliveryState === '임박' ? 'bg-amber-100 text-amber-800' :
                            q.deliveryState === '정상' ? 'bg-emerald-100 text-emerald-800' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {q.dDayString !== '-' ? `${q.dDayString} (${q.deliveryState})` : q.deliveryState}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-bold ${
                            q.status === '발주' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-200 text-slate-700'
                          }`}>
                            {q.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => onEditQuote(q)} className="p-1 hover:bg-slate-200 rounded text-slate-600 transition-colors cursor-pointer" title="수정">
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => onDeleteQuote(q.quote_id)} className="p-1 hover:bg-red-100 rounded text-red-600 transition-colors cursor-pointer" title="삭제">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Flat list view
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-100/70 text-slate-500 font-semibold uppercase tracking-wider">
              <th className="py-3.5 px-4">PR번호</th>
              <th className="py-3.5 px-4">견적ID</th>
              <th className="py-3.5 px-4">품목코드 / 품목명</th>
              <th className="py-3.5 px-4">공급사</th>
              <th className="py-3.5 px-4 text-right">단가 (KRW)</th>
              <th className="py-3.5 px-4 text-center">편차율</th>
              <th className="py-3.5 px-4">견적일</th>
              <th className="py-3.5 px-4">약속납기</th>
              <th className="py-3.5 px-4 text-center">납기판정</th>
              <th className="py-3.5 px-4 text-center">상태</th>
              <th className="py-3.5 px-4 text-right">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {quotes.map(q => (
              <tr key={q.quote_id} className="hover:bg-slate-50/80 transition-colors">
                <td className="py-3 px-4 font-mono font-bold text-indigo-600">
                  <button onClick={() => onSelectPr(q.pr_no)} className="hover:underline cursor-pointer flex items-center gap-1">
                    {q.pr_no}
                  </button>
                </td>
                <td className="py-3 px-4 font-mono text-slate-600">{q.quote_id}</td>
                <td className="py-3 px-4">
                  <div className="font-medium text-slate-900 flex items-center gap-1.5">
                    {q.item_name}
                    {q.isNameMismatch && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-purple-50 text-purple-700 border border-purple-200 font-semibold" title="동일 품목코드 내 품목명 표기 상이">
                        표기상이
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">{q.item_code} ({q.qty}{q.unit})</div>
                </td>
                <td className="py-3 px-4 font-medium text-slate-900 flex items-center gap-2">
                  {q.supplier}
                  {q.isLowestPrice && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                      <Award className="w-3 h-3 text-blue-600" /> 최저가
                    </span>
                  )}
                </td>
                <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                  {q.unit_price !== null ? q.unit_price.toLocaleString() : <span className="text-slate-400 font-normal">미기재</span>}
                </td>
                <td className="py-3 px-4 text-center">
                  {q.deviationPercent !== null ? (
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md font-medium ${
                      q.priceState === '이상치' ? 'bg-red-50 text-red-700 border border-red-200' : 'text-slate-600'
                    }`}>
                      {q.deviationPercent > 0 ? `+${q.deviationPercent}%` : `${q.deviationPercent}%`}
                      {q.priceState === '이상치' && <span className="ml-1 text-[10px] font-bold text-red-600">이상치</span>}
                    </span>
                  ) : (
                    <span className="text-slate-400">-</span>
                  )}
                </td>
                <td className="py-3 px-4 text-slate-600 font-mono">{q.quote_date}</td>
                <td className="py-3 px-4 text-slate-600 font-mono">
                  {q.promised_date || <span className="text-slate-400">미기재</span>}
                </td>
                <td className="py-3 px-4 text-center">
                  <span className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                    q.deliveryState === '지연' ? 'bg-red-100 text-red-700' :
                    q.deliveryState === '임박' ? 'bg-amber-100 text-amber-800' :
                    q.deliveryState === '정상' ? 'bg-emerald-100 text-emerald-800' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {q.dDayString !== '-' ? `${q.dDayString} (${q.deliveryState})` : q.deliveryState}
                  </span>
                </td>
                <td className="py-3 px-4 text-center">
                  <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-bold ${
                    q.status === '발주' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {q.status}
                  </span>
                </td>
                <td className="py-3 px-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => onEditQuote(q)} className="p-1 hover:bg-slate-200 rounded text-slate-600 transition-colors cursor-pointer" title="수정">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => onDeleteQuote(q.quote_id)} className="p-1 hover:bg-red-100 rounded text-red-600 transition-colors cursor-pointer" title="삭제">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
