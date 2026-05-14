import { X, Clock, Globe, Star, Calendar } from "lucide-react";
import { formatReleaseDate, getMovieGenres, getMovieLanguages } from "../../utils";

const MovieDetailsDialog = ({ movie, isOpen, onClose }) => {
  if (!isOpen || !movie) return null;

  const genres = getMovieGenres(movie);
  const languages = getMovieLanguages(movie);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="fixed inset-x-0 bottom-0 z-50 mx-auto max-h-[90vh] max-w-2xl overflow-y-auto rounded-t-2xl bg-white md:bottom-auto md:top-1/2 md:left-1/2 md:transform md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-2xl">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between border-b border-black/10 bg-white px-4 py-3 md:px-5">
          <h2 className="text-[16px] font-black text-[#171717]">{movie?.title}</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 hover:bg-black/5"
            aria-label="Close dialog"
          >
            <X size={18} className="text-[#171717]" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-5 px-4 py-4 md:px-5">
          {/* Basic Info */}
          <div className="space-y-3">
            <div className="flex w-fit items-center gap-2 rounded-full bg-[#171717] px-3 py-1.5 text-[13px]">
              <Star size={14} className="text-[#ffd166]" />
              <span className="font-bold text-white">{movie?.rating}/10</span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-black/10 bg-[#f8f6f2] p-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#8b8179]">
                  Runtime
                </p>
                <p className="mt-2 flex items-center gap-2 text-[13px] font-bold text-[#171717]">
                  <Clock size={14} />
                  {movie?.duration || "TBA"}
                </p>
              </div>

              <div className="rounded-2xl border border-black/10 bg-[#f8f6f2] p-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#8b8179]">
                  Release
                </p>
                <p className="mt-2 flex items-center gap-2 text-[13px] font-bold text-[#171717]">
                  <Calendar size={14} />
                  {movie?.releaseDate ? formatReleaseDate(movie.releaseDate) : "TBA"}
                </p>
              </div>

              <div className="rounded-2xl border border-black/10 bg-[#f8f6f2] p-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#8b8179]">
                  Genres
                </p>
                <p className="mt-2 text-[13px] font-bold text-[#171717]">
                  {genres.join(", ") || "Drama"}
                </p>
              </div>

              <div className="rounded-2xl border border-black/10 bg-[#f8f6f2] p-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#8b8179]">
                  Languages
                </p>
                <p className="mt-2 flex items-center gap-2 text-[13px] font-bold text-[#171717]">
                  <Globe size={14} />
                  {languages.join(", ") || "Multiple"}
                </p>
              </div>
            </div>
          </div>

          {/* Synopsis */}
          {movie?.description && (
            <div className="space-y-2">
              <h3 className="text-[13px] font-bold uppercase tracking-[0.1em] text-[#8f46ff]">
                Synopsis
              </h3>
              <p className="text-[13px] leading-6 text-[#6f6660]">
                {movie.description}
              </p>
            </div>
          )}

          {/* Formats */}
          {movie?.format && movie.format.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-[13px] font-bold uppercase tracking-[0.1em] text-[#8f46ff]">
                Available Formats
              </h3>
              <div className="flex flex-wrap gap-2">
                {movie.format.map((format) => (
                  <span
                    key={format}
                    className="rounded-full border border-black/10 bg-white px-3 py-1.5 text-xs font-semibold text-[#171717]"
                  >
                    {format}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default MovieDetailsDialog;
