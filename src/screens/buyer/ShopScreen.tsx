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
  ActivityIndicator,
  RefreshControl,
  Alert,
  Platform 
} from "react-native"
import { useNavigation, useFocusEffect } from "@react-navigation/native"
import { theme, spacing, fontSize } from "../../theme"
import { 
  UsersIcon, 
  ShoppingBagIcon, 
  MapPinIcon, 
  MagnifyingGlassIcon, 
  XCircleIcon 
} from "react-native-heroicons/outline"
import { useAuth } from "../../context/AuthContext"
import { useLocation } from "../../hooks/useLocation"
import { supabase } from "../../lib/supabase"

interface AggregatedProduct {
  product_name: string;
  product_description: string | null;
  product_image_url: string | null;
  product_type: string;
  price_unit: string;
  min_price: number;
  max_price: number;
  seller_count: number;
  sellers_info: Array<{
    seller_id: string;
    seller_name: string;
    seller_logo: string | null;
    price: number;
    is_open: boolean;
  }>;
}

const ShopScreen = () => {
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
  
  const [searchQuery, setSearchQuery] = useState("")
  const [products, setProducts] = useState<AggregatedProduct[]>([])
  const [filteredProducts, setFilteredProducts] = useState<AggregatedProduct[]>([])
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  // Load buyer's saved location when component mounts
  useEffect(() => {
    const loadBuyerData = async () => {
      if (userInfo?.profileData?.buyer_id) {
        // Load saved location from database with buyer type
        await loadSavedLocation(userInfo.profileData.buyer_id, 'buyer');
        console.log('Loaded buyer saved location');
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

  // Update location in database when location changes
  useEffect(() => {
    if (currentLocation && userInfo?.profileData?.buyer_id) {
      updateLocation(userInfo.profileData.buyer_id, 'buyer')
    }
  }, [currentLocation, userInfo?.profileData?.buyer_id])

  // Fetch products when location is available
  useEffect(() => {
    if (currentLocation) {
      fetchAggregatedProducts()
    }
  }, [currentLocation])

  // Fetch products when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (currentLocation) {
        fetchAggregatedProducts()
      }
    }, [currentLocation, userInfo])
  )

  const fetchAggregatedProducts = async (isRefresh: boolean = false) => {
    if (!currentLocation || !userInfo?.profileData?.buyer_id) {
      console.log('Missing location or buyer info')
      return
    }

    if (isRefresh) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }

    try {
      const { data, error } = await supabase.rpc('get_aggregated_products', {
        buyer_id_param: userInfo.profileData.buyer_id,
        buyer_lat: currentLocation.latitude,
        buyer_lng: currentLocation.longitude,
        radius_km: 0.5 // 500m radius
      })

      if (error) {
        console.error('Error fetching aggregated products:', error)
        Alert.alert('Error', 'Failed to load products. Please try again.')
        return
      }

      setProducts(data || [])
      setFilteredProducts(data || [])
      console.log(`Loaded ${(data || []).length} unique products from nearby and liked sellers`)
    } catch (error) {
      console.error('Error fetching products:', error)
      Alert.alert('Error', 'Failed to load products.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = () => {
    fetchAggregatedProducts(true)
  }

  const handleLocationRequest = () => {
    Alert.alert(
      "Location Required",
      "We need your location to show products from nearby vendors. Would you like to enable location access?",
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
        }
      ]
    )
  }

  const handleSearch = (text: string) => {
    setSearchQuery(text)

    if (text.trim() === "") {
      setFilteredProducts(products)
      return
    }

    const filtered = products.filter((product) => 
      product.product_name.toLowerCase().includes(text.toLowerCase()) ||
      (product.product_description && product.product_description.toLowerCase().includes(text.toLowerCase()))
    )

    setFilteredProducts(filtered)
  }

  const navigateToProductDetail = (product: AggregatedProduct) => {
    // @ts-ignore - Navigation type issue, will be fixed with proper navigation types
    navigation.navigate("ProductDetail", { product })
  }

  const formatPriceRange = (minPrice: number, maxPrice: number, priceUnit: string): string => {
    if (minPrice === maxPrice) {
      return `₹${minPrice.toFixed(2)}/${priceUnit}`
    }
    return `₹${minPrice.toFixed(2)} - ₹${maxPrice.toFixed(2)}/${priceUnit}`
  }

  const renderProductItem = ({ item }: { item: AggregatedProduct }) => (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() => navigateToProductDetail(item)}
      accessibilityLabel={`${item.product_name} card`}
    >
      <Image 
        source={{ 
          uri: item.product_image_url || `https://via.placeholder.com/150?text=${item.product_name.charAt(0)}` 
        }} 
        style={styles.productImage} 
        accessibilityLabel={`${item.product_name} image`} 
      />
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{item.product_name}</Text>
        <Text style={styles.priceRange}>
          {formatPriceRange(item.min_price, item.max_price, item.price_unit)}
        </Text>
        <View style={styles.sellerCount}>
          <UsersIcon size={14} color={theme.colors.placeholder} />
          <Text style={styles.sellerCountText}>
            {item.seller_count} seller{item.seller_count !== 1 ? 's' : ''}
          </Text>
        </View>
        {item.product_description && (
          <Text style={styles.productDescription} numberOfLines={2}>
            {item.product_description}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  )

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <ShoppingBagIcon size={50} color={theme.colors.disabled} />
      <Text style={styles.emptyText}>
        {searchQuery ? "No products found" : "No products available"}
      </Text>
      <Text style={styles.emptySubtext}>
        {searchQuery 
          ? "Try adjusting your search" 
          : "No vendors nearby or in your favorites are currently offering products"
        }
      </Text>
      {!searchQuery && (
        <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
          <Text style={styles.refreshButtonText}>Refresh</Text>
        </TouchableOpacity>
      )}
    </View>
  )

  if (!currentLocation) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Shop</Text>
        </View>
        <View style={styles.noLocationContainer}>
          <MapPinIcon size={50} color={theme.colors.disabled} />
          <Text style={styles.noLocationText}>Location Required</Text>
          <Text style={styles.noLocationSubtext}>
            We need your location to show products from nearby vendors
          </Text>
          <TouchableOpacity style={styles.enableLocationButton} onPress={handleLocationRequest}>
            <Text style={styles.enableLocationButtonText}>Enable Location</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Shop</Text>
        <Text style={styles.subtitle}>
          Products from nearby vendors and your favorites
        </Text>

        <View style={styles.searchContainer}>
          <MagnifyingGlassIcon size={20} color={theme.colors.placeholder} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for products"
            value={searchQuery}
            onChangeText={handleSearch}
            accessibilityLabel="Search products input"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch("")} accessibilityLabel="Clear search">
              <XCircleIcon size={20} color={theme.colors.placeholder} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading products...</Text>
        </View>
      ) : filteredProducts.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={filteredProducts}
          renderItem={renderProductItem}
          keyExtractor={(item) => item.product_name}
          numColumns={2}
          contentContainerStyle={styles.gridContent}
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
      )}
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
    paddingTop: Platform.OS === 'ios' ? 60 : spacing.xl,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: theme.colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: theme.colors.placeholder,
    marginBottom: spacing.md,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    padding: spacing.md,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: fontSize.md,
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
  gridContent: {
    padding: spacing.md,
  },
  productCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    margin: spacing.xs,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productImage: {
    width: "100%",
    height: 150,
    resizeMode: "cover",
    backgroundColor: "#F5F5F5",
  },
  productInfo: {
    padding: spacing.md,
  },
  productName: {
    fontSize: fontSize.md,
    fontWeight: "bold",
    marginBottom: spacing.xs,
  },
  priceRange: {
    fontSize: fontSize.sm,
    color: theme.colors.primary,
    fontWeight: "600",
    marginBottom: spacing.xs,
  },
  sellerCount: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  sellerCountText: {
    fontSize: fontSize.xs,
    color: theme.colors.placeholder,
    marginLeft: 4,
  },
  productDescription: {
    fontSize: fontSize.xs,
    color: theme.colors.placeholder,
    lineHeight: 16,
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
    lineHeight: 22,
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
    marginBottom: spacing.sm,
  },
  emptySubtext: {
    fontSize: fontSize.md,
    color: theme.colors.placeholder,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  refreshButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 8,
  },
  refreshButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: fontSize.md,
  },
  enableLocationButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 8,
    marginTop: spacing.md,
  },
  enableLocationButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: fontSize.md,
  },
})

export default ShopScreen
