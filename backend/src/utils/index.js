const { customAlphabet } = require("nanoid");

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function generateSeatLayout(priceMap = {}) {
  const premiumPrice = Number(priceMap.PREMIUM || 510);
  const executivePrice = Number(priceMap.EXECUTIVE || 290);
  const normalPrice = Number(priceMap.NORMAL || 180);

  return [
    {
      row: "E",
      type: "PREMIUM",
      price: premiumPrice,
      seats: Array.from({ length: 10 }, (_, index) => ({
        number: index + 1,
        status: "AVAILABLE",
      })),
    },
    {
      row: "D",
      type: "EXECUTIVE",
      price: executivePrice,
      seats: Array.from({ length: 20 }, (_, index) => ({
        number: index + 1,
        status: "AVAILABLE",
      })),
    },
    {
      row: "C",
      type: "EXECUTIVE",
      price: executivePrice,
      seats: Array.from({ length: 20 }, (_, index) => ({
        number: index + 1,
        status: "AVAILABLE",
      })),
    },
    {
      row: "B",
      type: "EXECUTIVE",
      price: executivePrice,
      seats: Array.from({ length: 20 }, (_, index) => ({
        number: index + 1,
        status: "AVAILABLE",
      })),
    },
    {
      row: "A",
      type: "NORMAL",
      price: normalPrice,
      seats: Array.from({ length: 20 }, (_, index) => ({
        number: index + 1,
        status: "AVAILABLE",
      })),
    },
  ];
}

function groupShowsByTheatreAndMovie(shows) {
  const groupedShows = {};

  shows.forEach((show) => {
    const movieId = show.movie._id;
    const theaterId = show.theater._id;
    const groupKey = `${movieId}_${theaterId}`;

    if (!groupedShows[groupKey]) {
      groupedShows[groupKey] = {
        movie: show.movie,
        theater: {
          theaterDetails: show.theater,
          shows: [],
        },
      };
    }

    groupedShows[groupKey].theater.shows.push({
      _id: show._id || "",
      date: show.date || "",
      startTime: show.startTime || "",
      screen: show.screen || "",
      format: show.format || "",
      audioType: show.audioType || "",
    });
  });

  return Object.values(groupedShows);
}

const bookingIdGenerator = customAlphabet(
  "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
  8,
);

function generateBookingReference() {
  return `BMS-${bookingIdGenerator()}`;
}

module.exports = {
  isValidEmail,
  generateSeatLayout,
  groupShowsByTheatreAndMovie,
  generateBookingReference,
};
