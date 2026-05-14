import { axiosWrapper } from "./axiosWrapper";

// List all the endpoints;
export const getRecommendedMovies = () =>
  axiosWrapper.get("/movies/recommended");
export const getAllMovies = () => axiosWrapper.get("/movies");
export const getMovieById = (data) => axiosWrapper.get(`/movies/${data}`);
export const getShowsByMovieAndLocation = (movieId, state, date) =>
  axiosWrapper.get("/shows", {
    params: {
      movieId,
      state,
      date,
    },
  });
export const getShowById = (data) => axiosWrapper.get(`/shows/${data}`);
export const createShow = (data) => axiosWrapper.post("/shows", data);
export const createBulkShows = (data) => axiosWrapper.post("/shows/bulk", data);
export const getAllTheaters = () => axiosWrapper.get("/theaters");
export const syncMoviesFromTmdb = (data = {}) =>
  axiosWrapper.post("/movies/sync-tmdb", data);

// Authentication APIS
export const login = (data) => axiosWrapper.post("/auth/login", data);
export const sendSignupOTP = (data) =>
  axiosWrapper.post("/auth/signup/send-otp", data);
export const verifySignupOTP = (data, config = {}) =>
  axiosWrapper.post("/auth/signup/verify-otp", data, config);
export const logout = () => axiosWrapper.post("/auth/logout");
export const getUser = () => axiosWrapper.get("/users/me");


// Payment Endpoints
export const createOrderRazorpay = (data, config = {}) => axiosWrapper.post("/payment/create-order", data, config);

// Booking Endpoints
export const bookShow = (data, config = {}) => axiosWrapper.post("/book", data, config);
export const getUserBookings = () => axiosWrapper.get("/book");

// Interceptor

axiosWrapper.interceptors.response.use(
  (config) => {
    return config;
  },
  async (error) => {
    const originalRequest = error.config;
    console.log(originalRequest);
    if (
      error.response &&
      error.response.status === 401 &&
      originalRequest &&
      !originalRequest._isRetry &&
      !originalRequest.url.includes("/auth/refresh-token")
    ) {
      originalRequest._isRetry = true;

      try {
        await axiosWrapper.post("/auth/refresh-token");

        return axiosWrapper.request(originalRequest);
      } catch (error) {
        console.log("Error while refreshing the token", error);
      }
    }

    throw error;
  },
);

export { axiosWrapper };
