import { useState } from "react";
import dayjs from "dayjs";
import { MapPin } from "lucide-react";
import { useShows } from "../../hooks/useShow";
import { useLocationContext } from "../../context/LocationContext";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { usePrefetch } from "../../redux/apiSlice";

const TheaterTimings = ({ movieId }) => {
  const navigate = useNavigate();
  const { location, loading: locationLoading, error: locationError } = useLocationContext();
  const prefetchShows = usePrefetch("getShowsByMovieAndLocation");
  const { auth, openAuthModal } = useAuth();

  const today = dayjs();
  const [selectedDate, setSelectedDate] = useState(today);
  const formattedDate = selectedDate.format("DD-MM-YYYY");

  const next7days = Array.from({ length: 7 }, (_, i) => today.add(i, "day"));

  const filters = { movieId, state: location, date: formattedDate };
  const { shows: showData, loading: isLoading, error: isError } = useShows(filters);

  return (
    <>
      <div className="mb-2 rounded-[20px] border border-black/8 bg-[#f8f6f2] p-3">
        <div className="flex items-center gap-3 overflow-x-auto py-1 scrollbar-hide">
          {next7days.map((date) => {
            const isSelected = selectedDate.isSame(date, "day");
            const showMonth = date.date() === 1 || date.isSame(today, "day");
            return (
              <div key={date.format("DD-MM-YYYY")} className="flex shrink-0 items-center gap-2">
                {showMonth ? (
                  <div className="flex h-[54px] w-7 items-center justify-center rounded-full bg-black/5 text-[11px] font-bold uppercase tracking-[0.08em] text-[#5f5a56] [writing-mode:vertical-rl]">
                    {date.format("MMM")}
                  </div>
                ) : null}
                <button
                  onClick={() => setSelectedDate(date)}
                  onMouseEnter={() => {
                    if (location) {
                      prefetchShows({ movieId, state: location, date: date.format("DD-MM-YYYY") });
                    }
                  }}
                  className={`flex h-[54px] min-w-[56px] cursor-pointer flex-col items-center justify-center rounded-2xl px-3 transition ${
                    isSelected
                      ? "bg-[#171717] text-white shadow-[0_10px_24px_rgba(23,23,23,0.2)]"
                      : "bg-transparent text-[#171717] hover:bg-white"
                  }`}
                >
                  <span className="text-[20px] font-black leading-none md:text-[22px]">
                    {date.format("D")}
                  </span>
                  <span className={`mt-1 text-[13px] font-semibold leading-none ${isSelected ? "text-white" : "text-[#6f6660]"}`}>
                    {date.format("ddd")}
                  </span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        {locationLoading && !location ? (
          <div className="cine-card flex flex-col items-center justify-center gap-3 rounded-2xl px-6 py-12 text-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#8f46ff] border-t-transparent" />
            <p className="text-base font-bold text-[#171717] md:text-[18px]">Finding nearby theaters...</p>
            <p className="text-[13px] text-[#6f6660] md:text-[15px]">We are loading shows for your current state.</p>
          </div>
        ) : !location ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-6 py-8 text-center text-amber-800">
            We could not detect your location yet, so nearby shows cannot be loaded.
          </div>
        ) : isLoading ? (
          <div className="cine-card flex flex-col items-center justify-center gap-3 rounded-2xl px-6 py-12 text-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#8f46ff] border-t-transparent" />
            <p className="text-base font-bold text-[#171717] md:text-[18px]">Loading shows...</p>
            <p className="text-[13px] text-[#6f6660] md:text-[15px]">Checking theaters for {formattedDate}.</p>
          </div>
        ) : isError ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-8 text-center text-red-700">
            We could not load shows right now. Please try again.
          </div>
        ) : showData?.length === 0 ? (
          <div className="cine-card rounded-2xl px-6 py-8 text-center text-[#6f6660]">
            No shows available for {formattedDate} in {location}.
            {locationError ? (
              <p className="mt-2 text-xs text-amber-700">{locationError}</p>
            ) : null}
          </div>
        ) : null}

        {showData?.map((curr) => (
          <div
            key={`${curr.theater.theaterDetails._id}_${curr.movie._id}`}
            className="cine-card overflow-hidden rounded-[26px] border border-black/8"
          >
            <div className="border-b border-black/6 bg-[#faf8f4] p-3 sm:p-4">
              <div className="flex items-start gap-2">
                <img
                  src={curr.theater.theaterDetails.logo}
                  alt={curr.theater.theaterDetails.name}
                  loading="lazy"
                  decoding="async"
                  className="h-10 w-10 rounded-lg bg-white object-contain p-1 shadow-sm"
                />
                <div>
                  <p className="text-base font-bold text-[#171717] md:text-[18px]">{curr.theater.theaterDetails.name}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-[13px] text-[#6f6660] md:text-[14px]">
                    <span className="flex items-center gap-0.5">
                      <MapPin size={12} />
                      {location}
                    </span>
                    <span className="rounded-full bg-[#eef4ff] px-2 py-0.5 text-xs font-semibold text-[#3b82f6]">
                      Allows cancellation
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-3 sm:p-4">
              <div className="flex flex-wrap gap-2">
                {curr.theater.shows.map((slot) => {
                  const theaterId = curr.theater.theaterDetails._id;
                  const movieName = curr.movie.title;
                  return (
                    <button
                      onClick={() => {
                        if (!auth) {
                          openAuthModal("login");
                          return;
                        }
                        navigate(
                          `/movies/${movieId}/${movieName}/${location}/theater/${theaterId}/show/${slot._id}/seat-layout`,
                        );
                      }}
                      key={slot._id}
                      className="group flex min-w-[92px] cursor-pointer flex-col items-center justify-center rounded-xl border border-black/10 bg-white px-3 py-2 text-[13px] transition hover:-translate-y-0.5 hover:border-[#8f46ff] hover:text-[#8f46ff] hover:shadow-[0_8px_16px_rgba(143,70,255,0.12)] md:min-w-[104px] md:text-[15px]"
                    >
                      <span className="font-black leading-tight">{slot.startTime}</span>
                      <span className="text-[8px] font-bold tracking-[0.1em] text-[#6f6660] group-hover:text-[#8f46ff]">
                        {slot.audioType.toUpperCase()}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default TheaterTimings;
