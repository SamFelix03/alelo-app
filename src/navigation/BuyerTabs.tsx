import React from "react"
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { Ionicons, MaterialCommunityIcons, FontAwesome } from "@expo/vector-icons"
import { View, Text, StyleSheet } from "react-native"
import { theme } from "../theme"

// Import screens
import ListScreen from "../screens/buyer/ListScreen"
import LikedSellersScreen from "../screens/buyer/LikedSellersScreen"
import ShopScreen from "../screens/buyer/ShopScreen"
import OrdersScreen from "../screens/buyer/OrdersScreen"
import CartScreen from "../screens/buyer/CartScreen"
import ProfileScreen from "../screens/buyer/ProfileScreen"
import NotificationsScreen from "../screens/buyer/NotificationsScreen"

const Tab = createBottomTabNavigator()

const BuyerTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let icon = null;

          if (route.name === "Home") {
            icon = <FontAwesome name="truck" size={22} color={color} />
          } else if (route.name === "Liked Sellers") {
            icon = <Ionicons name={focused ? "heart" : "heart-outline"} size={22} color={color} />
          } else if (route.name === "Shop") {
            icon = <View style={styles.shopIconContainer}>
              <MaterialCommunityIcons name="storefront" size={40} color="#FFFFFF" />
            </View>
          } else if (route.name === "Cart") {
            icon = <Ionicons name="cart" size={22} color={color} />
          } else if (route.name === "Profile") {
            icon = <Ionicons name={focused ? "person" : "person-outline"} size={22} color={color} />
          }

          return (
            <View style={styles.tabIconContainer}>
              {icon}
              <Text style={[styles.tabLabel, { color }]}>{route.name}</Text>
            </View>
          );
        },
        tabBarActiveTintColor: '#FFFFFF',
        tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.8)',
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
      })}
    >
      <Tab.Screen name="Home" component={ListScreen} />
      <Tab.Screen name="Liked Sellers" component={LikedSellersScreen} />
      <Tab.Screen 
        name="Shop" 
        component={ShopScreen} 
        options={{
          tabBarItemStyle: styles.centerTabItem,
        }}
      />
      <Tab.Screen name="Cart" component={CartScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
      <Tab.Screen 
        name="Orders" 
        component={OrdersScreen} 
        options={{
          tabBarButton: () => null,
        }}
      />
    </Tab.Navigator>
  )
}

const styles = StyleSheet.create({
  tabBar: {
    height: 60,
    backgroundColor: '#45A19D', // Teal color to match image
    borderTopWidth: 0,
    paddingHorizontal: 10,
  },
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
  },
  tabLabel: {
    fontSize: 12,
    marginTop: 4,
    color: '#FFFFFF',
  },
  shopIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#45A19D',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    borderWidth: 4,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  centerTabItem: {
    marginTop: -25,
  },
  badge: {
    backgroundColor: '#FF5C5C',
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
    minWidth: 18,
    height: 18,
    textAlign: 'center',
    lineHeight: 18,
    borderRadius: 9,
    paddingHorizontal: 5,
    position: 'absolute',
    top: 5,
    right: 5,
  }
});

export default BuyerTabs
