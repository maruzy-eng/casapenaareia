const DATE_KEY_PATTERN = /^(\d{4}-\d{2}-\d{2})/;

export function normalizeDateKey(value: string | null | undefined) {
  if (!value) return "";

  const match = String(value).trim().match(DATE_KEY_PATTERN);

  return match ? match[1] : "";
}

export function parseDateAsUtc(date: string) {
  const normalizedDate = normalizeDateKey(date);

  if (!normalizedDate) {
    throw new Error(`Invalid date: ${date}`);
  }

  const [year, month, day] = normalizedDate.split("-").map(Number);

  return new Date(Date.UTC(year, month - 1, day));
}

export function formatDateAsYmd(date: Date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function addDays(date: string, amount: number) {
  const currentDate = parseDateAsUtc(date);
  currentDate.setUTCDate(currentDate.getUTCDate() + amount);

  return formatDateAsYmd(currentDate);
}

export function differenceInDays(startDate: string, endDate: string) {
  const start = parseDateAsUtc(startDate);
  const end = parseDateAsUtc(endDate);
  const diff = end.getTime() - start.getTime();

  return Math.round(diff / 86_400_000);
}

export function calculateNights(checkIn: string, checkOut: string) {
  return Math.max(1, differenceInDays(checkIn, checkOut));
}

export function getLocalTodayYmd() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function isValidDateRange(checkIn: string, checkOut: string) {
  const normalizedCheckIn = normalizeDateKey(checkIn);
  const normalizedCheckOut = normalizeDateKey(checkOut);

  if (!normalizedCheckIn || !normalizedCheckOut) {
    return false;
  }

  return normalizedCheckIn < normalizedCheckOut;
}
