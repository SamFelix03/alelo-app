"use client"

import { useState, useEffect } from "react"
import { 
  View, 
  StyleSheet, 
  Text, 
  Image, 
  FlatList, 
  TouchableOpacity, 
  SafeAreaView, 
  ScrollView, 
  Alert,
  ActivityIndicator 
} from "react-native"
import { useNavigation, useRoute } from "@react-navigation/native"
import { theme, spacing, fontSize } from "../../theme"
import { Ionicons } from "@expo/vector-icons"
import { useAuth } from "../../context/AuthContext"
import { supabase } from "../../lib/supabase"

interface SellerInfo {
  seller_id: string;
  seller_name: string;
  seller_logo: string | null;
  price: number;
  is_open: boolean;
}

interface AggregatedProduct {
  product_name: string;
  product_description: string | null;
  product_image_url: string | null;
  product_type: string;
  price_unit: string;
  min_price: number;
  max_price: number;
  seller_count: number;
  sellers_info: SellerInfo[];
}

interface CartItem {
  product_name: string;
  seller_id: string;
  seller_name: string;
  price: number;
  price_unit: string;
  quantity: number;
  image_url: string | null;
}

const ProductDetail = () => {
  const navigation = useNavigation()
  const route = useRoute()
  const { userInfo } = useAuth()
  const { product } = route.params as { product: AggregatedProduct }

  const [quantity, setQuantity] = useState(1)
  const [selectedSeller, setSelectedSeller] = useState<SellerInfo | null>(null)
  const [loading, setLoading] = useState(false)

  // Auto-select the first available seller
  useEffect(() => {
    if (product.sellers_info && product.sellers_info.length > 0) {
      const firstOpenSeller = product.sellers_info.find(seller => seller.is_open)
      if (firstOpenSeller) {
        setSelectedSeller(firstOpenSeller)
      }
    }
  }, [product])

  const handleQuantityChange = (increment: number) => {
    const newQuantity = quantity + increment
    if (newQuantity >= 1) {
      setQuantity(newQuantity)
    }
  }

  const handleSellerSelect = (seller: SellerInfo) => {
    if (seller.is_open) {
      setSelectedSeller(seller)
    }
  }

  const navigateToSellerProfile = (seller: SellerInfo) => {
    // @ts-ignore - Navigation type issue
    navigation.navigate("SellerProfile", { sellerId: seller.seller_id })
  }

  const addToCart = async () => {
    if (!selectedSeller || !userInfo?.profileData?.buyer_id) {
      Alert.alert('Error', 'Please select a seller first')
      return
    }

    setLoading(true)

    try {
      // First, get the actual product_id for this specific seller
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('product_id')
        .eq('seller_id', selectedSeller.seller_id)
        .eq('name', product.product_name)
        .single()

      if (productError) {
        console.error('Error finding product:', productError)
        throw new Error('Product not found for this seller')
      }

      // Check if item already exists in cart
      const { data: existingItem, error: checkError } = await supabase
        .from('cart_items')
        .select('cart_item_id, quantity')
        .eq('buyer_id', userInfo.profileData.buyer_id)
        .eq('seller_id', selectedSeller.seller_id)
        .eq('product_id', productData.product_id)
        .single()

      if (checkError && checkError.code !== 'PGRST116') {
        // PGRST116 means no rows returned, which is expected if item doesn't exist
        throw checkError
      }

      if (existingItem) {
        // Update existing item quantity
        const newQuantity = existingItem.quantity + quantity
        const { error: updateError } = await supabase
          .from('cart_items')
          .update({ quantity: newQuantity })
          .eq('cart_item_id', existingItem.cart_item_id)

        if (updateError) throw updateError
      } else {
        // Add new item to cart
        const { error: insertError } = await supabase
          .from('cart_items')
          .insert({
            buyer_id: userInfo.profileData.buyer_id,
            seller_id: selectedSeller.seller_id,
            product_id: productData.product_id,
            quantity: quantity,
            price_at_time: selectedSeller.price,
            price_unit: product.price_unit
          })

        if (insertError) throw insertError
      }

      Alert.alert(
        'Added to Cart!', 
        `${quantity} ${product.price_unit}${quantity !== 1 ? 's' : ''} of ${product.product_name} from ${selectedSeller.seller_name} added to your cart.`,
        [
          {
            text: 'Continue Shopping',
            style: 'default'
          },
          {
            text: 'View Cart',
            style: 'default',
            onPress: () => {
              // @ts-ignore - Navigation type issue
              navigation.navigate('Cart')
            }
          }
        ]
      )

    } catch (error) {
      console.error('Error adding to cart:', error)
      Alert.alert('Error', 'Failed to add item to cart. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const formatDistance = (sellerId: string): string => {
    // This would typically come from location calculations
    // For now, return a placeholder
    return "0.5 km"
  }

  const formatPrice = (price: number, priceUnit: string): string => {
    return `₹${price.toFixed(2)}/${priceUnit}`
  }

  const renderSellerItem = ({ item }: { item: SellerInfo }) => (
    <TouchableOpacity
      style={[
        styles.sellerCard,
        selectedSeller?.seller_id === item.seller_id && styles.sellerCardSelected,
        !item.is_open && styles.sellerCardDisabled,
      ]}
      onPress={() => handleSellerSelect(item)}
      disabled={!item.is_open}
      accessibilityLabel={`${item.seller_name} seller card`}
    >
      <Image 
        source={{ 
          uri: item.seller_logo || `https://via.placeholder.com/50?text=${item.seller_name.charAt(0)}` 
        }} 
        style={styles.sellerLogo} 
        accessibilityLabel={`${item.seller_name} logo`} 
      />

      <View style={styles.sellerInfo}>
        <Text style={styles.sellerName}>{item.seller_name}</Text>

        <View style={styles.sellerMetaRow}>
          <View style={styles.distanceContainer}>
            <Ionicons name="location" size={14} color={theme.colors.placeholder} />
            <Text style={styles.distanceText}>{formatDistance(item.seller_id)}</Text>
          </View>
        </View>

        <View style={styles.priceRow}>
          <Text style={styles.priceText}>{formatPrice(item.price, product.price_unit)}</Text>

          <View style={[styles.statusBadge, item.is_open ? styles.openBadge : styles.closedBadge]}>
            <Text style={[styles.statusText, item.is_open ? styles.openText : styles.closedText]}>
              {item.is_open ? "Open" : "Closed"}
            </Text>
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={styles.viewButton}
        onPress={() => navigateToSellerProfile(item)}
        accessibilityLabel={`View ${item.seller_name} profile`}
      >
        <Ionicons name="chevron-forward" size={20} color={theme.colors.primary} />
      </TouchableOpacity>
    </TouchableOpacity>
  )

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            accessibilityLabel="Back button"
          >
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>

          <Text style={styles.title}>{product.product_name}</Text>
        </View>

        <Image
          source={{ 
            uri: product.product_image_url || `https://via.placeholder.com/300?text=${product.product_name}` 
          }}
          style={styles.productImage}
          accessibilityLabel={`${product.product_name} image`}
        />

        <View style={styles.productDetails}>
          <Text style={styles.productName}>{product.product_name}</Text>
          <Text style={styles.priceRange}>
            {product.min_price === product.max_price 
              ? `₹${product.min_price.toFixed(2)}/${product.price_unit}`
              : `₹${product.min_price.toFixed(2)} - ₹${product.max_price.toFixed(2)}/${product.price_unit}`
            }
          </Text>

          {product.product_description && (
            <Text style={styles.productDescription}>{product.product_description}</Text>
          )}

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>
            Available from {product.seller_count} seller{product.seller_count !== 1 ? 's' : ''}
          </Text>

          <View style={styles.quantityContainer}>
            <Text style={styles.quantityLabel}>Quantity:</Text>

            <View style={styles.quantityControls}>
              <TouchableOpacity
                style={[styles.quantityButton, quantity <= 1 && styles.quantityButtonDisabled]}
                onPress={() => handleQuantityChange(-1)}
                disabled={quantity <= 1}
                accessibilityLabel="Decrease quantity"
              >
                <Ionicons name="remove" size={20} color={quantity <= 1 ? theme.colors.disabled : theme.colors.text} />
              </TouchableOpacity>

              <Text style={styles.quantityText}>{quantity}</Text>

              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => handleQuantityChange(1)}
                accessibilityLabel="Increase quantity"
              >
                <Ionicons name="add" size={20} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <FlatList
          data={product.sellers_info}
          renderItem={renderSellerItem}
          keyExtractor={(item) => item.seller_id}
          contentContainerStyle={styles.sellersList}
          scrollEnabled={false}
        />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.addToCartButton, 
            (!selectedSeller || !selectedSeller.is_open || loading) && styles.addToCartButtonDisabled
          ]}
          onPress={addToCart}
          disabled={!selectedSeller || !selectedSeller.is_open || loading}
          accessibilityLabel="Add to cart button"
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.addToCartButtonText}>
              {selectedSeller 
                ? `Add to Cart - ₹${(selectedSeller.price * quantity).toFixed(2)}`
                : "Select a Seller"
              }
            </Text>
          )}
        </TouchableOpacity>
      </View>
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
    alignItems: "center",
    padding: spacing.md,
    paddingTop: 50,
  },
  backButton: {
    marginRight: spacing.md,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: "bold",
    flex: 1,
  },
  productImage: {
    width: "100%",
    height: 250,
    resizeMode: "cover",
    backgroundColor: "#F5F5F5",
  },
  productDetails: {
    padding: spacing.lg,
  },
  productName: {
    fontSize: fontSize.xl,
    fontWeight: "bold",
    marginBottom: spacing.xs,
  },
  priceRange: {
    fontSize: fontSize.lg,
    color: theme.colors.primary,
    fontWeight: "bold",
    marginBottom: spacing.md,
  },
  productDescription: {
    fontSize: fontSize.md,
    color: theme.colors.placeholder,
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  divider: {
    height: 1,
    backgroundColor: "#F0F0F0",
    marginVertical: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: "bold",
    marginBottom: spacing.md,
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.lg,
  },
  quantityLabel: {
    fontSize: fontSize.md,
    fontWeight: "bold",
  },
  quantityControls: {
    flexDirection: "row",
    alignItems: "center",
  },
  quantityButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
  },
  quantityButtonDisabled: {
    opacity: 0.5,
  },
  quantityText: {
    fontSize: fontSize.lg,
    fontWeight: "bold",
    marginHorizontal: spacing.md,
    minWidth: 30,
    textAlign: "center",
  },
  sellersList: {
    padding: spacing.md,
  },
  sellerCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  sellerCardSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: "#F9FFF9",
  },
  sellerCardDisabled: {
    opacity: 0.7,
  },
  sellerLogo: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: spacing.md,
    backgroundColor: "#F5F5F5",
  },
  sellerInfo: {
    flex: 1,
  },
  sellerName: {
    fontSize: fontSize.md,
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
  },
  distanceText: {
    fontSize: fontSize.sm,
    color: theme.colors.placeholder,
    marginLeft: 2,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  priceText: {
    fontSize: fontSize.md,
    fontWeight: "bold",
    color: theme.colors.primary,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 4,
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
  viewButton: {
    justifyContent: "center",
    padding: spacing.xs,
  },
  footer: {
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    backgroundColor: "#FFFFFF",
  },
  addToCartButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    padding: spacing.md,
    alignItems: "center",
    minHeight: 48,
    justifyContent: "center",
  },
  addToCartButtonDisabled: {
    backgroundColor: theme.colors.disabled,
  },
  addToCartButtonText: {
    color: "#FFFFFF",
    fontSize: fontSize.lg,
    fontWeight: "bold",
  },
})

export default ProductDetail
