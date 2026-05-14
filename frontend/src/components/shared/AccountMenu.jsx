import { LogOut, Mail, User } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const AccountMenu = ({ isOpen, onClose }) => {
  const { user, logoutRequest, logoutLoader } = useAuth();

  if (!isOpen) return null;

  return (
    <>
      <button
        type="button"
        aria-label="Close account menu"
        className="fixed inset-0 z-40 cursor-default bg-transparent"
        onClick={onClose}
      />
      <div className="absolute right-0 top-[calc(100%+10px)] z-50 w-[260px] overflow-hidden rounded-2xl border border-black/10 bg-white shadow-[0_18px_45px_rgba(23,23,23,0.16)]">
        <div className="border-b border-black/10 bg-[#faf8f4] p-3">
          <p className="flex items-center gap-2 text-[14px] font-black text-[#171717]">
            <User size={15} className="text-[#8f46ff]" />
            {user?.name || "Movie Lover"}
          </p>
          <p className="mt-1 flex items-center gap-2 break-all text-[12px] font-semibold text-[#6f6660]">
            <Mail size={13} />
            {user?.email || "No email available"}
          </p>
        </div>

        <div className="p-2">
          <button
            type="button"
            onClick={logoutRequest}
            disabled={logoutLoader}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#171717] px-3 py-2 text-[13px] font-black text-white transition hover:bg-[#2a2a2a] disabled:cursor-not-allowed disabled:opacity-70"
          >
            <LogOut size={14} />
            {logoutLoader ? "Logging out" : "Logout"}
          </button>
        </div>
      </div>
    </>
  );
};

export default AccountMenu;
