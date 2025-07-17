export function isFutureDate(date: Date): boolean {
  const now = new Date();
  return date.getTime() >= now.getTime();
}
