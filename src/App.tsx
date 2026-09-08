import React, { useState, useEffect, useMemo } from 'react';
import { QuoteRecord, EvaluatedQuoteRecord, FilterState } from './types';
import { SAMPLE_QUOTES } from './data/sampleQuotes';
import { evaluateQuotes, BASE_DATE } from './utils/calculator';
import { UploadPanel } from './components/UploadPanel';
import { DashboardCards } from './components/DashboardCards';
import { FilterBar } from './components/FilterBar';
import { QuoteTable } from './components/QuoteTable';
import { PRDetailModal } from './components/PRDetailModal';
import { QuoteFormModal } from './components/QuoteFormModal';
import { Building2, Sparkles, RefreshCcw, Download } from 'lucide-react';

const STORAGE_KEY = 'exs02.quotes.v1';

export default function App() {
  const [quotes, setQuotes] = useState<QuoteRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to load from localStorage', e);
    }
    return SAMPLE_QUOTES; // Default to sample data
  });

  const [filter, setFilter] = useState<FilterState>({
    searchQuery: '',
    statusFilter: '전체',
    deliveryFilter: '전체',
    anomalyFilter: '전체',
    itemCodeFilter: '전체',
    prFilter: '전체',
  });

  const [isGroupedByPr, setIsGroupedByPr] = useState(false);
  const [selectedPrNo, setSelectedPrNo] = useState<string | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingQuote, setEditingQuote] = useState<EvaluatedQuoteRecord | null>(null);

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(quotes));
    } catch (e) {
      console.error('Failed to save to localStorage', e);
    }
  }, [quotes]);

  // Evaluated quotes
  const evaluatedQuotes = useMemo(() => {
    return evaluateQuotes(quotes);
  }, [quotes]);

  // Filtered quotes
  const filteredQuotes = useMemo(() => {
    return evaluatedQuotes.filter(q => {
      // Search query (pr_no, item_name, supplier, item_code)
      if (filter.searchQuery.trim()) {
        const query = filter.searchQuery.toLowerCase();
        const match =
          q.pr_no.toLowerCase().includes(query) ||
          q.item_name.toLowerCase().includes(query) ||
          q.supplier.toLowerCase().includes(query) ||
          q.item_code.toLowerCase().includes(query) ||
          q.quote_id.toLowerCase().includes(query);
        if (!match) return false;
      }

      // Status filter
      if (filter.statusFilter !== '전체' && q.status !== filter.statusFilter) {
        return false;
      }

      // Delivery filter
      if (filter.deliveryFilter !== '전체') {
        if (q.deliveryState !== filter.deliveryFilter) return false;
      }

      // Anomaly filter
      if (filter.anomalyFilter === '이상チ' || filter.anomalyFilter === '이상치') {
        if (q.priceState !== '이상치') return false;
      } else if (filter.anomalyFilter === '표기상이') {
        if (!q.isNameMismatch) return false;
      } else if (filter.anomalyFilter === '발주차이') {
        if (!q.isOrderedDifferentFromLowest) return false;
      } else if (filter.anomalyFilter === '결측') {
        if (q.unit_price !== null && q.promised_date !== null) return false;
      }

      return true;
    }).sort((a, b) => {
      // Delivery rank order: 지연(0) -> 임박(1) -> 정상(2) -> 납기미기재(3) -> 판정대상아님(4)
      const rankMap: Record<string, number> = {
        '지연': 0,
        '임박': 1,
        '정상': 2,
        '납기 미기재': 3,
        '판정 대상 아님': 4,
      };
      const rankA = rankMap[a.deliveryState] ?? 5;
      const rankB = rankMap[b.deliveryState] ?? 5;

      if (rankA !== rankB) return rankA - rankB;

      // Secondary: D-day ascending (nulls last)
      const dA = a.dDay !== null ? a.dDay : 9999;
      const dB = b.dDay !== null ? b.dDay : 9999;
      if (dA !== dB) return dA - dB;

      // Tertiary: pr_no
      if (a.pr_no !== b.pr_no) return a.pr_no.localeCompare(b.pr_no);

      // Quaternary: unit_price ascending
      const pA = a.unit_price ?? 999999999;
      const pB = b.unit_price ?? 999999999;
      return pA - pB;
    });
  }, [evaluatedQuotes, filter]);

  // Handlers
  const handleLoadQuotes = (newQuotes: QuoteRecord[]) => {
    setQuotes(newQuotes);
  };

  const handleResetToSample = () => {
    if (window.confirm('기본 제공 샘플 데이터(80건)로 초기화하시겠습니까?')) {
      setQuotes(SAMPLE_QUOTES);
      setFilter({
        searchQuery: '',
        statusFilter: '전체',
        deliveryFilter: '전체',
        anomalyFilter: '전체',
        itemCodeFilter: '전체',
        prFilter: '전체',
      });
    }
  };

  const handleClearAll = () => {
    if (window.confirm('모든 데이터를 삭제하고 빈 상태로 시작하시겠습니까?')) {
      setQuotes([]);
    }
  };

  const handleSaveQuote = (saved: QuoteRecord) => {
    setQuotes(prev => {
      const exists = prev.some(q => q.quote_id === saved.quote_id);
      if (exists) {
        return prev.map(q => (q.quote_id === saved.quote_id ? saved : q));
      } else {
        return [saved, ...prev];
      }
    });
  };

  const handleDeleteQuote = (quoteId: string) => {
    if (window.confirm(`견적 ID [${quoteId}] 항목을 삭제하시겠습니까?`)) {
      setQuotes(prev => prev.filter(q => q.quote_id !== quoteId));
    }
  };

  const handleToggleStatus = (quoteId: string, currentStatus: '견적' | '발주') => {
    const nextStatus = currentStatus === '발주' ? '견적' : '발주';
    setQuotes(prev => prev.map(q => q.quote_id === quoteId ? { ...q, status: nextStatus } : q));
  };

  const handleExportCsv = () => {
    if (evaluatedQuotes.length === 0) return;
    const headers = ['quote_id', 'pr_no', 'item_code', 'item_name', 'supplier', 'unit', 'qty', 'unit_price', 'currency', 'quote_date', 'required_date', 'promised_date', 'status', 'remark'];
    let csvContent = headers.join(',') + '\n';
    evaluatedQuotes.forEach(q => {
      const row = [
        q.quote_id,
        q.pr_no,
        q.item_code,
        `"${q.item_name}"`,
        `"${q.supplier}"`,
        q.unit,
        q.qty,
        q.unit_price ?? '',
        q.currency,
        q.quote_date,
        q.required_date,
        q.promised_date ?? '',
        q.status,
        `"${q.remark || ''}"`
      ];
      csvContent += row.join(',') + '\n';
    });

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `purchase_quotes_evaluated_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans antialiased">
      {/* Top Header */}
      <header className="bg-slate-800/80 backdrop-blur-md border-b border-slate-700 sticky top-0 z-40 px-6 py-3.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-600/20 text-indigo-400 rounded-xl border border-indigo-500/30">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              구매 견적 비교·납기 판정기 <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">PRD-S02</span>
            </h1>
            <p className="text-xs text-slate-400">기준일: <strong className="text-slate-200">{BASE_DATE}</strong> (KST)</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleResetToSample}
            className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer border border-slate-600"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> 샘플 데이터 복원
          </button>
          <button
            onClick={handleClearAll}
            className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer border border-rose-500/30"
          >
            <RefreshCcw className="w-3.5 h-3.5" /> 전체 초기화
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8">
        {quotes.length === 0 ? (
          <UploadPanel onLoadQuotes={handleLoadQuotes} onOpenAddModal={() => { setEditingQuote(null); setIsFormModalOpen(true); }} />
        ) : (
          <div className="space-y-6">
            {/* Summary Cards */}
            <DashboardCards
              evaluatedQuotes={evaluatedQuotes}
              currentDeliveryFilter={filter.deliveryFilter}
              currentAnomalyFilter={filter.anomalyFilter}
              onSelectDeliveryFilter={(val) => setFilter(f => ({ ...f, deliveryFilter: val as any, anomalyFilter: '전체' }))}
              onSelectAnomalyFilter={(val) => setFilter(f => ({ ...f, anomalyFilter: val as any, deliveryFilter: '전체' }))}
            />

            {/* Filter & Action Bar */}
            <FilterBar
              filter={filter}
              onFilterChange={(newF) => setFilter(f => ({ ...f, ...newF }))}
              isGroupedByPr={isGroupedByPr}
              onToggleGroupedByPr={() => setIsGroupedByPr(!isGroupedByPr)}
              onOpenAddModal={() => { setEditingQuote(null); setIsFormModalOpen(true); }}
              onResetData={handleClearAll}
              onExportCsv={handleExportCsv}
            />

            {/* Active Filters Bar if any */}
            {(filter.statusFilter !== '전체' || filter.deliveryFilter !== '전체' || filter.anomalyFilter !== '전체' || filter.searchQuery) && (
              <div className="flex items-center gap-2 bg-indigo-950/40 border border-indigo-800/50 px-4 py-2 rounded-xl text-xs text-indigo-300">
                <span>적용된 필터:</span>
                {filter.searchQuery && <span className="px-2 py-0.5 bg-indigo-900/60 rounded-md font-mono">검색: "{filter.searchQuery}"</span>}
                {filter.statusFilter !== '전체' && <span className="px-2 py-0.5 bg-indigo-900/60 rounded-md font-mono">상태: {filter.statusFilter}</span>}
                {filter.deliveryFilter !== '전체' && <span className="px-2 py-0.5 bg-indigo-900/60 rounded-md font-mono">납기: {filter.deliveryFilter}</span>}
                {filter.anomalyFilter !== '전체' && <span className="px-2 py-0.5 bg-indigo-900/60 rounded-md font-mono">특이사항: {filter.anomalyFilter}</span>}
                <button
                  onClick={() => setFilter({ searchQuery: '', statusFilter: '전체', deliveryFilter: '전체', anomalyFilter: '전체', itemCodeFilter: '전체', prFilter: '전체' })}
                  className="ml-auto text-indigo-400 hover:text-white underline cursor-pointer font-medium"
                >
                  필터 초기화
                </button>
              </div>
            )}

            {/* Main Table */}
            <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-xl overflow-hidden text-slate-100">
              <div className="p-4 bg-slate-800/90 border-b border-slate-700 flex items-center justify-between text-xs text-slate-400">
                <div>총 <strong className="text-white">{evaluatedQuotes.length}건</strong> 중 검색/필터 결과 <strong className="text-indigo-400">{filteredQuotes.length}건</strong></div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>실시간 자동 판정 완료</span>
                </div>
              </div>
              <QuoteTable
                quotes={filteredQuotes}
                isGroupedByPr={isGroupedByPr}
                onSelectPr={(prNo) => setSelectedPrNo(prNo)}
                onEditQuote={(q) => { setEditingQuote(q); setIsFormModalOpen(true); }}
                onDeleteQuote={handleDeleteQuote}
              />
            </div>
          </div>
        )}
      </main>

      {/* PR Detail Modal */}
      {selectedPrNo && (
        <PRDetailModal
          prNo={selectedPrNo}
          quotes={evaluatedQuotes}
          onClose={() => setSelectedPrNo(null)}
          onToggleStatus={handleToggleStatus}
        />
      )}

      {/* Add/Edit Quote Modal */}
      <QuoteFormModal
        quote={editingQuote}
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSave={handleSaveQuote}
        existingCount={quotes.length}
      />

      {/* Footer */}
      <footer className="mt-auto py-6 text-center text-xs text-slate-500 border-t border-slate-800">
        구매 견적 비교·납기 판정기 (PRD-S02) &bull; Google AI Studio Build SPA
      </footer>
    </div>
  );
}
