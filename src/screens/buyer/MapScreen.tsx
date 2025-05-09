"use client"

import { useState, useRef } from "react"
import { View, StyleSheet, Text, TouchableOpacity, Animated, Dimensions, Image, Platform } from "react-native"
import { useNavigation } from "@react-navigation/native"
import { theme, spacing, fontSize } from "../../theme"
import { Ionicons } from "@expo/vector-icons"
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps"
import Slider from "@react-native-community/slider"

// Mock data for sellers
const MOCK_SELLERS = [
  {
    id: "1",
    name: "Fresh Veggies",
    logo: "https://via.placeholder.com/50?text=FV",
    latitude: 37.78825,
    longitude: -122.4324,
    distance: "0.5 km",
    rating: 4.8,
    isOpen: true,
    lastActive: new Date(),
  },
  {
    id: "2",
    name: "Fruit Paradise",
    logo: "https://via.placeholder.com/50?text=FP",
    latitude: 37.78925,
    longitude: -122.4344,
    distance: "0.8 km",
    rating: 4.5,
    isOpen: true,
    lastActive: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
  },
  {
    id: "3",
    name: "Bakery on Wheels",
    logo: "https://via.placeholder.com/50?text=BW",
    latitude: 37.78725,
    longitude: -122.4314,
    distance: "1.2 km",
    rating: 4.2,
    isOpen: false,
    lastActive: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
  },
]

const { width, height } = Dimensions.get("window")
const ASPECT_RATIO = width / height
const LATITUDE_DELTA = 0.0922
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO

const MapScreen = () => {
  const navigation = useNavigation()
  const mapRef = useRef(null)
  const [region, setRegion] = useState({
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: LATITUDE_DELTA,
    longitudeDelta: LONGITUDE_DELTA,
  })
  const [selectedSeller, setSelectedSeller] = useState(null)
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    showOpenOnly: false,
    showLikedOnly: false,
    radius: 5, // km
  })

  const bottomSheetHeight = useRef(new Animated.Value(0)).current
  const filtersHeight = useRef(new Animated.Value(0)).current

  const toggleFilters = () => {
    Animated.timing(filtersHeight, {
      toValue: showFilters ? 0 : 200,
      duration: 300,
      useNativeDriver: false,
    }).start()

    setShowFilters(!showFilters)
  }

  const handleMarkerPress = (seller) => {
    setSelectedSeller(seller)

    Animated.timing(bottomSheetHeight, {
      toValue: 120,
      duration: 300,
      useNativeDriver: false,
    }).start()

    mapRef.current?.animateToRegion({
      latitude: seller.latitude,
      longitude: seller.longitude,
      latitudeDelta: LATITUDE_DELTA / 2,
      longitudeDelta: LONGITUDE_DELTA / 2,
    })
  }

  const closeBottomSheet = () => {
    Animated.timing(bottomSheetHeight, {
      toValue: 0,
      duration: 300,
      useNativeDriver: false,
    }).start(() => {
      setSelectedSeller(null)
    })
  }

  const navigateToSellerProfile = () => {
    if (selectedSeller) {
      navigation.navigate("SellerProfile", { seller: selectedSeller })
    }
  }

  const handleRefresh = () => {
    // In a real app, this would refresh the seller data
    // For this example, we'll just show a console log
    console.log("Refreshing seller data...")
  }

  const isSellerActive = (lastActive) => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
    return lastActive > fiveMinutesAgo
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={region}
        onRegionChangeComplete={setRegion}
        showsUserLocation
        showsMyLocationButton
      >
        {MOCK_SELLERS.map((seller) => (
          <Marker
            key={seller.id}
            coordinate={{
              latitude: seller.latitude,
              longitude: seller.longitude,
            }}
            onPress={() => handleMarkerPress(seller)}
          >
            <View
              style={[
                styles.markerContainer,
                !seller.isOpen && styles.markerContainerClosed,
                isSellerActive(seller.lastActive) && styles.markerContainerActive,
              ]}
            >
              <Image
                source={{ uri: seller.logo }}
                style={[styles.markerImage, !seller.isOpen && styles.markerImageClosed]}
                accessibilityLabel={`${seller.name} marker`}
              />
            </View>
          </Marker>
        ))}
      </MapView>

      <View style={styles.headerContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={theme.colors.placeholder} />
          <Text style={styles.searchPlaceholder}>Search for vendors or products</Text>
        </View>

        <TouchableOpacity style={styles.filterButton} onPress={toggleFilters} accessibilityLabel="Filter button">
          <Ionicons name="options" size={24} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      <Animated.View style={[styles.filtersContainer, { height: filtersHeight }]}>
        <Text style={styles.filtersTitle}>Filters</Text>

        <View style={styles.filterRow}>
          <Text style={styles.filterLabel}>Show Open Sellers Only</Text>
          <TouchableOpacity
            style={[styles.toggleButton, filters.showOpenOnly && styles.toggleButtonActive]}
            onPress={() => setFilters({ ...filters, showOpenOnly: !filters.showOpenOnly })}
            accessibilityLabel="Toggle show open sellers only"
          >
            <View style={[styles.toggleCircle, filters.showOpenOnly && styles.toggleCircleActive]} />
          </TouchableOpacity>
        </View>

        <View style={styles.filterRow}>
          <Text style={styles.filterLabel}>Show Liked Sellers Only</Text>
          <TouchableOpacity
            style={[styles.toggleButton, filters.showLikedOnly && styles.toggleButtonActive]}
            onPress={() => setFilters({ ...filters, showLikedOnly: !filters.showLikedOnly })}
            accessibilityLabel="Toggle show liked sellers only"
          >
            <View style={[styles.toggleCircle, filters.showLikedOnly && styles.toggleCircleActive]} />
          </TouchableOpacity>
        </View>

        <Text style={styles.filterLabel}>Search Radius: {filters.radius} km</Text>
        <Slider
          style={styles.radiusSlider}
          minimumValue={1}
          maximumValue={10}
          step={1}
          value={filters.radius}
          onValueChange={(value) => setFilters({ ...filters, radius: value })}
          minimumTrackTintColor={theme.colors.primary}
          maximumTrackTintColor={theme.colors.disabled}
          thumbTintColor={theme.colors.primary}
          accessibilityLabel="Radius slider"
        />
      </Animated.View>

      <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh} accessibilityLabel="Refresh button">
        <Ionicons name="refresh" size={24} color="#FFFFFF" />
      </TouchableOpacity>

      <Animated.View style={[styles.bottomSheet, { height: bottomSheetHeight }]}>
        {selectedSeller && (
          <View style={styles.sellerPreview}>
            <TouchableOpacity style={styles.closeButton} onPress={closeBottomSheet} accessibilityLabel="Close button">
              <Ionicons name="close" size={20} color={theme.colors.text} />
            </TouchableOpacity>

            <View style={styles.sellerInfo}>
              <Image
                source={{ uri: selectedSeller.logo }}
                style={styles.sellerLogo}
                accessibilityLabel={`${selectedSeller.name} logo`}
              />

              <View style={styles.sellerDetails}>
                <Text style={styles.sellerName}>{selectedSeller.name}</Text>
                <View style={styles.sellerMetaRow}>
                  <Text style={styles.sellerDistance}>{selectedSeller.distance}</Text>
                  {selectedSeller.rating && (
                    <View style={styles.ratingContainer}>
                      <Ionicons name="star" size={14} color="#FFD700" />
                      <Text style={styles.ratingText}>{selectedSeller.rating}</Text>
                    </View>
                  )}
                </View>
                <View style={[styles.statusBadge, selectedSeller.isOpen ? styles.openBadge : styles.closedBadge]}>
                  <Text style={[styles.statusText, selectedSeller.isOpen ? styles.openText : styles.closedText]}>
                    {selectedSeller.isOpen ? "Open" : "Closed"}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.viewProfileButton}
                onPress={navigateToSellerProfile}
                accessibilityLabel="View profile button"
              >
                <Text style={styles.viewProfileText}>View Profile</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  headerContainer: {
    position: "absolute",
    top: Platform.OS === "ios" ? 50 : 30,
    left: 0,
    right: 0,
    flexDirection: "row",
    paddingHorizontal: spacing.md,
    alignItems: "center",
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: spacing.md,
    marginRight: spacing.sm,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchPlaceholder: {
    marginLeft: spacing.sm,
    color: theme.colors.placeholder,
    fontSize: fontSize.md,
  },
  filterButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  filtersContainer: {
    position: "absolute",
    top: Platform.OS === "ios" ? 100 : 80,
    left: spacing.md,
    right: spacing.md,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: "hidden",
  },
  filtersTitle: {
    fontSize: fontSize.lg,
    fontWeight: "bold",
    marginBottom: spacing.md,
  },
  filterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  filterLabel: {
    fontSize: fontSize.md,
  },
  toggleButton: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: theme.colors.disabled,
    padding: 2,
    justifyContent: "center",
  },
  toggleButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  toggleCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#FFFFFF",
  },
  toggleCircleActive: {
    alignSelf: "flex-end",
  },
  radiusSlider: {
    width: "100%",
    height: 40,
  },
  refreshButton: {
    position: "absolute",
    bottom: 150,
    right: spacing.md,
    backgroundColor: theme.colors.primary,
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  markerContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: theme.colors.primary,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  markerContainerClosed: {
    borderColor: theme.colors.disabled,
  },
  markerContainerActive: {
    borderColor: theme.colors.primary,
    shadowColor: theme.colors.primary,
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  markerImage: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  markerImageClosed: {
    opacity: 0.5,
  },
  bottomSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  closeButton: {
    position: "absolute",
    top: spacing.sm,
    right: spacing.sm,
    zIndex: 1,
  },
  sellerPreview: {
    flex: 1,
  },
  sellerInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  sellerLogo: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: spacing.md,
  },
  sellerDetails: {
    flex: 1,
  },
  sellerName: {
    fontSize: fontSize.lg,
    fontWeight: "bold",
    marginBottom: spacing.xs,
  },
  sellerMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  sellerDistance: {
    fontSize: fontSize.sm,
    color: theme.colors.placeholder,
    marginRight: spacing.md,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  ratingText: {
    fontSize: fontSize.sm,
    marginLeft: 2,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: "flex-start",
  },
  openBadge: {
    backgroundColor: "#E8F5E9",
  },
  closedBadge: {
    backgroundColor: "#FFEBEE",
  },
  statusText: {
    fontSize: fontSize.xs,
    fontWeight: "bold",
  },
  openText: {
    color: theme.colors.primary,
  },
  closedText: {
    color: theme.colors.error,
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
    fontSize: fontSize.sm,
  },
})

export default MapScreen
