import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { Ionicons } from "@expo/vector-icons"
import { theme } from "../theme"

// Seller Screens
import DashboardScreen from "../screens/seller/DashboardScreen"
import ProductsScreen from "../screens/seller/ProductsScreen"
import OrdersScreen from "../screens/seller/OrdersScreen"
import CustomersScreen from "../screens/seller/CustomersScreen"
import SettingsScreen from "../screens/seller/SettingsScreen"

const Tab = createBottomTabNavigator()

const SellerTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.placeholder,
        tabBarStyle: {
          elevation: 5,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          borderTopWidth: 1,
          borderTopColor: "#F0F0F0",
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "500",
          marginBottom: 5,
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName

          if (route.name === "Dashboard") {
            iconName = focused ? "home" : "home-outline"
          } else if (route.name === "Products") {
            iconName = focused ? "cube" : "cube-outline"
          } else if (route.name === "Orders") {
            iconName = focused ? "receipt" : "receipt-outline"
          } else if (route.name === "Customers") {
            iconName = focused ? "people" : "people-outline"
          } else if (route.name === "Settings") {
            iconName = focused ? "settings" : "settings-outline"
          }

          return <Ionicons name={iconName} size={size} color={color} />
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Products" component={ProductsScreen} />
      <Tab.Screen name="Orders" component={OrdersScreen} />
      <Tab.Screen name="Customers" component={CustomersScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  )
}

export default SellerTabs
