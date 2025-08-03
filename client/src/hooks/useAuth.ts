import { useState, useEffect } from "react";

export function useAuth() {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in from localStorage
    const isLoggedIn = localStorage.getItem("isLoggedIn");
    const username = localStorage.getItem("username");
    
    if (isLoggedIn === "true" && username) {
      setUser({
        username,
        role: "admin",
        firstName: "Eymen",
        lastName: "Admin",
        email: "eymen@company.com",
      });
    }
    setIsLoading(false);
  }, []);

  const logout = () => {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("username");
    setUser(null);
    window.location.reload();
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    logout,
  };
}
