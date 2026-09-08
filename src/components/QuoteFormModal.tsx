import React, { useState, useEffect } from 'react';
import { QuoteRecord, QuoteStatus } from '../types';
import { X, Save } from 'lucide-react';

interface QuoteFormModalProps {
  quote: EvaluatedQuoteRecordForEdit | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (quote: QuoteRecord) => void;
  existingCount: number;
}

export type EvaluatedQuoteRecordForEdit = QuoteRecord;

export const QuoteFormModal: React.FC<QuoteFormModalProps> = ({
  quote,
  isOpen,
  onClose,
  onSave,
  existingCount,
}) => {
  const [formData, setFormData] = useState<QuoteRecord>({
    quote_id: '',
    pr_no: 'PR-2026-033',
    item_code: 'IT-001',
    item_name: '',
    supplier: '',
    unit: 't',
    qty: 1,
    unit_price: null,
    currency: 'KRW',
    quote_date: new Date().toISOString().split('T')[0],
    required_date: '2026-09-30',
    promised_date: '',
    status: '견적',
    remark: '',
  });

  useEffect(() => {
    if (quote) {
      setFormData(quote);
    } else {
      setFormData({
        quote_id: `QT-${String(existingCount + 1).padStart(3, '0')}`,
        pr_no: 'PR-2026-033',
        item_code: 'IT-001',
        item_name: '신규 품목',
        supplier: '공급사명',
        unit: 'EA',
        qty: 10,
        unit_price: 50000,
        currency: 'KRW',
        quote_date: new Date().toISOString().split('T')[0],
        required_date: '2026-09-30',
        promised_date: '2026-09-25',
        status: '견적',
        remark: '',
      });
    }
  }, [quote, existingCount, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      unit_price: formData.unit_price !== null && !isNaN(Number(formData.unit_price)) ? Number(formData.unit_price) : null,
      qty: Number(formData.qty) || 1,
      remark: formData.remark ? String(formData.remark) : null,
      promised_date: formData.promised_date ? String(formData.promised_date) : null,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">
            {quote ? `견적 정보 수정 (${quote.quote_id})` : '신규 견적 단건 등록'}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-xl text-slate-500 transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">견적 ID</label>
              <input
                type="text"
                required
                value={formData.quote_id}
                onChange={e => setFormData({ ...formData, quote_id: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">PR 번호 (구매요청 그룹)</label>
              <input
                type="text"
                required
                value={formData.pr_no}
                onChange={e => setFormData({ ...formData, pr_no: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">품목 코드</label>
              <input
                type="text"
                required
                value={formData.item_code}
                onChange={e => setFormData({ ...formData, item_code: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">품목명</label>
              <input
                type="text"
                required
                value={formData.item_name}
                onChange={e => setFormData({ ...formData, item_name: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">공급사</label>
              <input
                type="text"
                required
                value={formData.supplier}
                onChange={e => setFormData({ ...formData, supplier: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">수량</label>
              <input
                type="number"
                step="any"
                required
                value={formData.qty}
                onChange={e => setFormData({ ...formData, qty: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">단위</label>
              <input
                type="text"
                required
                value={formData.unit}
                onChange={e => setFormData({ ...formData, unit: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">견적 단가 (KRW, 공란 가능)</label>
              <input
                type="number"
                value={formData.unit_price !== null ? formData.unit_price : ''}
                onChange={e => setFormData({ ...formData, unit_price: e.target.value === '' ? null : Number(e.target.value) })}
                placeholder="미기재시 공란"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">현재 상태</label>
              <select
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value as QuoteStatus })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium"
              >
                <option value="견적">견적</option>
                <option value="발주">발주</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">견적일자</label>
              <input
                type="date"
                required
                value={formData.quote_date}
                onChange={e => setFormData({ ...formData, quote_date: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">필요일자 (요청일)</label>
              <input
                type="date"
                required
                value={formData.required_date}
                onChange={e => setFormData({ ...formData, required_date: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">약속납기일 (공란 가능)</label>
              <input
                type="date"
                value={formData.promised_date || ''}
                onChange={e => setFormData({ ...formData, promised_date: e.target.value || null })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">비고 및 특이사항</label>
            <input
              type="text"
              value={formData.remark || ''}
              onChange={e => setFormData({ ...formData, remark: e.target.value || null })}
              placeholder="특이사항 입력..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
            />
          </div>

          <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-medium transition-all cursor-pointer"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-4 h-4" /> 저장하기
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
