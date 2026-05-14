import { useEffect, useState } from "react";
import Header from "../components/seat-layout/Header";
import Footer from "../components/seat-layout/Footer";
import { useParams } from "react-router-dom";
import { useShowById } from "../hooks/useShow";
import screenImg from "../assets/screen.png";
import { useSeatContext } from "../context/SeatContext";
import { useLocationContext } from "../context/LocationContext";
import { socket } from "../utils/socket";

const Seat = ({ seat, row, selectedSeats, lockedSeats, onClick }) => {
  const seatId = `${row}${seat.number}`;
  const isLocked = lockedSeats?.includes(seatId);
  const isSelected = selectedSeats.includes(seatId);

  return (
    <button
      className={`m-[2px] h-8 w-8 rounded-lg border text-[12px] font-bold transition sm:h-9 sm:w-9 sm:text-[13px] ${
        seat.status === "BOOKED"
          ? "cursor-not-allowed border-red-200 bg-red-50 text-red-400"
          : isLocked
          ? "cursor-not-allowed border-gray-300 bg-gray-200 text-gray-400"
          : isSelected
          ? "cursor-pointer border-[#8f46ff] bg-[#8f46ff] text-white shadow-[0_8px_18px_rgba(143,70,255,0.22)]"
          : "cursor-pointer border-black/30 bg-white hover:border-[#8f46ff] hover:bg-[#f4ecff]"
      }`}
      disabled={seat.status === "BOOKED" || isLocked}
      onClick={onClick}
    >
      {seat.status === "BOOKED" || isLocked ? "X" : seat.number}
    </button>
  );
};

const SeatLayout = () => {
  const [lockedSeats, setLockedSeats] = useState([]);
  const { selectedSeats, setSelectedSeats } = useSeatContext();
  const { location } = useLocationContext();
  const { showId } = useParams();
  const { show: showData, loading: isLoading, error: isError } = useShowById(showId);
  const isSelectedSeats = selectedSeats.length > 0;

  const handleSelectSeat = (row, number) => {
    const seatId = `${row}${number}`;

    setSelectedSeats((prev) =>
      prev.includes(seatId) ? prev.filter((existingId) => existingId !== seatId) : [...prev, seatId],
    );
  };

  useEffect(() => {
    setSelectedSeats([]);
    socket.emit("join-show", { showId });

    const handleLockedSeatsInitials = ({ seatIds }) => {
      setLockedSeats(seatIds);
    };

    const handleSeatLocked = ({ seatIds, showId: incomingShowId }) => {
      if (incomingShowId !== showId) return;
      setLockedSeats((prev) => [...new Set([...prev, ...seatIds])]);
    };

    const handleSeatUnlocked = ({ seatIds, showId: incomingShowId }) => {
      if (incomingShowId !== showId) return;
      setLockedSeats((prev) => prev.filter((id) => !seatIds.includes(id)));
    };

    const handleSeatsBooked = ({ seatIds, showId: incomingShowId }) => {
      if (incomingShowId !== showId) return;
      setLockedSeats((prev) => [...new Set([...prev, ...seatIds])]);
    };

    socket.on("locked-seats-initials", handleLockedSeatsInitials);
    socket.on("seat-locked", handleSeatLocked);
    socket.on("seat-unlocked", handleSeatUnlocked);
    socket.on("seats-booked", handleSeatsBooked);

    return () => {
      socket.off("locked-seats-initials", handleLockedSeatsInitials);
      socket.off("seat-locked", handleSeatLocked);
      socket.off("seat-unlocked", handleSeatUnlocked);
      socket.off("seats-booked", handleSeatsBooked);
    };
  }, [showId, setSelectedSeats]);

  return (
    <div className="h-screen overflow-y-hidden bg-[#f6f3ee]">
      <div className="fixed left-0 top-0 z-10 w-full">
        <Header showData={showData} />
      </div>

      <div className="mx-auto mt-[190px] h-[calc(100vh-300px)] max-w-7xl overflow-y-scroll rounded-t-3xl bg-[#fffdf9] px-3 pb-4 pt-4 shadow-inner scrollbar-hide sm:mt-[210px] sm:px-6">
        <div className="flex flex-col items-center justify-center">
          {isLoading ? (
            <div className="flex min-h-[260px] flex-col items-center justify-center gap-3 text-center">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#8f46ff] border-t-transparent" />
              <p className="font-bold text-[#171717]">Loading seat map...</p>
            </div>
          ) : isError ? (
            <div className="cine-card mt-10 rounded-2xl px-6 py-8 text-center text-[#b4233f]">
              Unable to load this seat layout. Please try again.
            </div>
          ) : null}

          {showData?.seatLayout && (
            <div className="flex flex-col items-center justify-center">
              {Object.entries(
                showData.seatLayout.reduce((acc, curr) => {
                  if (!acc[curr.type]) acc[curr.type] = { price: curr.price, rows: [] };
                  acc[curr.type].rows.push(curr);
                  return acc;
                }, {}),
              ).map(([type, { price, rows }]) => (
                <div key={type} className="mb-12 flex w-full flex-col items-center justify-center">
                  <h2 className="mb-4 rounded-full bg-black/5 px-4 py-2 text-center text-base font-black text-[#171717] md:text-[20px]">
                    {type} : Rs.{price}
                  </h2>
                  <div className="space-y-2">
                    {rows.map((rowObj) => (
                      <div key={rowObj.row} className="flex items-center">
                        <div className="mr-2 w-6 text-right text-[12px] font-bold text-[#6f6660] md:text-[13px]">
                          {rowObj.row}
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {rowObj.seats.map((seat, i) => (
                            <Seat
                              key={i}
                              seat={seat}
                              row={rowObj.row}
                              selectedSeats={selectedSeats}
                              lockedSeats={lockedSeats}
                              onClick={() => handleSelectSeat(rowObj.row, seat.number)}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-5 flex justify-center">
            <img
              src={screenImg}
              alt="Screen"
              loading="lazy"
              decoding="async"
              className="w-[300px] object-contain opacity-80 md:w-[400px]"
            />
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 z-10 h-[104px] w-full border-t border-black/10 bg-[#fffdf9] px-4 py-3 shadow-[0_-12px_32px_rgba(23,23,23,0.08)]">
        <Footer isSelected={isSelectedSeats} selectedSeats={selectedSeats} showData={showData} state={location} />
      </div>
    </div>
  );
};

export default SeatLayout;
