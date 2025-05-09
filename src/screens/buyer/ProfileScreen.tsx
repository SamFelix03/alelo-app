"use client"

import { useState } from "react"
import { View, StyleSheet, Text, Image, TouchableOpacity, ScrollView, Switch, SafeAreaView } from "react-native"
import { useNavigation } from "@react-navigation/native"
import { theme, spacing, fontSize } from "../../theme"
import { Ionicons } from "@expo/vector-icons"

// Mock data for liked sellers
const MOCK_LIKED_SELLERS = [
  {
    id: "1",
    name: "Fresh Veggies",
    logo: "https://via.placeholder.com/50?text=FV",
    distance: "0.5 km",
  },
  {
    id: "2",
    name: "Bakery on Wheels",
    logo: "https://via.placeholder.com/50?text=BW",
    distance: "1.2 km",
  },
  {
    id: "3",
    name: "Spice Market",
    logo: "https://via.placeholder.com/50?text=SM",
    distance: "2.0 km",
  },
]

const ProfileScreen = () => {
  const navigation = useNavigation()
  const [notifications, setNotifications] = useState({
    orderUpdates: true,
    promotions: false,
    sellerAlerts: true,
  })

  const handleEditProfile = () => {
    // In a real app, this would navigate to an edit profile screen
    console.log("Edit profile")
  }

  const handleChangeNumber = () => {
    // In a real app, this would navigate to a change number screen
    console.log("Change number")
  }

  const handleToggleNotification = (type) => {
    setNotifications({
      ...notifications,
      [type]: !notifications[type],
    })
  }

  const navigateToSellerProfile = (seller) => {
    navigation.navigate("SellerProfile", { seller })
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
        </View>

        <View style={styles.profileSection}>
          <View style={styles.profileInfo}>
            <Image
              source={{ uri: "https://via.placeholder.com/100?text=User" }}
              style={styles.profileImage}
              accessibilityLabel="Profile picture"
            />

            <View>
              <Text style={styles.profileName}>John Doe</Text>
              <Text style={styles.profileLocation}>San Francisco, CA</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.editButton}
            onPress={handleEditProfile}
            accessibilityLabel="Edit profile button"
          >
            <Ionicons name="pencil" size={16} color="#FFFFFF" />
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Liked Sellers</Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.likedSellersContainer}
          >
            {MOCK_LIKED_SELLERS.map((seller) => (
              <TouchableOpacity
                key={seller.id}
                style={styles.likedSellerCard}
                onPress={() => navigateToSellerProfile(seller)}
                accessibilityLabel={`${seller.name} card`}
              >
                <Image
                  source={{ uri: seller.logo }}
                  style={styles.likedSellerLogo}
                  accessibilityLabel={`${seller.name} logo`}
                />
                <Text style={styles.likedSellerName}>{seller.name}</Text>
                <Text style={styles.likedSellerDistance}>{seller.distance}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security</Text>

          <View style={styles.securityItem}>
            <View>
              <Text style={styles.securityLabel}>Phone Number</Text>
              <Text style={styles.securityValue}>+1 *****1234</Text>
            </View>

            <TouchableOpacity
              style={styles.changeButton}
              onPress={handleChangeNumber}
              accessibilityLabel="Change number button"
            >
              <Text style={styles.changeButtonText}>Change</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>

          <View style={styles.notificationItem}>
            <View>
              <Text style={styles.notificationLabel}>Order Updates</Text>
              <Text style={styles.notificationDescription}>Get notified about your order status</Text>
            </View>

            <Switch
              value={notifications.orderUpdates}
              onValueChange={() => handleToggleNotification("orderUpdates")}
              trackColor={{ false: "#D1D1D1", true: "#E8F5E9" }}
              thumbColor={notifications.orderUpdates ? theme.colors.primary : "#F5F5F5"}
              accessibilityLabel="Toggle order updates"
            />
          </View>

          <View style={styles.notificationItem}>
            <View>
              <Text style={styles.notificationLabel}>Promotions</Text>
              <Text style={styles.notificationDescription}>Receive offers and discounts from sellers</Text>
            </View>

            <Switch
              value={notifications.promotions}
              onValueChange={() => handleToggleNotification("promotions")}
              trackColor={{ false: "#D1D1D1", true: "#E8F5E9" }}
              thumbColor={notifications.promotions ? theme.colors.primary : "#F5F5F5"}
              accessibilityLabel="Toggle promotions"
            />
          </View>

          <View style={styles.notificationItem}>
            <View>
              <Text style={styles.notificationLabel}>Seller Availability Alerts</Text>
              <Text style={styles.notificationDescription}>Get notified when your favorite sellers are nearby</Text>
            </View>

            <Switch
              value={notifications.sellerAlerts}
              onValueChange={() => handleToggleNotification("sellerAlerts")}
              trackColor={{ false: "#D1D1D1", true: "#E8F5E9" }}
              thumbColor={notifications.sellerAlerts ? theme.colors.primary : "#F5F5F5"}
              accessibilityLabel="Toggle seller alerts"
            />
          </View>
        </View>

        <TouchableOpacity style={styles.logoutButton} accessibilityLabel="Logout button">
          <Ionicons name="log-out" size={20} color={theme.colors.error} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>Version 1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: "bold",
  },
  profileSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  profileInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: spacing.md,
  },
  profileName: {
    fontSize: fontSize.lg,
    fontWeight: "bold",
    marginBottom: spacing.xs,
  },
  profileLocation: {
    fontSize: fontSize.sm,
    color: theme.colors.placeholder,
  },
  editButton: {
    backgroundColor: theme.colors.primary,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
  },
  editButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    marginLeft: 4,
  },
  section: {
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: "bold",
    marginBottom: spacing.md,
  },
  likedSellersContainer: {
    paddingBottom: spacing.sm,
  },
  likedSellerCard: {
    alignItems: "center",
    marginRight: spacing.lg,
    width: 80,
  },
  likedSellerLogo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: spacing.sm,
  },
  likedSellerName: {
    fontSize: fontSize.sm,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 2,
  },
  likedSellerDistance: {
    fontSize: fontSize.xs,
    color: theme.colors.placeholder,
  },
  securityItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  securityLabel: {
    fontSize: fontSize.md,
    fontWeight: "bold",
    marginBottom: 2,
  },
  securityValue: {
    fontSize: fontSize.sm,
    color: theme.colors.placeholder,
  },
  changeButton: {
    backgroundColor: "#F5F5F5",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
  },
  changeButtonText: {
    color: theme.colors.primary,
    fontWeight: "bold",
  },
  notificationItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  notificationLabel: {
    fontSize: fontSize.md,
    fontWeight: "bold",
    marginBottom: 2,
  },
  notificationDescription: {
    fontSize: fontSize.sm,
    color: theme.colors.placeholder,
    maxWidth: 250,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  logoutText: {
    color: theme.colors.error,
    fontWeight: "bold",
    fontSize: fontSize.md,
    marginLeft: spacing.sm,
  },
  versionContainer: {
    padding: spacing.lg,
    alignItems: "center",
  },
  versionText: {
    fontSize: fontSize.sm,
    color: theme.colors.placeholder,
  },
})

export default ProfileScreen
