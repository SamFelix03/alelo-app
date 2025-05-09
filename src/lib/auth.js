import AsyncStorage from '@react-native-async-storage/async-storage';

// Store user data in AsyncStorage for session management
export const storeUserData = async (phoneNumber, userType) => {
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
export const getUserData = async () => {
  try {
    const userDataString = await AsyncStorage.getItem('userData');
    return userDataString ? JSON.parse(userDataString) : null;
  } catch (error) {
    console.error('Error getting user data:', error);
    return null;
  }
};

// Sign out user
export const signOut = async () => {
  try {
    await AsyncStorage.removeItem('userData');
    return true;
  } catch (error) {
    console.error('Error signing out:', error);
    return false;
  }
}; 