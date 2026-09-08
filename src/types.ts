export type QuoteStatus = '견적' | '발주';

export type DeliveryState = '지연' | '임박' | '정상' | '납기 미기재' | '판정 대상 아님';

export type PriceState = '정상' | '이상치' | '비교 불가' | '단가 미기재';

export interface QuoteRecord {
  quote_id: string;
  pr_no: string;
  item_code: string;
  item_name: string;
  supplier: string;
  unit: string;
  qty: number;
  unit_price: number | null;
  currency: string;
  quote_date: string;
  required_date: string;
  promised_date: string | null;
  status: QuoteStatus;
  remark: string | null;
}

export interface EvaluatedQuoteRecord extends QuoteRecord {
  deviationPercent: number | null;
  priceState: PriceState;
  isLowestPrice: boolean;
  dDay: number | null;
  dDayString: string;
  deliveryState: DeliveryState;
  isExceedRequiredDate: boolean;
  isNameMismatch: boolean;
  isOrderedDifferentFromLowest: boolean;
}

export interface FilterState {
  searchQuery: string;
  statusFilter: '전체' | '견적' | '발주';
  deliveryFilter: '전체' | '지연' | '임박' | '정상' | '납기 미기재';
  anomalyFilter: '전체' | '이상치' | '표기상이' | '발주차이';
  itemCodeFilter: string;
  prFilter: string;
}
