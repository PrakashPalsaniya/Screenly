import { useGetMoviesQuery, useGetMovieByIdQuery } from '../redux/apiSlice';

export const useMovies = () => {
  const { data, isLoading, error, refetch } = useGetMoviesQuery();
  return { movies: data?.movies || [], loading: isLoading, error, refetch };
};

export const useMovieById = (movieId) => {
  const { data, isLoading, error } = useGetMovieByIdQuery(movieId, { skip: !movieId });
  return { movie: data?.movie, loading: isLoading, error };
};

export const useClearMoviesError = () => {
  return () => {};
};
