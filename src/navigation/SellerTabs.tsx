"use client"
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from "@expo/vector-icons"
import { View, Text, StyleSheet } from "react-native"
import { theme } from "../theme"

// Import screens
import DashboardScreen from "../screens/seller/DashboardScreen"
import ProductsScreen from "../screens/seller/ProductsScreen"
import OrdersScreen from "../screens/seller/OrdersScreen"
import CustomersScreen from "../screens/seller/CustomersScreen"
import ProfileScreen from "../screens/seller/ProfileScreen"

const Tab = createBottomTabNavigator()

const SellerTabs = () => {
  // Custom component for the central customers icon
  const CustomersIcon = () => (
    <View style={styles.customersIconContainer}>
      <View style={styles.customersIconGroup}>
        <View style={[styles.customerIconPerson, styles.customerLeft]}>
          <Ionicons name="person" size={15} color="#000" />
        </View>
        <View style={[styles.customerIconPerson, styles.customerCenter, styles.customerFront]}>
          <Ionicons name="person" size={15} color="#000" />
        </View>
        <View style={[styles.customerIconPerson, styles.customerRight]}>
          <Ionicons name="person" size={15} color="#000" />
        </View>
      </View>
    </View>
  );

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let icon = null;

          if (route.name === "Home") {
            icon = <Ionicons name="home-outline" size={24} color={color} />
          } else if (route.name === "Business") {
            icon = <MaterialCommunityIcons name="truck-delivery-outline" size={26} color={color} />
          } else if (route.name === "Customers") {
            icon = <CustomersIcon />
          } else if (route.name === "Liked Customers") {
            icon = <Ionicons name="shield-outline" size={24} color={color} />
          } else if (route.name === "Menu") {
            icon = <Ionicons name="menu" size={24} color={color} />
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
      <Tab.Screen name="Home" component={DashboardScreen} />
      <Tab.Screen name="Business" component={ProductsScreen} />
      <Tab.Screen 
        name="Customers" 
        component={CustomersScreen} 
        options={{
          tabBarItemStyle: styles.centerTabItem,
        }}
      />
      <Tab.Screen name="Liked Customers" component={OrdersScreen} />
      <Tab.Screen name="Menu" component={ProfileScreen} />
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
  customersIconContainer: {
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
  customersIconGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 30,
  },
  customerIconPerson: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  customerLeft: {
    backgroundColor: '#6D9FFF',
    zIndex: 1,
    left: 4,
  },
  customerCenter: {
    backgroundColor: '#FF7F7F',
    zIndex: 3,
  },
  customerRight: {
    backgroundColor: '#93E088',
    zIndex: 1,
    right: 4,
  },
  customerFront: {
    borderWidth: 1,
    borderColor: '#fff',
  },
  centerTabItem: {
    marginTop: -25,
  },
});

export default SellerTabs
