import { useGetTheatersQuery, useGetTheaterByIdQuery } from '../redux/apiSlice';

export const useTheaters = (filters = {}) => {
  const { data, isLoading, error } = useGetTheatersQuery(filters);
  return { theaters: data || [], loading: isLoading, error };
};

export const useTheaterById = (theaterId) => {
  const { data, isLoading, error } = useGetTheaterByIdQuery(theaterId, { skip: !theaterId });
  return { theater: data, loading: isLoading, error };
};
