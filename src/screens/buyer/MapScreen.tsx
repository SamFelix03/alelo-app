"use client"

import { useState, useRef, useEffect } from "react"
import { View, StyleSheet, Text, TouchableOpacity, Animated, Dimensions, Image, Platform, Alert } from "react-native"
import { useNavigation } from "@react-navigation/native"
import { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { theme, spacing, fontSize } from "../../theme"
import { Ionicons } from "@expo/vector-icons"
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps"
import Slider from "@react-native-community/slider"
import { useLocation } from "../../hooks/useLocation"
import { supabase } from "../../lib/supabase"
import { calculateDistance, formatDistance } from "../../lib/locationService"

// Type definitions for the navigation and data
type RootStackParamList = {
  SearchScreen: undefined;
  SellerProfile: { seller: Seller };
};

type MapScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Types for the data models
type Seller = {
  seller_id: string;
  name: string;
  logo_url: string;
  latitude: number;
  longitude: number;
  distance: string;
  is_open: boolean;
  updated_at: string;
  address?: string;
};

const { width, height } = Dimensions.get("window")
const ASPECT_RATIO = width / height
const LATITUDE_DELTA = 0.0922
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO

const MapScreen = () => {
  const navigation = useNavigation<MapScreenNavigationProp>()
  const mapRef = useRef<MapView | null>(null)
  const { currentLocation, refreshLocation } = useLocation()
  
  const [region, setRegion] = useState({
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: LATITUDE_DELTA,
    longitudeDelta: LONGITUDE_DELTA,
  })
  const [sellers, setSellers] = useState<Seller[]>([])
  const [selectedSeller, setSelectedSeller] = useState<Seller | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    showOpenOnly: true,
    showLikedOnly: false,
    radius: 5, // km
  })
  const [isLoading, setIsLoading] = useState(false)

  const bottomSheetHeight = useRef(new Animated.Value(0)).current
  const filtersHeight = useRef(new Animated.Value(0)).current

  // Fetch nearby sellers from database
  const fetchNearbySellers = async () => {
    if (!currentLocation) {
      console.log('No current location available')
      return
    }

    setIsLoading(true)
    try {
      // Use the PostGIS function to find nearby sellers
      const { data, error } = await supabase
        .rpc('find_nearby_sellers', {
          buyer_lat: currentLocation.latitude,
          buyer_lng: currentLocation.longitude,
          radius_km: filters.radius
        })

      if (error) {
        console.error('Error fetching nearby sellers:', error)
        Alert.alert('Error', 'Failed to fetch nearby sellers')
        return
      }

      if (data) {
        // Transform the data and calculate distances
        const transformedSellers: Seller[] = data.map((seller: any) => {
          const distance = calculateDistance(
            currentLocation,
            { latitude: seller.latitude, longitude: seller.longitude }
          )
          
          return {
            seller_id: seller.seller_id,
            name: seller.name,
            logo_url: seller.logo_url || "https://via.placeholder.com/50?text=" + seller.name.charAt(0),
            latitude: seller.latitude,
            longitude: seller.longitude,
            distance: formatDistance(distance),
            is_open: seller.is_open,
            updated_at: seller.updated_at,
            address: seller.address,
          }
        })

        // Apply filters
        let filteredSellers = transformedSellers
        if (filters.showOpenOnly) {
          filteredSellers = filteredSellers.filter(seller => seller.is_open)
        }

        setSellers(filteredSellers)
      }
    } catch (error) {
      console.error('Error in fetchNearbySellers:', error)
      Alert.alert('Error', 'Failed to fetch nearby sellers')
    } finally {
      setIsLoading(false)
    }
  }

  // Set up real-time subscription for seller updates
  useEffect(() => {
    if (!currentLocation) return

    // Initial fetch
    fetchNearbySellers()

    // Set up real-time subscription
    const subscription = supabase
      .channel('seller-location-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sellers'
        },
        (payload) => {
          console.log('Seller update received:', payload)
          // Refetch sellers when any seller data changes
          fetchNearbySellers()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [currentLocation, filters.radius, filters.showOpenOnly])

  // Update region when current location changes
  useEffect(() => {
    if (currentLocation) {
      const newRegion = {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA,
      }
      setRegion(newRegion)
      mapRef.current?.animateToRegion(newRegion, 1000)
    }
  }, [currentLocation])

  const navigateToSearch = () => {
    navigation.navigate("SearchScreen");
  };

  const toggleFilters = () => {
    Animated.timing(filtersHeight, {
      toValue: showFilters ? 0 : 200,
      duration: 300,
      useNativeDriver: false,
    }).start()

    setShowFilters(!showFilters)
  }

  const handleMarkerPress = (seller: Seller) => {
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

  const handleRefresh = async () => {
    await refreshLocation()
    await fetchNearbySellers()
  }

  const isSellerActive = (updatedAt: string): boolean => {
    const lastUpdate = new Date(updatedAt)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
    return lastUpdate > fiveMinutesAgo
  }

  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters)
    // Refetch with new filters
    setTimeout(() => {
      fetchNearbySellers()
    }, 100)
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        region={region}
        onRegionChangeComplete={setRegion}
        showsUserLocation
        showsMyLocationButton
      >
        {sellers.map((seller) => (
          <Marker
            key={seller.seller_id}
            coordinate={{
              latitude: seller.latitude,
              longitude: seller.longitude,
            }}
            onPress={() => handleMarkerPress(seller)}
          >
            <View
              style={[
                styles.markerContainer,
                !seller.is_open && styles.markerContainerClosed,
                isSellerActive(seller.updated_at) && styles.markerContainerActive,
              ]}
            >
              <Image
                source={{ uri: seller.logo_url }}
                style={[styles.markerImage, !seller.is_open && styles.markerImageClosed]}
                accessibilityLabel={`${seller.name} marker`}
              />
            </View>
          </Marker>
        ))}
      </MapView>

      <View style={styles.headerContainer}>
        <TouchableOpacity style={styles.searchBar} onPress={navigateToSearch} activeOpacity={0.7}>
          <Ionicons name="search" size={20} color={theme.colors.placeholder} />
          <Text style={styles.searchPlaceholder}>Search for vendors or products</Text>
        </TouchableOpacity>

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
            onPress={() => handleFilterChange({ ...filters, showOpenOnly: !filters.showOpenOnly })}
            accessibilityLabel="Toggle show open sellers only"
          >
            <View style={[styles.toggleCircle, filters.showOpenOnly && styles.toggleCircleActive]} />
          </TouchableOpacity>
        </View>

        <View style={styles.filterRow}>
          <Text style={styles.filterLabel}>Show Liked Sellers Only</Text>
          <TouchableOpacity
            style={[styles.toggleButton, filters.showLikedOnly && styles.toggleButtonActive]}
            onPress={() => handleFilterChange({ ...filters, showLikedOnly: !filters.showLikedOnly })}
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
          onValueChange={(value) => handleFilterChange({ ...filters, radius: value })}
          minimumTrackTintColor={theme.colors.primary}
          maximumTrackTintColor={theme.colors.disabled}
          thumbTintColor={theme.colors.primary}
          accessibilityLabel="Radius slider"
        />
      </Animated.View>

      <TouchableOpacity 
        style={[styles.refreshButton, isLoading && styles.refreshButtonLoading]} 
        onPress={handleRefresh} 
        disabled={isLoading}
        accessibilityLabel="Refresh button"
      >
        <Ionicons name="refresh" size={24} color="#FFFFFF" />
      </TouchableOpacity>

      {sellers.length === 0 && !isLoading && currentLocation && (
        <View style={styles.noSellersContainer}>
          <Text style={styles.noSellersText}>No sellers found in your area</Text>
          <Text style={styles.noSellersSubtext}>Try increasing the search radius</Text>
        </View>
      )}

      <Animated.View style={[styles.bottomSheet, { height: bottomSheetHeight }]}>
        {selectedSeller && (
          <View style={styles.sellerPreview}>
            <TouchableOpacity style={styles.closeButton} onPress={closeBottomSheet} accessibilityLabel="Close button">
              <Ionicons name="close" size={20} color={theme.colors.text} />
            </TouchableOpacity>

            <View style={styles.sellerInfo}>
              <Image
                source={{ uri: selectedSeller.logo_url }}
                style={styles.sellerLogo}
                accessibilityLabel={`${selectedSeller.name} logo`}
              />

              <View style={styles.sellerDetails}>
                <Text style={styles.sellerName}>{selectedSeller.name}</Text>
                <View style={styles.sellerMetaRow}>
                  <Text style={styles.sellerDistance}>{selectedSeller.distance}</Text>
                </View>
                <View style={[styles.statusBadge, selectedSeller.is_open ? styles.openBadge : styles.closedBadge]}>
                  <Text style={[styles.statusText, selectedSeller.is_open ? styles.openText : styles.closedText]}>
                    {selectedSeller.is_open ? "Open" : "Closed"}
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
    zIndex: 10,
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: spacing.md,
    marginRight: spacing.sm,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 5,
  },
  searchPlaceholder: {
    marginLeft: spacing.sm,
    color: theme.colors.placeholder,
    fontSize: fontSize.md,
    flex: 1,
  },
  filterButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 5,
    height: 48,
    width: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  filtersContainer: {
    position: "absolute",
    top: Platform.OS === "ios" ? 110 : 90,
    left: spacing.md,
    right: spacing.md,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 5,
    overflow: "hidden",
    zIndex: 5,
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
  refreshButtonLoading: {
    backgroundColor: theme.colors.disabled,
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
  noSellersContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  noSellersText: {
    fontSize: fontSize.lg,
    fontWeight: "bold",
    marginBottom: spacing.sm,
  },
  noSellersSubtext: {
    fontSize: fontSize.md,
    color: theme.colors.placeholder,
  },
})

export default MapScreen
