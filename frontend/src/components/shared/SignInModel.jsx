import { X } from "lucide-react";
import mainLogo from "../../assets/screenly-logo.svg";
import { useAuth } from "../../context/AuthContext";
import StepEmail from "../auth/StepEmail";
import StepOTP from "../auth/StepOTP";

const steps = {
  1: StepEmail,
  2: StepOTP,
};

const SignInModel = () => {
  const { step, showModal, closeAuthModal } = useAuth();

  const Step = steps[step];

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-black/60 px-4 py-6 backdrop-blur-sm sm:px-6 sm:py-10">
      <div className="flex min-h-full items-start justify-center sm:items-center">
        <div className="animate-fadeIn cine-card relative flex w-full max-w-[400px] flex-col overflow-hidden rounded-[24px] shadow-2xl">
          <button
            onClick={closeAuthModal}
            className="absolute right-4 top-4 z-10 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-gray-100 text-gray-500 transition hover:bg-gray-200 hover:text-gray-700"
            aria-label="Close"
          >
            <X size={18} />
          </button>

          <div className="flex flex-col items-center justify-center px-5 pb-2 pt-8 sm:px-6 sm:pt-10">
            <img src={mainLogo} alt="Screenly" className="mb-2 h-8 sm:h-9" />
            <p className="text-center text-[11px] font-bold uppercase tracking-[0.18em] text-[#8f46ff]">
              Screenly
            </p>
          </div>

          <div className="max-h-[calc(100vh-10rem)] overflow-y-auto">
            <Step />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignInModel;
