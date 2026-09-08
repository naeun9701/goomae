import React from 'react';
import { Search, RefreshCw, Plus, Download, FolderTree, List } from 'lucide-react';
import { FilterState } from '../types';

interface FilterBarProps {
  filter: FilterState;
  onFilterChange: (newFilter: Partial<FilterState>) => void;
  isGroupedByPr: boolean;
  onToggleGroupedByPr: () => void;
  onOpenAddModal: () => void;
  onResetData: () => void;
  onExportCsv: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filter,
  onFilterChange,
  isGroupedByPr,
  onToggleGroupedByPr,
  onOpenAddModal,
  onResetData,
  onExportCsv,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-6 shadow-xs">
      <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
        {/* Search input */}
        <div className="relative w-full lg:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="PR번호, 품목명, 공급사 검색..."
            value={filter.searchQuery}
            onChange={(e) => onFilterChange({ searchQuery: e.target.value })}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 placeholder-slate-400"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          {/* Status Filter */}
          <select
            value={filter.statusFilter}
            onChange={(e) => onFilterChange({ statusFilter: e.target.value as any })}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
          >
            <option value="전체">상태: 전체</option>
            <option value="견적">견적</option>
            <option value="발주">발주</option>
          </select>

          {/* Delivery Filter */}
          <select
            value={filter.deliveryFilter}
            onChange={(e) => onFilterChange({ deliveryFilter: e.target.value as any })}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
          >
            <option value="전체">납기판정: 전체</option>
            <option value="지연">지연</option>
            <option value="임박">임박</option>
            <option value="정상">정상</option>
            <option value="납기 미기재">납기 미기재</option>
          </select>

          {/* Anomaly Filter */}
          <select
            value={filter.anomalyFilter}
            onChange={(e) => onFilterChange({ anomalyFilter: e.target.value as any })}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
          >
            <option value="전체">특이사항: 전체</option>
            <option value="이상치">단가 이상치</option>
            <option value="표기상이">품목명 표기상이</option>
            <option value="발주차이">발주≠최저가</option>
            <option value="결측">단가/납기 결측</option>
          </select>

          {/* Group View Toggle */}
          <button
            onClick={onToggleGroupedByPr}
            className={`px-3.5 py-2 rounded-xl text-sm font-medium border flex items-center gap-1.5 transition-all cursor-pointer ${
              isGroupedByPr
                ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
            title="PR 그룹별 보기 토글"
          >
            {isGroupedByPr ? <FolderTree className="w-4 h-4" /> : <List className="w-4 h-4" />}
            {isGroupedByPr ? 'PR별 그룹보기' : '전체 목록보기'}
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 w-full lg:w-auto justify-end">
          <button
            onClick={onExportCsv}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-medium flex items-center gap-1.5 transition-all cursor-pointer"
            title="현재 목록 CSV 내보내기"
          >
            <Download className="w-4 h-4" /> 내보내기
          </button>
          <button
            onClick={onOpenAddModal}
            className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> 견적 등록
          </button>
          <button
            onClick={onResetData}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-sm transition-all cursor-pointer"
            title="데이터 새로고침/반입 초기화"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
