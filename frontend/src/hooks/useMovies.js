import { useGetMoviesQuery, useGetMovieByIdQuery, useGetAllMoviesAdminQuery } from '../redux/apiSlice';

export const useMovies = (params = {}) => {
  const { data, isLoading, isFetching, error, refetch } = useGetMoviesQuery(params);
  return {
    movies:      data?.movies      || [],
    total:       data?.total       || 0,
    totalPages:  data?.totalPages  || 1,
    currentPage: data?.page        || 1,
    hasNextPage: data?.hasNextPage ?? false,
    loading:     isLoading,
    fetching:    isFetching,
    error,
    refetch,
  };
};

export const useMovieById = (movieId) => {
  const { data, isLoading, error } = useGetMovieByIdQuery(movieId, { skip: !movieId });
  return { movie: data?.movie, loading: isLoading, error };
};

// Admin: full unpaginated list for show creation
export const useAllMoviesAdmin = () => {
  const { data, isLoading, error } = useGetAllMoviesAdminQuery();
  return { movies: data?.movies || [], loading: isLoading, error };
};

export const useClearMoviesError = () => () => {};
