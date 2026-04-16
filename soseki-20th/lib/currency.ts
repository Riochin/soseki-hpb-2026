const CREDIT_DIVISOR = 100;

export function toCredit(value: number): string {
  const credit = value / CREDIT_DIVISOR;
  return Number.isInteger(credit)
    ? String(credit)
    : credit.toFixed(2).replace(/\.?0+$/, '');
}
