import { useDispatch, useSelector } from "react-redux";
import {
  loginUser,
  fetchUserProfile,
  logoutUser as logoutUserThunk,
  clearError,
} from "../redux/slices/authSlice";
import { useEffect } from "react";

export const useAuth = () => {
  const dispatch = useDispatch();
  const { user, loading, error, isAuthenticated } = useSelector(
    (state) => state.auth
  );

  const login = (credentials) => {
    return dispatch(loginUser(credentials));
  };

  const logout = () => {
    dispatch(logoutUserThunk());
  };

  const clearAuthError = () => {
    dispatch(clearError());
  };

  return {
    user,
    loading,
    error,
    isAuthenticated,
    login,
    logout,
    clearError: clearAuthError,
  };
};

export const useLoadUser = () => {
  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(fetchUserProfile());
  }, [dispatch]);

  return { loading };
};
