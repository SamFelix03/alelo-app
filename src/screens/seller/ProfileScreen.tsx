"use client"

import { useState } from "react"
import { View, StyleSheet, Text, Image, TouchableOpacity, ScrollView, Switch, SafeAreaView } from "react-native"
import { useNavigation } from "@react-navigation/native"
import { theme, spacing, fontSize } from "../../theme"
import { Ionicons } from "@expo/vector-icons"

const SellerProfileScreen = () => {
  const navigation = useNavigation()
  const [isOpen, setIsOpen] = useState(true)
  const [notifications, setNotifications] = useState({
    orderAlerts: true,
    customerProximity: false,
    promotions: true,
  })

  const handleEditProfile = () => {
    // In a real app, this would navigate to an edit profile screen
    console.log("Edit profile")
  }

  const handleChangeNumber = () => {
    // In a real app, this would navigate to a change number screen
    console.log("Change number")
  }

  const toggleBusinessStatus = () => {
    setIsOpen(!isOpen)
  }

  const handleToggleNotification = (type) => {
    setNotifications({
      ...notifications,
      [type]: !notifications[type],
    })
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
              source={{ uri: "https://via.placeholder.com/100?text=Business" }}
              style={styles.profileImage}
              accessibilityLabel="Business profile picture"
            />

            <View>
              <Text style={styles.profileName}>Fresh Veggies</Text>
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

        <View style={styles.businessStatusContainer}>
          <View>
            <Text style={styles.businessStatusLabel}>Business Status</Text>
            <Text style={styles.businessStatusDescription}>
              {isOpen ? "You are visible to nearby customers" : "You are not visible to customers"}
            </Text>
          </View>

          <Switch
            value={isOpen}
            onValueChange={toggleBusinessStatus}
            trackColor={{ false: "#D1D1D1", true: "#E8F5E9" }}
            thumbColor={isOpen ? theme.colors.primary : "#F5F5F5"}
            ios_backgroundColor="#D1D1D1"
            style={styles.switch}
            accessibilityLabel="Toggle business status"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Business Hours</Text>

          <View style={styles.hoursContainer}>
            <View style={styles.hourRow}>
              <Text style={styles.dayLabel}>Monday - Friday</Text>
              <Text style={styles.timeText}>8:00 AM - 8:00 PM</Text>
            </View>

            <View style={styles.hourRow}>
              <Text style={styles.dayLabel}>Saturday</Text>
              <Text style={styles.timeText}>9:00 AM - 6:00 PM</Text>
            </View>

            <View style={styles.hourRow}>
              <Text style={styles.dayLabel}>Sunday</Text>
              <Text style={styles.timeText}>Closed</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.editHoursButton} accessibilityLabel="Edit hours button">
            <Text style={styles.editHoursText}>Edit Hours</Text>
          </TouchableOpacity>
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

          <View style={styles.securityItem}>
            <View>
              <Text style={styles.securityLabel}>Business License</Text>
              <Text style={styles.securityValue}>License #ABC123456</Text>
            </View>

            <TouchableOpacity style={styles.changeButton} accessibilityLabel="Update license button">
              <Text style={styles.changeButtonText}>Update</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>

          <View style={styles.notificationItem}>
            <View>
              <Text style={styles.notificationLabel}>Order Alerts</Text>
              <Text style={styles.notificationDescription}>Get notified when you receive a new order</Text>
            </View>

            <Switch
              value={notifications.orderAlerts}
              onValueChange={() => handleToggleNotification("orderAlerts")}
              trackColor={{ false: "#D1D1D1", true: "#E8F5E9" }}
              thumbColor={notifications.orderAlerts ? theme.colors.primary : "#F5F5F5"}
              accessibilityLabel="Toggle order alerts"
            />
          </View>

          <View style={styles.notificationItem}>
            <View>
              <Text style={styles.notificationLabel}>Customer Proximity</Text>
              <Text style={styles.notificationDescription}>Get notified when customers are nearby</Text>
            </View>

            <Switch
              value={notifications.customerProximity}
              onValueChange={() => handleToggleNotification("customerProximity")}
              trackColor={{ false: "#D1D1D1", true: "#E8F5E9" }}
              thumbColor={notifications.customerProximity ? theme.colors.primary : "#F5F5F5"}
              accessibilityLabel="Toggle customer proximity alerts"
            />
          </View>

          <View style={styles.notificationItem}>
            <View>
              <Text style={styles.notificationLabel}>Promotions</Text>
              <Text style={styles.notificationDescription}>Receive updates about app features and promotions</Text>
            </View>

            <Switch
              value={notifications.promotions}
              onValueChange={() => handleToggleNotification("promotions")}
              trackColor={{ false: "#D1D1D1", true: "#E8F5E9" }}
              thumbColor={notifications.promotions ? theme.colors.primary : "#F5F5F5"}
              accessibilityLabel="Toggle promotions"
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
  businessStatusContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  businessStatusLabel: {
    fontSize: fontSize.lg,
    fontWeight: "bold",
    marginBottom: spacing.xs,
  },
  businessStatusDescription: {
    fontSize: fontSize.sm,
    color: theme.colors.placeholder,
    maxWidth: 250,
  },
  switch: {
    transform: [{ scaleX: 1.2 }, { scaleY: 1.2 }],
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
  hoursContainer: {
    marginBottom: spacing.md,
  },
  hourRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  dayLabel: {
    fontSize: fontSize.md,
    fontWeight: "bold",
  },
  timeText: {
    fontSize: fontSize.md,
    color: theme.colors.text,
  },
  editHoursButton: {
    backgroundColor: "#F5F5F5",
    padding: spacing.sm,
    borderRadius: 8,
    alignItems: "center",
  },
  editHoursText: {
    color: theme.colors.primary,
    fontWeight: "bold",
  },
  securityItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
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

export default SellerProfileScreen
