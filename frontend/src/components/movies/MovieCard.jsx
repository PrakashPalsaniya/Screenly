import { useNavigate } from "react-router-dom";
import { useLocationContext } from "../../context/LocationContext";
import {
  buildMoviePath,
  getMovieLanguages,
  getMoviePoster,
  getMoviePosterSrcSet,
  getMovieYear,
} from "../../utils";
import ProgressiveImg from "../shared/ProgressiveImg";
import { usePrefetch } from "../../redux/apiSlice";

const MovieCard = ({ movie, eager = false }) => {
  const navigate = useNavigate();
  const { location } = useLocationContext();
  const prefetchMovie = usePrefetch("getMovieById");

  const year = getMovieYear(movie);
  const languages = getMovieLanguages(movie).join(", ");
  const metaLabel = [year, languages].filter(Boolean).join(" | ");
  const poster = getMoviePoster(movie, { width: 320 });
  const posterSrcSet = getMoviePosterSrcSet(movie, [180, 240, 320, 420]);

  return (
    <button
      type="button"
      onClick={() => navigate(buildMoviePath(movie, location))}
      onMouseEnter={() => prefetchMovie(movie._id)}
      className="group w-full text-left outline-none transition duration-300 hover:-translate-y-1"
      aria-label={`Open ${movie.title}`}
    >
      <div className="relative aspect-[2/3] overflow-hidden rounded-2xl bg-[#111111] shadow-[0_18px_40px_rgba(0,0,0,0.18)]">
        <ProgressiveImg
          src={poster}
          srcSet={posterSrcSet || undefined}
          sizes="(min-width: 1280px) 170px, (min-width: 1024px) 180px, (min-width: 640px) 30vw, 30vw"
          alt={movie.title}
          eager={eager}
          containerClassName="h-full w-full"
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/70 via-black/15 to-transparent z-20 pointer-events-none" />
        {movie.rating ? (
          <div className="absolute right-3 top-3 z-20 rounded-full bg-black/70 px-3 py-1 text-xs font-bold text-white backdrop-blur">
            {movie.rating}/10
          </div>
        ) : null}
      </div>

      <div className="px-1 pb-1 pt-3">
        <p className="min-h-[2.35rem] line-clamp-2 text-[13px] font-bold leading-[1.15rem] text-[#171717] sm:text-[0.98rem] sm:leading-5">
          {movie.title}
        </p>
        <p className="mt-1 min-h-[1.1rem] line-clamp-1 text-[11px] font-medium text-[#5f5a56] sm:text-[13px]">
          {metaLabel || "Now showing"}
        </p>
      </div>
    </button>
  );
};

export default MovieCard;
