export const formatReleaseDate = (dateString) => {
  const date = new Date(dateString);
  const day = date.toLocaleString("en-IN", { day: "2-digit" });
  const month = date.toLocaleString("en-IN", { month: "short" });
  const year = date.getFullYear();
  return `${day} ${month}, ${year}`;
};

export const formatedTodayDate = () => {
  const today = new Date();
  const dd = String(today.getDate()).padStart(2, "0");
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const yyyy = today.getFullYear();
  const formattedDate = `${dd}-${mm}-${yyyy}`;
  return formattedDate;
};

export const seatTypePrices = {
  PREMIUM: 510,
  EXECUTIVE: 290,
  NORMAL: 180,
};

export const getSeatType = (seatId) => {
  const row = seatId?.charAt(0);
  if (row === "E") return "PREMIUM";
  if (["B", "C", "D"].includes(row)) return "EXECUTIVE";
  if (row === "A") return "NORMAL";
  return "UNKNOWN";
};

export const groupSeatsByType = (seats) => {
  const grouped = {};

  seats.forEach((seatId) => {
    const type = getSeatType(seatId);
    if (!grouped[type]) grouped[type] = [];
    grouped[type].push(seatId);
  });

  return Object.entries(grouped).map(([type, groupedSeats]) => ({
    type,
    seats: groupedSeats,
  }));
};

export const calculateTotalPrice = (seats) => {
  const base = seats.reduce((acc, seatId) => {
    const type = getSeatType(seatId);
    const price = seatTypePrices[type] || 0;
    return acc + price;
  }, 0);
  const tax = +(base * 0.05).toFixed(2);
  const total = +(base + tax).toFixed(2);
  return { base, tax, total };
};

export const slugifyMovieTitle = (title = "") =>
  title
    .replace(/:/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .toLowerCase();

export const getMovieLanguages = (movie) => {
  if (Array.isArray(movie?.languages)) return movie.languages;
  if (typeof movie?.languages === "string") {
    return movie.languages
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
};

export const getMovieGenres = (movie) => {
  if (Array.isArray(movie?.genre)) return movie.genre;
  if (typeof movie?.genre === "string") {
    return movie.genre
      .split("/")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
};

const CLOUDFRONT_DOMAIN = import.meta.env.VITE_CLOUDFRONT_DOMAIN;

/**
 * Builds the canonical CloudFront poster URL for a movie.
 * Key pattern: posters/{tmdbId}.jpg — matches what posterUploader.js writes to S3.
 */
export const getPosterUrl = (movie) => {
  if (CLOUDFRONT_DOMAIN && movie?.tmdbId) {
    return `https://${CLOUDFRONT_DOMAIN}/posters/${movie.tmdbId}.jpg`;
  }
  return movie?.posterUrl || "https://placehold.co/500x750?text=Screenly";
};

/**
 * Builds the CloudFront backdrop URL for a movie.
 * Key pattern: backdrops/{tmdbId}.jpg
 */
export const getBackdropUrl = (movie) => {
  if (CLOUDFRONT_DOMAIN && movie?.tmdbId) {
    return `https://${CLOUDFRONT_DOMAIN}/backdrops/${movie.tmdbId}.jpg`;
  }
  return movie?.backdropUrl || "";
};

/**
 * Returns the poster URL — alias kept so existing call-sites (getMoviePoster)
 * don't need to be renamed.
 */
export const getMoviePoster = (movie) => getPosterUrl(movie);

/**
 * Generates a srcSet string for responsive images.
 * CloudFront doesn't do on-the-fly resizing (unless you have a Lambda@Edge),
 * so we serve the same image at all widths and let the browser pick.
 * This still gives the browser accurate size hints for layout optimization.
 */
export const getMoviePosterSrcSet = (movie, widths = [180, 320, 500]) => {
  const url = getPosterUrl(movie);
  if (!url) return "";
  return widths.map((w) => `${url} ${w}w`).join(", ");
};

export const getMovieCertification = (movie) => movie?.age || movie?.certification || "UA";

export const getMovieYear = (movie) => {
  if (movie?.releaseDate) {
    const parsedYear = new Date(movie.releaseDate).getFullYear();
    if (!Number.isNaN(parsedYear)) return parsedYear;
  }
  return 2026;
};

export const buildMoviePath = (movie, location = "Kolkata") =>
  `/movies/${location}/${slugifyMovieTitle(movie?.title)}/${movie?._id}/ticket`;
