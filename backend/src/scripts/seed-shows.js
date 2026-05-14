const mongoose = require("mongoose");
const dayjs = require("dayjs");
const { MovieModel } = require("../modules/movie/movie.model");
const { TheaterModel } = require("../modules/theater/theater.model");
const { ShowModel } = require("../modules/show/show.model");
const { config } = require("../config/config");
const { generateSeatLayout } = require("../utils");

const DEFAULT_FORMATS = ["2D", "3D", "IMAX", "PVR PXL"];
const FIXED_TIME_SLOTS = [
  "09:00 AM",
  "12:30 PM",
  "04:00 PM",
  "07:30 PM",
  "10:30 PM",
];
const F1_TITLE = "F1: The Movie";
const F1_TIME_SLOTS = ["10:00 AM", "02:00 PM", "06:00 PM", "09:30 PM"];
const INSERT_BATCH_SIZE = 200;

function generatePriceMap() {
  return {
    PREMIUM: 510,
    EXECUTIVE: 290,
    NORMAL: 270,
  };
}

function getMovieFormats(movie) {
  const formats = Array.isArray(movie.format) && movie.format.length
    ? movie.format
    : ["2D"];

  const normalizedFormats = formats.map((format) =>
    format === "IMAX 3D" ? "IMAX" : format,
  );

  return normalizedFormats.filter((format) => DEFAULT_FORMATS.includes(format));
}

function buildShows(movies, theaters) {
  const today = dayjs().startOf("day");
  const shows = [];
  const f1Movie = movies.find((movie) => movie.title === F1_TITLE);

  for (const movie of movies) {
    if (movie.title === F1_TITLE) {
      continue;
    }

    const movieFormats = getMovieFormats(movie);

    for (const theater of theaters) {
      for (let dayOffset = 0; dayOffset < 2; dayOffset += 1) {
        const showDate = today.add(dayOffset, "day");
        const formattedDate = showDate.format("DD-MM-YYYY");
        const numberOfShows = Math.floor(Math.random() * 3) + 2;
        const selectedSlots = FIXED_TIME_SLOTS.slice(0, numberOfShows);

        selectedSlots.forEach((slot, slotIndex) => {
          const format = movieFormats[slotIndex % movieFormats.length] || "2D";

          shows.push({
            movie: movie._id,
            theater: theater._id,
            location: theater.state,
            format,
            audioType: "Dolby 7.1",
            startTime: slot,
            date: formattedDate,
            priceMap: generatePriceMap(),
            seatLayout: generateSeatLayout(),
          });
        });
      }
    }
  }

  if (f1Movie) {
    const f1Formats = getMovieFormats(f1Movie);

    for (const theater of theaters) {
      for (let dayOffset = 0; dayOffset < 2; dayOffset += 1) {
        const showDate = today.add(dayOffset, "day").format("DD-MM-YYYY");

        F1_TIME_SLOTS.forEach((slot, slotIndex) => {
          const format = f1Formats[slotIndex % f1Formats.length] || "2D";

          shows.push({
            movie: f1Movie._id,
            theater: theater._id,
            location: theater.state,
            format,
            audioType: "Dolby 7.1",
            startTime: slot,
            date: showDate,
            priceMap: generatePriceMap(),
            seatLayout: generateSeatLayout(),
          });
        });
      }
    }
  }

  return shows;
}

async function seedShows() {
  const databaseUri = config.databaseReplicaSet || config.databaseUrl;

  if (!databaseUri) {
    throw new Error("MongoDB connection string is not defined");
  }

  await mongoose.connect(databaseUri);
  console.log("Connected to database");

  try {
    const [movies, theaters] = await Promise.all([
      MovieModel.find().lean(),
      TheaterModel.find().lean(),
    ]);

    if (!movies.length || !theaters.length) {
      throw new Error("Movies or theaters are missing. Seed them first.");
    }

    const shows = buildShows(movies, theaters);

    await ShowModel.deleteMany({});
    console.log("Deleted existing shows");

    for (let index = 0; index < shows.length; index += INSERT_BATCH_SIZE) {
      const batch = shows.slice(index, index + INSERT_BATCH_SIZE);
      await ShowModel.insertMany(batch);
    }
    console.log(`Seeded ${shows.length} shows successfully`);
  } finally {
    await mongoose.disconnect();
  }
}

seedShows().catch((error) => {
  console.error("Show seeding failed:", error);
  process.exit(1);
});
