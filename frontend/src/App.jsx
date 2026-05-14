import { Suspense, lazy } from "react";
import { Navigate, Outlet, Route, Routes, useMatch } from "react-router-dom";
import Header from "./components/shared/Header";
import Footer from "./components/shared/Footer";
import { Toaster } from "react-hot-toast";
import { useLoadUser } from "./hooks/useLoadUser";
import FullScreenLoader from "./components/shared/FullScreenLoader";
import SignInModel from "./components/shared/SignInModel";
import { useAuth } from "./context/AuthContext";

const Movies = lazy(() => import("./pages/Movies"));
const MovieDetails = lazy(() => import("./pages/MovieDetails"));
const Bookings = lazy(() => import("./pages/Bookings"));
const Ticket = lazy(() => import("./pages/Ticket"));
const SeatLayout = lazy(() => import("./pages/SeatLayout"));
const Checkout = lazy(() => import("./pages/Checkout"));
const AdminShows = lazy(() => import("./pages/AdminShows"));
const AdminBookings = lazy(() => import("./pages/AdminBookings"));

const PrivateRoute = () => {
  const { auth }  = useAuth();
  return auth ? <Outlet /> : <Navigate to="/" replace />;
}

const AdminRoute = () => {
  const { auth, user } = useAuth();
  return auth && user?.role === "admin" ? <Outlet /> : <Navigate to="/" replace />;
};

function  App() {
  const { isLoading } = useLoadUser();

  const isSeatLayoutPage = useMatch(
    "/movies/:movieId/:movieName/:state/theater/:theaterId/show/:showId/seat-layout"
  );

  const isCheckoutPage = useMatch("/shows/:showId/:state/checkout");

  if(isLoading) {
    return <FullScreenLoader />
  }

  return (
    <>
      <Toaster 
        position="top-right"
        toastOptions={{
          style : {
            fontSize : "14px",
            borderRadius: "14px",
            background: "#111827",
            color: "#fff",
          }
        }}
      />
      <div className="flex min-h-screen flex-col bg-[#f6f3ee] text-[#171717]">
        {!isSeatLayoutPage && !isCheckoutPage && <Header />}
        <main className="grow">
          <Suspense fallback={<FullScreenLoader />}>
            <Routes>
              <Route path="/" element={<Movies />} />
              <Route path="/movies" element={<Movies />} />
              <Route path="/movies/:state/:movieName/:id/ticket" element={<MovieDetails />} />
              <Route element={<PrivateRoute />}>
                <Route path="/movies/:movieId/:movieName/:state/theater/:theaterId/show/:showId/seat-layout" element={<SeatLayout />} />
                <Route path="/profile/:id/booking" element={<Bookings />} />
                <Route path="/profile/:id/booking/:bookingId" element={<Ticket />} />
                <Route path="/shows/:showId/:state/checkout" element={<Checkout />} />
              </Route>
              <Route element={<AdminRoute />}>
                <Route path="/admin" element={<AdminShows />} />
                <Route path="/admin/bookings" element={<AdminBookings />} />
              </Route>
            </Routes>
          </Suspense>
        </main>
        {!isSeatLayoutPage && !isCheckoutPage && <Footer />}
        <SignInModel />
      </div>
    </>
  );
}

export default App;
