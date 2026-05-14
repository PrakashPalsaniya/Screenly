import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowLeft, Armchair, Calendar, Download, MapPin, Share2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useUserBookings } from "../hooks/useBooking";
import { getMoviePoster } from "../utils";
import { formatShowDateWithYear } from "../utils/dateFormatter";

const getTheaterPlace = (theater = {}) =>
  [theater.location, theater.city, theater.state].filter(Boolean).join(", ");

const escapePdfText = (value) =>
  String(value ?? "")
    .replace(/[^\x20-\x7E]/g, "?")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");

const wrapPdfText = (text, maxLength = 62) => {
  const words = String(text || "").split(/\s+/).filter(Boolean);
  const lines = [];
  let currentLine = "";

  words.forEach((word) => {
    const nextLine = currentLine ? `${currentLine} ${word}` : word;
    if (nextLine.length > maxLength && currentLine) {
      lines.push(currentLine);
      currentLine = word;
      return;
    }
    currentLine = nextLine;
  });

  if (currentLine) lines.push(currentLine);
  return lines.length ? lines : ["N/A"];
};

const pdfText = (text, x, y, size = 12, color = "0 0 0") =>
  `BT ${color} rg /F1 ${size} Tf ${x} ${y} Td (${escapePdfText(text)}) Tj ET`;

const createTicketPdf = ({ movie, show, theater, theaterPlace, seats, booking, bookingFee, ticketRef }) => {
  const lines = [
    "q 0.09 0.09 0.09 rg 48 650 516 116 re f Q",
    pdfText("SCREENLY M-TICKET", 72, 728, 11, "0.84 0.84 0.84"),
    pdfText(movie.title, 72, 704, 24, "1 1 1"),
    pdfText(`Booking ID: ${ticketRef}`, 72, 678, 11, "0.84 0.84 0.84"),
    pdfText("Date and Time", 72, 610, 10, "0.45 0.42 0.39"),
    pdfText(`${formatShowDateWithYear(show.date)} - ${show.startTime}`, 72, 590, 15),
    pdfText("Theater", 72, 548, 10, "0.45 0.42 0.39"),
    pdfText(theater.name, 72, 528, 15),
  ];

  wrapPdfText(theaterPlace, 58).slice(0, 2).forEach((line, index) => {
    lines.push(pdfText(line, 72, 508 - index * 16, 11, "0.32 0.29 0.27"));
  });

  lines.push(
    "q 0.98 0.97 0.95 rg 72 392 200 72 re f Q",
    "q 0.98 0.97 0.95 rg 308 392 200 72 re f Q",
    pdfText("Seats", 88, 438, 10, "0.45 0.42 0.39"),
    pdfText(seats.join(", "), 88, 416, 15),
    pdfText("Tickets", 324, 438, 10, "0.45 0.42 0.39"),
    pdfText(String(seats.length), 324, 416, 15),
    "q 0.98 0.97 0.95 rg 72 288 200 72 re f Q",
    "q 0.98 0.97 0.95 rg 308 288 200 72 re f Q",
    pdfText("Payment", 88, 334, 10, "0.45 0.42 0.39"),
    pdfText(booking.paymentMethod?.toUpperCase() || "N/A", 88, 312, 15),
    pdfText("Total", 324, 334, 10, "0.45 0.42 0.39"),
    pdfText(`Rs.${bookingFee.total ?? 0}`, 324, 312, 15),
    "q 1 0.21 0.37 rg 72 206 436 1 re f Q",
    pdfText("Please carry a valid ID. This ticket is valid only for the show details above.", 72, 176, 10, "0.45 0.42 0.39"),
  );

  const stream = lines.join("\n");
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>",
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];

  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return pdf;
};

const Ticket = () => {
  const navigate = useNavigate();
  const { bookingId } = useParams();
  const { user } = useAuth();
  const { bookings: data, error, loading } = useUserBookings();

  const booking = useMemo(() => {
    const bookings = Array.isArray(data) ? data : [];
    return bookings.find((item) => item._id === bookingId);
  }, [bookingId, data]);

  const show = booking?.showId;
  const movie = show?.movie;
  const theater = show?.theater;
  const seats = Array.isArray(booking?.seats) ? booking.seats : [];
  const bookingFee = booking?.bookingFee || {};
  const theaterPlace = getTheaterPlace(theater);
  const ticketRef = booking?.bookingRef || booking?._id || "ticket";
  const ticketUrl = window.location.href;

  const ticketText = movie
    ? `${movie.title}
${formatShowDateWithYear(show.date)} at ${show.startTime}
${theater?.name}${theaterPlace ? `, ${theaterPlace}` : ""}
Seats: ${seats.join(", ")}
Booking ID: ${ticketRef}`
    : "";

  const downloadTicket = () => {
    if (!booking || !movie || !show || !theater) return;

    const pdf = createTicketPdf({
      movie,
      show,
      theater,
      theaterPlace,
      seats,
      booking,
      bookingFee,
      ticketRef,
    });
    const blob = new Blob([pdf], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `screenly-ticket-${ticketRef}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const shareTicket = async () => {
    if (!ticketText) return;

    try {
      if (navigator.share) {
        await navigator.share({
          title: `${movie.title} ticket`,
          text: ticketText,
          url: ticketUrl,
        });
        return;
      }

      await navigator.clipboard.writeText(`${ticketText}\n${ticketUrl}`);
      toast.success("Ticket link copied");
    } catch (shareError) {
      if (shareError?.name !== "AbortError") {
        toast.error("Unable to share ticket");
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f6f3ee] px-4 py-6">
        <div className="mx-auto max-w-3xl">
          <div className="cine-card h-72 animate-pulse rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !booking || !show || !movie || !theater) {
    return (
      <div className="min-h-screen bg-[#f6f3ee] px-4 py-6">
        <div className="mx-auto max-w-3xl">
          <button
            type="button"
            onClick={() => navigate(`/profile/${user?._id}/booking`)}
            className="mb-4 inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-3 py-2 text-[13px] font-bold"
          >
            <ArrowLeft size={15} />
            Back
          </button>
          <div className="cine-card rounded-2xl p-5 text-[13px] text-[#6f6660]">
            Ticket not found.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f3ee] px-4 py-6">
      <div className="mx-auto max-w-3xl">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => navigate(`/profile/${user?._id}/booking`)}
            className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-3 py-2 text-[13px] font-bold"
          >
            <ArrowLeft size={15} />
            Bookings
          </button>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={shareTicket}
              className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-3 py-2 text-[13px] font-bold"
            >
              <Share2 size={15} />
              Share
            </button>
            <button
              type="button"
              onClick={downloadTicket}
              className="inline-flex items-center gap-2 rounded-full bg-[#171717] px-3 py-2 text-[13px] font-bold text-white"
            >
              <Download size={15} />
              Download
            </button>
          </div>
        </div>

        <section className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm">
          <div className="bg-[#171717] p-4 text-white sm:p-5">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-white/60">
              Screenly M-Ticket
            </p>
            <h1 className="mt-2 text-[22px] font-black leading-tight md:text-[28px]">
              {movie.title}
            </h1>
            <p className="mt-2 text-[13px] font-semibold text-white/70">
              Booking ID: {ticketRef}
            </p>
          </div>

          <div className="grid gap-4 p-4 sm:grid-cols-[140px_1fr] sm:p-5">
            <img
              src={getMoviePoster(movie, { width: 320 })}
              alt={movie.title}
              className="aspect-[2/3] w-[120px] rounded-xl object-cover sm:w-full sm:max-w-none"
            />

            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-black/10 bg-[#faf8f4] p-3">
                  <p className="text-[11px] font-black uppercase tracking-[0.12em] text-[#8b8179]">
                    Date and time
                  </p>
                  <p className="mt-1 flex items-center gap-2 text-[14px] font-black">
                    <Calendar size={15} />
                    {formatShowDateWithYear(show.date)} - {show.startTime}
                  </p>
                </div>
                <div className="rounded-xl border border-black/10 bg-[#faf8f4] p-3">
                  <p className="text-[11px] font-black uppercase tracking-[0.12em] text-[#8b8179]">
                    Seats
                  </p>
                  <p className="mt-1 flex items-center gap-2 text-[14px] font-black">
                    <Armchair size={15} />
                    {seats.join(", ")}
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-black/10 bg-[#faf8f4] p-3">
                <p className="text-[11px] font-black uppercase tracking-[0.12em] text-[#8b8179]">
                  Theater
                </p>
                <p className="mt-1 flex items-start gap-2 text-[14px] font-black">
                  <MapPin size={15} className="mt-0.5 shrink-0" />
                  <span>
                    {theater.name}
                    {theaterPlace ? <span className="block font-semibold text-[#6f6660]">{theaterPlace}</span> : null}
                  </span>
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-black/10 p-3">
                  <p className="text-[11px] font-black uppercase tracking-[0.12em] text-[#8b8179]">
                    Tickets
                  </p>
                  <p className="mt-1 text-[16px] font-black">{seats.length}</p>
                </div>
                <div className="rounded-xl border border-black/10 p-3">
                  <p className="text-[11px] font-black uppercase tracking-[0.12em] text-[#8b8179]">
                    Payment
                  </p>
                  <p className="mt-1 text-[16px] font-black">
                    {booking.paymentMethod?.toUpperCase() || "N/A"}
                  </p>
                </div>
                <div className="rounded-xl border border-black/10 p-3">
                  <p className="text-[11px] font-black uppercase tracking-[0.12em] text-[#8b8179]">
                    Total
                  </p>
                  <p className="mt-1 text-[16px] font-black">Rs.{bookingFee.total ?? 0}</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Ticket;
