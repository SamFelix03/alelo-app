"use client"
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons"
import { View, Text, StyleSheet, Platform } from "react-native"
import { theme } from "../theme"

// Import screens
import DashboardScreen from "../screens/seller/DashboardScreen"
import ProductsScreen from "../screens/seller/ProductsScreen"
import OrdersScreen from "../screens/seller/OrdersScreen"
import CustomersScreen from "../screens/seller/CustomersScreen"
import ProfileScreen from "../screens/seller/ProfileScreen"

const Tab = createBottomTabNavigator()

const TAB_BAR_HEIGHT = Platform.OS === 'ios' ? 88 : 64
const MIDDLE_BUTTON_SIZE = 52

const SellerTabs = () => {
  // Custom component for the central customers icon
  const CustomersIcon = ({ focused }: { focused: boolean }) => (
    <View style={[styles.customersIconContainer, focused && styles.customersIconContainerFocused]}>
      <View style={styles.customersIconGroup}>
        <View style={[styles.customerIconPerson, styles.customerLeft]}>
          <Ionicons name="person" size={12} color="#000" />
        </View>
        <View style={[styles.customerIconPerson, styles.customerCenter, styles.customerFront]}>
          <Ionicons name="person" size={12} color="#000" />
        </View>
        <View style={[styles.customerIconPerson, styles.customerRight]}>
          <Ionicons name="person" size={12} color="#000" />
        </View>
      </View>
    </View>
  );

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color }) => {
          let icon = null;

          switch (route.name) {
            case "Home":
              icon = <Ionicons name={focused ? "home" : "home-outline"} size={24} color={color} />;
              break;
            case "Products":
              icon = (
                <MaterialCommunityIcons
                  name={focused ? "truck-delivery" : "truck-delivery-outline"}
                  size={24}
                  color={color}
                />
              );
              break;
            case "Customers":
              icon = <CustomersIcon focused={focused} />;
              break;
            case "Orders":
              icon = <Ionicons name={focused ? "shield" : "shield-outline"} size={24} color={color} />;
              break;
            case "Menu":
              icon = <Ionicons name={focused ? "menu" : "menu-outline"} size={24} color={color} />;
              break;
          }

          const isMiddleTab = route.name === "Customers";
          const showLabel = !isMiddleTab || !focused;

          return (
            <View style={[
              styles.tabIconContainer,
              isMiddleTab && styles.middleTabContainer
            ]}>
              {icon}
              {showLabel && (
                <Text 
                  numberOfLines={1} 
                  style={[
                    styles.tabLabel,
                    { color },
                    isMiddleTab && styles.middleTabLabel
                  ]}
                >
                  {route.name}
                </Text>
              )}
            </View>
          );
        },
        tabBarActiveTintColor: '#FFFFFF',
        tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.7)',
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
      })}
    >
      <Tab.Screen name="Home" component={DashboardScreen} />
      <Tab.Screen name="Products" component={ProductsScreen} />
      <Tab.Screen 
        name="Customers" 
        component={CustomersScreen} 
        options={{
          tabBarItemStyle: styles.centerTabItem,
        }}
      />
      <Tab.Screen name="Orders" component={OrdersScreen} />
      <Tab.Screen name="Menu" component={ProfileScreen} />
    </Tab.Navigator>
  )
}

const styles = StyleSheet.create({
  tabBar: {
    height: TAB_BAR_HEIGHT,
    backgroundColor: '#45A19D',
    borderTopWidth: 0,
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 24 : 8, // Account for iOS home indicator
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    paddingHorizontal: 12,
    width: '100%',
  },
  middleTabContainer: {
    position: 'absolute',
    top: -20,
    alignItems: 'center',
    width: MIDDLE_BUTTON_SIZE,
  },
  tabLabel: {
    fontSize: 11,
    marginTop: 4,
    textAlign: 'center',
    width: '100%',
    lineHeight: 14,
  },
  middleTabLabel: {
    position: 'absolute',
    bottom: -24,
    width: 80, // Fixed width for middle tab label
    left: -14, // Center the label ((80 - 52) / 2)
  },
  customersIconContainer: {
    width: MIDDLE_BUTTON_SIZE,
    height: MIDDLE_BUTTON_SIZE,
    borderRadius: MIDDLE_BUTTON_SIZE / 2,
    backgroundColor: '#45A19D',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.7)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  customersIconContainerFocused: {
    borderColor: '#FFFFFF',
    shadowOpacity: 0.3,
    elevation: 6,
  },
  customersIconGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 24,
  },
  customerIconPerson: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  customerLeft: {
    backgroundColor: '#6D9FFF',
    zIndex: 1,
    left: 3,
  },
  customerCenter: {
    backgroundColor: '#FF7F7F',
    zIndex: 3,
  },
  customerRight: {
    backgroundColor: '#93E088',
    zIndex: 1,
    right: 3,
  },
  customerFront: {
    borderWidth: 1,
    borderColor: '#fff',
  },
  centerTabItem: {
    height: TAB_BAR_HEIGHT,
  },
});

export default SellerTabs
