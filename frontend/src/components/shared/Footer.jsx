import mainLogo from "../../assets/screenly-logo-white.svg";

const Footer = () => {
  return (
    <footer className="bg-[#171717] px-4 py-10 text-sm text-gray-400">
      <div className="mx-auto flex max-w-screen-xl flex-col items-center gap-4 text-center">
        <img src={mainLogo} alt="Screenly Logo" className="w-36" />
        <p className="max-w-2xl text-sm leading-6 text-gray-300">
          Screenly helps you discover movies, check nearby showtimes, choose your
          seats, and complete bookings in one place.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">
          <span>Movies</span>
          <span>|</span>
          <span>Showtimes</span>
          <span>|</span>
          <span>Bookings</span>
          <span>|</span>
          <span>Screenly</span>
        </div>
        <p className="text-xs text-gray-500">
          Copyright 2026 Screenly. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
