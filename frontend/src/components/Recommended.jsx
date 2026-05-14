import { useNavigate } from "react-router-dom";
import { useMovies } from "../hooks/useMovies";
import MovieCard from "./movies/MovieCard";

const Recommended = () => {
  const navigate = useNavigate();
  const { movies, loading, error } = useMovies();

  const recommendedMovies = (movies && Array.isArray(movies) ? [...movies] : [])
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
    .slice(0, 8);

  if (loading) {
    return (
      <section className="w-full bg-[#f6f3ee] py-8 sm:py-10">
        <div className="mx-auto max-w-screen-xl px-4">
          <div className="mb-5 h-8 w-56 animate-pulse rounded-full bg-black/10" />
          <div className="grid grid-cols-3 gap-x-3 gap-y-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {Array(8)
              .fill(0)
              .map((_, i) => (
                <div key={`loading-${i}`} className="w-full">
                  <div className="aspect-[2/3] animate-pulse rounded-2xl bg-black/10" />
                  <div className="space-y-2 px-1 pb-1 pt-3">
                    <div className="h-4 w-3/4 animate-pulse rounded bg-black/10" />
                    <div className="h-3 w-1/2 animate-pulse rounded bg-black/10" />
                  </div>
                </div>
              ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="w-full bg-[#f6f3ee] py-8 sm:py-10">
        <div className="mx-auto max-w-screen-xl px-4">
          <div className="cine-card rounded-2xl px-5 py-8 text-center text-[13px] text-[#b4233f]">
            Failed to load movies. Please try again.
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full bg-[#f6f3ee] py-8 sm:py-10">
      <div className="mx-auto max-w-screen-xl px-4">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#8f46ff]">
              Now showing
            </p>
            <h2 className="text-[20px] font-black leading-tight text-[#171717] md:text-[22px]">
              Recommended
            </h2>
          </div>
          <button
            onClick={() => navigate("/movies")}
            className="rounded-full border border-black/10 bg-white px-3 py-1.5 text-[13px] font-bold text-[#171717] shadow-sm transition hover:border-[#8f46ff] hover:text-[#8f46ff]"
          >
            See All
          </button>
        </div>

        <div className="grid grid-cols-3 gap-x-3 gap-y-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {recommendedMovies.map((movie, i) => (
            <div
              key={movie._id || i}
              className="animate-fadeIn"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <MovieCard movie={movie} eager={i < 4} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Recommended;
