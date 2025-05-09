import AsyncStorage from '@react-native-async-storage/async-storage';
import { CommonActions } from '@react-navigation/native';

type UserData = {
  phoneNumber: string;
  userType: string;
  isAuthenticated: boolean;
};

// Store user data in AsyncStorage for session management
export const storeUserData = async (phoneNumber: string, userType: string): Promise<boolean> => {
  try {
    await AsyncStorage.setItem(
      'userData',
      JSON.stringify({
        phoneNumber,
        userType,
        isAuthenticated: true
      })
    );
    return true;
  } catch (error) {
    console.error('Error storing user data:', error);
    return false;
  }
};

// Get user data from AsyncStorage
export const getUserData = async (): Promise<UserData | null> => {
  try {
    const userDataString = await AsyncStorage.getItem('userData');
    return userDataString ? JSON.parse(userDataString) : null;
  } catch (error) {
    console.error('Error getting user data:', error);
    return null;
  }
};

// Sign out user
export const signOut = async (navigation?: any): Promise<boolean> => {
  try {
    // First remove user data from AsyncStorage
    await AsyncStorage.removeItem('userData');
    
    // Then immediately reset navigation to Auth stack
    if (navigation) {
      // Reset the navigation state to ensure we go back to the auth flow
      setTimeout(() => {
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: 'Auth' }],
          })
        );
      }, 100); // Small delay to ensure AsyncStorage operation completes
    }
    
    return true;
  } catch (error) {
    console.error('Error signing out:', error);
    return false;
  }
}; 