import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosWrapper } from '../apis';

const axiosBaseQuery =
  () =>
  async ({ url, method, data, params, headers }) => {
    try {
      const result = await axiosWrapper({
        url,
        method,
        data,
        params,
        headers,
      });
      return { data: result.data };
    } catch (axiosError) {
      const err = axiosError;
      return {
        error: {
          status: err.response?.status,
          data: err.response?.data || err.message,
        },
      };
    }
  };

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['Movie', 'Show', 'Theater', 'Booking'],
  endpoints: (builder) => ({
    getMovies: builder.query({
      query: ({ page = 1, limit = 12 } = {}) => ({
        url: '/movies',
        method: 'GET',
        params: { page, limit },
      }),
      providesTags: ['Movie'],
    }),
    getAllMoviesAdmin: builder.query({
      query: () => ({ url: '/movies/all', method: 'GET' }),
      providesTags: ['Movie'],
    }),
    getMovieById: builder.query({
      query: (id) => ({ url: `/movies/${id}`, method: 'GET' }),
      providesTags: (result, error, id) => [{ type: 'Movie', id }],
    }),
    getShowsByMovieAndLocation: builder.query({
      query: ({ movieId, state, date }) => ({
        url: '/shows',
        method: 'GET',
        params: { movieId, state, date },
      }),
      providesTags: ['Show'],
    }),
    getShowById: builder.query({
      query: (id) => ({ url: `/shows/${id}`, method: 'GET' }),
      providesTags: (result, error, id) => [{ type: 'Show', id }],
    }),

    getTheaters: builder.query({
      query: (filters = {}) => ({ url: '/theaters', method: 'GET', params: filters }),
      providesTags: ['Theater'],
    }),
    getTheaterById: builder.query({
      query: (id) => ({ url: `/theaters/${id}`, method: 'GET' }),
      providesTags: (result, error, id) => [{ type: 'Theater', id }],
    }),
    getUserBookings: builder.query({
      query: () => ({ url: '/book', method: 'GET' }),
      providesTags: ['Booking'],
    }),
    getAdminBookings: builder.query({
      query: () => ({ url: '/book/admin', method: 'GET' }),
      providesTags: ['Booking'],
    }),
    createBooking: builder.mutation({
      query: (bookingData) => ({
        url: '/book',
        method: 'POST',
        data: bookingData,
      }),
      invalidatesTags: ['Booking'],
    }),
    cancelBooking: builder.mutation({
      query: (bookingId) => ({
        url: `/book/${bookingId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Booking'],
    }),
  }),
});

export const {
  useGetMoviesQuery,
  useGetAllMoviesAdminQuery,
  useGetMovieByIdQuery,
  useGetShowsByMovieAndLocationQuery,
  useGetShowByIdQuery,
  useGetTheatersQuery,
  useGetTheaterByIdQuery,
  useGetUserBookingsQuery,
  useGetAdminBookingsQuery,
  useCreateBookingMutation,
  useCancelBookingMutation,
  usePrefetch,
} = apiSlice;
