import * as bookingService from './booking.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { toBookingDTO, toBookingListDTO } from '../../mappers/booking.mapper.js';

export const create = asyncHandler(async (req, res, next) => {
  const booking = await bookingService.createBooking(req.body, req.user.id);
  return res.status(201).json(
    new ApiResponse(201, toBookingDTO(booking), 'Resource booked successfully')
  );
});

export const getById = asyncHandler(async (req, res, next) => {
  const booking = await bookingService.getBookingById(req.params.id);
  return res.status(200).json(
    new ApiResponse(200, toBookingDTO(booking), 'Booking details retrieved successfully')
  );
});

export const getAll = asyncHandler(async (req, res, next) => {
  const result = await bookingService.getAllBookings(req.query, req.user);
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  
  const meta = {
    page,
    limit,
    total: result.total,
    pages: Math.ceil(result.total / limit),
  };

  return res.status(200).json(
    new ApiResponse(200, toBookingListDTO(result.data), 'Bookings list retrieved successfully', meta)
  );
});

export const cancel = asyncHandler(async (req, res, next) => {
  const booking = await bookingService.cancelBooking(req.params.id, req.user);
  return res.status(200).json(
    new ApiResponse(200, toBookingDTO(booking), 'Booking cancelled successfully')
  );
});
