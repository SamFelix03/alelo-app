"use client"
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { Ionicons } from "@expo/vector-icons"
import { theme } from "../theme"

// Import screens
import MapScreen from "../screens/buyer/MapScreen"
import ListScreen from "../screens/buyer/ListScreen"
import ShopScreen from "../screens/buyer/ShopScreen"
import OrdersScreen from "../screens/buyer/OrdersScreen"
import ProfileScreen from "../screens/buyer/ProfileScreen"
import NotificationsScreen from "../screens/buyer/NotificationsScreen"

const Tab = createBottomTabNavigator()

const BuyerTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
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
          } else if (route.name === "Notifications") {
            iconName = focused ? "notifications" : "notifications-outline"
          }

          return <Ionicons name={iconName} size={size} color={color} />
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.placeholder,
        headerShown: false,
      })}
    >
      <Tab.Screen name="Map" component={MapScreen} />
      <Tab.Screen name="List" component={ListScreen} />
      <Tab.Screen name="Shop" component={ShopScreen} />
      <Tab.Screen name="Orders" component={OrdersScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
      <Tab.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{
          tabBarBadge: 3, // This would be dynamic in a real app
          tabBarBadgeStyle: { backgroundColor: theme.colors.primary },
        }}
      />
    </Tab.Navigator>
  )
}

export default BuyerTabs
