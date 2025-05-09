"use client"

import { useState } from "react"
import { View, StyleSheet, Text, TouchableOpacity, FlatList, SafeAreaView } from "react-native"
import { useNavigation } from "@react-navigation/native"
import { theme, spacing, fontSize } from "../../theme"
import { Ionicons } from "@expo/vector-icons"

// Mock data for notifications
const MOCK_NOTIFICATIONS = [
  {
    id: "1",
    type: "order",
    title: "Order Accepted",
    message: "Fresh Veggies has accepted your order #1234",
    timestamp: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
    read: false,
  },
  {
    id: "2",
    type: "order",
    title: "Order Ready",
    message: "Your order from Fruit Paradise is ready for pickup",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    read: false,
  },
  {
    id: "3",
    type: "seller",
    title: "Seller Nearby",
    message: "Bakery on Wheels is now 0.5 km away from you",
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
    read: true,
  },
  {
    id: "4",
    type: "promo",
    title: "Weekend Special",
    message: "Get 10% off on all orders this weekend!",
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    read: true,
  },
  {
    id: "5",
    type: "order",
    title: "Order Delivered",
    message: "Your order from Dairy Delights has been delivered",
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    read: true,
  },
]

const NotificationsScreen = () => {
  const navigation = useNavigation()
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS)
  const [activeTab, setActiveTab] = useState("all") // 'all', 'unread'

  const formatTime = (date) => {
    const now = new Date()
    const diffInMinutes = Math.floor((now - date) / (1000 * 60))
    const diffInHours = Math.floor(diffInMinutes / 60)
    const diffInDays = Math.floor(diffInHours / 24)

    if (diffInMinutes < 60) {
      return `${diffInMinutes} min ago`
    } else if (diffInHours < 24) {
      return `${diffInHours} hr ago`
    } else {
      return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`
    }
  }

  const getIconForType = (type) => {
    switch (type) {
      case "order":
        return <Ionicons name="receipt" size={24} color="#FFFFFF" />
      case "seller":
        return <Ionicons name="location" size={24} color="#FFFFFF" />
      case "promo":
        return <Ionicons name="gift" size={24} color="#FFFFFF" />
      default:
        return <Ionicons name="notifications" size={24} color="#FFFFFF" />
    }
  }

  const getColorForType = (type) => {
    switch (type) {
      case "order":
        return theme.colors.primary
      case "seller":
        return theme.colors.secondary
      case "promo":
        return "#FFD700" // Gold color for promotions
      default:
        return theme.colors.placeholder
    }
  }

  const handleMarkAsRead = (id) => {
    const updatedNotifications = notifications.map((notification) =>
      notification.id === id ? { ...notification, read: true } : notification,
    )
    setNotifications(updatedNotifications)
  }

  const handleMarkAllAsRead = () => {
    const updatedNotifications = notifications.map((notification) => ({ ...notification, read: true }))
    setNotifications(updatedNotifications)
  }

  const handleNotificationPress = (notification) => {
    // Mark as read
    handleMarkAsRead(notification.id)

    // Navigate based on notification type
    if (notification.type === "order") {
      navigation.navigate("Orders")
    } else if (notification.type === "seller") {
      navigation.navigate("Map")
    }
    // For promos, we just mark as read without navigation
  }

  const filteredNotifications = activeTab === "all" ? notifications : notifications.filter((item) => !item.read)

  const renderNotificationItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.notificationItem, !item.read && styles.unreadNotification]}
      onPress={() => handleNotificationPress(item)}
      accessibilityLabel={`${item.title} notification`}
    >
      <View style={[styles.iconContainer, { backgroundColor: getColorForType(item.type) }]}>
        {getIconForType(item.type)}
      </View>

      <View style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <Text style={styles.notificationTitle}>{item.title}</Text>
          <Text style={styles.notificationTime}>{formatTime(item.timestamp)}</Text>
        </View>
        <Text style={styles.notificationMessage}>{item.message}</Text>
      </View>

      {!item.read && <View style={styles.unreadIndicator} />}
    </TouchableOpacity>
  )

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="notifications-off" size={50} color={theme.colors.disabled} />
      <Text style={styles.emptyText}>No notifications</Text>
      <Text style={styles.emptySubtext}>
        {activeTab === "unread" ? "You've read all your notifications" : "You don't have any notifications yet"}
      </Text>
    </View>
  )

  const unreadCount = notifications.filter((item) => !item.read).length

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Notifications</Text>

        {unreadCount > 0 && (
          <TouchableOpacity
            style={styles.markAllReadButton}
            onPress={handleMarkAllAsRead}
            accessibilityLabel="Mark all as read button"
          >
            <Text style={styles.markAllReadText}>Mark all as read</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "all" && styles.activeTab]}
          onPress={() => setActiveTab("all")}
          accessibilityLabel="All notifications tab"
        >
          <Text style={[styles.tabText, activeTab === "all" && styles.activeTabText]}>All</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "unread" && styles.activeTab]}
          onPress={() => setActiveTab("unread")}
          accessibilityLabel="Unread notifications tab"
        >
          <Text style={[styles.tabText, activeTab === "unread" && styles.activeTabText]}>
            Unread {unreadCount > 0 && `(${unreadCount})`}
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredNotifications}
        renderItem={renderNotificationItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.notificationsList}
        ListEmptyComponent={renderEmptyState}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: "bold",
  },
  markAllReadButton: {
    padding: spacing.sm,
  },
  markAllReadText: {
    color: theme.colors.primary,
    fontWeight: "bold",
  },
  tabsContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.primary,
  },
  tabText: {
    fontSize: fontSize.md,
    color: theme.colors.placeholder,
  },
  activeTabText: {
    color: theme.colors.primary,
    fontWeight: "bold",
  },
  notificationsList: {
    padding: spacing.md,
  },
  notificationItem: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  unreadNotification: {
    backgroundColor: "#F9FFF9",
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  notificationTitle: {
    fontSize: fontSize.md,
    fontWeight: "bold",
  },
  notificationTime: {
    fontSize: fontSize.xs,
    color: theme.colors.placeholder,
  },
  notificationMessage: {
    fontSize: fontSize.sm,
    color: theme.colors.text,
  },
  unreadIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.primary,
    alignSelf: "flex-start",
    marginTop: 5,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
    marginTop: spacing.xxl,
  },
  emptyText: {
    fontSize: fontSize.lg,
    fontWeight: "bold",
    marginTop: spacing.md,
  },
  emptySubtext: {
    fontSize: fontSize.md,
    color: theme.colors.placeholder,
    marginTop: spacing.xs,
    textAlign: "center",
  },
})

export default NotificationsScreen
