import React from "react";
import { Navigate } from "react-router-dom";
import { useAuthStatus } from "../hooks/useAuthStatus";

const PrivateRoute = ({ children }) => {
  const { loggedIn, checkingStatus } = useAuthStatus();

  if (checkingStatus) {
    return null;
  }

  return loggedIn ? children : <Navigate to="/sign-in" />;
};

export default PrivateRoute;
