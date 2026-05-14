import { useGetShowsByMovieAndLocationQuery, useGetShowByIdQuery } from '../redux/apiSlice';

export const useShows = (filters = {}) => {
  const shouldFetch =
    Boolean(filters?.movieId) &&
    Boolean(filters?.state) &&
    Boolean(filters?.date);

  const { data, isLoading, error } = useGetShowsByMovieAndLocationQuery(
    filters,
    { skip: !shouldFetch }
  );

  return { shows: data || [], loading: isLoading, error };
};

export const useShowById = (showId) => {
  const { data, isLoading, error } = useGetShowByIdQuery(showId, { skip: !showId });
  return { show: data, loading: isLoading, error };
};
