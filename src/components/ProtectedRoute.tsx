import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { authService } from "@/services/auth.service";

interface ProtectedRouteProps {
  children: ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  if (!authService.isLoggedIn()) {
    return <Navigate to="/sign-in" replace />;
  }

  return <>{children}</>;
};
