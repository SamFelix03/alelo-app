"use client"

import { useState, useEffect, useCallback } from "react"
import { 
  View, 
  StyleSheet, 
  Text, 
  Image, 
  TouchableOpacity, 
  FlatList, 
  SafeAreaView, 
  ScrollView, 
  ActivityIndicator,
  Alert,
  Platform 
} from "react-native"
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native"
import { theme, spacing, fontSize } from "../../theme"
import { 
  ChevronRightIcon, 
  BuildingStorefrontIcon, 
  ArrowLeftIcon, 
  HeartIcon, 
  MapPinIcon, 
  StarIcon 
} from "react-native-heroicons/outline"
import { HeartIcon as HeartSolid } from "react-native-heroicons/solid"
import { useAuth } from "../../context/AuthContext"
import { supabase } from "../../lib/supabase"

interface Product {
  product_id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  price: number;
  price_unit: string;
  product_type: string;
  is_available: boolean;
}

interface Seller {
  seller_id: string;
  name: string;
  logo_url: string | null;
  address: string | null;
  latitude: number;
  longitude: number;
  distance: number;
  is_open: boolean;
}

const SellerProfile = () => {
  const navigation = useNavigation()
  const route = useRoute()
  const { userInfo } = useAuth()
  const { seller } = route.params as { seller: Seller }

  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [isLiked, setIsLiked] = useState(false)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  // Load seller data and products when screen loads
  useEffect(() => {
    fetchSellerProducts()
    checkIfLiked()
  }, [])

  // Refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchSellerProducts()
    }, [])
  )

  const fetchSellerProducts = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('seller_id', seller.seller_id)
        .eq('is_available', true)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching products:', error)
        Alert.alert('Error', 'Failed to load products. Please try again.')
        return
      }

      setProducts(data || [])
      console.log(`Loaded ${(data || []).length} products for seller ${seller.name}`)
    } catch (error) {
      console.error('Error fetching products:', error)
      Alert.alert('Error', 'Failed to load products.')
    } finally {
      setLoading(false)
    }
  }

  const checkIfLiked = async () => {
    if (!userInfo?.profileData?.buyer_id) return

    try {
      const { data, error } = await supabase
        .from('buyer_liked_sellers')
        .select('seller_id')
        .eq('buyer_id', userInfo.profileData.buyer_id)
        .eq('seller_id', seller.seller_id)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking like status:', error)
        return
      }

      setIsLiked(!!data)
    } catch (error) {
      console.error('Error checking like status:', error)
    }
  }

  const toggleLike = async () => {
    if (!userInfo?.profileData?.buyer_id) return

    try {
      if (isLiked) {
        // Unlike
        const { error } = await supabase
          .from('buyer_liked_sellers')
          .delete()
          .eq('buyer_id', userInfo.profileData.buyer_id)
          .eq('seller_id', seller.seller_id)

        if (error) {
          console.error('Error unliking seller:', error)
          Alert.alert('Error', 'Failed to unlike seller.')
          return
        }

        setIsLiked(false)
      } else {
        // Like
        const { error } = await supabase
          .from('buyer_liked_sellers')
          .insert({
            buyer_id: userInfo.profileData.buyer_id,
            seller_id: seller.seller_id
          })

        if (error) {
          console.error('Error liking seller:', error)
          Alert.alert('Error', 'Failed to like seller.')
          return
        }

        setIsLiked(true)
      }
    } catch (error) {
      console.error('Error toggling like:', error)
      Alert.alert('Error', 'Failed to update like status.')
    }
  }

  const navigateToProductDetail = (product: Product) => {
    // Convert single product to aggregated format for ProductDetail screen
    const aggregatedProduct = {
      product_name: product.name,
      product_description: product.description,
      product_image_url: product.image_url,
      product_type: product.product_type,
      price_unit: product.price_unit,
      min_price: product.price,
      max_price: product.price,
      seller_count: 1,
      sellers_info: [{
        seller_id: seller.seller_id,
        seller_name: seller.name,
        seller_logo: seller.logo_url,
        price: product.price,
        is_open: seller.is_open
      }]
    }

    // @ts-ignore - Navigation type issue
    navigation.navigate("ProductDetail", { product: aggregatedProduct })
  }

  const formatDistance = (meters: number): string => {
    if (meters < 1000) {
      return `${Math.round(meters)}m away`
    } else {
      return `${(meters / 1000).toFixed(1)}km away`
    }
  }

  const formatPrice = (price: number, priceUnit: string): string => {
    return `$${price.toFixed(2)}/${priceUnit}`
  }

  const renderGridItem = ({ item }: { item: Product }) => (
    <TouchableOpacity 
      style={styles.gridItem}
      onPress={() => navigateToProductDetail(item)}
      accessibilityLabel={`View ${item.name} details`}
    >
      <View style={styles.productCard}>
        <Image 
          source={{ 
            uri: item.image_url || `https://via.placeholder.com/150?text=${item.name.charAt(0)}` 
          }} 
          style={styles.productImage} 
          accessibilityLabel={`${item.name} image`} 
        />

        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
          <Text style={styles.productPrice}>{formatPrice(item.price, item.price_unit)}</Text>
          {item.description && (
            <Text style={styles.productDescription} numberOfLines={2}>
              {item.description}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  )

  const renderListItem = ({ item }: { item: Product }) => (
    <TouchableOpacity 
      style={styles.listItem}
      onPress={() => navigateToProductDetail(item)}
      accessibilityLabel={`View ${item.name} details`}
    >
      <Image 
        source={{ 
          uri: item.image_url || `https://via.placeholder.com/80?text=${item.name.charAt(0)}` 
        }} 
        style={styles.listItemImage} 
        accessibilityLabel={`${item.name} image`} 
      />

      <View style={styles.listItemInfo}>
        <Text style={styles.productName}>{item.name}</Text>
        <Text style={styles.productPrice}>{formatPrice(item.price, item.price_unit)}</Text>
        {item.description && (
          <Text style={styles.productDescription} numberOfLines={2}>
            {item.description}
          </Text>
        )}
      </View>

      <ChevronRightIcon size={20} color={theme.colors.placeholder} />
    </TouchableOpacity>
  )

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <BuildingStorefrontIcon size={50} color={theme.colors.disabled} />
      <Text style={styles.emptyText}>No products available</Text>
      <Text style={styles.emptySubtext}>
        This vendor doesn't have any products listed at the moment
      </Text>
    </View>
  )

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header with cover and seller info */}
        <View style={styles.header}>
          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => navigation.goBack()}
              accessibilityLabel="Back button"
            >
              <ArrowLeftIcon size={24} color="#FFFFFF" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.headerButton}
              onPress={toggleLike}
              accessibilityLabel={`${isLiked ? "Unlike" : "Like"} seller`}
            >
              <HeartIcon
                size={24}
                color={isLiked ? theme.colors.error : "#FFFFFF"}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.sellerInfoHeader}>
            <Image 
              source={{ 
                uri: seller.logo_url || `https://via.placeholder.com/80?text=${seller.name.charAt(0)}` 
              }} 
              style={styles.sellerLogo} 
              accessibilityLabel="Seller logo" 
            />
            
            <View style={styles.sellerDetails}>
              <Text style={styles.sellerName}>{seller.name}</Text>
              
              <View style={styles.sellerMeta}>
                <View style={styles.distanceContainer}>
                  <MapPinIcon size={16} color="rgba(255, 255, 255, 0.9)" />
                  <Text style={styles.distanceText}>{formatDistance(seller.distance)}</Text>
                </View>
              </View>

              {seller.address && (
                <Text style={styles.sellerAddress} numberOfLines={2}>{seller.address}</Text>
              )}

              <View style={[styles.statusBadge, seller.is_open ? styles.openBadge : styles.closedBadge]}>
                <Text style={[styles.statusText, seller.is_open ? styles.openText : styles.closedText]}>
                  {seller.is_open ? "Open Now" : "Closed"}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Products section */}
        <View style={styles.productsSection}>
          <View style={styles.productsHeader}>
            <Text style={styles.sectionTitle}>
              Products ({products.length})
            </Text>

            <TouchableOpacity
              style={styles.viewModeButton}
              onPress={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
              accessibilityLabel={`Switch to ${viewMode === "grid" ? "list" : "grid"} view`}
            >
              <StarIcon 
                size={20} 
                color={theme.colors.text} 
              />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={styles.loadingText}>Loading products...</Text>
            </View>
          ) : products.length === 0 ? (
            renderEmptyState()
          ) : viewMode === "grid" ? (
            <FlatList
              key="grid"
              data={products}
              renderItem={renderGridItem}
              keyExtractor={(item) => item.product_id}
              numColumns={2}
              contentContainerStyle={styles.productsGrid}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <FlatList
              key="list"
              data={products}
              renderItem={renderListItem}
              keyExtractor={(item) => item.product_id}
              numColumns={1}
              contentContainerStyle={styles.productsList}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          )}
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
    backgroundColor: theme.colors.primary,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: spacing.xl,
  },
  headerButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  sellerInfoHeader: {
    flexDirection: "row",
    paddingHorizontal: spacing.lg,
    alignItems: "center",
  },
  sellerLogo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: spacing.md,
    backgroundColor: "#FFFFFF",
  },
  sellerDetails: {
    flex: 1,
  },
  sellerName: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: spacing.xs,
  },
  sellerMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  distanceContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  distanceText: {
    fontSize: fontSize.sm,
    color: "rgba(255, 255, 255, 0.9)",
    marginLeft: 4,
    fontWeight: "500",
  },
  sellerAddress: {
    fontSize: fontSize.sm,
    color: "rgba(255, 255, 255, 0.8)",
    marginBottom: spacing.md,
    lineHeight: 20,
    fontWeight: "400",
  },
  statusBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    alignSelf: "flex-start",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  openBadge: {
    backgroundColor: "#FFFFFF",
  },
  closedBadge: {
    backgroundColor: "#FFFFFF",
  },
  statusText: {
    fontSize: fontSize.sm,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  openText: {
    color: "#4CAF50",
  },
  closedText: {
    color: "#F44336",
  },
  productsSection: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  productsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: "bold",
    color: theme.colors.text,
  },
  viewModeButton: {
    padding: spacing.sm,
    borderRadius: 8,
    backgroundColor: "#F5F5F5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
    minHeight: 200,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: fontSize.md,
    color: theme.colors.placeholder,
  },
  productsGrid: {
    padding: spacing.md,
  },
  gridItem: {
    width: "50%",
    padding: spacing.xs,
  },
  productCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productImage: {
    width: "100%",
    height: 120,
    resizeMode: "cover",
    backgroundColor: "#F5F5F5",
  },
  productInfo: {
    padding: spacing.md,
  },
  productName: {
    fontSize: fontSize.md,
    fontWeight: "600",
    color: theme.colors.text,
    marginBottom: spacing.xs,
    lineHeight: 20,
  },
  productPrice: {
    fontSize: fontSize.sm,
    color: theme.colors.primary,
    fontWeight: "700",
    marginBottom: spacing.xs,
  },
  productDescription: {
    fontSize: fontSize.xs,
    color: theme.colors.placeholder,
    lineHeight: 16,
  },
  productsList: {
    padding: spacing.md,
  },
  listItem: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  listItemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: spacing.md,
    backgroundColor: "#F5F5F5",
  },
  listItemInfo: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
    minHeight: 200,
  },
  emptyText: {
    fontSize: fontSize.lg,
    fontWeight: "bold",
    marginTop: spacing.md,
    color: theme.colors.text,
  },
  emptySubtext: {
    fontSize: fontSize.md,
    color: theme.colors.placeholder,
    textAlign: "center",
    marginTop: spacing.sm,
    lineHeight: 22,
  },
})

export default SellerProfile
