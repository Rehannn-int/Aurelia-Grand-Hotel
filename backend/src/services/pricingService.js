import ApiError from '../utils/ApiError.js';
import { parseStayDates } from '../utils/dateUtils.js';
import RoomCategory from '../models/RoomCategory.js';

export async function quoteBooking({ categoryId, categorySlug, checkIn, checkOut, roomCount, adults, children = 0 }) {
  const { nights } = parseStayDates(checkIn, checkOut);
  if (!Number.isInteger(roomCount) || roomCount < 1 || roomCount > 10) throw new ApiError(400, 'Room count must be between 1 and 10');
  if (!Number.isInteger(adults) || adults < 1 || adults > 20 || !Number.isInteger(children) || children < 0 || children > 20) {
    throw new ApiError(400, 'Guest counts are invalid');
  }
  const category = await RoomCategory.findOne({
    active: true,
    ...(categoryId ? { _id: categoryId } : { slug: categorySlug }),
  });
  if (!category) throw new ApiError(404, 'Room category was not found');
  if (adults + children > category.maxOccupancy * roomCount) throw new ApiError(400, 'Guest count exceeds the selected room capacity');

  const subtotal = category.basePrice * nights * roomCount;
  return {
    category,
    nights,
    pricing: { nightlyRate: category.basePrice, subtotal, discount: 0, tax: 0, total: subtotal },
  };
}
