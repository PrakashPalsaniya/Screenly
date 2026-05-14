import { useNavigate } from "react-router-dom";
import { Armchair, ChevronRight } from "lucide-react";
import { useUserBookings } from "../../hooks/useBooking";
import { useAuth } from "../../context/AuthContext";
import { getMoviePoster } from "../../utils";
import { formatShowDateWithYear } from "../../utils/dateFormatter";

const BookingHistory = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { bookings: data, error: isError, loading } = useUserBookings();
  const bookings = Array.isArray(data) ? data : [];
  const validBookings = bookings.filter(
    (booking) => booking?.showId?.movie && booking?.showId?.theater,
  );

  if (isError) {
    return (
      <div className="cine-card rounded-2xl px-5 py-6">
        <h3 className="mb-3 text-[18px] font-black">Your Bookings</h3>
        <p className="text-[13px] text-[#6f6660]">Failed to load bookings. Please try again later.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="cine-card rounded-2xl px-5 py-6">
        <h3 className="mb-3 text-[18px] font-black">Your Bookings</h3>
        <div className="space-y-3">
          <div className="h-5 w-48 animate-pulse rounded bg-black/10" />
          <div className="h-28 animate-pulse rounded-xl bg-black/10" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <h3 className="mb-3 text-[18px] font-black">Your Bookings</h3>

      {validBookings.length === 0 ? (
        <div className="cine-card rounded-2xl p-5 text-[13px] text-[#6f6660]">
          No bookings found yet.
        </div>
      ) : null}

      <div className="space-y-3">
        {validBookings.map((booking) => {
          const show = booking.showId;
          const movie = show.movie;
          const theater = show.theater;
          const seats = Array.isArray(booking.seats) ? booking.seats : [];
          const bookingFee = booking.bookingFee || {};
          const theaterPlace = theater.location || theater.city || theater.state || "";

          return (
            <div key={booking._id} className="cine-card overflow-hidden rounded-2xl p-3">
              <div className="flex gap-3">
                <img
                  src={getMoviePoster(movie, { width: 240 })}
                  alt={movie.title}
                  loading="lazy"
                  decoding="async"
                  className="h-20 w-14 shrink-0 rounded-xl object-cover sm:h-28 sm:w-20"
                />

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[16px] font-black leading-tight">{movie.title}</p>
                      <p className="mt-1 line-clamp-2 text-[13px] font-bold text-[#2f2a27]">
                        {formatShowDateWithYear(show.date)} - {show.startTime}{" "}
                        {theater.name}
                        {theaterPlace ? `, ${theaterPlace}` : ""}
                      </p>
                    </div>
                    <p className="shrink-0 rounded-full bg-[#171717] px-2.5 py-1 text-[11px] font-bold text-white">
                      M-Ticket
                    </p>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                    <p className="min-w-0 text-[13px] font-bold text-[#2f2a27]">
                      <Armchair className="mr-2 inline" size={15} />
                      <span className="break-words">{seats.join(", ")}</span>
                    </p>
                    <div className="flex items-center gap-3">
                      <p className="text-[16px] font-black">Rs.{bookingFee.total ?? 0}</p>
                      <button
                        type="button"
                        onClick={() => navigate(`/profile/${user?._id}/booking/${booking._id}`)}
                        className="inline-flex items-center gap-1 rounded-full bg-[#8f46ff] px-3 py-1.5 text-[12px] font-black text-white transition hover:bg-[#7c3aed]"
                      >
                        View ticket
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BookingHistory;
