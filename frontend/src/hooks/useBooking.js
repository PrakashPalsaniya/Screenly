import { useGetUserBookingsQuery, useCreateBookingMutation, useCancelBookingMutation } from '../redux/apiSlice';

export const useBooking = () => {
  const [createBookingMutation, { isLoading: isCreating, error: createError }] = useCreateBookingMutation();
  const [cancelBookingMutation, { isLoading: isCanceling, error: cancelError }] = useCancelBookingMutation();

  const book = async (bookingData) => {
    return await createBookingMutation(bookingData).unwrap();
  };

  const cancel = async (bookingId) => {
    return await cancelBookingMutation(bookingId).unwrap();
  };

  return {
    book,
    cancel,
    isCreating,
    isCanceling,
    error: createError || cancelError,
  };
};

export const useUserBookings = () => {
  const { data, isLoading, error } = useGetUserBookingsQuery();
  return { bookings: data?.bookings || [], loading: isLoading, error };
};
