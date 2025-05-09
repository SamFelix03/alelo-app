import React from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Auth Screens
import RoleSelection from '../screens/auth/RoleSelection';
import OtpVerification from '../screens/auth/OtpVerification';
import BuyerOnboarding from '../screens/auth/BuyerOnboarding';
import SellerOnboarding from '../screens/auth/SellerOnboarding';

// Tab Navigators
import BuyerTabs from './BuyerTabs';
import SellerTabs from './SellerTabs';

// Auth Context
import { useAuth } from '../context/AuthContext';

// Define stack navigator param lists
type AuthStackParamList = {
  RoleSelection: undefined;
  OtpVerification: { 
    role: 'buyer' | 'seller' | null, 
    phoneNumber: string, 
    existingUser?: boolean, 
    existingUserType?: string 
  };
  BuyerOnboarding: { phoneNumber: string };
  SellerOnboarding: { phoneNumber: string };
};

const AuthStack = createNativeStackNavigator<AuthStackParamList>();

// Auth Flow Navigator
const AuthNavigator = () => {
  const { isLoggedIn, isLoading, userInfo } = useAuth();

  // Show loading indicator while checking auth state
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <>
      {isLoggedIn ? (
        // User is logged in, show the appropriate tabs based on user type
        userInfo?.userType === 'buyer' ? <BuyerTabs /> : <SellerTabs />
      ) : (
        // User is not logged in, show the auth flow
        <AuthStack.Navigator
          initialRouteName="RoleSelection"
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
        >
          <AuthStack.Screen name="RoleSelection" component={RoleSelection} />
          <AuthStack.Screen name="OtpVerification" component={OtpVerification} />
          <AuthStack.Screen name="BuyerOnboarding" component={BuyerOnboarding} />
          <AuthStack.Screen name="SellerOnboarding" component={SellerOnboarding} />
        </AuthStack.Navigator>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
});

export default AuthNavigator; 