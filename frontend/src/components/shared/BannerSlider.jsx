import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useMovies } from "../../hooks/useMovies";
import { useLocationContext } from "../../context/LocationContext";
import {
  buildMoviePath,
  getMovieLanguages,
  getMoviePoster,
  getMoviePosterSrcSet,
  getMovieYear,
} from "../../utils";

const MovieStripCard = ({ movie, eager = false, onOpenMovie }) => {
  const metaLabel = [getMovieYear(movie), getMovieLanguages(movie).join(", ")]
    .filter(Boolean)
    .join(" | ");

  return (
    <button
      type="button"
      onClick={() => onOpenMovie(movie)}
      className="group w-[132px] shrink-0 text-left outline-none sm:w-[180px] lg:w-[205px]"
      aria-label={`Open ${movie.title}`}
    >
      <div className="relative aspect-[2/3] overflow-hidden rounded-[22px] bg-[#111111] shadow-[0_18px_40px_rgba(0,0,0,0.22)]">
        <img
          src={getMoviePoster(movie, { width: 360 })}
          srcSet={getMoviePosterSrcSet(movie, [220, 300, 360, 450]) || undefined}
          sizes="(min-width: 1024px) 205px, (min-width: 640px) 180px, 132px"
          alt={movie.title}
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          className="h-full w-full scale-[1.04] object-cover transition duration-500 ease-out group-hover:scale-100"
        />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/78 via-black/24 to-transparent" />
        {movie.rating ? (
          <span className="absolute right-3 top-3 rounded-full bg-black/70 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
            {movie.rating}/10
          </span>
        ) : null}
      </div>

      <div className="px-1 pt-3">
        <h3 className="line-clamp-1 text-[13px] font-bold text-[#171717] sm:text-[16px]">{movie.title}</h3>
        <p className="mt-1 line-clamp-1 text-[11px] text-[#6b665f] sm:text-[13px]">
          {metaLabel || "Now showing"}
        </p>
      </div>
    </button>
  );
};

const BannerSlider = () => {
  const navigate = useNavigate();
  const { location } = useLocationContext();
  const { movies, loading } = useMovies();

  const movieSlides = useMemo(() => {
    return movies?.length ? movies.filter((movie) => getMoviePoster(movie)).slice(0, 10) : [];
  }, [movies]);

  const repeatedMovies = [...movieSlides, ...movieSlides];

  const openMovie = (movie) => {
    if (movie?._id) {
      navigate(buildMoviePath(movie, location));
      return;
    }

    navigate("/movies");
  };

  if (loading) {
    return (
      <section className="overflow-hidden bg-[#f6f3ee] py-5 sm:py-7">
        <div className="mx-auto max-w-screen-2xl px-3 sm:px-4">
          <div className="flex gap-4 overflow-hidden rounded-[30px] px-2 py-3 sm:gap-5 sm:px-3 sm:py-4">
            {Array(6)
              .fill(0)
              .map((_, index) => (
                <div
                  key={index}
                  className="h-[198px] w-[132px] shrink-0 animate-pulse rounded-[22px] bg-black/10 sm:h-[270px] sm:w-[180px] lg:h-[308px] lg:w-[205px]"
                />
              ))}
          </div>
        </div>
      </section>
    );
  }

  if (!movieSlides.length) {
    return null;
  }

  return (
    <section className="overflow-hidden bg-[#f6f3ee] py-5 sm:py-7">
      <div className="mx-auto max-w-screen-2xl px-3 sm:px-4">
        <div className="movie-360-shell relative overflow-hidden rounded-[30px] px-2 py-3 sm:px-3 sm:py-4">
          <div className="pointer-events-none absolute inset-y-0 left-1/2 w-[38%] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,_rgba(255,255,255,0.55)_0%,_rgba(255,255,255,0.08)_48%,_transparent_72%)] blur-2xl" />
          <div className="movie-360-track movie-marquee movie-marquee-left flex gap-4 sm:gap-5">
            {repeatedMovies.map((movie, index) => (
              <MovieStripCard
                key={`${movie._id || movie.id}-${index}`}
                movie={movie}
                eager={index < 4}
                onOpenMovie={openMovie}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default BannerSlider;
