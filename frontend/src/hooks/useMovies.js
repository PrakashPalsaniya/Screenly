import { useGetMoviesQuery, useGetMovieByIdQuery, useGetAllMoviesAdminQuery } from '../redux/apiSlice';

export const useMovies = ({ page = 1, limit = 12 } = {}) => {
  const { data, isLoading, error, refetch } = useGetMoviesQuery({ page, limit });
  return {
    movies: data?.movies || [],
    total: data?.total || 0,
    totalPages: data?.totalPages || 1,
    currentPage: data?.page || 1,
    loading: isLoading,
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

export const useClearMoviesError = () => {
  return () => {};
};
