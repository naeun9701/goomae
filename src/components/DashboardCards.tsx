import React from 'react';
import { EvaluatedQuoteRecord } from '../types';
import { AlertCircle, Clock, AlertTriangle, FileQuestion, Layers, CheckCircle2 } from 'lucide-react';

interface DashboardCardsProps {
  evaluatedQuotes: EvaluatedQuoteRecord[];
  currentDeliveryFilter: string;
  currentAnomalyFilter: string;
  onSelectDeliveryFilter: (val: string) => void;
  onSelectAnomalyFilter: (val: string) => void;
}

export const DashboardCards: React.FC<DashboardCardsProps> = ({
  evaluatedQuotes,
  currentDeliveryFilter,
  currentAnomalyFilter,
  onSelectDeliveryFilter,
  onSelectAnomalyFilter,
}) => {
  const totalCount = evaluatedQuotes.length;
  const orderedQuotes = evaluatedQuotes.filter(q => q.status === '발주');
  
  const delayedCount = orderedQuotes.filter(q => q.deliveryState === '지연').length;
  const imminentCount = orderedQuotes.filter(q => q.deliveryState === '임박').length;
  const normalCount = orderedQuotes.filter(q => q.deliveryState === '정상').length;
  
  const anomalyCount = evaluatedQuotes.filter(q => q.priceState === '이상치').length;
  const mismatchCount = evaluatedQuotes.filter(q => q.isNameMismatch).length;
  const missingCount = evaluatedQuotes.filter(q => q.unit_price === null || q.promised_date === null).length;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
      {/* 1. 지연 납기 */}
      <div
        onClick={() => onSelectDeliveryFilter(currentDeliveryFilter === '지연' ? '전체' : '지연')}
        className={`bg-white p-4 rounded-xl border transition-all cursor-pointer shadow-xs hover:shadow-md ${
          currentDeliveryFilter === '지연' ? 'border-red-500 ring-2 ring-red-500/20 bg-red-50/30' : 'border-slate-200 hover:border-red-300'
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-500">납기 지연 (발주)</span>
          <div className="p-1.5 bg-red-50 text-red-600 rounded-lg">
            <AlertCircle className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold text-red-600">{delayedCount}건</div>
        <div className="text-[11px] text-slate-400 mt-1">기준일(08-27) 초과</div>
      </div>

      {/* 2. 임박 납기 */}
      <div
        onClick={() => onSelectDeliveryFilter(currentDeliveryFilter === '임박' ? '전체' : '임박')}
        className={`bg-white p-4 rounded-xl border transition-all cursor-pointer shadow-xs hover:shadow-md ${
          currentDeliveryFilter === '임박' ? 'border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/30' : 'border-slate-200 hover:border-amber-300'
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-500">납기 임박 (0~7일)</span>
          <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
            <Clock className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold text-amber-600">{imminentCount}건</div>
        <div className="text-[11px] text-slate-400 mt-1">즉시 점검 필요</div>
      </div>

      {/* 3. 정상 납기 */}
      <div
        onClick={() => onSelectDeliveryFilter(currentDeliveryFilter === '정상' ? '전체' : '정상')}
        className={`bg-white p-4 rounded-xl border transition-all cursor-pointer shadow-xs hover:shadow-md ${
          currentDeliveryFilter === '정상' ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/30' : 'border-slate-200 hover:border-emerald-300'
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-500">납기 정상</span>
          <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold text-emerald-600">{normalCount}건</div>
        <div className="text-[11px] text-slate-400 mt-1">여유 있음 (8일+)</div>
      </div>

      {/* 4. 단가 이상치 */}
      <div
        onClick={() => onSelectAnomalyFilter(currentAnomalyFilter === '이상치' ? '전체' : '이상치')}
        className={`bg-white p-4 rounded-xl border transition-all cursor-pointer shadow-xs hover:shadow-md ${
          currentAnomalyFilter === '이상치' ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/30' : 'border-slate-200 hover:border-rose-300'
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-500">단가 이상치</span>
          <div className="p-1.5 bg-rose-50 text-rose-600 rounded-lg">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold text-rose-600">{anomalyCount}건</div>
        <div className="text-[11px] text-slate-400 mt-1">중앙값 대비 ±30% 초과</div>
      </div>

      {/* 5. 표기 상이 */}
      <div
        onClick={() => onSelectAnomalyFilter(currentAnomalyFilter === '표기상이' ? '전체' : '표기상이')}
        className={`bg-white p-4 rounded-xl border transition-all cursor-pointer shadow-xs hover:shadow-md ${
          currentAnomalyFilter === '표기상이' ? 'border-purple-500 ring-2 ring-purple-500/20 bg-purple-50/30' : 'border-slate-200 hover:border-purple-300'
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-500">품목명 표기 상이</span>
          <div className="p-1.5 bg-purple-50 text-purple-600 rounded-lg">
            <Layers className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold text-purple-600">{mismatchCount}건</div>
        <div className="text-[11px] text-slate-400 mt-1">동일 코드 명칭 불일치</div>
      </div>

      {/* 6. 단가/납기 결측 */}
      <div
        onClick={() => onSelectAnomalyFilter(currentAnomalyFilter === '결측' ? '전체' : '결측')}
        className={`bg-white p-4 rounded-xl border transition-all cursor-pointer shadow-xs hover:shadow-md ${
          currentAnomalyFilter === '결측' ? 'border-slate-500 ring-2 ring-slate-500/20 bg-slate-100/50' : 'border-slate-200 hover:border-slate-400'
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-500">단가/납기 결측</span>
          <div className="p-1.5 bg-slate-100 text-slate-600 rounded-lg">
            <FileQuestion className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold text-slate-700">{missingCount}건</div>
        <div className="text-[11px] text-slate-400 mt-1">공란 항목 존재</div>
      </div>
    </div>
  );
};
