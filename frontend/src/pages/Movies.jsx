import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { SlidersHorizontal } from "lucide-react";
import BannerSlider from "../components/shared/BannerSlider";
import FilterDialog from "../components/movies/FilterDialog";
import MovieList from "../components/movies/MovieList";
import { useMovies } from "../hooks/useMovies";
import { genres } from "../utils/constants";

const Movies = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedLanguages, setSelectedLanguages] = useState([]);
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [sortBy, setSortBy] = useState(searchParams.get("sort") || "featured");
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);
  const [page, setPage] = useState(1);

  const searchValue = searchParams.get("q") || "";

  // Reset page to 1 when filters or search change
  useEffect(() => {
    setPage(1);
  }, [searchValue, selectedGenres, selectedLanguages, sortBy]);

  // Fetch movies from server using server-side pagination, sorting & filters
  const {
    movies,
    total,
    totalPages,
    currentPage,
    hasNextPage,
    loading,
    fetching,
    error,
  } = useMovies({
    page,
    limit: 12,
    search: searchValue,
    genre: selectedGenres.join(","),
    language: selectedLanguages.join(","),
    sort: sortBy,
  });

  const toggleItem = (value, setter) => {
    setter((prev) =>
      prev.includes(value) ? prev.filter((i) => i !== value) : [...prev, value]
    );
  };

  const updateSortValue = (value) => {
    setSortBy(value);
    const nextParams = new URLSearchParams(searchParams);
    if (value !== "featured") nextParams.set("sort", value);
    else nextParams.delete("sort");
    setSearchParams(nextParams, { replace: true });
  };

  const resetAllFilters = () => {
    setSelectedLanguages([]);
    setSelectedGenres([]);
    setSortBy("featured");
    setSearchParams({}, { replace: true });
  };

  const sortLabelMap = {
    featured: "featured",
    rating: "top rated",
    title: "title",
    newest: "newest",
  };

  return (
    <div className="bg-[#f6f3ee]">
      <BannerSlider />
      <div className="mx-auto flex min-h-screen max-w-screen-xl flex-col px-4 pb-12 pt-4">
        {/* Filter & Sort Controls */}
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsFilterDialogOpen(true)}
              className="flex items-center gap-2 rounded-full border border-[#171717] bg-white px-3 py-2 text-[13px] font-bold text-[#171717] transition hover:bg-[#171717] hover:text-white"
            >
              <SlidersHorizontal size={16} />
              Filters
            </button>
            {(selectedGenres.length > 0 || selectedLanguages.length > 0) && (
              <span className="rounded-full bg-[#8f46ff] px-2.5 py-1 text-[12px] font-bold text-white">
                {selectedGenres.length + selectedLanguages.length} active
              </span>
            )}
          </div>
          {/* Sorting Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-[12px] font-bold uppercase tracking-wider text-[#6f6660]">Sort By:</span>
            <select
              value={sortBy}
              onChange={(e) => updateSortValue(e.target.value)}
              className="rounded-full border border-[#171717] bg-white px-3 py-1.5 text-[13px] font-bold text-[#171717] outline-none"
            >
              <option value="featured">Featured</option>
              <option value="rating">Top Rated</option>
              <option value="title">Title</option>
              <option value="newest">Newest</option>
            </select>
          </div>
        </div>

        {/* Filter Dialog */}
        <FilterDialog
          isOpen={isFilterDialogOpen}
          onClose={() => setIsFilterDialogOpen(false)}
          selectedGenres={selectedGenres}
          selectedLanguages={selectedLanguages}
          availableGenres={genres}
          topGenres={genres}
          onToggleGenre={(value) => toggleItem(value, setSelectedGenres)}
          onToggleLanguage={(value) => toggleItem(value, setSelectedLanguages)}
          onApply={() => setIsFilterDialogOpen(false)}
          onClear={resetAllFilters}
        />

        {/* Movie List with Infinite Scroll */}
        <MovieList
          allMovies={movies}
          loading={loading && page === 1} // Only show full loading skeleton on first page load
          fetching={fetching}
          error={error}
          resultCount={total}
          searchValue={searchValue}
          sortLabel={sortLabelMap[sortBy] || "featured"}
          onResetFilters={resetAllFilters}
          hasNextPage={hasNextPage}
          onLoadMore={() => {
            setPage((prev) => prev + 1);
          }}
        />
      </div>
    </div>
  );
};

export default Movies;
