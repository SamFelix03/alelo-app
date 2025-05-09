import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { getUserData } from '../lib/auth';
import { supabase } from '../lib/supabase';

type UserInfo = {
  phoneNumber: string;
  userType: 'buyer' | 'seller';
  profileData: any; // This will store user profile data from buyer/seller tables
};

type AuthContextType = {
  isLoggedIn: boolean;
  isLoading: boolean;
  userInfo: UserInfo | null;
  refreshUserProfile: () => Promise<void>;
  refreshAuthState: () => Promise<void>; // Method to manually refresh auth state
};

// Create context with default values
const AuthContext = createContext<AuthContextType>({
  isLoggedIn: false,
  isLoading: true,
  userInfo: null,
  refreshUserProfile: async () => {},
  refreshAuthState: async () => {}, // Default implementation
});

// Hook to use the auth context
export const useAuth = () => useContext(AuthContext);

type AuthProviderProps = {
  children: ReactNode;
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  // Function to fetch user profile data from appropriate table
  const fetchUserProfile = async (phoneNumber: string, userType: string) => {
    try {
      const tableName = userType === 'buyer' ? 'buyers' : 'sellers';
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('phone_number', phoneNumber)
        .single();

      if (error) {
        console.error(`Error fetching ${userType} profile:`, error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      return null;
    }
  };

  // Refresh user profile - can be called after updating profile
  const refreshUserProfile = async () => {
    if (!userInfo) return;
    
    const profileData = await fetchUserProfile(
      userInfo.phoneNumber, 
      userInfo.userType
    );
    
    if (profileData) {
      setUserInfo({
        ...userInfo,
        profileData
      });
    }
  };

  // Check auth state and update context
  const checkAuthState = async () => {
    try {
      setIsLoading(true);
      
      // Get stored user data
      const userData = await getUserData();
      
      if (userData && userData.isAuthenticated) {
        // Fetch profile data from appropriate table
        const profileData = await fetchUserProfile(
          userData.phoneNumber,
          userData.userType
        );
        
        if (profileData) {
          setUserInfo({
            phoneNumber: userData.phoneNumber,
            userType: userData.userType as 'buyer' | 'seller',
            profileData
          });
          setIsLoggedIn(true);
        } else {
          // Clear any stale user data if profile not found
          setIsLoggedIn(false);
          setUserInfo(null);
        }
      } else {
        setIsLoggedIn(false);
        setUserInfo(null);
      }
    } catch (error) {
      console.error('Error checking auth state:', error);
      setIsLoggedIn(false);
      setUserInfo(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Method to manually refresh auth state - important for immediate login/logout
  const refreshAuthState = async () => {
    await checkAuthState();
  };

  // Check for existing session on app load
  useEffect(() => {
    checkAuthState();
  }, []);

  const contextValue: AuthContextType = {
    isLoggedIn,
    isLoading,
    userInfo,
    refreshUserProfile,
    refreshAuthState
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}; 