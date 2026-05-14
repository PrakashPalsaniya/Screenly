import { useEffect, useRef, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import toast from "react-hot-toast";

dayjs.extend(customParseFormat);
import { Info, User } from "lucide-react";
import Header from "../components/seat-layout/Header";
import { createOrderRazorpay } from "../apis";
import { useAuth } from "../context/AuthContext";
import { useLocationContext } from "../context/LocationContext";
import { useSeatContext } from "../context/SeatContext";
import { useBooking } from "../hooks/useBooking";
import { razorPayScript } from "../utils/constants";
import { socket } from "../utils/socket";
import { calculateTotalPrice, getMoviePoster, groupSeatsByType } from "../utils";
import { formatShowDate } from "../utils/dateFormatter";

function loadScript(src) {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = src;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

const Checkout = () => {
  const [timeLeft, setTimeLeft] = useState(300);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const isProcessingPaymentRef = useRef(false);
  const unlockCleanupTimeoutRef = useRef(null);
  const bookingCompletedRef = useRef(false);
  const lockReleasedRef = useRef(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { location } = useLocationContext();
  const { selectedSeats, shows: showData } = useSeatContext();
  const { book } = useBooking();
  const { base, tax, total } = calculateTotalPrice(selectedSeats);

  // IDEMPOTENCY: Stable key for this specific checkout attempt
  const idempotencyKey = useMemo(() => crypto.randomUUID(), []);

  useEffect(() => {
    if (unlockCleanupTimeoutRef.current) {
      clearTimeout(unlockCleanupTimeoutRef.current);
      unlockCleanupTimeoutRef.current = null;
    }

    const unlockCurrentSeats = () => {
      if (
        !lockReleasedRef.current &&
        !bookingCompletedRef.current &&
        showData?._id &&
        user?._id &&
        selectedSeats?.length
      ) {
        lockReleasedRef.current = true;
        socket.emit("unlock-seats", {
          showId: showData._id,
          seatIds: selectedSeats,
          userId: user._id,
        });
      }
    };

    const interval = setInterval(() => {
      if (isProcessingPaymentRef.current) return;

      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          unlockCurrentSeats();
          toast.error("Time expired!");
          navigate("/");
          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(interval);
      unlockCleanupTimeoutRef.current = setTimeout(unlockCurrentSeats, 0);
    };
  }, [navigate, showData?._id, user?._id, selectedSeats]);

  useEffect(() => {
    if (!showData || selectedSeats.length === 0) {
      navigate("/");
    }
  }, [navigate, selectedSeats.length, showData]);

  const handleSuccessfulBooking = async (paymentResponse) => {
    const bookingPayload = {
      showId: showData._id,
      seats: selectedSeats,
      paymentId: paymentResponse.razorpay_payment_id,
      paymentOrderId: paymentResponse.razorpay_order_id,
      paymentSignature: paymentResponse.razorpay_signature,
      bookingFee: {
        ticketPrice: base,
        total,
        convenience: tax,
      },
    };

    const bookingResponse = await book(bookingPayload);
    toast.success("Booking successful!");
    bookingCompletedRef.current = true;

    socket.emit("booking-confirmed", {
      showId: showData._id,
      userId: user._id,
      seatIds: selectedSeats,
    });

    navigate(`/profile/${user._id}/booking`);
  };

  const handleBookSeat = async () => {
    if (isProcessingPayment) {
      return;
    }

    try {
      setIsProcessingPayment(true);
      isProcessingPaymentRef.current = true;

      const scriptLoaded = await loadScript(razorPayScript);
      if (!scriptLoaded) {
        toast.error("Razorpay SDK failed to load. Are you online?");
        setIsProcessingPayment(false);
        isProcessingPaymentRef.current = false;
        return;
      }

      const orderResponse = await createOrderRazorpay(
        {
          amount: total,
          showId: showData._id,
          seats: selectedSeats,
        },
        {
          headers: {
            "Idempotency-Key": `${idempotencyKey}-order`,
          },
        }
      );
      const orderData = orderResponse?.data;

      const rzp = new window.Razorpay({
        key: `${import.meta.env.VITE_RAZORPAY_API_KEY}`,
        amount: orderData?.amount,
        currency: orderData?.currency,
        name: "Screenly",
        description: "Secure Payment for Your Booking",
        order_id: orderData?.id,
        handler: async (paymentResponse) => {
          try {
            await handleSuccessfulBooking(paymentResponse);
          } catch (error) {
            console.log(error);
            toast.error(
              error?.response?.data?.message || "Payment verification failed",
            );
          } finally {
            setIsProcessingPayment(false);
            isProcessingPaymentRef.current = false;
          }
        },
        prefill: {
          name: user?.name,
          email: user?.email,
          contact: user?.phone,
        },
        theme: { color: "#8f46ff" },
        modal: {
          ondismiss: () => {
            if (!bookingCompletedRef.current) {
              setIsProcessingPayment(false);
              isProcessingPaymentRef.current = false;
              toast.error("Payment flow closed. You can retry before the timer expires.");
            }
          },
        },
      });

      rzp.on("payment.failed", (response) => {
        toast.error(response?.error?.description || "Payment failed. Please try a different method.");
        // We do NOT navigate or unlock seats here, because the user can retry payment inside the modal.
        // We only unpause the timer when they explicitly close the modal (ondismiss).
      });

      rzp.open();
    } catch (error) {
      console.log(error);
      toast.error(error?.response?.data?.message || "Unable to start payment");
      setIsProcessingPayment(false);
      isProcessingPaymentRef.current = false;
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#f6f3ee]">
      <Header type="checkout" />

      <div className="mx-auto max-w-6xl px-4 py-6">
        <p className="mb-4 rounded-2xl border border-dashed border-[#8f46ff]/50 bg-white px-4 py-2.5 text-center text-[15px] font-black text-[#8f46ff] md:text-[16px]">
          Time left: {String(Math.floor(timeLeft / 60)).padStart(2, "0")}:
          {String(timeLeft % 60).padStart(2, "0")}
        </p>

        <div className="flex flex-col gap-6 lg:flex-row">
          <div className="flex-1 space-y-4">
            <div className="cine-card flex gap-4 rounded-2xl p-4">
              <img
                src={getMoviePoster(showData?.movie, { width: 140 })}
                alt={showData?.movie.title}
                loading="eager"
                decoding="async"
                className="h-[96px] w-[66px] rounded-xl object-cover"
              />

              <div>
                <h3 className="text-[20px] font-black leading-tight text-[#171717] md:text-[24px]">{showData?.movie.title}</h3>
                <p className="text-[13px] font-medium text-[#6f6660] md:text-[15px]">
                  {showData?.movie.certification} -{" "}
                  {showData?.movie.languages.join(", ")} -{" "}
                  {showData?.movie.format.join(", ")}
                </p>
                <p className="text-[13px] font-medium text-[#6f6660] md:text-[15px]">
                  {showData?.theater.name}, {showData?.theater.city},{" "}
                  {showData?.theater.state}
                </p>
              </div>
            </div>

            <div className="cine-card rounded-2xl px-4 py-4 sm:px-5">
              <p className="border-b border-black/10 pb-4 text-[14px] font-bold text-[#171717]">
                {formatShowDate(showData?.date, "D MMMM YYYY")
                  .split(" ")
                  .slice(0, 2)
                  .join(" ")}{" "}
                - <span className="font-black">{showData?.startTime}</span>
              </p>

              <div className="mt-4 mb-4 flex items-center justify-between gap-4">
                <div>
                  <p className="mt-2 text-[15px] font-black">
                    {selectedSeats.length} ticket
                  </p>
                  <div className="text-[13px] text-[#6f6660] md:text-[14px]">
                    <span className="font-medium">
                      {groupSeatsByType(selectedSeats).map(({ type, seats }) => (
                        <p key={type} className="font-medium">
                          {type} - {seats.join(", ")}
                        </p>
                      ))}
                    </span>
                  </div>
                </div>

                <p className="mt-2 text-[18px] font-black">Rs.{base}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] tracking-wide text-amber-900 sm:px-5">
              <span className="flex items-center gap-2 font-bold">
                <Info size={16} /> No cancellation or refund available
                after payment.
              </span>
            </div>
          </div>

          <div className="w-full space-y-4 lg:w-[320px]">
            <h4 className="text-[18px] font-black text-[#171717] md:text-[20px]">Payment Summary</h4>

            <div className="cine-card space-y-2 rounded-2xl px-4 py-5 sm:px-5">
              <div className="flex justify-between text-[14px] md:text-[15px]">
                <span className="text-sm font-medium text-[#6f6660]">Order amount</span>
                <span>Rs.{base}</span>
              </div>
              <div className="flex justify-between pb-4 text-[14px] md:text-[15px]">
                <span className="text-sm font-bold">Taxes & fees (5%)</span>
                <span>Rs.{tax}</span>
              </div>
              <div className="flex justify-between border-t border-black/10 pt-4 text-[18px] font-black">
                <span>To be paid</span>
                <span>Rs.{total}</span>
              </div>
            </div>

            <h4 className="text-[18px] font-black md:text-[20px]">Your details</h4>
            <div className="cine-card flex items-start gap-3 rounded-2xl px-4 py-5 sm:px-5">
              <User size={16} />
              <div className="-mt-1">
                <p className="text-[14px] font-bold md:text-[15px]">{user?.name}</p>
                <p className="text-[13px] text-[#6f6660] md:text-[14px]">+91-{user?.phone}</p>
                <p className="break-all text-[13px] text-[#6f6660] md:text-[14px]">{user?.email}</p>
                <p className="text-[13px] text-[#6f6660] md:text-[14px]">{location}</p>
              </div>
            </div>
            <button
              onClick={handleBookSeat}
              disabled={isProcessingPayment}
              className="cine-button flex w-full cursor-pointer items-center justify-center rounded-full px-5 py-2.5 text-[15px] font-black disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isProcessingPayment ? "Processing..." : "Proceed To Pay"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
