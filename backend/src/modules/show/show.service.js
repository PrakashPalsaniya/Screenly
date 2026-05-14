const { Types } = require("mongoose");

const { generateSeatLayout, groupShowsByTheatreAndMovie } = require("../../utils");
const { ShowModel } = require("./show.model");
const { TheaterModel } = require("../theater/theater.model");
const { MovieModel } = require("../movie/movie.model");
const { UserModel } = require("../user/user.model");
const {
  publishShowEmail,
} = require("../notifications/rabbitmq.producer");

const createHttpError = (status, message) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

const getTheaterLocation = (theater) => {
  return theater.state || theater.city || theater.location;
};

const getScreenForShow = (theater, showData) => {
  const screens = theater.screens?.length
    ? theater.screens
    : [{ name: "Screen 1" }];

  const selectedScreen = screens.find(
    (screen) => screen.name === showData.screen
  );

  if (!selectedScreen) {
    throw createHttpError(400, "Selected screen does not belong to this theater");
  }

  if (
    selectedScreen.formats?.length &&
    !selectedScreen.formats.includes(showData.format)
  ) {
    throw createHttpError(400, "Selected screen does not support this format");
  }

  return selectedScreen;
};

const buildShowDocument = (showData, theater) => {
  const location = getTheaterLocation(theater);

  if (!location) {
    throw createHttpError(
      400,
      "Selected theater does not have a location configured"
    );
  }

  return {
    ...showData,
    location,
    seatLayout: generateSeatLayout(showData.priceMap),
  };
};

const getActiveUserEmailRecipients = async () => {
  const users = await UserModel.find({
    activateUser: true,
    emailVerified: true,
    email: { $exists: true, $ne: null },
  })
    .select("email")
    .lean();

  return [
    ...new Set(
      users
        .map((user) => String(user.email || "").trim().toLowerCase())
        .filter((email) => email.length > 0)
    ),
  ];
};

const createShow = async (showData) => {
  const [movie, theater] = await Promise.all([
    MovieModel.findById(showData.movie).lean(),
    TheaterModel.findById(showData.theater).lean(),
  ]);

  if (!movie) {
    throw createHttpError(404, "Movie not found");
  }

  if (!theater) {
    throw createHttpError(404, "Theater not found");
  }

  getScreenForShow(theater, showData);

  const existingShow = await ShowModel.findOne({
    movie: showData.movie,
    theater: showData.theater,
    screen: showData.screen,
    date: showData.date,
    startTime: showData.startTime,
  });

  if (existingShow) {
    throw createHttpError(
      409,
      "A show already exists for this screen at the selected time"
    );
  }

  const showToCreate = buildShowDocument(showData, theater);
  const show = await ShowModel.create(showToCreate);

  try {
    const recipients = await getActiveUserEmailRecipients();

    if (recipients.length > 0) {
      const theaterLocation = [
        theater.location,
        theater.city,
        theater.state,
      ]
        .filter(Boolean)
        .join(", ");

      await publishShowEmail({
        recipients,
        movieTitle: movie.title,
        posterUrl: movie.posterUrl,
        theaterName: theater.name,
        theaterLocation,
        screen: showData.screen,
        format: showData.format,
        audioType: showData.audioType,
        shows: [
          {
            date: showData.date,
            time: showData.startTime,
          },
        ],
      });
    }
  } catch (error) {
    console.error("New show email notification failed:", error?.message || error);
  }

  return show;
};

const createBulkShows = async (bulkData) => {
  const theater = await TheaterModel.findById(bulkData.theater).lean();

  if (!theater) {
    throw createHttpError(404, "Theater not found");
  }

  const movies = await MovieModel.find({
    _id: { $in: bulkData.movies },
  })
    .select("_id title posterUrl")
    .lean();

  const validMovieIds = new Set(movies.map((movie) => String(movie._id)));

  if (validMovieIds.size !== bulkData.movies.length) {
    throw createHttpError(404, "One or more selected movies were not found");
  }

  const movieTitleMap = new Map(
    movies.map((movie) => [String(movie._id), movie.title])
  );

  const created = [];
  const skipped = [];

  for (const movieId of bulkData.movies) {
    for (const date of bulkData.dates) {
      for (const slot of bulkData.slots) {
        const showData = {
          movie: movieId,
          theater: bulkData.theater,
          screen: bulkData.screen,
          date,
          ...slot,
        };

        getScreenForShow(theater, showData);

        const existingShow = await ShowModel.findOne({
          movie: showData.movie,
          theater: showData.theater,
          screen: showData.screen,
          date: showData.date,
          startTime: showData.startTime,
        }).lean();

        if (existingShow) {
          skipped.push({
            movie: movieId,
            date,
            startTime: showData.startTime,
            reason: "Show already exists",
          });
          continue;
        }

        const show = await ShowModel.create(buildShowDocument(showData, theater));
        created.push(show);
      }
    }
  }

  try {
    if (created.length > 0) {
      const recipients = await getActiveUserEmailRecipients();

      if (recipients.length > 0) {
        const theaterLocation = [
          theater.location,
          theater.city,
          theater.state,
        ]
          .filter(Boolean)
          .join(", ");

        const consolidatedShows = created.map((show) => ({
          date: show.date,
          time: show.startTime,
        }));

        const title =
          bulkData.movies.length === 1
            ? movieTitleMap.get(String(bulkData.movies[0])) || "New Shows"
            : "Multiple Movies";

        await publishShowEmail({
          recipients,
          movieTitle: title,
          posterUrl:
            bulkData.movies.length === 1
              ? movies.find((movie) => String(movie._id) === String(bulkData.movies[0]))?.posterUrl
              : null,
          theaterName: theater.name,
          theaterLocation,
          screen: bulkData.screen,
          format: created[0]?.format,
          audioType: created[0]?.audioType,
          shows: consolidatedShows,
        });
      }
    }
  } catch (error) {
    console.error("Bulk show email notifications failed:", error?.message || error);
  }

  return {
    createdCount: created.length,
    skippedCount: skipped.length,
    created,
    skipped,
  };
};

const getShowsByMovieDateLocation = async (movieId, date, location) => {
  const query = {
    movie: new Types.ObjectId(movieId),
    location: { $regex: new RegExp(location, "i") },
  };

  if (date) {
    query.date = date;
  }

  const shows = await ShowModel.find(query)
    .populate("movie theater")
    .sort({ startTime: 1 });

  return groupShowsByTheatreAndMovie(shows);
};

const getShowById = async (showId) => {
  return await ShowModel.findById(showId).populate("movie theater");
};

const updateSeatStatus = async (showId, seats, status, session) => {
  const show = await ShowModel.findById(showId).session(session);

  if (!show) {
    throw new Error("Show not found!");
  }

  const parsedSeats = seats.map((seat) => {
    const row = seat.charAt(0);
    const number = parseInt(seat.slice(1));

    return { row, number };
  });

  for (const parsedSeat of parsedSeats) {
    const row = show.seatLayout.find((r) => r.row === parsedSeat.row);

    if (!row) {
      throw new Error(`Invalid seat row: ${parsedSeat.row}`);
    }

    const seat = row.seats.find((s) => s.number === parsedSeat.number);

    if (!seat) {
      throw new Error(
        `Invalid seat number: ${parsedSeat.number} in row ${parsedSeat.row}`
      );
    }

    if (seat.status === "BOOKED") {
      throw new Error(
        `Seat ${parsedSeat.row}${parsedSeat.number} is already booked!`
      );
    }

    seat.status = status;
  }

  show.markModified("seatLayout");
  await show.save({ session });
};

module.exports = {
  createShow,
  createBulkShows,
  getShowsByMovieDateLocation,
  getShowById,
  updateSeatStatus,
};
