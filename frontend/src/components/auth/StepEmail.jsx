import { useState } from "react";
import { Mail, Phone, Lock, User, Loader } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const initialSignupState = {
  name: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
};

const initialLoginState = {
  email: "",
  password: "",
};

const inputClass =
  "cine-focus w-full rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-[13px] text-[#171717] outline-none transition placeholder:text-gray-400";

const labelClass = "text-[13px] font-semibold text-[#171717]";

const Field = ({ label, type, value, onChange, placeholder, minLength, required, icon: Icon }) => (
  <label className="flex flex-col gap-1.5">
    <span className={labelClass}>{label}</span>
    <div className="relative">
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`${inputClass} ${Icon ? "pr-10" : ""}`}
        minLength={minLength}
        required={required}
      />
      {Icon ? (
        <span className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-gray-400">
          <Icon size={16} className="lucide" />
        </span>
      ) : null}
    </div>
  </label>
);

const StepEmail = () => {
  const {
    authMode,
    switchAuthMode,
    loginRequest,
    sendSignupOtpRequest,
    loginLoader,
    signupOtpLoader,
  } = useAuth();

  const [loginForm, setLoginForm] = useState(initialLoginState);
  const [signupForm, setSignupForm] = useState(initialSignupState);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    await loginRequest(loginForm);
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();

    if (signupForm.password !== signupForm.confirmPassword) {
      return;
    }

    await sendSignupOtpRequest({
      name: signupForm.name.trim(),
      email: signupForm.email.trim(),
      phone: signupForm.phone.trim(),
      password: signupForm.password,
    });
  };

  const isSignup = authMode === "signup";
  const isLoading = isSignup ? signupOtpLoader : loginLoader;

  return (
    <div className="px-5 pb-6 pt-4 sm:px-8 sm:pb-8">
      <div className="mb-6">
        <h2 className="text-center text-[22px] font-bold text-[#171717]">
          {isSignup ? "Create Account" : "Welcome Back"}
        </h2>
        <p className="mt-1 text-center text-[13px] text-gray-500">
          {isSignup ? "Sign up to start booking tickets" : "Log in to access your bookings"}
        </p>
      </div>

      <div className="mb-6 flex rounded-xl bg-gray-100/80 p-1">
        <button
          type="button"
          onClick={() => switchAuthMode("login")}
          className={`flex-1 rounded-lg px-4 py-2 text-[13px] font-semibold transition ${
            !isSignup ? "bg-white text-[#171717] shadow-sm" : "text-gray-500 hover:text-[#171717]"
          }`}
        >
          Login
        </button>
        <button
          type="button"
          onClick={() => switchAuthMode("signup")}
          className={`flex-1 rounded-lg px-4 py-2 text-[13px] font-semibold transition ${
            isSignup ? "bg-white text-[#171717] shadow-sm" : "text-gray-500 hover:text-[#171717]"
          }`}
        >
          Sign Up
        </button>
      </div>

        {isSignup ? (
          <form className="flex flex-col gap-3.5" onSubmit={handleSignupSubmit}>
            <Field
              label="Full Name"
              type="text"
              value={signupForm.name}
              onChange={(e) => setSignupForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Enter your full name"
              required
              icon={User}
            />
            <Field
              label="Email"
              type="email"
              value={signupForm.email}
              onChange={(e) => setSignupForm((prev) => ({ ...prev, email: e.target.value }))}
              placeholder="Enter your email"
              required
              icon={Mail}
            />
            <Field
              label="Phone"
              type="tel"
              value={signupForm.phone}
              onChange={(e) => setSignupForm((prev) => ({ ...prev, phone: e.target.value }))}
              placeholder="Enter phone number"
              required
              icon={Phone}
            />
            <Field
              label="Password"
              type="password"
              value={signupForm.password}
              onChange={(e) => setSignupForm((prev) => ({ ...prev, password: e.target.value }))}
              placeholder="Create a password"
              minLength={8}
              required
              icon={Lock}
            />
            <Field
              label="Confirm Password"
              type="password"
              value={signupForm.confirmPassword}
              onChange={(e) =>
                setSignupForm((prev) => ({ ...prev, confirmPassword: e.target.value }))
              }
              placeholder="Confirm your password"
              minLength={8}
              required
              icon={Lock}
            />

            {signupForm.confirmPassword && signupForm.password !== signupForm.confirmPassword ? (
              <p className="text-[13px] font-medium text-red-500">Passwords do not match.</p>
            ) : null}

            <button
              type="submit"
              className="cine-button mt-2 w-full cursor-pointer rounded-full py-2.5 text-[14px] font-semibold transition hover:scale-[1.02]"
            >
              {isLoading ? <Loader className="h-5 w-5 animate-spin inline-block" /> : "Get OTP"}
            </button>
          </form>
        ) : (
          <form className="flex flex-col gap-3.5" onSubmit={handleLoginSubmit}>
            <Field
              label="Email"
              type="email"
              value={loginForm.email}
              onChange={(e) => setLoginForm((prev) => ({ ...prev, email: e.target.value }))}
              placeholder="Enter your email"
              required
              icon={Mail}
            />
            <Field
              label="Password"
              type="password"
              value={loginForm.password}
              onChange={(e) => setLoginForm((prev) => ({ ...prev, password: e.target.value }))}
              placeholder="Enter your password"
              minLength={8}
              required
              icon={Lock}
            />

            <button
              type="submit"
              className="cine-button mt-2 w-full cursor-pointer rounded-full py-2.5 text-[14px] font-semibold transition hover:scale-[1.02]"
            >
              {isLoading ? <Loader className="h-5 w-5 animate-spin inline-block" /> : "Login"}
            </button>
          </form>
        )}

        <p className="mt-5 text-center text-[13px] font-medium text-gray-500">
          {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
          <button
            type="button"
            onClick={() => switchAuthMode(isSignup ? "login" : "signup")}
            className="cursor-pointer font-semibold text-[#8f46ff] hover:underline hover:underline-offset-4"
          >
            {isSignup ? "Log In" : "Sign Up"}
          </button>
        </p>
    </div>
  );
};

export default StepEmail;
