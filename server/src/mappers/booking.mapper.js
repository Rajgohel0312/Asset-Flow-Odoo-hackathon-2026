import { toUserDTO } from './user.mapper.js';
import { toAssetDTO } from './asset.mapper.js';

export const toBookingDTO = (booking) => {
  if (!booking) return null;
  return {
    id: booking.id,
    bookingNumber: booking.bookingNumber,
    assetId: booking.assetId,
    asset: booking.asset ? toAssetDTO(booking.asset) : null,
    bookedBy: booking.bookedBy,
    user: booking.user ? toUserDTO(booking.user) : null,
    startTime: booking.startTime,
    endTime: booking.endTime,
    purpose: booking.purpose,
    status: booking.status,
    createdAt: booking.createdAt,
  };
};

export const toBookingListDTO = (bookings) => {
  if (!bookings) return [];
  return bookings.map(toBookingDTO);
};
