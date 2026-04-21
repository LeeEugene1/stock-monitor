/**
 * 한국거래소(KRX) 주식/ETF 호가 단위 (2023.01 개편 이후 기준).
 * 지정가 주문 시 이 단위에 맞지 않으면 거부됨.
 */
export function krxTickSize(price: number): number {
  if (price >= 500_000) return 1000;
  if (price >= 200_000) return 500;
  if (price >= 50_000) return 100;
  if (price >= 20_000) return 50;
  if (price >= 5_000) return 10;
  if (price >= 2_000) return 5;
  return 1;
}

export function roundDownToTick(price: number): number {
  const tick = krxTickSize(price);
  return Math.floor(price / tick) * tick;
}
