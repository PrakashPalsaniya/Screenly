import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  Calendar,
  Check,
  Clock,
  Film,
  MapPin,
  Monitor,

  Search,
  Send,
  SlidersHorizontal,
} from "lucide-react";
import { createBulkShows, getAllMovies, getAllTheaters } from "../apis";
import AdminFilterDialog from "../components/admin/AdminFilterDialog";
import {
  getMovieCertification,
  getMovieGenres,
  getMovieLanguages,
  getMoviePoster,
  getMovieYear,
} from "../utils";

const defaultPrices = {
  PREMIUM: 510,
  EXECUTIVE: 290,
  NORMAL: 180,
};

const steps = [
  { key: "movie", label: "Movie" },
  { key: "theater", label: "Theater" },
  { key: "schedule", label: "Schedule" },
];

const toShowDate = (date) => dayjs(date).format("DD-MM-YYYY");
const toShowTime = (time) => dayjs(`2026-01-01T${time}`).format("hh:mm A");

const chipClass = "rounded-full border px-2.5 py-1 text-[11px] font-bold transition";
const inputClass =
  "cine-focus w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-[13px] font-semibold outline-none";

const AdminShows = () => {
  const [movies, setMovies] = useState([]);
  const [theaters, setTheaters] = useState([]);
  const [activeStep, setActiveStep] = useState("movie");
  const [selectedMovieIds, setSelectedMovieIds] = useState([]);
  const [selectedTheaterId, setSelectedTheaterId] = useState("");
  const [selectedScreenName, setSelectedScreenName] = useState("");
  const [dates, setDates] = useState([dayjs().format("YYYY-MM-DD")]);
  const [slots, setSlots] = useState([
    { id: crypto.randomUUID(), time: "18:00", format: "2D", audioType: "Dolby 7.1" },
  ]);
  const [prices, setPrices] = useState(defaultPrices);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);

  const [movieSearch, setMovieSearch] = useState("");
  const [movieLanguage, setMovieLanguage] = useState("all");
  const [movieGenre, setMovieGenre] = useState("all");
  const [movieSort, setMovieSort] = useState("newest");
  const [theaterSearch, setTheaterSearch] = useState("");
  const [theaterState, setTheaterState] = useState("all");
  const [theaterCity, setTheaterCity] = useState("all");
  const [isMovieFilterOpen, setIsMovieFilterOpen] = useState(false);
  const [isTheaterFilterOpen, setIsTheaterFilterOpen] = useState(false);

  const selectedMovies = useMemo(
    () => movies.filter((movie) => selectedMovieIds.includes(movie._id)),
    [movies, selectedMovieIds],
  );

  const selectedTheater = useMemo(
    () => theaters.find((theater) => theater._id === selectedTheaterId),
    [theaters, selectedTheaterId],
  );

  const screens = selectedTheater?.screens?.length
    ? selectedTheater.screens
    : [{ name: "Screen 1", formats: ["2D"], audioTypes: ["Dolby 7.1"] }];

  const selectedScreen = screens.find((screen) => screen.name === selectedScreenName);
  const availableFormats = selectedScreen?.formats?.length ? selectedScreen.formats : ["2D"];
  const availableAudioTypes = selectedScreen?.audioTypes?.length
    ? selectedScreen.audioTypes
    : ["Dolby 7.1"];

  const availableMovieLanguages = useMemo(() => {
    const values = new Set();
    movies.forEach((movie) => getMovieLanguages(movie).forEach((language) => values.add(language)));
    return [...values].sort((a, b) => a.localeCompare(b));
  }, [movies]);

  const availableMovieGenres = useMemo(() => {
    const values = new Set();
    movies.forEach((movie) => getMovieGenres(movie).forEach((genre) => values.add(genre)));
    return [...values].sort((a, b) => a.localeCompare(b));
  }, [movies]);

  const availableStates = useMemo(
    () => [...new Set(theaters.map((theater) => theater.state).filter(Boolean))].sort(),
    [theaters],
  );

  const availableCities = useMemo(() => {
    const filtered = theaters.filter(
      (theater) => theaterState === "all" || theater.state === theaterState,
    );
    return [...new Set(filtered.map((theater) => theater.city).filter(Boolean))].sort();
  }, [theaters, theaterState]);

  const filteredMovies = useMemo(() => {
    const normalizedSearch = movieSearch.trim().toLowerCase();
    const nextMovies = movies.filter((movie) => {
      const genres = getMovieGenres(movie);
      const languages = getMovieLanguages(movie);
      const title = movie.title?.toLowerCase() || "";
      const matchesSearch =
        !normalizedSearch ||
        title.includes(normalizedSearch) ||
        genres.some((genre) => genre.toLowerCase().includes(normalizedSearch)) ||
        languages.some((language) => language.toLowerCase().includes(normalizedSearch));
      const matchesLanguage = movieLanguage === "all" || languages.includes(movieLanguage);
      const matchesGenre = movieGenre === "all" || genres.includes(movieGenre);
      return matchesSearch && matchesLanguage && matchesGenre;
    });

    if (movieSort === "rating") {
      nextMovies.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (movieSort === "title") {
      nextMovies.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
    } else {
      nextMovies.sort((a, b) => getMovieYear(b) - getMovieYear(a));
    }

    return nextMovies;
  }, [movies, movieSearch, movieLanguage, movieGenre, movieSort]);

  const filteredTheaters = useMemo(() => {
    const normalizedSearch = theaterSearch.trim().toLowerCase();
    return theaters.filter((theater) => {
      const searchable = `${theater.name} ${theater.location} ${theater.city} ${theater.state}`.toLowerCase();
      const matchesSearch = !normalizedSearch || searchable.includes(normalizedSearch);
      const matchesState = theaterState === "all" || theater.state === theaterState;
      const matchesCity = theaterCity === "all" || theater.city === theaterCity;
      return matchesSearch && matchesState && matchesCity;
    });
  }, [theaters, theaterSearch, theaterState, theaterCity]);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [moviesResponse, theatersResponse] = await Promise.all([
        getAllMovies(),
        getAllTheaters(),
      ]);
      setMovies(moviesResponse.data?.movies ?? []);
      setTheaters(theatersResponse.data ?? []);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Unable to load admin data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  useEffect(() => {
    setSelectedScreenName(screens[0]?.name || "");
  }, [selectedTheaterId]);

  useEffect(() => {
    setSlots((previous) =>
      previous.map((slot) => ({
        ...slot,
        format: availableFormats.includes(slot.format) ? slot.format : availableFormats[0] || "2D",
        audioType: availableAudioTypes.includes(slot.audioType)
          ? slot.audioType
          : availableAudioTypes[0] || "Dolby 7.1",
      })),
    );
  }, [selectedScreenName, selectedTheaterId]);

  useEffect(() => {
    setTheaterCity("all");
  }, [theaterState]);

  const updatePrice = (key, value) => {
    setPrices((previous) => ({ ...previous, [key]: value }));
  };



  const publishShow = async (event) => {
    event.preventDefault();

    if (!selectedMovieIds.length || !selectedTheaterId || !selectedScreenName) {
      toast.error("Select movie, theater, and screen first");
      return;
    }
    const validDates = dates.filter(Boolean);
    const validSlots = slots.filter((slot) => slot.time);
    if (!validDates.length || !validSlots.length) {
      toast.error("Add at least one date and show time");
      return;
    }

    setPublishing(true);
    try {
      const response = await createBulkShows({
        movies: selectedMovieIds,
        theater: selectedTheaterId,
        screen: selectedScreenName,
        dates: validDates.map(toShowDate),
        slots: validSlots.map((slot) => ({
          startTime: toShowTime(slot.time),
          format: slot.format,
          audioType: slot.audioType,
          priceMap: {
            PREMIUM: Number(prices.PREMIUM),
            EXECUTIVE: Number(prices.EXECUTIVE),
            NORMAL: Number(prices.NORMAL),
          },
        })),
      });
      const result = response.data;

      toast.success(
        `Published ${result?.createdCount || 0} shows${
          result?.skippedCount ? `, skipped ${result.skippedCount} existing` : ""
        }`,
      );
      setActiveStep("movie");
      setSelectedMovieIds([]);
      setSelectedTheaterId("");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Unable to publish show");
    } finally {
      setPublishing(false);
    }
  };

  const toggleMovie = (movieId) => {
    setSelectedMovieIds((previous) =>
      previous.includes(movieId)
        ? previous.filter((id) => id !== movieId)
        : [...previous, movieId],
    );
  };

  const continueToTheaters = () => {
    if (!selectedMovieIds.length) {
      toast.error("Select at least one movie");
      return;
    }
    setActiveStep("theater");
  };

  const selectTheater = (theaterId) => {
    setSelectedTheaterId(theaterId);
    setActiveStep("schedule");
  };

  const canOpenStep = (stepKey) => {
    if (stepKey === "movie") return true;
    if (stepKey === "theater") return Boolean(selectedMovieIds.length);
    return Boolean(selectedMovieIds.length && selectedTheaterId);
  };

  const updateSlot = (slotId, key, value) => {
    setSlots((previous) =>
      previous.map((slot) => (slot.id === slotId ? { ...slot, [key]: value } : slot)),
    );
  };

  const addSlot = () => {
    setSlots((previous) => [
      ...previous,
      {
        id: crypto.randomUUID(),
        time: "18:00",
        format: availableFormats[0] || "2D",
        audioType: availableAudioTypes[0] || "Dolby 7.1",
      },
    ]);
  };

  const removeSlot = (slotId) => {
    setSlots((previous) => previous.filter((slot) => slot.id !== slotId));
  };

  const addDate = () => {
    setDates((previous) => [...previous, dayjs().format("YYYY-MM-DD")]);
  };

  const updateDate = (index, value) => {
    setDates((previous) =>
      previous.map((dateValue, currentIndex) =>
        currentIndex === index ? value : dateValue,
      ),
    );
  };

  const removeDate = (index) => {
    setDates((previous) => previous.filter((_, currentIndex) => currentIndex !== index));
  };

  return (
    <div className="bg-[#f6f3ee] px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-screen-xl">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#8f46ff]">
              Admin console
            </p>
            <h1 className="mt-1 text-[24px] font-black leading-tight text-[#171717] md:text-[28px]">
              Publish shows
            </h1>
          </div>


        </div>

        <div className="mb-5 grid gap-2 sm:grid-cols-3">
          {steps.map((step, index) => {
            const isActive = activeStep === step.key;
            const isDone =
              (step.key === "movie" && selectedMovieIds.length) ||
              (step.key === "theater" && selectedTheaterId) ||
              (step.key === "schedule" && selectedMovieIds.length && selectedTheaterId);

            return (
              <button
                type="button"
                key={step.key}
                disabled={!canOpenStep(step.key)}
                onClick={() => setActiveStep(step.key)}
                className={`flex items-center justify-between rounded-xl border px-3 py-2.5 text-left transition disabled:cursor-not-allowed disabled:opacity-50 ${
                  isActive
                    ? "border-[#8f46ff] bg-[#171717] text-white"
                    : "border-black/10 bg-white text-[#171717] hover:border-[#8f46ff]"
                }`}
              >
                <span>
                  <span className="block text-[10px] font-black uppercase tracking-[0.14em] opacity-70">
                    Step {index + 1}
                  </span>
                  <span className="mt-0.5 block text-[13px] font-black">{step.label}</span>
                </span>
                {isDone ? <Check size={16} /> : null}
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="cine-card flex min-h-[360px] items-center justify-center rounded-[26px] p-8">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#8f46ff] border-t-transparent" />
          </div>
        ) : null}

        {!loading && activeStep === "movie" ? (
          <section className="space-y-5">
            {/* Filter Button */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsMovieFilterOpen(true)}
                className="flex items-center gap-2 rounded-full border border-[#171717] bg-white px-3 py-2 text-[13px] font-bold text-[#171717] transition hover:bg-[#171717] hover:text-white"
              >
                <SlidersHorizontal size={16} />
                Filters
              </button>
              {(movieLanguage !== "all" || movieGenre !== "all" || movieSort !== "newest" || movieSearch) && (
                <span className="rounded-full bg-[#8f46ff] px-3 py-1.5 text-xs font-bold text-white">
                  Filters active
                </span>
              )}
            </div>

            {/* Filter Dialog */}
            <AdminFilterDialog
              isOpen={isMovieFilterOpen}
              onClose={() => setIsMovieFilterOpen(false)}
              title="Filter"
              searchValue={movieSearch}
              onSearchChange={setMovieSearch}
              filters={[
                {
                  key: "language",
                  label: "Language",
                  value: movieLanguage,
                  options: [
                    { value: "all", label: "All languages" },
                    ...availableMovieLanguages.map((lang) => ({
                      value: lang,
                      label: lang,
                    })),
                  ],
                },
                {
                  key: "genre",
                  label: "Genre",
                  value: movieGenre,
                  options: [
                    { value: "all", label: "All genres" },
                    ...availableMovieGenres.map((genre) => ({
                      value: genre,
                      label: genre,
                    })),
                  ],
                },
                {
                  key: "sort",
                  label: "Sort By",
                  value: movieSort,
                  options: [
                    { value: "newest", label: "Newest" },
                    { value: "rating", label: "Top rated" },
                    { value: "title", label: "Title A-Z" },
                  ],
                },
              ]}
              onFilterChange={(key, value) => {
                if (key === "language") setMovieLanguage(value);
                else if (key === "genre") setMovieGenre(value);
                else if (key === "sort") setMovieSort(value);
              }}
            />

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filteredMovies.map((movie) => (
                <button
                  type="button"
                  key={movie._id}
                  onClick={() => toggleMovie(movie._id)}
                  className={`cine-card relative flex min-h-[124px] gap-3 rounded-2xl p-3 text-left transition hover:-translate-y-0.5 hover:border-[#8f46ff] ${
                    selectedMovieIds.includes(movie._id) ? "border-[#8f46ff] bg-[#f4ecff]" : ""
                  }`}
                >
                  {selectedMovieIds.includes(movie._id) ? (
                    <span className="absolute right-3 top-3 rounded-full bg-[#171717] p-1 text-white">
                      <Check size={13} />
                    </span>
                  ) : null}
                  <img
                    src={getMoviePoster(movie, { width: 180 })}
                    alt={movie.title}
                    className="h-24 w-16 shrink-0 rounded-xl object-cover"
                  />
                  <span className="min-w-0 py-1">
                    <span className="line-clamp-2 block text-[14px] font-black leading-snug text-[#171717]">
                      {movie.title}
                    </span>
                    <span className="mt-1.5 block text-[12px] font-semibold text-[#6f6660]">
                      {getMovieGenres(movie).slice(0, 3).join(", ") || "Genre TBA"}
                    </span>
                    <span className="mt-3 flex flex-wrap gap-2">
                      <span className={`${chipClass} border-[#8f46ff]/25 bg-[#f4ecff] text-[#6d28d9]`}>
                        {movie.duration}
                      </span>
                      <span className={`${chipClass} border-black/10 bg-white text-[#5f5a56]`}>
                        {getMovieCertification(movie)}
                      </span>
                    </span>
                  </span>
                </button>
              ))}
            </div>

            {!filteredMovies.length ? (
              <div className="cine-card rounded-[26px] p-8 text-center font-bold text-[#6f6660]">
                No movies match these filters.
              </div>
            ) : null}

            <div className="sticky bottom-4 z-10 flex justify-end">
              <button
                type="button"
                onClick={continueToTheaters}
                className="cine-button inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-[13px] font-black"
              >
                Continue with {selectedMovieIds.length} movie{selectedMovieIds.length === 1 ? "" : "s"}
              </button>
            </div>
          </section>
        ) : null}

        {!loading && activeStep === "theater" ? (
          <section className="space-y-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={() => setActiveStep("movie")}
                className="inline-flex w-fit items-center gap-2 rounded-xl border border-black/10 bg-white px-3 py-2 text-[13px] font-black text-[#171717]"
              >
                <ArrowLeft size={16} />
                Movies
              </button>
              <p className="text-sm font-bold text-[#6f6660]">
                Selected: <span className="text-[#171717]">{selectedMovieIds.length} movie{selectedMovieIds.length === 1 ? "" : "s"}</span>
              </p>
            </div>

            {/* Theater Filter Button */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsTheaterFilterOpen(true)}
                className="flex items-center gap-2 rounded-full border border-[#171717] bg-white px-3 py-2 text-[13px] font-bold text-[#171717] transition hover:bg-[#171717] hover:text-white"
              >
                <SlidersHorizontal size={16} />
                Filters
              </button>
              {(theaterState !== "all" || theaterCity !== "all" || theaterSearch) && (
                <span className="rounded-full bg-[#8f46ff] px-3 py-1.5 text-xs font-bold text-white">
                  Filters active
                </span>
              )}
            </div>

            {/* Theater Filter Dialog */}
            <AdminFilterDialog
              isOpen={isTheaterFilterOpen}
              onClose={() => setIsTheaterFilterOpen(false)}
              title="Filter Theaters"
              searchValue={theaterSearch}
              onSearchChange={setTheaterSearch}
              filters={[
                {
                  key: "state",
                  label: "State",
                  value: theaterState,
                  options: [
                    { value: "all", label: "All states" },
                    ...availableStates.map((state) => ({
                      value: state,
                      label: state,
                    })),
                  ],
                },
                {
                  key: "city",
                  label: "City",
                  value: theaterCity,
                  options: [
                    { value: "all", label: "All cities" },
                    ...availableCities.map((city) => ({
                      value: city,
                      label: city,
                    })),
                  ],
                },
              ]}
              onFilterChange={(key, value) => {
                if (key === "state") setTheaterState(value);
                else if (key === "city") setTheaterCity(value);
              }}
            />

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filteredTheaters.map((theater) => (
                <button
                  type="button"
                  key={theater._id}
                  onClick={() => selectTheater(theater._id)}
                  className="cine-card rounded-2xl p-3 text-left transition hover:-translate-y-0.5 hover:border-[#8f46ff]"
                >
                  <span className="flex items-start gap-3">
                    <img
                      src={theater.logo}
                      alt={theater.name}
                      className="h-9 w-9 rounded-lg bg-white object-contain p-1 shadow-sm"
                    />
                    <span>
                      <span className="block text-[14px] font-black leading-snug text-[#171717]">{theater.name}</span>
                      <span className="mt-1 block text-[12px] font-semibold text-[#6f6660]">
                        {theater.location}
                      </span>
                      <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-[#eef4ff] px-2.5 py-1 text-[11px] font-black text-[#3b82f6]">
                        <Monitor size={12} />
                        {(theater.screens?.length || 1)} screens
                      </span>
                    </span>
                  </span>
                </button>
              ))}
            </div>

            {!filteredTheaters.length ? (
              <div className="cine-card rounded-[26px] p-8 text-center font-bold text-[#6f6660]">
                No theaters match these filters.
              </div>
            ) : null}
          </section>
        ) : null}

        {!loading && activeStep === "schedule" ? (
          <form onSubmit={publishShow} className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="space-y-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={() => setActiveStep("theater")}
                  className="inline-flex w-fit items-center gap-2 rounded-xl border border-black/10 bg-white px-3 py-2 text-[13px] font-black text-[#171717]"
                >
                  <ArrowLeft size={16} />
                  Theaters
                </button>
              </div>

              <section className="cine-card rounded-2xl p-3 sm:p-4">
                <div className="mb-3 flex items-center gap-2 text-[13px] font-black text-[#5f5a56]">
                  <Monitor size={16} />
                  <span>Select screen</span>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  {screens.map((screen) => (
                    <button
                      type="button"
                      key={screen.name}
                      onClick={() => setSelectedScreenName(screen.name)}
                      className={`rounded-xl border p-3 text-left transition ${
                        selectedScreenName === screen.name
                          ? "border-[#8f46ff] bg-[#f4ecff]"
                          : "border-black/10 bg-white hover:border-[#8f46ff]"
                      }`}
                    >
                      <span className="block text-[13px] font-black text-[#171717]">{screen.name}</span>
                      <span className="mt-2 block text-xs font-semibold text-[#6f6660]">
                        {(screen.formats || []).join(", ")}
                      </span>
                    </button>
                  ))}
                </div>
              </section>

              <section className="cine-card rounded-2xl p-3 sm:p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-[13px] font-black text-[#5f5a56]">
                    <Calendar size={16} />
                    <span>Dates</span>
                  </div>
                  <button
                    type="button"
                    onClick={addDate}
                    className="rounded-full border border-black/10 bg-white px-3 py-1.5 text-[12px] font-black text-[#171717]"
                  >
                    Add date
                  </button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {dates.map((dateValue, index) => (
                    <div key={`${dateValue}-${index}`} className="flex gap-2">
                      <input
                        className={inputClass}
                        type="date"
                        min={dayjs().format("YYYY-MM-DD")}
                        value={dateValue}
                        onChange={(event) => updateDate(index, event.target.value)}
                      />
                      {dates.length > 1 ? (
                        <button
                          type="button"
                          onClick={() => removeDate(index)}
                          className="rounded-xl border border-red-200 bg-red-50 px-3 text-[12px] font-black text-red-700"
                        >
                          Remove
                        </button>
                      ) : null}
                    </div>
                  ))}
                </div>
              </section>

              <section className="cine-card rounded-2xl p-3 sm:p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-[13px] font-black text-[#5f5a56]">
                    <Clock size={16} />
                    <span>Show times</span>
                  </div>
                  <button
                    type="button"
                    onClick={addSlot}
                    className="rounded-full border border-black/10 bg-white px-3 py-1.5 text-[12px] font-black text-[#171717]"
                  >
                    Add time
                  </button>
                </div>
                <div className="space-y-3">
                  {slots.map((slot) => (
                    <div
                      key={slot.id}
                      className="grid gap-2 rounded-xl border border-black/10 bg-white p-3 sm:grid-cols-[1fr_1fr_1fr_auto]"
                    >
                      <input
                        className={inputClass}
                        type="time"
                        value={slot.time}
                        onChange={(event) => updateSlot(slot.id, "time", event.target.value)}
                      />
                      <select
                        className={inputClass}
                        value={slot.format}
                        onChange={(event) => updateSlot(slot.id, "format", event.target.value)}
                      >
                        {availableFormats.map((format) => (
                          <option key={format} value={format}>
                            {format}
                          </option>
                        ))}
                      </select>
                      <select
                        className={inputClass}
                        value={slot.audioType}
                        onChange={(event) => updateSlot(slot.id, "audioType", event.target.value)}
                      >
                        {availableAudioTypes.map((audioType) => (
                          <option key={audioType} value={audioType}>
                            {audioType}
                          </option>
                        ))}
                      </select>
                      {slots.length > 1 ? (
                        <button
                          type="button"
                          onClick={() => removeSlot(slot.id)}
                          className="rounded-xl border border-red-200 bg-red-50 px-3 text-[12px] font-black text-red-700"
                        >
                          Remove
                        </button>
                      ) : null}
                    </div>
                  ))}
                </div>
              </section>

              <section className="cine-card rounded-2xl p-3 sm:p-4">
                <div className="mb-3 text-[13px] font-black text-[#5f5a56]">Prices</div>
                <div className="grid gap-4 sm:grid-cols-3">
                  {Object.keys(defaultPrices).map((key) => (
                    <label key={key} className="block">
                      <span className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-[#6f6660]">
                        {key}
                      </span>
                      <input
                        className={inputClass}
                        type="number"
                        min="1"
                        value={prices[key]}
                        onChange={(event) => updatePrice(key, event.target.value)}
                      />
                    </label>
                  ))}
                </div>
              </section>
            </div>

            <aside className="cine-card h-fit rounded-2xl p-3 sm:p-4 lg:sticky lg:top-24">
              <h2 className="mb-3 text-[18px] font-black text-[#171717]">Ready to publish</h2>
              <div className="space-y-4">
                <div className="rounded-xl border border-black/10 bg-white p-3">
                  <span className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.14em] text-[#8b8179]">
                    <Film size={14} />
                    Movies
                  </span>
                  <p className="text-[14px] font-black text-[#171717]">
                    {selectedMovies.length} selected
                  </p>
                  <p className="mt-1 line-clamp-3 text-[12px] font-semibold text-[#6f6660]">
                    {selectedMovies.map((movie) => movie.title).join(", ")}
                  </p>
                </div>
                <div className="rounded-xl border border-black/10 bg-white p-3">
                  <span className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.14em] text-[#8b8179]">
                    <MapPin size={14} />
                    Theater
                  </span>
                  <p className="text-[14px] font-black text-[#171717]">{selectedTheater?.name}</p>
                  <p className="mt-1 text-[12px] font-semibold text-[#6f6660]">
                    {selectedTheater?.location}
                  </p>
                </div>
                <div className="rounded-xl border border-black/10 bg-[#faf8f4] p-3">
                  <p className="text-[13px] font-black text-[#171717]">
                    {selectedScreenName}
                  </p>
                  <p className="mt-2 text-[12px] font-bold text-[#8f46ff]">
                    {dates.filter(Boolean).length} date{dates.filter(Boolean).length === 1 ? "" : "s"} / {slots.filter((slot) => slot.time).length} time{slots.filter((slot) => slot.time).length === 1 ? "" : "s"}
                  </p>
                </div>
              </div>

              <button
                type="submit"
                disabled={publishing}
                className="cine-button mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-black transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-70"
              >
                <Send size={15} />
                {publishing ? "Publishing" : "Publish show"}
              </button>
            </aside>
          </form>
        ) : null}
      </div>
    </div>
  );
};

export default AdminShows;
