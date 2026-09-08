import { supabase, isSupabaseConfigured } from './supabase';
import { QuoteRecord } from '../types';

export async function fetchQuotesFromSupabase(): Promise<QuoteRecord[] | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  try {
    const { data, error } = await supabase
      .from('purchase_quotes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    if (data && data.length > 0) {
      return data.map((d: any) => ({
        quote_id: d.quote_id,
        pr_no: d.pr_no,
        item_code: d.item_code,
        item_name: d.item_name,
        supplier: d.supplier,
        unit: d.unit,
        qty: Number(d.qty),
        unit_price: d.unit_price !== null && d.unit_price !== undefined ? Number(d.unit_price) : null,
        currency: d.currency || 'KRW',
        quote_date: d.quote_date || '2026-08-01',
        required_date: d.required_date || '2026-09-01',
        promised_date: d.promised_date || null,
        status: d.status || '견적',
        remark: d.remark || null,
      }));
    }
    return null;
  } catch (err) {
    console.error('Failed to fetch quotes from Supabase:', err);
    return null;
  }
}

export async function saveQuotesToSupabase(quotesToSave: QuoteRecord[], userEmail: string): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false;
  try {
    const rows = quotesToSave.map(q => ({
      quote_id: q.quote_id,
      pr_no: q.pr_no,
      item_code: q.item_code,
      item_name: q.item_name,
      supplier: q.supplier,
      unit: q.unit,
      qty: q.qty,
      unit_price: q.unit_price,
      currency: q.currency || 'KRW',
      quote_date: q.quote_date,
      required_date: q.required_date,
      promised_date: q.promised_date,
      status: q.status,
      remark: q.remark,
      uploaded_by: userEmail,
    }));

    // Upsert to accumulate CSV / quote records
    const { error } = await supabase
      .from('purchase_quotes')
      .upsert(rows, { onConflict: 'quote_id' });

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Failed to save quotes to Supabase DB:', err);
    return false;
  }
}
