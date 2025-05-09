import { NavigationContainer } from "@react-navigation/native"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import { SafeAreaProvider } from "react-native-safe-area-context"
import { StatusBar } from "react-native"
import { GestureHandlerRootView } from "react-native-gesture-handler"
import { Provider as PaperProvider } from "react-native-paper"
import { theme } from "./src/theme"

// Auth Screens
import RoleSelection from "./src/screens/auth/RoleSelection"
import OtpVerification from "./src/screens/auth/OtpVerification"
import BuyerOnboarding from "./src/screens/auth/BuyerOnboarding"
import SellerOnboarding from "./src/screens/auth/SellerOnboarding"

// Buyer Screens
import BuyerTabs from "./src/navigation/BuyerTabs"
import SellerProfile from "./src/screens/buyer/SellerProfile"
import CartScreen from "./src/screens/buyer/CartScreen"
import ProductDetail from "./src/screens/buyer/ProductDetail"

// Seller Screens
import SellerTabs from "./src/navigation/SellerTabs"
import ProductForm from "./src/screens/seller/ProductForm"

const Stack = createNativeStackNavigator()

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PaperProvider theme={theme}>
          <NavigationContainer>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
            <Stack.Navigator
              initialRouteName="RoleSelection"
              screenOptions={{
                headerShown: false,
                animation: "slide_from_right",
              }}
            >
              {/* Auth Screens */}
              <Stack.Screen name="RoleSelection" component={RoleSelection} />
              <Stack.Screen name="OtpVerification" component={OtpVerification} />
              <Stack.Screen name="BuyerOnboarding" component={BuyerOnboarding} />
              <Stack.Screen name="SellerOnboarding" component={SellerOnboarding} />

              {/* Buyer Screens */}
              <Stack.Screen name="BuyerTabs" component={BuyerTabs} />
              <Stack.Screen name="SellerProfile" component={SellerProfile} />
              <Stack.Screen name="CartScreen" component={CartScreen} />
              <Stack.Screen name="ProductDetail" component={ProductDetail} />

              {/* Seller Screens */}
              <Stack.Screen name="SellerTabs" component={SellerTabs} />
              <Stack.Screen name="ProductForm" component={ProductForm} />
            </Stack.Navigator>
          </NavigationContainer>
        </PaperProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}
