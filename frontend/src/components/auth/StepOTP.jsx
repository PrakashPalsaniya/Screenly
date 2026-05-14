import { useRef, useState } from "react";
import { X } from "lucide-react";
import { useCountdown } from "../../hooks/useCountdown";
import { useAuth } from "../../context/AuthContext";

const StepOTP = () => {
  const [otpArray, setOtpArray] = useState(new Array(4).fill(""));
  const inputRef = useRef([]);
  const { pendingSignup, resendSignupOtpRequest, verifySignupOtpRequest, verifyOtpLoader } =
    useAuth();

  const { displayTime, isExpired, resetCountdown } = useCountdown({
    initialTimeInSeconds: 5 * 60,
  });

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const otp = otpArray.join("");

    if (otp.length !== 4) {
      return;
    }

    const isVerified = await verifySignupOtpRequest(otp);
    if (isVerified) {
      setOtpArray(new Array(4).fill(""));
    }
  };

  const handleResendOtp = async (e) => {
    e.preventDefault();
    const isResent = await resendSignupOtpRequest();

    if (isResent) {
      setOtpArray(new Array(4).fill(""));
      inputRef.current[0]?.focus();
      resetCountdown();
    }
  };

  const handleOtpChange = ({ target }, index) => {
    const { value } = target;
    if (value !== "" && Number.isNaN(Number(value))) {
      return;
    }

    const nextOtp = otpArray.map((digit, idx) =>
      idx === index ? value.slice(-1) : digit,
    );
    setOtpArray(nextOtp);

    if (value !== "" && index < inputRef.current.length - 1) {
      inputRef.current[index + 1]?.focus();
    }
  };

  const handleClearOtp = () => {
    setOtpArray(new Array(4).fill(""));
    inputRef.current[0]?.focus();
  };

  return (
    <div className="px-5 pb-6 pt-4 sm:px-8 sm:pb-8">
      <div className="mb-6">
        <h2 className="text-center text-[22px] font-bold text-[#171717]">Verify OTP</h2>
        <p className="mt-1.5 text-center text-[13px] text-gray-500">
          Enter the code sent to <br/>
          <span className="font-semibold text-[#171717]">{pendingSignup?.email}</span>
        </p>
      </div>

      <div className="flex items-center justify-center gap-2">
        {otpArray.map((digit, index) => (
          <input
            key={index}
            ref={(ref) => (inputRef.current[index] = ref)}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleOtpChange(e, index)}
            className="cine-focus h-12 w-12 rounded-xl border border-black/10 bg-white text-center text-[16px] font-bold text-[#171717] outline-none transition"
          />
        ))}

        <button
          onClick={handleClearOtp}
          type="button"
          className="ml-2 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-gray-100 text-gray-500 transition hover:bg-gray-200 hover:text-gray-700"
          aria-label="Clear OTP"
        >
          <X size={16} />
        </button>
      </div>

      <div className="mt-4">
        {isExpired ? (
          <p className="text-center text-[13px] text-red-500">
            OTP expired.{" "}
            <button
              type="button"
              className="cursor-pointer font-semibold text-[#8f46ff] hover:underline hover:underline-offset-4"
              onClick={handleResendOtp}
            >
              Resend Code
            </button>
          </p>
        ) : (
          <p className="text-center text-[13px] font-medium text-gray-500">
            Code expires in <span className="font-semibold text-[#171717]">{displayTime}</span>
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={handleVerifyOtp}
        className="cine-button mt-6 w-full cursor-pointer rounded-full py-2.5 text-[14px] font-semibold transition hover:scale-[1.02]"
      >
        {verifyOtpLoader ? "Verifying..." : "Create Account"}
      </button>

      <p className="mt-4 text-center text-[12px] text-gray-400">
        Your account becomes active after verification.
      </p>
    </div>
  );
};

export default StepOTP;
