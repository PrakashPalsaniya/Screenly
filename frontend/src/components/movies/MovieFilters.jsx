
const chipClass = "rounded-full border px-2.5 py-1 text-[12px] font-semibold transition";

const MovieFilters = ({
  searchValue,
  onSearchChange,
  selectedGenres,
  availableGenres,
  sortBy,
  onSortChange,
  onToggleGenre,
  onClearSection,
  onResetAll,
  resultCount,
}) => {
  // Show only top 5 genres
  const topGenres = availableGenres.slice(0, 5);

  return (
    <aside className="w-full md:sticky md:top-32 md:w-[280px]">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between md:mb-5 md:block">
        <div>
          <h2 className="text-[18px] font-black text-[#171717]">Filters</h2>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#8b8179] md:mt-1">
            {resultCount} results
          </p>
        </div>
      </div>

      <div className="space-y-3 md:space-y-4">
        {/* Search */}
        <div className="cine-card rounded-2xl p-3">
          <input
            type="search"
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search movies..."
            className="cine-focus w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-[13px] outline-none"
            aria-label="Search movies"
          />
        </div>

        {/* Sort By */}
        <div className="cine-card rounded-2xl p-3">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[13px] font-bold text-[#171717]">Sort</span>
            {sortBy !== "featured" && (
              <button
                type="button"
                onClick={() => onSortChange("featured")}
                className="text-[12px] font-bold text-[#8f46ff] hover:text-[#7c3aed]"
              >
                Reset
              </button>
            )}
          </div>

          <select
            value={sortBy}
            onChange={(event) => onSortChange(event.target.value)}
            className="cine-focus w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-[13px] outline-none"
            aria-label="Sort movies"
          >
            <option value="featured">Featured</option>
            <option value="rating">Top Rated</option>
            <option value="title">Title A-Z</option>
            <option value="newest">Newest</option>
          </select>
        </div>

        {/* Genres Only */}
        <div className="cine-card rounded-2xl p-3">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[13px] font-bold text-[#171717]">Genres</span>
            {selectedGenres.length > 0 && (
              <button
                type="button"
                onClick={() => onClearSection("genres")}
                className="text-[12px] font-bold text-[#8f46ff] hover:text-[#7c3aed]"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {topGenres.map((genre) => (
              <button
                type="button"
                key={genre}
                onClick={() => onToggleGenre(genre)}
                className={`${chipClass} ${
                  selectedGenres.includes(genre)
                    ? "border-[#8f46ff] bg-[#8f46ff] text-white shadow-md"
                    : "border-black/10 bg-white text-[#5f5a56] hover:border-[#8f46ff] hover:bg-[#f4ecff]"
                }`}
              >
                {genre}
              </button>
            ))}
          </div>
        </div>

        {/* Reset Button */}
        {(selectedGenres.length > 0 || sortBy !== "featured" || searchValue) && (
          <button
            type="button"
            onClick={onResetAll}
            className="w-full cursor-pointer rounded-full border border-[#8f46ff] bg-transparent px-3 py-2 text-[13px] font-bold text-[#8f46ff] transition hover:bg-[#8f46ff] hover:text-white md:rounded-xl"
          >
            Reset All
          </button>
        )}
      </div>
    </aside>
  );
};

export default MovieFilters;
