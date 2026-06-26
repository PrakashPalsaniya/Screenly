import { ChevronLeft, ChevronRight } from "lucide-react";
import MovieCard from "./MovieCard";
import MovieSkeleton from "../shared/MovieSkeleton";

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages = [];
    const delta = 1; // pages on each side of current

    const left = Math.max(2, currentPage - delta);
    const right = Math.min(totalPages - 1, currentPage + delta);

    pages.push(1);
    if (left > 2) pages.push("...");
    for (let i = left; i <= right; i++) pages.push(i);
    if (right < totalPages - 1) pages.push("...");
    if (totalPages > 1) pages.push(totalPages);

    return pages;
  };

  return (
    <div className="mt-10 flex items-center justify-center gap-1.5">
      {/* Prev */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="flex h-9 w-9 items-center justify-center rounded-xl border border-black/10 bg-white text-[#171717] transition hover:border-[#8f46ff] hover:text-[#8f46ff] disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ChevronLeft size={16} />
      </button>

      {/* Page Numbers */}
      {getPageNumbers().map((page, i) =>
        page === "..." ? (
          <span key={`ellipsis-${i}`} className="px-1 text-[13px] text-[#6f6660]">
            …
          </span>
        ) : (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`flex h-9 min-w-[36px] items-center justify-center rounded-xl border px-2.5 text-[13px] font-bold transition ${
              currentPage === page
                ? "border-[#8f46ff] bg-[#8f46ff] text-white"
                : "border-black/10 bg-white text-[#171717] hover:border-[#8f46ff] hover:text-[#8f46ff]"
            }`}
          >
            {page}
          </button>
        )
      )}

      {/* Next */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="flex h-9 w-9 items-center justify-center rounded-xl border border-black/10 bg-white text-[#171717] transition hover:border-[#8f46ff] hover:text-[#8f46ff] disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
};

const MovieList = ({
  allMovies,
  loading,
  error,
  resultCount,
  searchValue,
  sortLabel,
  onResetFilters,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
}) => {
  return (
    <div className="w-full">
      {/* Header */}
      <div className="cine-card mb-5 flex flex-col gap-3 rounded-2xl px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#8f46ff]">
            Discover
          </p>
          <h3 className="text-[18px] font-black leading-tight text-[#171717]">
            {searchValue ? `Results for "${searchValue}"` : "Browse"}
          </h3>
          <p className="mt-1 text-[13px] text-[#6f6660]">
            {resultCount} titles | sorted by {sortLabel}
            {totalPages > 1 && ` | Page ${currentPage} of ${totalPages}`}
          </p>
        </div>
        <button
          type="button"
          onClick={onResetFilters}
          className="text-left text-[13px] font-bold text-[#171717] hover:text-[#8f46ff]"
        >
          Clear search &amp; filters -&gt;
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-3 gap-x-3 gap-y-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {Array(12).fill(0).map((_, i) => <MovieSkeleton key={i} />)}
        </div>
      ) : error ? (
        <div className="cine-card rounded-2xl px-5 py-8 text-center text-[13px] text-[#b4233f]">
          Failed to load movies. Please try again.
        </div>
      ) : !allMovies.length ? (
        <div className="cine-card rounded-2xl px-5 py-9 text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#8f46ff]">
            No Matches
          </p>
          <h3 className="mt-2 text-[20px] font-black leading-tight text-[#171717]">
            No movies match your current filters
          </h3>
          <p className="mx-auto mt-2 max-w-lg text-[13px] text-[#6f6660]">
            Try a different keyword, remove some filters, or switch the sort order to discover more titles.
          </p>
          <button
            type="button"
            onClick={onResetFilters}
            className="cine-button mt-5 rounded-full px-4 py-2.5 text-[13px] font-semibold"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-x-3 gap-y-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {allMovies.map((movie, i) => (
              <MovieCard key={movie._id || i} movie={movie} eager={i < 4} />
            ))}
          </div>

          {/* Pagination Controls */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
          />
        </>
      )}
    </div>
  );
};

export default MovieList;
