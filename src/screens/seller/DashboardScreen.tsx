"use client"

import { useState, useEffect } from "react"
import { View, StyleSheet, Text, TouchableOpacity, Switch, Image, ScrollView, SafeAreaView, Platform, Alert, AlertButton } from "react-native"
import { useNavigation } from "@react-navigation/native"
import { theme, spacing, fontSize } from "../../theme"
import { Ionicons } from "@expo/vector-icons"
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps"
import { useLocation } from "../../hooks/useLocation"
import { useAuth } from "../../context/AuthContext"
import { supabase } from "../../lib/supabase"
import LocationPicker from "../../components/LocationPicker"
import { LocationCoords } from "../../lib/locationService"

interface Buyer {
  id: string;
  name: string;
  avatar: string;
  latitude: number;
  longitude: number;
  distance: string;
  lastOrder: Date;
}

// Mock data for buyers
const MOCK_BUYERS: Buyer[] = [
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
  const { userInfo } = useAuth()
  const { 
    currentLocation, 
    isLoading: locationLoading, 
    error: locationError, 
    hasPermission,
    isManualLocation,
    startTracking, 
    stopTracking, 
    updateLocation,
    setManualLocation,
    refreshLocation,
    loadSavedLocation,
    checkPermissions
  } = useLocation()
  
  const [isOpen, setIsOpen] = useState(false)
  const [selectedBuyer, setSelectedBuyer] = useState<Buyer | null>(null)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [showLocationPicker, setShowLocationPicker] = useState(false)

  // Load seller's saved location and business status when component mounts
  useEffect(() => {
    const loadSellerData = async () => {
      if (userInfo?.profileData?.seller_id) {
        // Load saved location from database
        await loadSavedLocation(userInfo.profileData.seller_id);
        
        // Load business status from database
        try {
          const { data, error } = await supabase
            .from('sellers')
            .select('is_open')
            .eq('seller_id', userInfo.profileData.seller_id)
            .single();

          if (!error && data) {
            setIsOpen(data.is_open || false);
            console.log('Loaded business status:', data.is_open);
          }
        } catch (error) {
          console.error('Error loading business status:', error);
        }
      }
    };

    loadSellerData();
  }, [userInfo?.profileData?.seller_id]);

  // Update seller's business status in database
  const updateBusinessStatus = async (newStatus: boolean) => {
    if (!userInfo?.profileData?.seller_id) {
      Alert.alert("Error", "Seller profile not found")
      return false
    }

    try {
      const { error } = await supabase
        .from('sellers')
        .update({ 
          is_open: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('seller_id', userInfo.profileData.seller_id)

      if (error) {
        console.error('Error updating business status:', error)
        Alert.alert("Error", "Failed to update business status")
        return false
      }

      return true
    } catch (error) {
      console.error('Error updating business status:', error)
      Alert.alert("Error", "Failed to update business status")
      return false
    }
  }

  const toggleBusinessStatus = async () => {
    setIsUpdatingStatus(true)
    const newStatus = !isOpen

    try {
      if (newStatus) {
        // Opening business - check location permissions first
        if (!hasPermission) {
          Alert.alert(
            "Location Permission Required", 
            "Please enable location access to share your location with customers. This helps customers find you on the map.",
            [
              { text: "Cancel", style: "cancel" },
              { 
                text: "Enable Location", 
                onPress: async () => {
                  await checkPermissions()
                  if (!hasPermission) {
                    Alert.alert(
                      "Location Access Denied",
                      "To share your location with customers, please enable location access in your device settings.",
                      [
                        { text: "OK" }
                      ]
                    )
                  }
                }
              }
            ]
          )
          setIsUpdatingStatus(false)
          return
        }

        if (!currentLocation) {
          // Try to get location quickly (5 second timeout)
          console.log('Attempting quick location fetch...')
          const quickLocation = await refreshLocation()
          
          // If still no location after quick attempt, immediately offer manual selection
          if (!currentLocation) {
            Alert.alert(
              "Set Your Location", 
              "We couldn't detect your location automatically. Please set your business location manually on the map.",
              [
                { text: "Cancel", style: "cancel", onPress: () => setIsUpdatingStatus(false) },
                { 
                  text: "Set Location", 
                  onPress: () => {
                    setShowLocationPicker(true)
                  }
                }
              ]
            )
            return
          }
        }

        // Update business status first
        const statusUpdated = await updateBusinessStatus(newStatus)
        if (!statusUpdated) {
          setIsUpdatingStatus(false)
          return
        }

        // Start location tracking (will skip if manual location is set)
        await startTracking()
        
        // Update initial location
        if (userInfo?.profileData?.seller_id) {
          await updateLocation(userInfo.profileData.seller_id)
        }

        setIsOpen(newStatus)
        Alert.alert("Business Opened", "You are now visible to nearby customers!")
      } else {
        // Closing business - stop location tracking
        const statusUpdated = await updateBusinessStatus(newStatus)
        if (!statusUpdated) {
          setIsUpdatingStatus(false)
          return
        }

        stopTracking()
        setIsOpen(newStatus)
        Alert.alert("Business Closed", "You are no longer visible to customers.")
      }
    } catch (error) {
      console.error('Error toggling business status:', error)
      Alert.alert("Error", "Failed to update business status")
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  const handleLocationSelected = async (location: LocationCoords) => {
    setManualLocation(location)
    setShowLocationPicker(false)
    
    // Immediately save the manual location to database
    if (userInfo?.profileData?.seller_id) {
      await updateLocation(userInfo.profileData.seller_id);
      console.log('Manual location saved to database');
    }
    
    // Now try to open business again
    setIsUpdatingStatus(true)
    try {
      const statusUpdated = await updateBusinessStatus(true)
      if (statusUpdated && userInfo?.profileData?.seller_id) {
        await updateLocation(userInfo.profileData.seller_id)
        setIsOpen(true)
        Alert.alert("Business Opened", "You are now visible to nearby customers with your selected location!")
      }
    } catch (error) {
      console.error('Error opening business with manual location:', error)
      Alert.alert("Error", "Failed to open business")
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  const handleLocationPickerCancel = () => {
    setShowLocationPicker(false)
    setIsUpdatingStatus(false)
  }

  // Update location in database when location changes and business is open
  useEffect(() => {
    if (isOpen && currentLocation && userInfo?.profileData?.seller_id) {
      updateLocation(userInfo.profileData.seller_id)
    }
  }, [currentLocation, isOpen, userInfo?.profileData?.seller_id])

  // Show location error if any
  useEffect(() => {
    if (locationError) {
      let title = "Location Error"
      let message = locationError.message
      let buttons: AlertButton[] = [{ text: "OK" }]

      if (locationError.code === 'PERMISSION_DENIED' || locationError.code === 'SERVICES_DISABLED') {
        title = "Location Access Required"
        buttons = [
          { text: "Cancel", style: "cancel" },
          { 
            text: "Settings", 
            onPress: () => {
              // In a real app, you might want to open device settings
              Alert.alert("Settings", "Please enable location services in your device settings.")
            }
          }
        ]
        Alert.alert(title, message, buttons)
      }
      // Don't show automatic alerts for LOCATION_UNAVAILABLE or LOCATION_ERROR
      // These are handled in the business toggle flow
    }
  }, [locationError])

  const handleBuyerMarkerPress = (buyer: Buyer) => {
    setSelectedBuyer(buyer)
  }

  const formatDate = (date: Date) => {
    const now = new Date()
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

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

  // Use current location or fallback to default
  const mapRegion = currentLocation ? {
    latitude: currentLocation.latitude,
    longitude: currentLocation.longitude,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  } : {
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          region={mapRegion}
          showsUserLocation
        >
          {/* Seller's position (you) */}
          {currentLocation && (
            <Marker
              coordinate={{
                latitude: currentLocation.latitude,
                longitude: currentLocation.longitude,
              }}
            >
              <View style={[styles.sellerMarker, isOpen && styles.sellerMarkerOpen]}>
                <Ionicons name="business" size={20} color="#FFFFFF" />
              </View>
            </Marker>
          )}

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

        <View style={styles.overlayContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>Dashboard</Text>
            {locationLoading && (
              <Text style={styles.locationStatus}>Getting location...</Text>
            )}
          </View>

          <View style={styles.businessStatusContainer}>
            <View>
              <Text style={styles.businessStatusLabel}>Business Status</Text>
              <Text style={styles.businessStatusDescription}>
                {isOpen ? "You are visible to nearby customers" : "You are not visible to customers"}
              </Text>
              {currentLocation && (
                <Text style={styles.locationInfo}>
                  {isManualLocation ? "Saved location: " : "GPS location: "}
                  {currentLocation.latitude.toFixed(4)}, {currentLocation.longitude.toFixed(4)}
                </Text>
              )}
              {!currentLocation && (
                <Text style={styles.locationInfo}>
                  No location set - will prompt to set location when opening business
                </Text>
              )}
            </View>

            <Switch
              value={isOpen}
              onValueChange={toggleBusinessStatus}
              disabled={isUpdatingStatus}
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
                <Ionicons 
                  name={isManualLocation ? "location" : "globe"} 
                  size={24} 
                  color={theme.colors.primary} 
                />
              </View>

              <View style={styles.locationTextContainer}>
                <Text style={styles.locationSharingText}>
                  {isManualLocation ? "Manual location set" : "Location sharing is active"}
                </Text>
                <Text style={styles.locationSharingDescription}>
                  {isManualLocation 
                    ? "Your selected location is being shared with nearby customers"
                    : "Your real-time location is being shared with nearby customers"
                  }
                </Text>
              </View>
            </View>
          )}
        </View>

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

      <LocationPicker
        visible={showLocationPicker}
        onLocationSelected={handleLocationSelected}
        onCancel={handleLocationPickerCancel}
        initialLocation={currentLocation || undefined}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  overlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: Platform.OS === 'ios' ? 60 : spacing.xl,
    paddingBottom: spacing.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderBottomWidth: 1,
    borderBottomColor: "rgba(240, 240, 240, 0.5)",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: theme.colors.text,
  },
  businessStatusContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderBottomWidth: 1,
    borderBottomColor: "rgba(240, 240, 240, 0.5)",
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
    backgroundColor: 'rgba(232, 245, 233, 0.9)',
    padding: spacing.md,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.md,
    borderRadius: 8,
  },
  locationIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
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
  mapContainer: {
    flex: 1,
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
  sellerMarkerOpen: {
    backgroundColor: theme.colors.secondary,
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
  locationInfo: {
    fontSize: fontSize.xs,
    color: theme.colors.placeholder,
    marginTop: spacing.xs,
  },
  locationStatus: {
    fontSize: fontSize.sm,
    color: theme.colors.placeholder,
    marginTop: spacing.xs,
  },
})

export default DashboardScreen
