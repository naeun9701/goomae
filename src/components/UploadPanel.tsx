import React, { useState } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { QuoteRecord, QuoteStatus } from '../types';
import { SAMPLE_QUOTES } from '../data/sampleQuotes';
import { Upload, FileText, Clipboard, Sparkles, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface UploadPanelProps {
  onLoadQuotes: (quotes: QuoteRecord[]) => void;
  onOpenAddModal: () => void;
}

export const UploadPanel: React.FC<UploadPanelProps> = ({ onLoadQuotes, onOpenAddModal }) => {
  const [pasteText, setPasteText] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Helper to map parsed rows to QuoteRecord
  const processRows = (rows: any[]): QuoteRecord[] => {
    return rows.map((row, index) => {
      // Normalize keys by trimming and lowercasing/matching
      const getVal = (keys: string[]) => {
        for (const k of keys) {
          if (row[k] !== undefined && row[k] !== null && row[k] !== '') {
            return row[k];
          }
          // Case-insensitive search
          const foundKey = Object.keys(row).find(
            ogKey => ogKey.trim().toLowerCase() === k.toLowerCase()
          );
          if (foundKey && row[foundKey] !== undefined && row[foundKey] !== null && row[foundKey] !== '') {
            return row[foundKey];
          }
        }
        return null;
      };

      const quote_id = String(getVal(['quote_id', '견적번호', 'id']) || `QT-${String(index + 1).padStart(3, '0')}`);
      const pr_no = String(getVal(['pr_no', 'PR번호', 'pr', '구매요청번호']) || 'PR-2026-001');
      const item_code = String(getVal(['item_code', '품목코드', 'code']) || 'IT-001');
      const item_name = String(getVal(['item_name', '품목명', 'name']) || '품목명 미지정');
      const supplier = String(getVal(['supplier', '공급사', '업체명']) || '미지정 공급사');
      const unit = String(getVal(['unit', '단위']) || 'EA');
      
      const rawQty = getVal(['qty', '수량']);
      const qty = rawQty !== null ? Number(String(rawQty).replace(/,/g, '')) : 1;

      const rawPrice = getVal(['unit_price', '단가', '견적단가', 'price']);
      let unit_price: number | null = null;
      if (rawPrice !== null && rawPrice !== undefined && String(rawPrice).trim() !== '') {
        const cleaned = Number(String(rawPrice).replace(/,/g, '').trim());
        unit_price = isNaN(cleaned) ? null : cleaned;
      }

      const currency = String(getVal(['currency', '통화']) || 'KRW');
      const quote_date = String(getVal(['quote_date', '견적일자', '견적일']) || '2026-08-01');
      const required_date = String(getVal(['required_date', '필요일자', '요청일']) || '2026-09-01');
      
      const rawPromised = getVal(['promised_date', '약속납기', '납기일', '납기']);
      let promised_date: string | null = null;
      if (rawPromised !== null && rawPromised !== undefined && String(rawPromised).trim() !== '' && String(rawPromised).trim() !== '-') {
        promised_date = String(rawPromised).trim();
      }

      const rawStatus = String(getVal(['status', '상태', '발주여부']) || '견적');
      const status = (rawStatus.includes('발주') ? '발주' : '견적') as QuoteStatus;
      
      const remark = getVal(['remark', '비고', '특이사항']);

      return {
        quote_id,
        pr_no,
        item_code,
        item_name,
        supplier,
        unit,
        qty: isNaN(qty) ? 1 : qty,
        unit_price,
        currency,
        quote_date,
        required_date,
        promised_date,
        status,
        remark: remark ? String(remark) : null
      };
    }).filter(q => q.pr_no && q.item_code);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorMsg(null);

    const fileName = file.name.toLowerCase();
    if (fileName.endsWith('.csv')) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          try {
            const parsed = processRows(results.data);
            if (parsed.length === 0) {
              setErrorMsg('CSV 파일에서 유효한 데이터를 읽지 못했습니다.');
              return;
            }
            onLoadQuotes(parsed);
          } catch (err: any) {
            setErrorMsg(`CSV 파싱 오류: ${err.message}`);
          }
        },
        error: (err) => {
          setErrorMsg(`CSV 읽기 오류: ${err.message}`);
        }
      });
    } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const data = evt.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const json = XLSX.utils.sheet_to_json(worksheet);
          const parsed = processRows(json);
          if (parsed.length === 0) {
            setErrorMsg('엑셀 파일에서 유효한 데이터를 읽지 못했습니다.');
            return;
          }
          onLoadQuotes(parsed);
        } catch (err: any) {
          setErrorMsg(`엑셀 파싱 오류: ${err.message}`);
        }
      };
      reader.readAsBinaryString(file);
    } else {
      setErrorMsg('지원하지 않는 파일 형식입니다. CSV 또는 XLSX 파일을 선택해주세요.');
    }
  };

  const handlePasteSubmit = () => {
    if (!pasteText.trim()) {
      setErrorMsg('붙여넣을 텍스트가 없습니다.');
      return;
    }
    setErrorMsg(null);
    Papa.parse(pasteText, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const parsed = processRows(results.data);
          if (parsed.length === 0) {
            setErrorMsg('텍스트에서 유효한 데이터를 파싱할 수 없습니다. CSV 형식(헤더 포함)을 확인해주세요.');
            return;
          }
          onLoadQuotes(parsed);
        } catch (err: any) {
          setErrorMsg(`텍스트 파싱 오류: ${err.message}`);
        }
      },
      error: (err) => {
        setErrorMsg(`텍스트 파싱 실패: ${err.message}`);
      }
    });
  };

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 mb-4 shadow-sm">
          <FileText className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">구매 견적 비교·납기 판정기</h1>
        <p className="text-slate-600 mt-2 max-w-xl mx-auto">
          ERP에서 내보낸 구매요청(PR)별 복수 공급사 견적 데이터를 반입하여 최저가 후보, 단가 이상치, 납기 지연 및 품목명 표기 상이를 자동으로 판정합니다.
        </p>
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-3 text-sm">
          <AlertTriangle className="w-5 h-5 shrink-0 text-red-500" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Sample Data Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between hover:border-indigo-300 transition-all">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
                <Sparkles className="w-3.5 h-3.5" /> 표준 샘플 데이터
              </span>
              <span className="text-xs text-slate-500">PRD 검증용 80건</span>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-1">기본 제공 샘플 데이터 로드</h3>
            <p className="text-sm text-slate-500 mb-6">
              PRD에 정의된 80건의 구매 견적 및 발주 데이터(이상치 2건, 납기 지연/임박 분포 포함)를 즉시 불러와 검증을 시작합니다.
            </p>
          </div>
          <button
            onClick={() => onLoadQuotes(SAMPLE_QUOTES)}
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" /> 샘플 데이터로 시작하기 (80건)
          </button>
        </div>

        {/* File Upload Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between hover:border-indigo-300 transition-all">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">
                <Upload className="w-3.5 h-3.5" /> 파일 업로드
              </span>
              <span className="text-xs text-slate-500">CSV / XLSX</span>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-1">ERP 견적 파일 반입</h3>
            <p className="text-sm text-slate-500 mb-6">
              보유하고 계신 구매 견적 CSV 또는 엑셀(XLSX) 파일을 드래그하거나 선택하여 반입하세요.
            </p>
          </div>
          <label className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer">
            <Upload className="w-4 h-4" /> 파일 선택하기
            <input type="file" accept=".csv, .xlsx, .xls" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>
      </div>

      {/* Paste & Direct Input Section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <Clipboard className="w-4 h-4 text-indigo-600" /> 텍스트 붙여넣기 반입
          </h3>
          <button
            onClick={onOpenAddModal}
            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium hover:underline cursor-pointer"
          >
            + 견적 단건 직접 등록하기
          </button>
        </div>
        <p className="text-xs text-slate-500 mb-3">
          ERP 테이블이나 스프레드시트에서 복사한 데이터를 헤더 포함하여 탭 또는 쉼표 구분으로 붙여넣으세요.
        </p>
        <textarea
          value={pasteText}
          onChange={(e) => setPasteText(e.target.value)}
          placeholder={`quote_id,pr_no,item_code,item_name,supplier,unit,qty,unit_price,currency,quote_date,required_date,promised_date,status,remark\nQT-001,PR-2026-001,IT-001,MTBE 수입품,유진테크,t,5,,KRW,2026-08-05,2026-09-07,2026-08-29,견적,`}
          rows={5}
          className="w-full font-mono text-xs p-3 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 mb-3 bg-slate-50"
        />
        <div className="flex justify-end">
          <button
            onClick={handlePasteSubmit}
            className="py-2 px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl text-sm transition-all cursor-pointer"
          >
            붙여넣은 데이터 파싱하기
          </button>
        </div>
      </div>
    </div>
  );
};
