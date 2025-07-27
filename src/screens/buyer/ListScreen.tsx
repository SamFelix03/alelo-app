"use client"

import { useState, useEffect, useCallback } from "react"
import { 
  View, 
  StyleSheet, 
  Text, 
  TextInput, 
  FlatList, 
  TouchableOpacity, 
  Image, 
  SafeAreaView, 
  Alert,
  ActivityIndicator,
  Platform,
  RefreshControl
} from "react-native"
import { useNavigation, useFocusEffect } from "@react-navigation/native"
import { theme, spacing, fontSize } from "../../theme"
import { 
  MapPinIcon, 
  StarIcon, 
  HeartIcon, 
  XMarkIcon, 
  UserIcon, 
  BuildingStorefrontIcon, 
  MagnifyingGlassIcon, 
  XCircleIcon,
  Bars3Icon
} from "react-native-heroicons/outline"
import { HeartIcon as HeartSolid } from "react-native-heroicons/solid"
import MapView, { Marker, Circle, PROVIDER_GOOGLE } from "react-native-maps"
import { useLocation } from "../../hooks/useLocation"
import { useAuth } from "../../context/AuthContext"
import { supabase } from "../../lib/supabase"
import LocationPicker from "../../components/LocationPicker"
import { LocationCoords } from "../../lib/locationService"

interface Seller {
  seller_id: string;
  name: string;
  logo_url: string | null;
  address: string | null;
  latitude: number;
  longitude: number;
  distance: number; // in meters
  is_open: boolean;
  rating?: number;
}

type ViewMode = 'list' | 'map';
type SortBy = 'distance' | 'rating' | 'name';

const ListScreen = () => {
  const navigation = useNavigation()
  const { userInfo } = useAuth()
  const { 
    currentLocation, 
    isLoading: locationLoading, 
    error: locationError, 
    hasPermission,
    isManualLocation,
    refreshLocation,
    checkPermissions,
    setManualLocation,
    updateLocation,
    loadSavedLocation
  } = useLocation()

  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<SortBy>("distance")
  const [sellers, setSellers] = useState<Seller[]>([])
  const [filteredSellers, setFilteredSellers] = useState<Seller[]>([])
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [showLocationPicker, setShowLocationPicker] = useState(false)
  const [selectedSeller, setSelectedSeller] = useState<Seller | null>(null)
  const [likedSellers, setLikedSellers] = useState<Set<string>>(new Set())

  const SEARCH_RADIUS = 500 // 500 meters

  // Load buyer's saved location when component mounts
  useEffect(() => {
    const loadBuyerData = async () => {
      if (userInfo?.profileData?.buyer_id) {
        // Load saved location from database with buyer type
        await loadSavedLocation(userInfo.profileData.buyer_id, 'buyer');
        console.log('Loaded buyer saved location');
        
        // Load liked sellers
        await loadLikedSellers();
      }
    };

    loadBuyerData();
  }, [userInfo?.profileData?.buyer_id]);

  // Load initial location and check permissions
  useEffect(() => {
    const initializeLocation = async () => {
      if (!hasPermission) {
        await checkPermissions()
      }
      if (!currentLocation) {
        await refreshLocation()
      }
    }
    initializeLocation()
  }, [])

  // Fetch sellers when location is available
  useEffect(() => {
    if (currentLocation) {
      fetchNearbySellers()
    }
  }, [currentLocation])

  // Refresh sellers when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (currentLocation) {
        fetchNearbySellers()
      }
      // Refresh liked sellers when screen comes into focus
      if (userInfo?.profileData?.buyer_id) {
        loadLikedSellers()
      }
    }, [currentLocation, userInfo?.profileData?.buyer_id])
  )

  // Update location in database when location changes
  useEffect(() => {
    if (currentLocation && userInfo?.profileData?.buyer_id) {
      updateLocation(userInfo.profileData.buyer_id, 'buyer')
    }
  }, [currentLocation, userInfo?.profileData?.buyer_id])

  // Filter and sort sellers when search or sort changes
  useEffect(() => {
    let filtered = sellers.filter(seller => 
      seller.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    // Sort filtered results
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'distance':
          return a.distance - b.distance
        case 'rating':
          return (b.rating || 0) - (a.rating || 0)
        case 'name':
          return a.name.localeCompare(b.name)
        default:
          return 0
      }
    })

    setFilteredSellers(filtered)
  }, [sellers, searchQuery, sortBy])

  const fetchNearbySellers = async (isRefresh: boolean = false) => {
    if (!currentLocation) return

    if (isRefresh) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }

    try {
      // Use PostGIS ST_DWithin to find sellers within radius
      const { data, error } = await supabase.rpc('find_nearby_sellers', {
        buyer_lat: currentLocation.latitude,
        buyer_lng: currentLocation.longitude,
        radius_km: SEARCH_RADIUS / 1000 // Convert meters to kilometers
      })

      if (error) {
        console.error('Error fetching nearby sellers:', error)
        Alert.alert('Error', 'Failed to fetch nearby sellers. Please try again.')
        return
      }

      const sellersData: Seller[] = (data || []).map((seller: any) => ({
        seller_id: seller.seller_id,
        name: seller.name,
        logo_url: seller.logo_url,
        address: seller.address,
        latitude: seller.latitude,
        longitude: seller.longitude,
        distance: seller.distance_km * 1000, // Convert back to meters for consistency
        is_open: seller.is_open,
        rating: seller.rating || 4.5 // Default rating for now
      }))

      setSellers(sellersData)
      console.log(`Found ${sellersData.length} sellers within ${SEARCH_RADIUS}m`)
    } catch (error) {
      console.error('Error fetching sellers:', error)
      Alert.alert('Error', 'Failed to fetch nearby sellers.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = () => {
    fetchNearbySellers(true)
  }

  const handleLocationRequest = () => {
    Alert.alert(
      "Location Required",
      "We need your location to show nearby vendors. Would you like to enable location access or set your location manually?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Enable GPS",
          onPress: async () => {
            await checkPermissions()
            if (hasPermission) {
              await refreshLocation()
            }
          }
        },
        {
          text: "Set Manually",
          onPress: () => setShowLocationPicker(true)
        }
      ]
    )
  }

  const handleLocationSelected = async (location: LocationCoords) => {
    setManualLocation(location)
    setShowLocationPicker(false)
    
    // Immediately save the manual location to database
    if (userInfo?.profileData?.buyer_id) {
      await updateLocation(userInfo.profileData.buyer_id, 'buyer');
      console.log('Manual location saved to database');
    }
    
    // Fetch sellers with the new location
    console.log('Fetching sellers with manual location:', location);
  }

  const handleLocationPickerCancel = () => {
    setShowLocationPicker(false)
  }

  const handleSearch = (text: string) => {
    setSearchQuery(text)
  }

  const handleSort = (sortType: SortBy) => {
    setSortBy(sortType)
  }

  const toggleLike = async (sellerId: string) => {
    if (!userInfo?.profileData?.buyer_id) return

    const isCurrentlyLiked = likedSellers.has(sellerId)

    try {
      if (isCurrentlyLiked) {
        // Unlike: Remove from database
        const { error } = await supabase
          .from('buyer_liked_sellers')
          .delete()
          .eq('buyer_id', userInfo.profileData.buyer_id)
          .eq('seller_id', sellerId)

        if (error) {
          console.error('Error unliking seller:', error)
          Alert.alert('Error', 'Failed to unlike seller. Please try again.')
          return
        }

        // Update local state
        const newLiked = new Set(likedSellers)
        newLiked.delete(sellerId)
        setLikedSellers(newLiked)
      } else {
        // Like: Add to database
        const { error } = await supabase
          .from('buyer_liked_sellers')
          .insert({
            buyer_id: userInfo.profileData.buyer_id,
            seller_id: sellerId
          })

        if (error) {
          console.error('Error liking seller:', error)
          Alert.alert('Error', 'Failed to like seller. Please try again.')
          return
        }

        // Update local state
        const newLiked = new Set(likedSellers)
        newLiked.add(sellerId)
        setLikedSellers(newLiked)
      }
    } catch (error) {
      console.error('Error toggling like:', error)
      Alert.alert('Error', 'Failed to update like status.')
    }
  }

  const navigateToSellerProfile = (seller: Seller) => {
    // @ts-ignore - Navigation type issue, will be fixed with proper navigation types
    navigation.navigate("SellerProfile", { seller })
  }

  const handleSellerMarkerPress = (seller: Seller) => {
    setSelectedSeller(seller)
  }

  const formatDistance = (meters: number): string => {
    if (meters < 1000) {
      return `${Math.round(meters)}m`
    } else {
      return `${(meters / 1000).toFixed(1)}km`
    }
  }

  const renderSellerItem = ({ item }: { item: Seller }) => (
    <View style={styles.sellerCard}>
      <Image 
        source={{ 
          uri: item.logo_url || `https://via.placeholder.com/60?text=${item.name.charAt(0)}` 
        }} 
        style={styles.sellerLogo} 
        accessibilityLabel={`${item.name} logo`} 
      />

      <View style={styles.sellerInfo}>
        <Text style={styles.sellerName}>{item.name}</Text>

        <View style={styles.sellerMetaRow}>
          <View style={styles.distanceContainer}>
            <MapPinIcon size={14} color={theme.colors.placeholder} />
            <Text style={styles.distanceText}>{formatDistance(item.distance)}</Text>
          </View>

          {item.rating && (
            <View style={styles.ratingContainer}>
              <StarIcon size={14} color="#FFD700" />
              <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
            </View>
          )}
        </View>

        {item.address && (
          <Text style={styles.sellerAddress} numberOfLines={1}>{item.address}</Text>
        )}

        <View style={[styles.statusBadge, item.is_open ? styles.openBadge : styles.closedBadge]}>
          <Text style={[styles.statusText, item.is_open ? styles.openText : styles.closedText]}>
            {item.is_open ? "Open" : "Closed"}
          </Text>
        </View>
      </View>

      <View style={styles.sellerActions}>
        <TouchableOpacity
          style={styles.likeButton}
          onPress={() => toggleLike(item.seller_id)}
          accessibilityLabel={`${likedSellers.has(item.seller_id) ? "Unlike" : "Like"} ${item.name}`}
        >
          <HeartIcon
            size={24}
            color={likedSellers.has(item.seller_id) ? theme.colors.error : theme.colors.text}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.viewMenuButton, !item.is_open && styles.viewMenuButtonDisabled]}
          onPress={() => navigateToSellerProfile(item)}
          disabled={!item.is_open}
          accessibilityLabel={`View ${item.name} menu`}
        >
          <Text style={[styles.viewMenuText, !item.is_open && styles.viewMenuTextDisabled]}>
            View Shop
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  )

  const renderMapView = () => {
    if (!currentLocation) {
      return (
        <View style={styles.noLocationContainer}>
          <MapPinIcon size={50} color={theme.colors.disabled} />
          <Text style={styles.noLocationText}>Location Required</Text>
          <Text style={styles.noLocationSubtext}>Enable location to see nearby vendors on the map</Text>
          <TouchableOpacity style={styles.enableLocationButton} onPress={handleLocationRequest}>
            <Text style={styles.enableLocationText}>Enable Location</Text>
          </TouchableOpacity>
        </View>
      )
    }

    const mapRegion = {
      latitude: currentLocation.latitude,
      longitude: currentLocation.longitude,
      latitudeDelta: 0.01, // Smaller delta for closer zoom
      longitudeDelta: 0.01,
    }

    return (
      <View style={styles.mapContainer}>
        {/* Selected seller preview - moved to top */}
        {selectedSeller && (
          <View style={styles.sellerPreviewTop}>
            <Image
              source={{ 
                uri: selectedSeller.logo_url || `https://via.placeholder.com/50?text=${selectedSeller.name.charAt(0)}` 
              }}
              style={styles.previewLogo}
            />
            <View style={styles.previewInfo}>
              <Text style={styles.previewName}>{selectedSeller.name}</Text>
              <Text style={styles.previewDistance}>{formatDistance(selectedSeller.distance)}</Text>
              <View style={[
                styles.previewStatus, 
                selectedSeller.is_open ? styles.previewStatusOpen : styles.previewStatusClosed
              ]}>
                <Text style={[
                  styles.previewStatusText,
                  selectedSeller.is_open ? styles.previewStatusTextOpen : styles.previewStatusTextClosed
                ]}>
                  {selectedSeller.is_open ? "Open" : "Closed"}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.previewButton, !selectedSeller.is_open && styles.previewButtonDisabled]}
              onPress={() => navigateToSellerProfile(selectedSeller)}
              disabled={!selectedSeller.is_open}
            >
              <Text style={[styles.previewButtonText, !selectedSeller.is_open && styles.previewButtonTextDisabled]}>
                View
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.closePreviewButton}
              onPress={() => setSelectedSeller(null)}
            >
              <XMarkIcon size={20} color={theme.colors.text} />
            </TouchableOpacity>
          </View>
        )}

        <MapView
          style={[styles.map, selectedSeller && styles.mapWithTopPreview]}
          provider={PROVIDER_GOOGLE}
          region={mapRegion}
          showsUserLocation={!isManualLocation}
          showsMyLocationButton={false}
        >
          {/* Buyer's location */}
          <Marker
            coordinate={{
              latitude: currentLocation.latitude,
              longitude: currentLocation.longitude,
            }}
            title="You are here"
          >
            <View style={styles.buyerMarker}>
              <UserIcon size={16} color="#FFFFFF" />
            </View>
          </Marker>

          {/* Search radius circle */}
          <Circle
            center={{
              latitude: currentLocation.latitude,
              longitude: currentLocation.longitude,
            }}
            radius={SEARCH_RADIUS}
            strokeColor={theme.colors.primary}
            fillColor={`${theme.colors.primary}20`}
            strokeWidth={2}
          />

          {/* Seller markers */}
          {filteredSellers.map((seller) => (
            <Marker
              key={seller.seller_id}
              coordinate={{
                latitude: seller.latitude,
                longitude: seller.longitude,
              }}
              onPress={() => handleSellerMarkerPress(seller)}
              title={seller.name}
              description={seller.is_open ? "Open" : "Closed"}
            >
              <View style={[
                styles.sellerMarker, 
                seller.is_open ? styles.sellerMarkerOpen : styles.sellerMarkerClosed
              ]}>
                <BuildingStorefrontIcon size={16} color="#FFFFFF" />
              </View>
            </Marker>
          ))}
        </MapView>
      </View>
    )
  }

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <BuildingStorefrontIcon size={50} color={theme.colors.disabled} />
      <Text style={styles.emptyText}>No vendors nearby</Text>
      <Text style={styles.emptySubtext}>
        {searchQuery ? "Try adjusting your search" : `No vendors found within ${SEARCH_RADIUS}m`}
      </Text>
      {!searchQuery && (
        <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
          <Text style={styles.refreshButtonText}>Refresh</Text>
        </TouchableOpacity>
      )}
    </View>
  )

  // Load liked sellers from database
  const loadLikedSellers = async () => {
    if (!userInfo?.profileData?.buyer_id) return

    try {
      const { data, error } = await supabase
        .from('buyer_liked_sellers')
        .select('seller_id')
        .eq('buyer_id', userInfo.profileData.buyer_id)

      if (error) {
        console.error('Error loading liked sellers:', error)
        return
      }

      const likedSellerIds = new Set((data || []).map(item => item.seller_id))
      setLikedSellers(likedSellerIds)
      console.log(`Loaded ${likedSellerIds.size} liked sellers`)
    } catch (error) {
      console.error('Error loading liked sellers:', error)
    }
  }

  if (!currentLocation && !locationLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Nearby Vendors</Text>
        </View>
        <View style={styles.noLocationContainer}>
          <MapPinIcon size={50} color={theme.colors.disabled} />
          <Text style={styles.noLocationText}>Location Required</Text>
          <Text style={styles.noLocationSubtext}>
            We need your location to show nearby vendors
          </Text>
          <TouchableOpacity style={styles.enableLocationButton} onPress={handleLocationRequest}>
            <Text style={styles.enableLocationText}>Set Location</Text>
          </TouchableOpacity>
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Nearby Vendors</Text>
        {locationLoading && (
          <Text style={styles.locationStatus}>Getting location...</Text>
        )}
        {currentLocation && (
          <Text style={styles.locationInfo}>
            {isManualLocation ? "Manual location" : "GPS location"} • {filteredSellers.length} vendors nearby
          </Text>
        )}

        {viewMode === 'list' && (
          <>
            <View style={styles.searchContainer}>
              <MagnifyingGlassIcon size={20} color={theme.colors.placeholder} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search vendors"
                value={searchQuery}
                onChangeText={handleSearch}
                accessibilityLabel="Search input"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => handleSearch("")} accessibilityLabel="Clear search">
                  <XCircleIcon size={20} color={theme.colors.placeholder} />
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.sortContainer}>
              <Text style={styles.sortLabel}>Sort by:</Text>
              <View style={styles.sortButtons}>
                <TouchableOpacity
                  style={[styles.sortButton, sortBy === "distance" && styles.sortButtonActive]}
                  onPress={() => handleSort("distance")}
                  accessibilityLabel="Sort by distance"
                >
                  <Text style={[styles.sortButtonText, sortBy === "distance" && styles.sortButtonTextActive]}>
                    Distance
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.sortButton, sortBy === "rating" && styles.sortButtonActive]}
                  onPress={() => handleSort("rating")}
                  accessibilityLabel="Sort by rating"
                >
                  <Text style={[styles.sortButtonText, sortBy === "rating" && styles.sortButtonTextActive]}>
                    Rating
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.sortButton, sortBy === "name" && styles.sortButtonActive]}
                  onPress={() => handleSort("name")}
                  accessibilityLabel="Sort by name"
                >
                  <Text style={[styles.sortButtonText, sortBy === "name" && styles.sortButtonTextActive]}>
                    Name
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}
      </View>

      {/* Content based on view mode */}
      {viewMode === 'list' ? (
        loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Finding nearby vendors...</Text>
          </View>
        ) : filteredSellers.length === 0 ? (
          renderEmptyState()
        ) : (
          <FlatList
            data={filteredSellers}
            renderItem={renderSellerItem}
            keyExtractor={(item) => item.seller_id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={[theme.colors.primary]}
                tintColor={theme.colors.primary}
                title="Pull to refresh"
                titleColor={theme.colors.placeholder}
              />
            }
          />
        )
      ) : (
        renderMapView()
      )}

      {/* View mode toggle button */}
      <TouchableOpacity
        style={styles.viewModeButton}
        onPress={() => setViewMode(viewMode === 'list' ? 'map' : 'list')}
        accessibilityLabel={`Switch to ${viewMode === 'list' ? 'map' : 'list'} view`}
      >
        <Bars3Icon 
          size={24} 
          color="#FFFFFF" 
        />
      </TouchableOpacity>

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
  header: {
    padding: spacing.lg,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
    paddingTop: Platform.OS === 'ios' ? 60 : spacing.xl,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: theme.colors.text,
    marginBottom: spacing.sm,
  },
  locationStatus: {
    fontSize: fontSize.sm,
    color: theme.colors.placeholder,
    marginBottom: spacing.sm,
  },
  locationInfo: {
    fontSize: fontSize.sm,
    color: theme.colors.placeholder,
    marginBottom: spacing.md,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: fontSize.md,
  },
  sortContainer: {
    marginTop: spacing.sm,
  },
  sortLabel: {
    fontSize: fontSize.sm,
    color: theme.colors.placeholder,
    marginBottom: spacing.xs,
  },
  sortButtons: {
    flexDirection: "row",
  },
  sortButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: 20,
    marginRight: spacing.sm,
    backgroundColor: "#F5F5F5",
  },
  sortButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  sortButtonText: {
    fontSize: fontSize.sm,
    color: theme.colors.text,
  },
  sortButtonTextActive: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: fontSize.md,
    color: theme.colors.placeholder,
  },
  listContent: {
    padding: spacing.md,
  },
  sellerCard: {
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
  sellerLogo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: spacing.md,
    backgroundColor: "#F5F5F5",
  },
  sellerInfo: {
    flex: 1,
    justifyContent: "center",
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
  distanceContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: spacing.md,
  },
  distanceText: {
    fontSize: fontSize.sm,
    color: theme.colors.placeholder,
    marginLeft: 2,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  ratingText: {
    fontSize: fontSize.sm,
    marginLeft: 2,
  },
  sellerAddress: {
    fontSize: fontSize.xs,
    color: theme.colors.placeholder,
    marginBottom: spacing.xs,
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
  sellerActions: {
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  likeButton: {
    marginBottom: spacing.md,
  },
  viewMenuButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
  },
  viewMenuButtonDisabled: {
    backgroundColor: theme.colors.disabled,
  },
  viewMenuText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: fontSize.sm,
  },
  viewMenuTextDisabled: {
    color: "#FFFFFF",
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  mapWithTopPreview: {
    marginTop: 100, // Adjust this value based on your design
  },
  buyerMarker: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#2196F3",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  sellerMarker: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: theme.colors.disabled,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  sellerMarkerOpen: {
    backgroundColor: theme.colors.primary,
  },
  sellerMarkerClosed: {
    backgroundColor: theme.colors.error,
  },
  sellerPreviewTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  previewLogo: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: spacing.md,
    backgroundColor: "#F5F5F5",
  },
  previewInfo: {
    flex: 1,
  },
  previewName: {
    fontSize: fontSize.md,
    fontWeight: "bold",
    marginBottom: 2,
  },
  previewDistance: {
    fontSize: fontSize.sm,
    color: theme.colors.placeholder,
    marginBottom: spacing.xs,
  },
  previewStatus: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: "flex-start",
  },
  previewStatusOpen: {
    backgroundColor: "#E8F5E9",
  },
  previewStatusClosed: {
    backgroundColor: "#FFEBEE",
  },
  previewStatusText: {
    fontSize: fontSize.xs,
    fontWeight: "bold",
  },
  previewStatusTextOpen: {
    color: theme.colors.primary,
  },
  previewStatusTextClosed: {
    color: theme.colors.error,
  },
  previewButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
  },
  previewButtonDisabled: {
    backgroundColor: theme.colors.disabled,
  },
  previewButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: fontSize.sm,
  },
  previewButtonTextDisabled: {
    color: "#FFFFFF",
  },
  closePreviewButton: {
    marginLeft: spacing.md,
  },
  viewModeButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  noLocationContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  noLocationText: {
    fontSize: fontSize.lg,
    fontWeight: "bold",
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  noLocationSubtext: {
    fontSize: fontSize.md,
    color: theme.colors.placeholder,
    textAlign: "center",
    marginBottom: spacing.lg,
  },
  enableLocationButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 8,
  },
  enableLocationText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: fontSize.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
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
  refreshButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 8,
    marginTop: spacing.lg,
  },
  refreshButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: fontSize.md,
  },
})

export default ListScreen
