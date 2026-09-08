import { QuoteRecord, EvaluatedQuoteRecord, DeliveryState, PriceState } from '../types';

export const BASE_DATE = '2026-08-27';

export function evaluateQuotes(quotes: QuoteRecord[]): EvaluatedQuoteRecord[] {
  const baseDateObj = new Date(BASE_DATE);
  baseDateObj.setHours(0, 0, 0, 0);

  // 1. Group by pr_no for median and lowest price calculation
  const prGroups: Record<string, QuoteRecord[]> = {};
  quotes.forEach(q => {
    if (!prGroups[q.pr_no]) {
      prGroups[q.pr_no] = [];
    }
    prGroups[q.pr_no].push(q);
  });

  // 2. Detect item name mismatches per item_code
  const itemNamesMap: Record<string, Set<string>> = {};
  quotes.forEach(q => {
    const code = q.item_code.trim();
    const name = q.item_name.trim();
    if (!itemNamesMap[code]) {
      itemNamesMap[code] = new Set();
    }
    itemNamesMap[code].add(name);
  });

  const mismatchItemCodes = new Set<string>();
  Object.keys(itemNamesMap).forEach(code => {
    if (itemNamesMap[code].size >= 2) {
      mismatchItemCodes.add(code);
    }
  });

  // Calculate median helper
  const prMedians: Record<string, number | null> = {};
  Object.keys(prGroups).forEach(prNo => {
    const group = prGroups[prNo];
    const validPrices = group
      .map(q => q.unit_price)
      .filter((p): p is number => p !== null && p !== undefined && !isNaN(p))
      .sort((a, b) => a - b);

    if (validPrices.length === 0) {
      prMedians[prNo] = null;
    } else {
      const mid = Math.floor(validPrices.length / 2);
      if (validPrices.length % 2 === 0) {
        prMedians[prNo] = (validPrices[mid - 1] + validPrices[mid]) / 2;
      } else {
        prMedians[prNo] = validPrices[mid];
      }
    }
  });

  // Calculate lowest price per PR (excluding anomalies and null prices)
  const prLowestPrices: Record<string, { minPrice: number; quoteId: string } | null> = {};
  Object.keys(prGroups).forEach(prNo => {
    const group = prGroups[prNo];
    const med = prMedians[prNo];

    // Candidates for lowest price: unit_price != null, and if med exists, deviation <= 30%
    const candidates = group.filter(q => {
      if (q.unit_price === null || q.unit_price === undefined) return false;
      if (med === null) return true;
      const dev = Math.abs(((q.unit_price - med) / med) * 100);
      return dev <= 30; // anomaly threshold is > 30
    });

    if (candidates.length === 0) {
      // Fallback to all valid prices if all were flagged as anomaly
      const allValid = group.filter(q => q.unit_price !== null && q.unit_price !== undefined);
      if (allValid.length === 0) {
        prLowestPrices[prNo] = null;
        return;
      }
      let minP = Math.min(...allValid.map(q => q.unit_price!));
      const best = allValid
        .filter(q => q.unit_price === minP)
        .sort((a, b) => {
          if (a.quote_date !== b.quote_date) return a.quote_date.localeCompare(b.quote_date);
          return a.quote_id.localeCompare(b.quote_id);
        })[0];
      prLowestPrices[prNo] = { minPrice: minP, quoteId: best.quote_id };
    } else {
      let minP = Math.min(...candidates.map(q => q.unit_price!));
      const best = candidates
        .filter(q => q.unit_price === minP)
        .sort((a, b) => {
          if (a.quote_date !== b.quote_date) return a.quote_date.localeCompare(b.quote_date);
          return a.quote_id.localeCompare(b.quote_id);
        })[0];
      prLowestPrices[prNo] = { minPrice: minP, quoteId: best.quote_id };
    }
  });

  // 3. Evaluate each quote
  return quotes.map(q => {
    const group = prGroups[q.pr_no] || [];
    const validPricesCount = group.filter(item => item.unit_price !== null && item.unit_price !== undefined).length;
    const med = prMedians[q.pr_no];

    let deviationPercent: number | null = null;
    let priceState: PriceState = '정상';

    if (q.unit_price === null || q.unit_price === undefined) {
      priceState = '단가 미기재';
    } else if (validPricesCount < 3) {
      priceState = '비교 불가';
      if (med !== null && med > 0) {
        deviationPercent = Number((((q.unit_price - med) / med) * 100).toFixed(1));
      }
    } else {
      if (med !== null && med > 0) {
        deviationPercent = Number((((q.unit_price - med) / med) * 100).toFixed(1));
        if (Math.abs(deviationPercent) > 30) {
          priceState = '이상치';
        } else {
          priceState = '정상';
        }
      }
    }

    // Lowest price check
    const lowest = prLowestPrices[q.pr_no];
    const isLowestPrice = lowest ? lowest.quoteId === q.quote_id : false;

    // Ordered row check vs lowest
    const orderedRowInPr = group.find(item => item.status === '발주');
    const isOrderedDifferentFromLowest = Boolean(
      orderedRowInPr && lowest && orderedRowInPr.quote_id !== lowest.quoteId
    );

    // D-Day calculation
    let dDay: number | null = null;
    let dDayString = '-';
    let deliveryState: DeliveryState = '판정 대상 아님';

    if (!q.promised_date || q.promised_date.trim() === '') {
      dDay = null;
      dDayString = '-';
      deliveryState = q.status === '발주' ? '납기 미기재' : '판정 대상 아님';
    } else {
      const promisedObj = new Date(q.promised_date);
      promisedObj.setHours(0, 0, 0, 0);
      const diffTime = promisedObj.getTime() - baseDateObj.getTime();
      dDay = Math.round(diffTime / (1000 * 60 * 60 * 24));

      if (dDay < 0) {
        dDayString = `D+${Math.abs(dDay)}`;
      } else if (dDay === 0) {
        dDayString = 'D-DAY';
      } else {
        dDayString = `D-${dDay}`;
      }

      if (q.status === '견적') {
        deliveryState = '판정 대상 아님';
      } else {
        if (dDay < 0) {
          deliveryState = '지연';
        } else if (dDay >= 0 && dDay <= 7) {
          deliveryState = '임박';
        } else {
          deliveryState = '정상';
        }
      }
    }

    // Required date check
    let isExceedRequiredDate = false;
    if (q.promised_date && q.required_date) {
      isExceedRequiredDate = q.promised_date > q.required_date;
    }

    const isNameMismatch = mismatchItemCodes.has(q.item_code.trim());

    return {
      ...q,
      deviationPercent,
      priceState,
      isLowestPrice,
      dDay,
      dDayString,
      deliveryState,
      isExceedRequiredDate,
      isNameMismatch,
      isOrderedDifferentFromLowest
    };
  });
}
