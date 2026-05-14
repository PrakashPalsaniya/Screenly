import { useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { useSearchParams } from "react-router-dom";
import { SlidersHorizontal } from "lucide-react";
import BannerSlider from "../components/shared/BannerSlider";
import FilterDialog from "../components/movies/FilterDialog";
import MovieList from "../components/movies/MovieList";
import { useMovies } from "../hooks/useMovies";

import {
  getMovieGenres,
  getMovieLanguages,
  getMovieYear,
} from "../utils";

const Movies = () => {
  const dispatch = useDispatch();
  const { movies, loading, error } = useMovies();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedLanguages, setSelectedLanguages] = useState([]);
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [sortBy, setSortBy] = useState(searchParams.get("sort") || "featured");
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);
  const searchValue = searchParams.get("q") || "";



  const availableGenres = useMemo(() => {
    const genreSet = new Set();
    (movies ?? []).forEach((movie) => {
      getMovieGenres(movie).forEach((genre) => genreSet.add(genre));
    });
    return [...genreSet].sort((a, b) => a.localeCompare(b)).slice(0, 12);
  }, [movies]);

  const topGenres = availableGenres.slice(0, 5);



  const visibleMovies = useMemo(() => {
    const normalizedQuery = searchValue.trim().toLowerCase();

    const filteredMovies = (movies ?? []).filter((movie) => {
      const title = movie?.title?.toLowerCase() || "";
      const genres = getMovieGenres(movie);
      const movieLanguages = getMovieLanguages(movie);

      const matchesQuery =
        !normalizedQuery ||
        title.includes(normalizedQuery) ||
        genres.some((genre) => genre.toLowerCase().includes(normalizedQuery));

      const matchesGenres =
        !selectedGenres.length || selectedGenres.some((genre) => genres.includes(genre));

      const matchesLanguages =
        !selectedLanguages.length ||
        selectedLanguages.some((language) => movieLanguages.includes(language));

      return matchesQuery && matchesGenres && matchesLanguages;
    });

    const sortedMovies = [...filteredMovies];

    if (sortBy === "rating") {
      sortedMovies.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sortBy === "title") {
      sortedMovies.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
    } else if (sortBy === "newest") {
      sortedMovies.sort((a, b) => getMovieYear(b) - getMovieYear(a));
    }

    return sortedMovies;
  }, [movies, searchValue, selectedGenres, selectedLanguages, sortBy]);

  const toggleItem = (value, setter) => {
    setter((previous) =>
      previous.includes(value)
        ? previous.filter((item) => item !== value)
        : [...previous, value],
    );
  };

  const updateSearchValue = (value) => {
    const nextParams = new URLSearchParams(searchParams);
    if (value.trim()) {
      nextParams.set("q", value);
    } else {
      nextParams.delete("q");
    }
    setSearchParams(nextParams, { replace: true });
  };

  const updateSortValue = (value) => {
    setSortBy(value);
    const nextParams = new URLSearchParams(searchParams);
    if (value !== "featured") {
      nextParams.set("sort", value);
    } else {
      nextParams.delete("sort");
    }
    setSearchParams(nextParams, { replace: true });
  };

  const clearSection = (section) => {
    if (section === "languages") setSelectedLanguages([]);
    if (section === "genres") setSelectedGenres([]);
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

        {/* Movie List */}
        <MovieList
          allMovies={visibleMovies}
          loading={loading}
          error={error}
          resultCount={visibleMovies.length}
          searchValue={searchValue}
          sortLabel={sortLabelMap[sortBy] || "featured"}
          onResetFilters={resetAllFilters}
        />
      </div>
    </div>
  );
};

export default Movies;
