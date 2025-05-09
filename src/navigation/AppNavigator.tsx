import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Main Navigators
import AuthNavigator from './AuthNavigator';

// Individual Screens
import SellerProfile from '../screens/buyer/SellerProfile';
import ProductDetail from '../screens/buyer/ProductDetail';
import CartScreen from '../screens/buyer/CartScreen';
import ProductForm from '../screens/seller/ProductForm';
import SearchScreen from '../screens/buyer/SearchScreen';

// Auth Context Provider
import { AuthProvider } from '../context/AuthContext';

// Define stack navigator param list
type RootStackParamList = {
  Auth: undefined;
  SellerProfile: { seller: any };
  ProductDetail: { product: any };
  CartScreen: { cart?: any[]; seller?: any; product?: any; quantity?: number };
  ProductForm: { product?: any };
  SearchScreen: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  return (
    <AuthProvider>
      <NavigationContainer>
        <Stack.Navigator 
          initialRouteName="Auth"
          screenOptions={{ 
            headerShown: false,
            animation: 'slide_from_right',
          }}
        >
          {/* Auth Navigator handles authentication flow */}
          <Stack.Screen 
            name="Auth" 
            component={AuthNavigator} 
            options={{ headerShown: false }}
          />

          {/* Common screens accessible from both buyer and seller flows */}
          <Stack.Screen name="SellerProfile" component={SellerProfile} />
          <Stack.Screen name="ProductDetail" component={ProductDetail} />
          <Stack.Screen name="CartScreen" component={CartScreen} />
          <Stack.Screen name="ProductForm" component={ProductForm} />
          <Stack.Screen name="SearchScreen" component={SearchScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </AuthProvider>
  );
};

export default AppNavigator;
