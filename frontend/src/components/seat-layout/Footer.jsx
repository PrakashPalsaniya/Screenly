import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useSeatContext } from "../../context/SeatContext";
import { socket, waitForSocketConnection } from "../../utils/socket";
import { useAuth } from "../../context/AuthContext";

const Footer = ({ isSelected, selectedSeats, showData, state }) => {
  const navigate = useNavigate();
  const { setShows, setSelectedSeats } = useSeatContext();
  const { user } = useAuth();
  const [isLocking, setIsLocking] = useState(false);

  const handleNavigateToCheckout = async () => {
    if (isLocking) return;

    if (!showData?._id || !user?._id) {
      toast.error("Unable to lock seats. Please refresh and try again.");
      return;
    }

    setIsLocking(true);

    let timeoutId;

    const cleanupListeners = () => {
      clearTimeout(timeoutId);
      socket.off("lock-success", onSuccess);
      socket.off("lock-failed", onFailure);
    };

    const onSuccess = (data) => {
      cleanupListeners();
      setIsLocking(false);
      setShows(showData);
      navigate(`/shows/${showData._id}/${state}/checkout`, {
        state: { expiresIn: data.expiresIn || 300, seatIds: data.seatIds },
      });
    };

    const onFailure = (data) => {
      cleanupListeners();
      setIsLocking(false);
      const failedSeats = data?.failedSeats || [];
      if (failedSeats.length > 0) {
        setSelectedSeats((prev) =>
          prev.filter((seatId) => !failedSeats.includes(seatId)),
        );
      }
      toast.error(
        failedSeats.length > 0
          ? `Seats ${failedSeats.join(", ")} just got taken! Please select again.`
          : data?.message || "Failed to lock seats. Try again.",
      );
    };

    try {
      await waitForSocketConnection();

      socket.off("lock-success");
      socket.off("lock-failed");
      socket.once("lock-success", onSuccess);
      socket.once("lock-failed", onFailure);

      socket.emit("lock-seats", {
        showId: showData._id,
        seatIds: selectedSeats,
        userId: user._id,
      });

      timeoutId = setTimeout(() => {
        cleanupListeners();
        setIsLocking(false);
        toast.error("Seat lock request timed out. Please try again.");
      }, 10000);
    } catch (error) {
      setIsLocking(false);
      toast.error(error?.message || "Socket connection failed. Please retry.");
    }
  };

  return (
    <>
      {isSelected ? (
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 py-2">
          <p className="text-base font-black text-[#171717] md:text-[20px]">
            {selectedSeats.length} Seat{selectedSeats.length !== 1 ? "s" : ""} Selected
          </p>
          <button
            onClick={handleNavigateToCheckout}
            disabled={isLocking}
            className={`rounded-full px-5 py-2.5 text-[15px] font-bold transition md:px-6 md:text-base ${
              isLocking
                ? "cursor-not-allowed bg-gray-400 text-white opacity-70"
                : "cine-button cursor-pointer"
            }`}
          >
            {isLocking ? "Locking Seats..." : "Proceed"}
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <p className="text-[11px] font-black tracking-[0.2em] text-[#8f46ff] md:text-xs">
            SCREEN THIS WAY
          </p>
          <div className="mt-3 flex flex-wrap justify-center gap-4 text-[12px] text-[#6f6660] md:text-[13px]">
            <div className="flex items-center gap-1">
              <div className="h-3 w-3 rounded-[4px] border border-black/30 bg-white" />
              <p>Available</p>
            </div>
            <div className="flex items-center gap-1">
              <div className="flex h-3 w-3 items-center justify-center rounded-[4px] border bg-gray-200">
                <small className="-mt-1">x</small>
              </div>
              Occupied
            </div>
            <div className="flex items-center gap-1">
              <div className="h-3 w-3 rounded-[4px] bg-[#8f46ff]" />
              Selected
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Footer;
