import { useState } from "react";
import { useParams } from "react-router-dom";
import { Clock, Globe, Star } from "lucide-react";
import TheaterTimings from "../components/movies/TheaterTimings";
import MovieDetailsDialog from "../components/movies/MovieDetailsDialog";
import { useMovieById } from "../hooks/useMovies";
import {
  formatReleaseDate,
  getMovieCertification,
  getMovieGenres,
  getMovieLanguages,
  getMoviePoster,
  getMoviePosterSrcSet,
} from "../utils";

import ProgressiveImg from "../components/shared/ProgressiveImg";

const MovieDetails = () => {
  const { id } = useParams();
  const { movie } = useMovieById(id);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const genres = getMovieGenres(movie);
  const languages = getMovieLanguages(movie);
  const poster = getMoviePoster(movie, { width: 220 });
  const posterSrcSet = getMoviePosterSrcSet(movie, [160, 220, 280, 320]);
  const certification = getMovieCertification(movie);

  return (
    <>
      <section className="bg-white px-4 py-8 sm:py-12">
        <div className="mx-auto max-w-7xl">
          {/* Movie Header Info */}
          <div className="mb-8 grid gap-5 md:grid-cols-[220px_1fr] md:gap-6">
            <div className="mx-auto w-[150px] sm:w-[180px] md:mx-0 md:w-full">
              <div className="overflow-hidden rounded-2xl border border-black/10 bg-gray-100">
                <ProgressiveImg
                  src={poster}
                  srcSet={posterSrcSet || undefined}
                  sizes="(min-width: 768px) 220px, (min-width: 640px) 180px, 150px"
                  alt={movie?.title}
                  eager={true}
                  className="aspect-[2/3] w-full object-cover"
                />
              </div>
            </div>

            <div className="flex flex-col justify-center">
              <h1 className="text-[22px] font-black leading-tight text-[#171717] md:text-[32px]">
                {movie?.title}
              </h1>

              <div className="mt-4 flex flex-wrap gap-2">
                {[...(movie?.format || []), certification].filter(Boolean).map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-black/10 bg-[#f8f6f2] px-3 py-1.5 text-xs font-semibold text-[#171717]"
                  >
                    {item}
                  </span>
                ))}
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <div className="flex items-center gap-2 rounded-full bg-[#171717] w-fit px-4 py-2 text-sm">
                  <Star size={16} className="text-[#ffd166]" />
                  <span className="font-bold text-white">{movie?.rating}/10</span>
                </div>
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <div className="rounded-xl border border-black/10 bg-[#f8f6f2] p-3">
                  <p className="text-xs font-bold uppercase tracking-[0.1em] text-[#8b8179]">
                    Runtime
                  </p>
                  <p className="mt-1 text-[13px] font-bold text-[#171717] md:text-[15px]">
                    {movie?.duration || "TBA"}
                  </p>
                </div>
                <div className="rounded-xl border border-black/10 bg-[#f8f6f2] p-3">
                  <p className="text-xs font-bold uppercase tracking-[0.1em] text-[#8b8179]">
                    Languages
                  </p>
                  <p className="mt-1 text-[13px] font-bold text-[#171717] md:text-[15px]">
                    {languages.join(", ") || "Multiple"}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsDetailsOpen(true)}
                className="mt-4 w-full rounded-full border-2 border-[#171717] bg-white px-4 py-2.5 text-[15px] font-bold text-[#171717] transition hover:bg-[#171717] hover:text-white md:text-base"
              >
                View more details
              </button>
            </div>
          </div>

          {/* Booking Section */}
          <div className="rounded-[26px] border border-black/10 bg-[#fffdf9] p-5 shadow-sm sm:p-6">
            <div className="mb-6">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#8f46ff]">
                Book Tickets
              </p>
              <h2 className="mt-2 text-[18px] font-black text-[#171717] md:text-[22px]">
                Select Date and Theater
              </h2>
              <p className="mt-2 max-w-2xl text-[13px] text-[#6f6660] md:text-[15px]">
                Choose your preferred day, then pick a theater with available time slots.
              </p>
            </div>

            <TheaterTimings movieId={id} />
          </div>
        </div>
      </section>

      <MovieDetailsDialog
        movie={movie}
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
      />
    </>
  );
};

export default MovieDetails;
