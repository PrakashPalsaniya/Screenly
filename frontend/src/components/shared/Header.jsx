import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Search, User, Loader } from "lucide-react";
import mainLogo from "../../assets/screenly-logo.svg";
import { useLocationContext } from "../../context/LocationContext";
import { useAuth } from "../../context/AuthContext";
import AccountMenu from "./AccountMenu";

const Header = () => {
  const { location, loading } = useLocationContext();
  const { openAuthModal, auth, user } = useAuth();
  const navigate = useNavigate();
  const routerLocation = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [isAccountOpen, setIsAccountOpen] = useState(false);

  const navItems = useMemo(
    () => [
      { label: "Movies", path: "/movies" },
      ...(auth && user?._id
        ? [
            { label: "Bookings", path: `/profile/${user._id}/booking` },
            ...(user?.role === "admin" 
              ? [
                  { label: "Admin Shows", path: "/admin" },
                  { label: "Admin Bookings", path: "/admin/bookings" }
                ] 
              : []),
          ]
        : []),
    ],
    [auth, user?._id],
  );

  const submitSearch = (event) => {
    event.preventDefault();
    const normalizedValue = searchQuery.trim();
    navigate(normalizedValue ? `/movies?q=${encodeURIComponent(normalizedValue)}` : "/movies");
  };

  const isActivePath = (path) => {
    if (path === "/") return routerLocation.pathname === "/";
    return routerLocation.pathname.startsWith(path);
  };

  return (
    <div className="sticky top-0 z-40 w-full border-b border-white/60 bg-[#fffdf9]/90 text-sm shadow-sm backdrop-blur-xl">
      <div className="px-4 md:px-8">
        <div className="mx-auto max-w-screen-xl py-2.5">
          <div className="flex items-center justify-between gap-3 sm:gap-4">
            <div className="flex min-w-0 flex-1 items-center gap-4">
              <img
                onClick={() => navigate("/")}
                src={mainLogo}
                alt="Screenly"
                className="h-8 cursor-pointer object-contain sm:h-9"
              />
              <form onSubmit={submitSearch} className="relative hidden flex-1 sm:block">
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  type="text"
                  placeholder="Search for movies"
                  className="cine-focus w-full rounded-full border border-black/10 bg-white/80 px-3.5 py-2 pr-9 text-[13px] outline-none transition"
                  aria-label="Search for movies"
                />
                <button
                  type="submit"
                  className="absolute right-3.5 top-2.5 text-gray-500"
                  aria-label="Submit movie search"
                >
                  <Search size={16} />
                </button>
              </form>
            </div>

            <div className="flex shrink-0 items-center gap-2 sm:gap-4">
              <div className="flex items-center gap-1 text-xs font-semibold text-[#2f2a27] sm:text-sm">
                {loading ? <Loader size={16} className="animate-spin" /> : null}
                {location ? <p className="max-w-[90px] truncate sm:max-w-none">{location}</p> : null}
              </div>

              {auth ? (
                <div className="relative flex items-center gap-2 sm:gap-4">
                  <button
                    type="button"
                    onClick={() => setIsAccountOpen((value) => !value)}
                    className="cursor-pointer rounded-full border border-black/10 bg-white p-1.5 text-sm font-medium shadow-sm"
                    aria-label="Open account menu"
                  >
                    <User size={16} className="text-[#8f46ff]" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAccountOpen((value) => !value)}
                    className="hidden cursor-pointer text-[13px] font-semibold hover:text-[#8f46ff] md:inline"
                  >
                    Hi, {user?.name || "Movie Lover"}
                  </button>
                  <AccountMenu
                    isOpen={isAccountOpen}
                    onClose={() => setIsAccountOpen(false)}
                  />
                </div>
              ) : (
                <button
                  onClick={() => openAuthModal("login")}
                  className="cine-button cursor-pointer rounded-full px-3.5 py-2 text-[13px] font-semibold transition hover:scale-[1.02]"
                >
                  Sign in
                </button>
              )}
            </div>
          </div>

          <div className="mt-3 flex flex-col gap-3 sm:hidden">
            <form onSubmit={submitSearch} className="relative">
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                type="text"
                placeholder="Search for movies"
                className="cine-focus w-full rounded-full border border-black/10 bg-white px-3.5 py-2 pr-9 text-[13px] outline-none"
                aria-label="Search for movies"
              />
              <button
                type="submit"
                className="absolute right-3 top-2.5 text-gray-500"
                aria-label="Submit movie search"
              >
                <Search size={16} />
              </button>
            </form>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {navItems.map((item) => {
              const active = isActivePath(item.path);
              return (
                <button
                  key={item.path}
                  type="button"
                  onClick={() => navigate(item.path)}
                  className={`rounded-full px-3 py-1.5 text-[13px] font-semibold transition ${
                    active
                      ? "bg-[#171717] text-white shadow-sm"
                      : "border border-black/10 bg-white text-[#2f2a27] hover:border-[#8f46ff] hover:text-[#8f46ff]"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;
