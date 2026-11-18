import Room from '../models/Room.js';
import InventoryNight from '../models/InventoryNight.js';
import { enumerateStayNights } from '../utils/dateUtils.js';

export async function findAvailableRooms({ categoryId, checkIn, checkOut, adults, children = 0, roomCount = 1, session }) {
  const nights = enumerateStayNights(checkIn, checkOut);
  const roomQuery = {
    active: true,
    operationalStatus: { $nin: ['maintenance', 'out_of_service'] },
  };
  if (categoryId) roomQuery.category = categoryId;

  const rooms = await Room.find(roomQuery).populate({
    path: 'category',
    match: { active: true, maxOccupancy: { $gte: Math.ceil((adults + children) / roomCount) } },
  }).session(session || null);
  const eligibleRooms = rooms.filter((room) => room.category);
  if (!eligibleRooms.length) return [];

  const occupied = await InventoryNight.distinct('room', {
    room: { $in: eligibleRooms.map((room) => room._id) },
    night: { $in: nights },
    $or: [
      { holdExpiresAt: { $exists: false } },
      { holdExpiresAt: null },
      { holdExpiresAt: { $gt: new Date() } },
    ],
  }).session(session || null);
  const occupiedIds = new Set(occupied.map(String));
  return eligibleRooms.filter((room) => !occupiedIds.has(String(room._id)));
}
