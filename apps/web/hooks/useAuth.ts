import { useState, useEffect } from "react";
import { useAuthStore, User } from "../stores/authStore";

export function useAuth() {
  const [isHydrated, setIsHydrated] = useState(false);
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const setAuth = useAuthStore((state) => state.setAuth);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  return {
    user: isHydrated ? user : null,
    accessToken: isHydrated ? accessToken : null,
    isAuthenticated: isHydrated ? isAuthenticated : false,
    setAuth,
    clearAuth,
    isHydrated,
  };
}
