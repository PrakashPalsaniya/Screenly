import MovieCard from "./MovieCard";
import MovieSkeleton from "../shared/MovieSkeleton";


const MovieList = ({
  allMovies,
  loading,
  error,
  resultCount,
  searchValue,
  sortLabel,
  onResetFilters,
}) => {
  return (
    <div className="w-full">
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
          </p>
        </div>
        <button
          type="button"
          onClick={onResetFilters}
          className="text-left text-[13px] font-bold text-[#171717] hover:text-[#8f46ff]"
        >
          Clear search & filters -&gt;
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-3 gap-x-3 gap-y-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {Array(8)
            .fill(0)
            .map((_, i) => (
              <MovieSkeleton key={i} />
            ))}
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
            Try a different keyword, remove some filters, or switch the sort order to
            discover more titles.
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
        <div className="grid grid-cols-3 gap-x-3 gap-y-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {allMovies.map((movie, i) => (
            <MovieCard key={movie._id || i} movie={movie} eager={i < 4} />
          ))}
        </div>
      )}
    </div>
  );
};

export default MovieList;
