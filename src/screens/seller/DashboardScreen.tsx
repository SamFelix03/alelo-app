"use client"

import { useState } from "react"
import { View, StyleSheet, Text, TouchableOpacity, Switch, Image, ScrollView, SafeAreaView } from "react-native"
import { useNavigation } from "@react-navigation/native"
import { theme, spacing, fontSize } from "../../theme"
import { Ionicons } from "@expo/vector-icons"
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps"

// Mock data for buyers
const MOCK_BUYERS = [
  {
    id: "1",
    name: "John Doe",
    avatar: "https://via.placeholder.com/50?text=JD",
    latitude: 37.78825,
    longitude: -122.4324,
    distance: "0.5 km",
    lastOrder: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
  },
  {
    id: "2",
    name: "Jane Smith",
    avatar: "https://via.placeholder.com/50?text=JS",
    latitude: 37.78925,
    longitude: -122.4344,
    distance: "0.8 km",
    lastOrder: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
  },
  {
    id: "3",
    name: "Bob Johnson",
    avatar: "https://via.placeholder.com/50?text=BJ",
    latitude: 37.78725,
    longitude: -122.4314,
    distance: "1.2 km",
    lastOrder: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
  },
]

// Mock data for stats
const MOCK_STATS = {
  todayOrders: 5,
  pendingOrders: 2,
  completedOrders: 3,
  revenue: "$75.50",
  avgPrepTime: "12 mins",
}

const DashboardScreen = () => {
  const navigation = useNavigation()
  const [isOpen, setIsOpen] = useState(false)
  const [selectedBuyer, setSelectedBuyer] = useState(null)

  const toggleBusinessStatus = () => {
    setIsOpen(!isOpen)
  }

  const handleBuyerMarkerPress = (buyer) => {
    setSelectedBuyer(buyer)
  }

  const formatDate = (date) => {
    const now = new Date()
    const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24))

    if (diffInDays === 0) {
      return "Today"
    } else if (diffInDays === 1) {
      return "Yesterday"
    } else {
      return `${diffInDays} days ago`
    }
  }

  const navigateToBuyerProfile = () => {
    if (selectedBuyer) {
      // In a real app, this would navigate to a buyer profile screen
      console.log(`Navigate to ${selectedBuyer.name}'s profile`)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.title}>Dashboard</Text>
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

        {isOpen && (
          <View style={styles.locationSharingContainer}>
            <View style={styles.locationIconContainer}>
              <Ionicons name="globe" size={24} color={theme.colors.primary} />
            </View>

            <View style={styles.locationTextContainer}>
              <Text style={styles.locationSharingText}>Location sharing is active</Text>
              <Text style={styles.locationSharingDescription}>
                Your real-time location is being shared with nearby customers
              </Text>
            </View>
          </View>
        )}

        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>Today's Stats</Text>

          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{MOCK_STATS.todayOrders}</Text>
              <Text style={styles.statLabel}>Orders</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statValue}>{MOCK_STATS.pendingOrders}</Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statValue}>{MOCK_STATS.completedOrders}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statValue}>{MOCK_STATS.revenue}</Text>
              <Text style={styles.statLabel}>Revenue</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statValue}>{MOCK_STATS.avgPrepTime}</Text>
              <Text style={styles.statLabel}>Avg. Prep Time</Text>
            </View>
          </View>
        </View>

        <View style={styles.mapContainer}>
          <Text style={styles.sectionTitle}>Nearby Customers</Text>

          <View style={styles.mapWrapper}>
            <MapView
              style={styles.map}
              provider={PROVIDER_GOOGLE}
              initialRegion={{
                latitude: 37.78825,
                longitude: -122.4324,
                latitudeDelta: 0.0922,
                longitudeDelta: 0.0421,
              }}
              showsUserLocation
            >
              {/* Seller's position (you) */}
              <Marker
                coordinate={{
                  latitude: 37.78825,
                  longitude: -122.4324,
                }}
              >
                <View style={styles.sellerMarker}>
                  <Ionicons name="business" size={20} color="#FFFFFF" />
                </View>
              </Marker>

              {/* Buyers' positions */}
              {MOCK_BUYERS.map((buyer) => (
                <Marker
                  key={buyer.id}
                  coordinate={{
                    latitude: buyer.latitude,
                    longitude: buyer.longitude,
                  }}
                  onPress={() => handleBuyerMarkerPress(buyer)}
                >
                  <View style={styles.buyerMarker}>
                    <Ionicons name="person" size={16} color="#FFFFFF" />
                  </View>
                </Marker>
              ))}
            </MapView>

            {selectedBuyer && (
              <View style={styles.buyerPreview}>
                <Image
                  source={{ uri: selectedBuyer.avatar }}
                  style={styles.buyerAvatar}
                  accessibilityLabel={`${selectedBuyer.name} avatar`}
                />

                <View style={styles.buyerInfo}>
                  <Text style={styles.buyerName}>{selectedBuyer.name}</Text>
                  <View style={styles.buyerMetaRow}>
                    <Text style={styles.buyerDistance}>{selectedBuyer.distance}</Text>
                    <Text style={styles.buyerLastOrder}>Last order: {formatDate(selectedBuyer.lastOrder)}</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.viewProfileButton}
                  onPress={navigateToBuyerProfile}
                  accessibilityLabel="View profile button"
                >
                  <Text style={styles.viewProfileText}>View Profile</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
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
  locationSharingContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F5E9",
    padding: spacing.md,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.md,
    borderRadius: 8,
  },
  locationIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
  },
  locationTextContainer: {
    flex: 1,
  },
  locationSharingText: {
    fontSize: fontSize.md,
    fontWeight: "bold",
    color: theme.colors.primary,
    marginBottom: 2,
  },
  locationSharingDescription: {
    fontSize: fontSize.xs,
    color: theme.colors.placeholder,
  },
  statsContainer: {
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: "bold",
    marginBottom: spacing.md,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  statCard: {
    width: "30%",
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.md,
    alignItems: "center",
  },
  statValue: {
    fontSize: fontSize.xl,
    fontWeight: "bold",
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontSize: fontSize.xs,
    color: theme.colors.placeholder,
  },
  mapContainer: {
    padding: spacing.lg,
  },
  mapWrapper: {
    borderRadius: 12,
    overflow: "hidden",
    height: 300,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  sellerMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  buyerMarker: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: theme.colors.secondary,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  buyerPreview: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  buyerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: spacing.md,
  },
  buyerInfo: {
    flex: 1,
  },
  buyerName: {
    fontSize: fontSize.md,
    fontWeight: "bold",
    marginBottom: 2,
  },
  buyerMetaRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  buyerDistance: {
    fontSize: fontSize.xs,
    color: theme.colors.placeholder,
    marginRight: spacing.md,
  },
  buyerLastOrder: {
    fontSize: fontSize.xs,
    color: theme.colors.placeholder,
  },
  viewProfileButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
  },
  viewProfileText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: fontSize.xs,
  },
})

export default DashboardScreen
