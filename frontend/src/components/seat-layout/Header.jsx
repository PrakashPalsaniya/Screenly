import mainLogo from "../../assets/screenly-logo.svg";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { formatShowDate, getShowDay } from "../../utils/dateFormatter";
import AccountMenu from "../shared/AccountMenu";

const Header = ({ showData, type }) => {
  const navigate = useNavigate();
  const { auth, user, openAuthModal } = useAuth();
  const [isAccountOpen, setIsAccountOpen] = useState(false);

  return (
    <>
      <div className="border-b border-black/10 bg-[#fffdf9]/95 shadow-sm backdrop-blur-xl">
        <div className="flex items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <img
            onClick={() => navigate("/")}
            src={mainLogo}
            alt="Screenly"
            className="h-7 cursor-pointer object-contain md:h-9"
          />

          {type === "checkout" ? (
            <h2 className="text-center text-base font-black text-[#171717] md:text-[22px]">
              Review your booking
            </h2>
          ) : (
            <div className="min-w-0 text-center">
              <h2 className="truncate text-[20px] font-black leading-tight text-[#171717] md:text-[30px]">
                {showData?.movie.title}
              </h2>
              <p className="hidden text-[14px] font-semibold text-[#6f6660] md:text-base sm:block">
                {formatShowDate(showData?.date, "D MMMM YYYY")}{" "}
                {showData?.startTime} at{" "}
                {showData?.theater.name +
                  ", " +
                  showData?.theater.city +
                  ", " +
                  showData?.theater.state}
              </p>
            </div>
          )}

          {auth ? (
            <div className="relative flex items-center gap-2 sm:gap-4">
              <button
                type="button"
                onClick={() => setIsAccountOpen((value) => !value)}
                className="cursor-pointer rounded-full border border-black/10 bg-white p-2 text-sm font-medium shadow-sm"
                aria-label="Open account menu"
              >
                <User size={18} className="text-[#8f46ff]" />
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
              className="cine-button cursor-pointer rounded-full px-4 py-2 text-[15px] font-bold md:text-base"
            >
              Sign in
            </button>
          )}
        </div>
      </div>

      {type !== "checkout" ? (
        <>
          <div className="bg-[#fffdf9] pt-4">
            <div className="mx-auto flex max-w-7xl items-center gap-4 overflow-x-auto px-4 pb-4 scrollbar-hide sm:px-6">
              <div className="shrink-0 text-[13px] text-[#6f6660] md:text-[14px]">
                <p className="text-xs font-bold uppercase">
                  {getShowDay(showData?.date)}
                </p>
                <p className="text-[14px] font-black text-[#171717] md:text-base">
                  {formatShowDate(showData?.date, "DD MMMM")}
                </p>
              </div>

              <button className="shrink-0 cursor-pointer rounded-xl border border-[#8f46ff] bg-[#f4ecff] px-5 py-2 text-[14px] font-black text-[#171717] md:text-base">
                {showData?.startTime}
                <p className="text-[10px] font-black text-[#6f6660]">
                  {showData?.audioType.toUpperCase()}
                </p>
              </button>
            </div>
          </div>
          <hr className="mx-auto max-w-7xl border-black/10" />
        </>
      ) : null}
    </>
  );
};

export default Header;
