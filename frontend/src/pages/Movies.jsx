import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { SlidersHorizontal } from "lucide-react";
import BannerSlider from "../components/shared/BannerSlider";
import FilterDialog from "../components/movies/FilterDialog";
import MovieList from "../components/movies/MovieList";
import { useMovies } from "../hooks/useMovies";
import { getMovieGenres, getMovieLanguages, getMovieYear } from "../utils";

const MOVIES_PER_PAGE = 12;

const Movies = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedLanguages, setSelectedLanguages] = useState([]);
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [sortBy, setSortBy] = useState(searchParams.get("sort") || "featured");
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);
  const [clientPage, setClientPage] = useState(1);

  const searchValue = searchParams.get("q") || "";

  // Server-side: always fetch page 1 with high limit so filters work on full dataset
  // For a small dataset (< 200 movies) this is fine — scales naturally
  const { movies, total, totalPages: serverTotalPages, loading, error } = useMovies({
    page: 1,
    limit: 100,
  });

  const availableGenres = useMemo(() => {
    const genreSet = new Set();
    (movies ?? []).forEach((movie) => {
      getMovieGenres(movie).forEach((genre) => genreSet.add(genre));
    });
    return [...genreSet].sort((a, b) => a.localeCompare(b)).slice(0, 12);
  }, [movies]);

  const topGenres = availableGenres.slice(0, 5);

  // Client-side filter + sort on the fetched batch
  const filteredMovies = useMemo(() => {
    const normalizedQuery = searchValue.trim().toLowerCase();

    const filtered = (movies ?? []).filter((movie) => {
      const title = movie?.title?.toLowerCase() || "";
      const genres = getMovieGenres(movie);
      const movieLanguages = getMovieLanguages(movie);

      const matchesQuery =
        !normalizedQuery ||
        title.includes(normalizedQuery) ||
        genres.some((genre) => genre.toLowerCase().includes(normalizedQuery));

      const matchesGenres =
        !selectedGenres.length || selectedGenres.some((g) => genres.includes(g));

      const matchesLanguages =
        !selectedLanguages.length ||
        selectedLanguages.some((l) => movieLanguages.includes(l));

      return matchesQuery && matchesGenres && matchesLanguages;
    });

    const sorted = [...filtered];
    if (sortBy === "rating") sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    else if (sortBy === "title") sorted.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
    else if (sortBy === "newest") sorted.sort((a, b) => getMovieYear(b) - getMovieYear(a));

    return sorted;
  }, [movies, searchValue, selectedGenres, selectedLanguages, sortBy]);

  // Client-side pagination over filtered results
  const totalPages = Math.ceil(filteredMovies.length / MOVIES_PER_PAGE);
  const paginatedMovies = filteredMovies.slice(
    (clientPage - 1) * MOVIES_PER_PAGE,
    clientPage * MOVIES_PER_PAGE
  );

  // Reset to page 1 whenever filters change
  const toggleItem = (value, setter) => {
    setClientPage(1);
    setter((prev) => prev.includes(value) ? prev.filter((i) => i !== value) : [...prev, value]);
  };

  const updateSearchValue = (value) => {
    setClientPage(1);
    const nextParams = new URLSearchParams(searchParams);
    if (value.trim()) nextParams.set("q", value);
    else nextParams.delete("q");
    setSearchParams(nextParams, { replace: true });
  };

  const updateSortValue = (value) => {
    setClientPage(1);
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
    setClientPage(1);
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
        {/* Filter Button */}
        <div className="mb-5 flex items-center gap-3">
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

        {/* Filter Dialog */}
        <FilterDialog
          isOpen={isFilterDialogOpen}
          onClose={() => setIsFilterDialogOpen(false)}
          selectedGenres={selectedGenres}
          selectedLanguages={selectedLanguages}
          availableGenres={availableGenres}
          topGenres={topGenres}
          onToggleGenre={(value) => toggleItem(value, setSelectedGenres)}
          onToggleLanguage={(value) => toggleItem(value, setSelectedLanguages)}
          onApply={() => setIsFilterDialogOpen(false)}
          onClear={resetAllFilters}
        />

        {/* Movie List with Pagination */}
        <MovieList
          allMovies={paginatedMovies}
          loading={loading}
          error={error}
          resultCount={filteredMovies.length}
          searchValue={searchValue}
          sortLabel={sortLabelMap[sortBy] || "featured"}
          onResetFilters={resetAllFilters}
          currentPage={clientPage}
          totalPages={totalPages}
          onPageChange={(page) => {
            setClientPage(page);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        />
      </div>
    </div>
  );
};

export default Movies;
