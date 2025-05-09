"use client"
import { NavigationContainer } from "@react-navigation/native"
import { createStackNavigator } from "@react-navigation/stack"

// Import screens
import RoleSelection from "../screens/auth/RoleSelection"
import OtpVerification from "../screens/auth/OtpVerification"
import BuyerOnboarding from "../screens/auth/BuyerOnboarding"
import SellerOnboarding from "../screens/auth/SellerOnboarding"
import BuyerTabs from "./BuyerTabs"
import SellerTabs from "./SellerTabs"
import SellerProfile from "../screens/buyer/SellerProfile"
import ProductDetail from "../screens/buyer/ProductDetail"
import CartScreen from "../screens/buyer/CartScreen"
import ProductForm from "../screens/seller/ProductForm"
import SearchScreen from "../screens/buyer/SearchScreen"

const Stack = createStackNavigator()

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {/* Auth Flow */}
        <Stack.Screen name="RoleSelection" component={RoleSelection} />
        <Stack.Screen name="OtpVerification" component={OtpVerification} />
        <Stack.Screen name="BuyerOnboarding" component={BuyerOnboarding} />
        <Stack.Screen name="SellerOnboarding" component={SellerOnboarding} />

        {/* Main Flows */}
        <Stack.Screen name="BuyerTabs" component={BuyerTabs} />
        <Stack.Screen name="SellerTabs" component={SellerTabs} />

        {/* Buyer Screens */}
        <Stack.Screen name="SellerProfile" component={SellerProfile} />
        <Stack.Screen name="ProductDetail" component={ProductDetail} />
        <Stack.Screen name="CartScreen" component={CartScreen} />
        <Stack.Screen name="SearchScreen" component={SearchScreen} />

        {/* Seller Screens */}
        <Stack.Screen name="ProductForm" component={ProductForm} />
      </Stack.Navigator>
    </NavigationContainer>
  )
}

export default AppNavigator
