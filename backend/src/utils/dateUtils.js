import ApiError from './ApiError.js';

export function parseStayDates(checkIn, checkOut) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(checkIn || '') || !/^\d{4}-\d{2}-\d{2}$/.test(checkOut || '')) {
    throw new ApiError(400, 'Check-in and check-out must use YYYY-MM-DD dates');
  }
  const start = new Date(`${checkIn}T00:00:00.000Z`);
  const end = new Date(`${checkOut}T00:00:00.000Z`);
  if (
    Number.isNaN(start.getTime())
    || Number.isNaN(end.getTime())
    || start.toISOString().slice(0, 10) !== checkIn
    || end.toISOString().slice(0, 10) !== checkOut
    || end <= start
  ) {
    throw new ApiError(400, 'Check-out must be after check-in and both dates must be valid');
  }
  const nights = Math.round((end - start) / 86400000);
  if (nights > 90) throw new ApiError(400, 'A stay cannot exceed 90 nights');
  return { start, end, nights };
}

export function enumerateStayNights(checkIn, checkOut) {
  const { start, nights } = parseStayDates(checkIn, checkOut);
  return Array.from({ length: nights }, (_, index) => new Date(start.getTime() + index * 86400000));
}
