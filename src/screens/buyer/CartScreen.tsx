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
  Alert,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from "react-native"
import { useNavigation, useFocusEffect } from "@react-navigation/native"
import { theme, spacing, fontSize } from "../../theme"
import { ShoppingCartIcon, MinusIcon, PlusIcon, TrashIcon } from "react-native-heroicons/outline"
import { supabase } from "../../lib/supabase"
import { useAuth } from "../../context/AuthContext"

interface CartItem {
  cart_item_id: string;
  product_id: string;
  quantity: number;
  price_at_time: number;
  price_unit: string;
  product_name: string;
  product_image_url: string | null;
}

interface SellerCart {
  seller_id: string;
  seller_name: string;
  seller_logo: string | null;
  seller_address: string | null;
  seller_is_open: boolean;
  items: CartItem[];
  total_amount: number;
}

const CartScreen = () => {
  const navigation = useNavigation()
  const { userInfo } = useAuth()
  const [sellerCarts, setSellerCarts] = useState<SellerCart[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [placingOrders, setPlacingOrders] = useState<string[]>([])

  const fetchCartItems = async () => {
    if (!userInfo?.profileData?.buyer_id) {
      console.log('No buyer ID found')
      setLoading(false)
      return
    }

    try {
      // Fetch cart items with product and seller information
      const { data: cartData, error: cartError } = await supabase
        .from('cart_items')
        .select(`
          cart_item_id,
          product_id,
          quantity,
          price_at_time,
          price_unit,
          seller_id,
          products (
            name,
            image_url
          ),
          sellers (
            name,
            logo_url,
            address,
            is_open
          )
        `)
        .eq('buyer_id', userInfo.profileData.buyer_id)
        .order('created_at', { ascending: false })

      if (cartError) throw cartError

      // Group cart items by seller
      const groupedBySeller = (cartData || []).reduce((acc, item) => {
        const sellerId = item.seller_id
        const sellerInfo = item.sellers as any
        const productInfo = item.products as any

        if (!acc[sellerId]) {
          acc[sellerId] = {
            seller_id: sellerId,
            seller_name: sellerInfo?.name || 'Unknown Seller',
            seller_logo: sellerInfo?.logo_url || null,
            seller_address: sellerInfo?.address || null,
            seller_is_open: sellerInfo?.is_open || false,
            items: [],
            total_amount: 0
          }
        }

        const cartItem: CartItem = {
          cart_item_id: item.cart_item_id,
          product_id: item.product_id,
          quantity: item.quantity,
          price_at_time: item.price_at_time,
          price_unit: item.price_unit,
          product_name: productInfo?.name || 'Unknown Product',
          product_image_url: productInfo?.image_url || null
        }

        acc[sellerId].items.push(cartItem)
        acc[sellerId].total_amount += item.price_at_time * item.quantity

        return acc
      }, {} as Record<string, SellerCart>)

      setSellerCarts(Object.values(groupedBySeller))
    } catch (error) {
      console.error('Error fetching cart items:', error)
      Alert.alert('Error', 'Failed to load cart items. Please try again.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchCartItems()
  }, [userInfo?.profileData?.buyer_id])

  // Refresh cart when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchCartItems()
    }, [userInfo?.profileData?.buyer_id])
  )

  const onRefresh = () => {
    setRefreshing(true)
    fetchCartItems()
  }

  const updateCartItemQuantity = async (cartItemId: string, sellerId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeCartItem(cartItemId, sellerId)
      return
    }

    try {
      const { error } = await supabase
        .from('cart_items')
        .update({ quantity: newQuantity })
        .eq('cart_item_id', cartItemId)

      if (error) throw error

      // Update local state
      setSellerCarts(prev => prev.map(sellerCart => {
        if (sellerCart.seller_id === sellerId) {
          const updatedItems = sellerCart.items.map(item => 
            item.cart_item_id === cartItemId 
              ? { ...item, quantity: newQuantity }
              : item
          )
          const newTotal = updatedItems.reduce((sum, item) => sum + (item.price_at_time * item.quantity), 0)
          return { ...sellerCart, items: updatedItems, total_amount: newTotal }
        }
        return sellerCart
      }))

    } catch (error) {
      console.error('Error updating cart item:', error)
      Alert.alert('Error', 'Failed to update item quantity.')
    }
  }

  const removeCartItem = async (cartItemId: string, sellerId: string) => {
    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('cart_item_id', cartItemId)

      if (error) throw error

      // Update local state
      setSellerCarts(prev => {
        const updated = prev.map(sellerCart => {
          if (sellerCart.seller_id === sellerId) {
            const updatedItems = sellerCart.items.filter(item => item.cart_item_id !== cartItemId)
            const newTotal = updatedItems.reduce((sum, item) => sum + (item.price_at_time * item.quantity), 0)
            return { ...sellerCart, items: updatedItems, total_amount: newTotal }
          }
          return sellerCart
        }).filter(sellerCart => sellerCart.items.length > 0) // Remove empty seller carts

        return updated
      })

    } catch (error) {
      console.error('Error removing cart item:', error)
      Alert.alert('Error', 'Failed to remove item.')
    }
  }

  const placeOrder = async (sellerCart: SellerCart) => {
    if (!userInfo?.profileData?.buyer_id) return

    setPlacingOrders(prev => [...prev, sellerCart.seller_id])

    try {
      // Create order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          buyer_id: userInfo.profileData.buyer_id,
          seller_id: sellerCart.seller_id,
          status: 'pending',
          total_amount: sellerCart.total_amount,
          notes: null
        })
        .select('order_id')
        .single()

      if (orderError) throw orderError

      // Create order items
      const orderItems = sellerCart.items.map(item => ({
        order_id: orderData.order_id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.price_at_time,
        subtotal: item.price_at_time * item.quantity
      }))

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems)

      if (itemsError) throw itemsError

      // Remove items from cart
      const cartItemIds = sellerCart.items.map(item => item.cart_item_id)
      const { error: deleteError } = await supabase
        .from('cart_items')
        .delete()
        .in('cart_item_id', cartItemIds)

      if (deleteError) throw deleteError

      // Update local state
      setSellerCarts(prev => prev.filter(cart => cart.seller_id !== sellerCart.seller_id))

      Alert.alert(
        'Order Placed!',
        `Your order from ${sellerCart.seller_name} has been placed successfully.`,
        [
          {
            text: 'View Orders',
            onPress: () => {
              // @ts-ignore - Navigation type issue
              navigation.navigate('Orders')
            }
          },
          { text: 'Continue Shopping', style: 'default' }
        ]
      )

    } catch (error) {
      console.error('Error placing order:', error)
      Alert.alert('Error', 'Failed to place order. Please try again.')
    } finally {
      setPlacingOrders(prev => prev.filter(id => id !== sellerCart.seller_id))
    }
  }

  const handlePlaceOrder = (sellerCart: SellerCart) => {
    if (!sellerCart.seller_is_open) {
      Alert.alert('Shop Closed', `${sellerCart.seller_name} is currently closed. You cannot place an order right now.`)
      return
    }

    Alert.alert(
      'Confirm Order',
      `Place order with ${sellerCart.seller_name} for ₹${sellerCart.total_amount.toFixed(2)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Place Order', 
          onPress: () => placeOrder(sellerCart)
        }
      ]
    )
  }

  const formatPrice = (amount: number) => {
    return `₹${amount.toFixed(2)}`
  }

  const renderCartItem = (item: CartItem, sellerId: string) => (
    <View key={item.cart_item_id} style={styles.cartItem}>
      <Image 
        source={{ 
          uri: item.product_image_url || `https://via.placeholder.com/60?text=${item.product_name.charAt(0)}` 
        }} 
        style={styles.itemImage} 
        accessibilityLabel={`${item.product_name} image`} 
      />

      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.product_name}</Text>
        <Text style={styles.itemPrice}>
          {formatPrice(item.price_at_time)}/{item.price_unit}
        </Text>
      </View>

      <View style={styles.quantityControls}>
        <TouchableOpacity
          style={styles.quantityButton}
          onPress={() => updateCartItemQuantity(item.cart_item_id, sellerId, item.quantity - 1)}
          accessibilityLabel={`Decrease ${item.product_name} quantity`}
        >
          <MinusIcon size={20} color={theme.colors.text} />
        </TouchableOpacity>

        <Text style={styles.quantityText}>{item.quantity}</Text>

        <TouchableOpacity
          style={styles.quantityButton}
          onPress={() => updateCartItemQuantity(item.cart_item_id, sellerId, item.quantity + 1)}
          accessibilityLabel={`Increase ${item.product_name} quantity`}
        >
          <PlusIcon size={20} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => removeCartItem(item.cart_item_id, sellerId)}
        accessibilityLabel={`Remove ${item.product_name} from cart`}
      >
        <TrashIcon size={20} color={theme.colors.error} />
      </TouchableOpacity>
    </View>
  )

  const renderSellerCart = ({ item }: { item: SellerCart }) => (
    <View style={styles.sellerCard}>
      <View style={styles.sellerHeader}>
        <View style={styles.sellerInfo}>
          <Image
            source={{ 
              uri: item.seller_logo || `https://via.placeholder.com/50?text=${item.seller_name.charAt(0)}` 
            }}
            style={styles.sellerLogo}
            accessibilityLabel={`${item.seller_name} logo`}
          />
          <View style={styles.sellerDetails}>
            <Text style={styles.sellerName}>{item.seller_name}</Text>
            {item.seller_address && (
              <Text style={styles.sellerAddress} numberOfLines={1}>{item.seller_address}</Text>
            )}
            <View style={styles.sellerStatusContainer}>
              <View style={[styles.statusDot, item.seller_is_open ? styles.openDot : styles.closedDot]} />
              <Text style={[styles.sellerStatus, item.seller_is_open ? styles.openStatus : styles.closedStatus]}>
                {item.seller_is_open ? 'Open' : 'Closed'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.itemsContainer}>
        {item.items.map(cartItem => renderCartItem(cartItem, item.seller_id))}
      </View>

      <View style={styles.sellerFooter}>
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Total:</Text>
          <Text style={styles.totalAmount}>{formatPrice(item.total_amount)}</Text>
        </View>

        <TouchableOpacity
          style={[
            styles.placeOrderButton, 
            (!item.seller_is_open || placingOrders.includes(item.seller_id)) && styles.disabledButton
          ]}
          onPress={() => handlePlaceOrder(item)}
          disabled={!item.seller_is_open || placingOrders.includes(item.seller_id)}
          accessibilityLabel="Place order button"
        >
          {placingOrders.includes(item.seller_id) ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.placeOrderText}>
              {item.seller_is_open ? 'Place Order' : 'Shop Closed'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  )

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <ShoppingCartIcon size={80} color={theme.colors.disabled} />
      <Text style={styles.emptyText}>Your cart is empty</Text>
      <Text style={styles.emptySubtext}>
        Browse products and add them to your cart to get started
      </Text>
      <TouchableOpacity
        style={styles.browseButton}
        onPress={() => {
          // @ts-ignore - Navigation type issue
          navigation.navigate('Shop')
        }}
        accessibilityLabel="Browse products button"
      >
        <Text style={styles.browseButtonText}>Browse Products</Text>
      </TouchableOpacity>
    </View>
  )

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Shopping Cart</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading your cart...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Shopping Cart</Text>
        {sellerCarts.length > 0 && (
          <Text style={styles.cartCount}>
            {sellerCarts.reduce((total, cart) => total + cart.items.length, 0)} items
          </Text>
        )}
      </View>

      <FlatList
        data={sellerCarts}
        renderItem={renderSellerCart}
        keyExtractor={(item) => item.seller_id}
        contentContainerStyle={styles.cartList}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
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
    paddingHorizontal: spacing.lg,
    paddingTop: Platform.OS === 'ios' ? 60 : spacing.xl,
    paddingBottom: spacing.lg,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: theme.colors.text,
  },
  cartCount: {
    fontSize: fontSize.md,
    color: theme.colors.placeholder,
    marginTop: spacing.xs,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: fontSize.md,
    color: theme.colors.placeholder,
  },
  cartList: {
    padding: spacing.md,
  },
  sellerCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sellerHeader: {
    marginBottom: spacing.md,
  },
  sellerInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  sellerLogo: {
    width: 60,
    height: 60,
    borderRadius: 30,
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
  sellerAddress: {
    fontSize: fontSize.sm,
    color: theme.colors.placeholder,
    marginBottom: spacing.xs,
  },
  sellerStatusContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.xs,
  },
  openDot: {
    backgroundColor: "#4CAF50",
  },
  closedDot: {
    backgroundColor: "#F44336",
  },
  sellerStatus: {
    fontSize: fontSize.sm,
    fontWeight: "500",
  },
  openStatus: {
    color: "#4CAF50",
  },
  closedStatus: {
    color: "#F44336",
  },
  itemsContainer: {
    marginBottom: spacing.md,
  },
  cartItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: spacing.md,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: fontSize.md,
    fontWeight: "600",
    marginBottom: spacing.xs,
  },
  itemPrice: {
    fontSize: fontSize.sm,
    color: theme.colors.primary,
    fontWeight: "500",
  },
  quantityControls: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: spacing.md,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
  },
  quantityText: {
    fontSize: fontSize.md,
    fontWeight: "bold",
    marginHorizontal: spacing.md,
    minWidth: 30,
    textAlign: "center",
  },
  removeButton: {
    padding: spacing.sm,
  },
  sellerFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    paddingTop: spacing.md,
  },
  totalContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  totalLabel: {
    fontSize: fontSize.lg,
    fontWeight: "bold",
    marginRight: spacing.sm,
  },
  totalAmount: {
    fontSize: fontSize.lg,
    fontWeight: "bold",
    color: theme.colors.primary,
  },
  placeOrderButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  placeOrderText: {
    color: "#FFFFFF",
    fontSize: fontSize.md,
    fontWeight: "bold",
  },
  disabledButton: {
    opacity: 0.6,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
    marginTop: spacing.xxl,
  },
  emptyText: {
    fontSize: fontSize.xl,
    fontWeight: "bold",
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  emptySubtext: {
    fontSize: fontSize.md,
    color: theme.colors.placeholder,
    textAlign: "center",
    marginBottom: spacing.xl,
    lineHeight: 22,
  },
  browseButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: 8,
  },
  browseButtonText: {
    color: "#FFFFFF",
    fontSize: fontSize.md,
    fontWeight: "bold",
  },
})

export default CartScreen
