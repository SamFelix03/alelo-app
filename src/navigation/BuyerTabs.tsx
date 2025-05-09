import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { Ionicons } from "@expo/vector-icons"
import { theme } from "../theme"

// Buyer Screens
import MapScreen from "../screens/buyer/MapScreen"
import ListScreen from "../screens/buyer/ListScreen"
import ShopScreen from "../screens/buyer/ShopScreen"
import OrdersScreen from "../screens/buyer/OrdersScreen"
import ProfileScreen from "../screens/buyer/ProfileScreen"

const Tab = createBottomTabNavigator()

const BuyerTabs = () => {
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

          if (route.name === "Map") {
            iconName = focused ? "map" : "map-outline"
          } else if (route.name === "List") {
            iconName = focused ? "list" : "list-outline"
          } else if (route.name === "Shop") {
            iconName = focused ? "basket" : "basket-outline"
          } else if (route.name === "Orders") {
            iconName = focused ? "receipt" : "receipt-outline"
          } else if (route.name === "Profile") {
            iconName = focused ? "person" : "person-outline"
          }

          return <Ionicons name={iconName} size={size} color={color} />
        },
      })}
    >
      <Tab.Screen name="Map" component={MapScreen} />
      <Tab.Screen name="List" component={ListScreen} />
      <Tab.Screen name="Shop" component={ShopScreen} />
      <Tab.Screen name="Orders" component={OrdersScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  )
}

export default BuyerTabs
