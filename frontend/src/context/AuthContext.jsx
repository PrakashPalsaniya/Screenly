import { useContext, createContext, useState } from "react";
import { toast } from "react-hot-toast";
import { login, logout, sendSignupOTP, verifySignupOTP } from "../apis";
import { setSocketAuth } from "../utils/socket";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [step, setStep] = useState(1);
  const [authMode, setAuthMode] = useState("login");
  const [showModal, setShowModal] = useState(false);
  const [user, setUser] = useState(null);
  const [auth, setAuth] = useState(false);
  const [pendingSignup, setPendingSignup] = useState(null);
  const [signupIdempotencyKey, setSignupIdempotencyKey] = useState(null);
  const [signupOtpLoader, setSignupOtpLoader] = useState(false);
  const [verifyOtpLoader, setVerifyOtpLoader] = useState(false);
  const [loginLoader, setLoginLoader] = useState(false);
  const [logoutLoader, setLogoutLoader] = useState(false);

  const resetAuthFlow = () => {
    setStep(1);
    setPendingSignup(null);
  };

  const openAuthModal = (mode = "login") => {
    setAuthMode(mode);
    resetAuthFlow();
    setShowModal(true);
  };

  const closeAuthModal = () => {
    setShowModal(false);
    resetAuthFlow();
  };

  const switchAuthMode = (mode) => {
    setAuthMode(mode);
    resetAuthFlow();
  };

  const loginRequest = async ({ email, password }) => {
    setLoginLoader(true);

    try {
      const res = await login({ email, password });
      setUser(res.data.user);
      setAuth(true);
      
      // FIX: Set socket auth so backend knows this user's ID
      setSocketAuth(res.data.user._id, res.data.user.email);
      
      closeAuthModal();
      toast.success("Logged in successfully");
      return true;
    } catch (err) {
      toast.error(err?.response?.data?.message || "Login failed");
      return false;
    } finally {
      setLoginLoader(false);
    }
  };

  const sendSignupOtpRequest = async ({ name, email, phone, password }) => {
    setSignupOtpLoader(true);

    try {
      const res = await sendSignupOTP({ name, email, phone, password });
      setPendingSignup({
        name,
        email,
        phone,
        password,
        hash: res.data.hash,
      });
      setSignupIdempotencyKey(crypto.randomUUID());
      setStep(2);
      toast.success("OTP sent to your email");
      return true;
    } catch (err) {
      toast.error(err?.response?.data?.message || "Unable to send OTP");
      return false;
    } finally {
      setSignupOtpLoader(false);
    }
  };

  const resendSignupOtpRequest = async () => {
    if (!pendingSignup) {
      toast.error("Signup session expired. Please start again.");
      switchAuthMode("signup");
      return false;
    }

    return sendSignupOtpRequest(pendingSignup);
  };

  const verifySignupOtpRequest = async (otp) => {
    if (!pendingSignup) {
      toast.error("Signup session expired. Please start again.");
      switchAuthMode("signup");
      return false;
    }

    setVerifyOtpLoader(true);

    try {
      const res = await verifySignupOTP(
        {
          ...pendingSignup,
          otp,
        },
        {
          headers: {
            "Idempotency-Key": `${signupIdempotencyKey}-verify`,
          },
        }
      );
      setPendingSignup(null);
      setUser(res.data.user);
      setAuth(true);
      
      // FIX: Set socket auth so backend knows this user's ID
      setSocketAuth(res.data.user._id, res.data.user.email);
      
      closeAuthModal();
      toast.success("Account created successfully");
      return true;
    } catch (err) {
      toast.error(err?.response?.data?.message || "OTP verification failed");
      return false;
    } finally {
      setVerifyOtpLoader(false);
    }
  };

  const logoutRequest = async () => {
    setLogoutLoader(true);

    try {
      await logout();
    } catch (_error) {
      // Even if the session is already invalid, clear local app state.
    } finally {
      setAuth(false);
      setUser(null);
      closeAuthModal();
      setLogoutLoader(false);
      toast.success("Logged out successfully");
      window.location.href = "/";
    }
  };

  const value = {
    step,
    setStep,
    authMode,
    showModal,
    user,
    setUser,
    auth,
    setAuth,
    pendingSignup,
    signupOtpLoader,
    verifyOtpLoader,
    loginLoader,
    logoutLoader,
    openAuthModal,
    closeAuthModal,
    switchAuthMode,
    loginRequest,
    sendSignupOtpRequest,
    resendSignupOtpRequest,
    verifySignupOtpRequest,
    logoutRequest,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
