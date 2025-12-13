import { createContext, useContext, useEffect, useState } from "react";
import { getUserInfo } from "../api/auth";
import { tokenManager } from "../api/endpoints";

interface AuthContextType {
  user: any;
  setUser: React.Dispatch<React.SetStateAction<any>>;
  fetchUser: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);


export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // user = { role, staff_id or diner_id }
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = async () => {
    console.log('[AuthContext] fetchUser called');
    // Check if we have a token before fetching user info
    const token = tokenManager.getAccessToken();
    console.log('[AuthContext] Token exists:', !!token);
    if (!token) {
      console.log('[AuthContext] No token, setting user to null');
      setUser(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      console.log('[AuthContext] Fetching user info from API');
      const data = await getUserInfo();
      console.log('[AuthContext] User info received:', data);
      setUser(data);
    } catch (error: any) {
      console.error('[AuthContext] Failed to fetch user:', error);
      // Only clear tokens if we get a 401 (unauthorized) response
      // Don't clear on network errors or other issues
      if (error?.message?.includes('401')) {
        console.log('[AuthContext] Got 401, clearing tokens');
        tokenManager.clearTokens();
        setUser(null);
      } else {
        console.log('[AuthContext] Non-401 error, keeping tokens and user state');
        // Keep existing user state to prevent logout on temporary network issues
      }
    } finally {
      setIsLoading(false);
      console.log('[AuthContext] Loading complete');
    }
  };

  useEffect(() => {
    console.log('[AuthContext] Initial mount, checking if need to fetchUser');
    console.log('[AuthContext] Current user:', user);
    // Only fetch user if we don't already have one
    // This prevents overwriting user set by login
    if (!user) {
      console.log('[AuthContext] No user, calling fetchUser');
      fetchUser();
    } else {
      console.log('[AuthContext] User already exists, skipping fetchUser');
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - only run on mount

  return (
    <AuthContext.Provider value={{ user, setUser, fetchUser, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

