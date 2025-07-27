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
  ScrollView,
  Platform,
  ActivityIndicator,
  RefreshControl,
} from "react-native"
import { useNavigation, useFocusEffect } from "@react-navigation/native"
import { theme, spacing, fontSize } from "../../theme"
import { 
  CheckCircleIcon, 
  ClockIcon, 
  ArrowPathIcon, 
  XCircleIcon, 
  ReceiptRefundIcon, 
  ArrowLeftIcon 
} from "react-native-heroicons/outline"
import { supabase } from "../../lib/supabase"
import { useAuth } from "../../context/AuthContext"

interface OrderItem {
  order_item_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  product_name: string;
  price_unit: string;
}

interface Order {
  order_id: string;
  seller_id: string;
  status: 'pending' | 'completed' | 'cancelled';
  total_amount: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  seller_name: string;
  seller_phone: string;
  seller_address: string | null;
  seller_logo: string | null;
  seller_is_open: boolean;
  items: OrderItem[];
  is_seller_liked: boolean;
}

const OrdersScreen = () => {
  const navigation = useNavigation()
  const { userInfo } = useAuth()
  const [activeTab, setActiveTab] = useState<"pending" | "completed" | "cancelled">("pending")
  const [orders, setOrders] = useState<{
    pending: Order[];
    completed: Order[];
    cancelled: Order[];
  }>({
    pending: [],
    completed: [],
    cancelled: []
  })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [updatingOrder, setUpdatingOrder] = useState<string | null>(null)
  const [likingSellerOrders, setLikingSellerOrders] = useState<string[]>([])

  const fetchOrders = async () => {
    if (!userInfo?.profileData?.buyer_id) {
      console.log('No buyer ID found')
      setLoading(false)
      return
    }

    try {
      // Fetch orders with seller information and order items
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          order_id,
          seller_id,
          status,
          total_amount,
          notes,
          created_at,
          updated_at,
          sellers (
            name,
            phone_number,
            address,
            logo_url,
            is_open
          )
        `)
        .eq('buyer_id', userInfo.profileData.buyer_id)
        .order('created_at', { ascending: false })

      if (ordersError) throw ordersError

      // For each order, fetch the order items with product details and check if seller is liked
      const ordersWithItemsAndLikes = await Promise.all(
        (ordersData || []).map(async (order) => {
          // Fetch order items
          const { data: itemsData, error: itemsError } = await supabase
            .from('order_items')
            .select(`
              order_item_id,
              product_id,
              quantity,
              unit_price,
              subtotal,
              products (
                name,
                price_unit
              )
            `)
            .eq('order_id', order.order_id)

          if (itemsError) {
            console.error('Error fetching order items:', itemsError)
          }

          // Check if seller is liked
          const { data: likedData, error: likedError } = await supabase
            .from('buyer_liked_sellers')
            .select('seller_id')
            .eq('buyer_id', userInfo.profileData.buyer_id)
            .eq('seller_id', order.seller_id)
            .single()

          if (likedError && likedError.code !== 'PGRST116') {
            console.error('Error checking liked status:', likedError)
          }

          const items = (itemsData || []).map(item => ({
            order_item_id: item.order_item_id,
            product_id: item.product_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            subtotal: item.subtotal,
            product_name: (item.products as any)?.name || 'Unknown Product',
            price_unit: (item.products as any)?.price_unit || 'unit'
          }))

          return {
            ...order,
            seller_name: (order.sellers as any)?.name || 'Unknown',
            seller_phone: (order.sellers as any)?.phone_number || '',
            seller_address: (order.sellers as any)?.address || '',
            seller_logo: (order.sellers as any)?.logo_url || null,
            seller_is_open: (order.sellers as any)?.is_open || false,
            items,
            is_seller_liked: !!likedData
          }
        })
      )

      // Group orders by status
      const groupedOrders = {
        pending: ordersWithItemsAndLikes.filter(order => order.status === 'pending'),
        completed: ordersWithItemsAndLikes.filter(order => order.status === 'completed'),
        cancelled: ordersWithItemsAndLikes.filter(order => order.status === 'cancelled')
      }

      setOrders(groupedOrders)
    } catch (error) {
      console.error('Error fetching orders:', error)
      Alert.alert('Error', 'Failed to load orders. Please try again.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [userInfo?.profileData?.buyer_id])

  // Refresh orders when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchOrders()
    }, [userInfo?.profileData?.buyer_id])
  )

  const onRefresh = () => {
    setRefreshing(true)
    fetchOrders()
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

    if (diffInDays === 0) {
      return "Today"
    } else if (diffInDays === 1) {
      return "Yesterday"
    } else {
      return date.toLocaleDateString()
    }
  }

  const formatPrice = (amount: number) => {
    return `₹${amount.toFixed(2)}`
  }

  const cancelOrder = async (orderId: string) => {
    setUpdatingOrder(orderId)
    
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('order_id', orderId)

      if (error) throw error

      // Refresh orders to show updated status
      await fetchOrders()
      
      Alert.alert('Success', 'Order cancelled successfully!')
    } catch (error) {
      console.error('Error cancelling order:', error)
      Alert.alert('Error', 'Failed to cancel order. Please try again.')
    } finally {
      setUpdatingOrder(null)
    }
  }

  const handleCancelOrder = (orderId: string) => {
    Alert.alert(
      "Cancel Order", 
      "Are you sure you want to cancel this order?", 
      [
        {
          text: "No",
          style: "cancel",
        },
        {
          text: "Yes, Cancel",
          style: "destructive",
          onPress: () => cancelOrder(orderId),
        },
      ]
    )
  }

  const toggleSellerLike = async (sellerId: string, orderId: string, isCurrentlyLiked: boolean) => {
    if (!userInfo?.profileData?.buyer_id) return

    setLikingSellerOrders(prev => [...prev, orderId])

    try {
      if (isCurrentlyLiked) {
        // Unlike
        const { error } = await supabase
          .from('buyer_liked_sellers')
          .delete()
          .eq('buyer_id', userInfo.profileData.buyer_id)
          .eq('seller_id', sellerId)

        if (error) throw error
      } else {
        // Like
        const { error } = await supabase
          .from('buyer_liked_sellers')
          .insert({
            buyer_id: userInfo.profileData.buyer_id,
            seller_id: sellerId
          })

        if (error) throw error
      }

      // Update local state
      setOrders(prev => {
        const updateOrdersInCategory = (categoryOrders: Order[]) => 
          categoryOrders.map(order => 
            order.order_id === orderId 
              ? { ...order, is_seller_liked: !isCurrentlyLiked }
              : order
          )

        return {
          pending: updateOrdersInCategory(prev.pending),
          completed: updateOrdersInCategory(prev.completed),
          cancelled: updateOrdersInCategory(prev.cancelled)
        }
      })

    } catch (error) {
      console.error('Error toggling seller like:', error)
      Alert.alert('Error', 'Failed to update like status.')
    } finally {
      setLikingSellerOrders(prev => prev.filter(id => id !== orderId))
    }
  }

  const handleReorder = (order: Order) => {
    // In a real app, this would add the items to the cart or navigate to the seller
    Alert.alert(
      'Reorder',
      `Add ${order.items.length} item(s) from ${order.seller_name} to cart?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Add to Cart', 
          onPress: () => {
            Alert.alert('Success', 'Items added to cart!')
            // TODO: Implement actual cart functionality
          }
        }
      ]
    )
  }

  const renderOrderItem = (item: OrderItem) => (
    <View key={item.order_item_id} style={styles.orderItem}>
      <Text style={styles.itemQuantity}>{item.quantity}x</Text>
      <Text style={styles.itemName}>{item.product_name}</Text>
      <Text style={styles.itemPrice}>{formatPrice(item.subtotal)}</Text>
    </View>
  )

  const renderPendingOrder = ({ item }: { item: Order }) => (
    <View style={styles.orderCard}>
      <View style={styles.orderHeader}>
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
            <View style={styles.sellerStatusContainer}>
              <View style={[styles.statusDot, item.seller_is_open ? styles.openDot : styles.closedDot]} />
              <Text style={[styles.sellerStatus, item.seller_is_open ? styles.openStatus : styles.closedStatus]}>
                {item.seller_is_open ? 'Open' : 'Closed'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.likeButton}
            onPress={() => toggleSellerLike(item.seller_id, item.order_id, item.is_seller_liked)}
            disabled={likingSellerOrders.includes(item.order_id)}
            accessibilityLabel={`${item.is_seller_liked ? 'Unlike' : 'Like'} seller`}
          >
            {likingSellerOrders.includes(item.order_id) ? (
              <ActivityIndicator size="small" color={theme.colors.primary} />
            ) : (
              <CheckCircleIcon size={20} color={item.is_seller_liked ? theme.colors.error : theme.colors.placeholder} />
            )}
          </TouchableOpacity>

          <Text style={styles.orderTime}>{formatDate(item.created_at)}</Text>
        </View>
      </View>

      <View style={styles.itemsContainer}>
        {item.items.map(renderOrderItem)}
      </View>

      {item.notes && (
        <View style={styles.notesContainer}>
          <Text style={styles.notesLabel}>Notes:</Text>
          <Text style={styles.notesText}>{item.notes}</Text>
        </View>
      )}

      <View style={styles.orderFooter}>
        <Text style={styles.orderTotal}>Total: {formatPrice(item.total_amount)}</Text>

        <TouchableOpacity
          style={[styles.cancelButton, updatingOrder === item.order_id && styles.disabledButton]}
          onPress={() => handleCancelOrder(item.order_id)}
          disabled={updatingOrder === item.order_id}
          accessibilityLabel="Cancel order button"
        >
          {updatingOrder === item.order_id ? (
            <ActivityIndicator size="small" color={theme.colors.error} />
          ) : (
            <Text style={styles.cancelButtonText}>Cancel Order</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  )

  const renderCompletedOrder = ({ item }: { item: Order }) => (
    <View style={styles.orderCard}>
      <View style={styles.orderHeader}>
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
            <View style={styles.sellerStatusContainer}>
              <View style={[styles.statusDot, item.seller_is_open ? styles.openDot : styles.closedDot]} />
              <Text style={[styles.sellerStatus, item.seller_is_open ? styles.openStatus : styles.closedStatus]}>
                {item.seller_is_open ? 'Open' : 'Closed'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.likeButton}
            onPress={() => toggleSellerLike(item.seller_id, item.order_id, item.is_seller_liked)}
            disabled={likingSellerOrders.includes(item.order_id)}
            accessibilityLabel={`${item.is_seller_liked ? 'Unlike' : 'Like'} seller`}
          >
            {likingSellerOrders.includes(item.order_id) ? (
              <ActivityIndicator size="small" color={theme.colors.primary} />
            ) : (
              <CheckCircleIcon size={20} color={item.is_seller_liked ? theme.colors.error : theme.colors.placeholder} />
            )}
          </TouchableOpacity>

          <Text style={styles.orderTime}>{formatDate(item.created_at)}</Text>
        </View>
      </View>

      <View style={styles.itemsContainer}>
        {item.items.map(renderOrderItem)}
      </View>

      {item.notes && (
        <View style={styles.notesContainer}>
          <Text style={styles.notesLabel}>Notes:</Text>
          <Text style={styles.notesText}>{item.notes}</Text>
        </View>
      )}

      <View style={styles.orderFooter}>
        <Text style={styles.orderTotal}>Total: {formatPrice(item.total_amount)}</Text>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.reorderButton}
            onPress={() => handleReorder(item)}
            accessibilityLabel="Reorder button"
          >
            <ArrowPathIcon size={16} color="#FFFFFF" />
            <Text style={styles.reorderButtonText}>Reorder</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )

  const renderCancelledOrder = ({ item }: { item: Order }) => (
    <View style={styles.orderCard}>
      <View style={styles.orderHeader}>
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
            <View style={styles.sellerStatusContainer}>
              <View style={[styles.statusDot, item.seller_is_open ? styles.openDot : styles.closedDot]} />
              <Text style={[styles.sellerStatus, item.seller_is_open ? styles.openStatus : styles.closedStatus]}>
                {item.seller_is_open ? 'Open' : 'Closed'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.likeButton}
            onPress={() => toggleSellerLike(item.seller_id, item.order_id, item.is_seller_liked)}
            disabled={likingSellerOrders.includes(item.order_id)}
            accessibilityLabel={`${item.is_seller_liked ? 'Unlike' : 'Like'} seller`}
          >
            {likingSellerOrders.includes(item.order_id) ? (
              <ActivityIndicator size="small" color={theme.colors.primary} />
            ) : (
              <CheckCircleIcon size={20} color={item.is_seller_liked ? theme.colors.error : theme.colors.placeholder} />
            )}
          </TouchableOpacity>

          <Text style={styles.orderTime}>{formatDate(item.created_at)}</Text>
        </View>
      </View>

      <View style={styles.itemsContainer}>
        {item.items.map(renderOrderItem)}
      </View>

      {item.notes && (
        <View style={styles.notesContainer}>
          <Text style={styles.notesLabel}>Notes:</Text>
          <Text style={styles.notesText}>{item.notes}</Text>
        </View>
      )}

      <View style={styles.orderFooter}>
        <Text style={styles.orderTotal}>Total: {formatPrice(item.total_amount)}</Text>

        <View style={styles.statusBadge}>
          <XCircleIcon size={16} color={theme.colors.error} />
          <Text style={[styles.statusText, { color: theme.colors.error }]}>Cancelled</Text>
        </View>
      </View>
    </View>
  )

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <ReceiptRefundIcon size={50} color={theme.colors.disabled} />
      <Text style={styles.emptyText}>No orders yet</Text>
      <Text style={styles.emptySubtext}>
        {activeTab === 'pending' ? 'Your pending orders will appear here' :
         activeTab === 'completed' ? 'Your completed orders will appear here' :
         'Your cancelled orders will appear here'}
      </Text>
    </View>
  )

  const getTabData = () => {
    switch (activeTab) {
      case 'pending':
        return orders.pending
      case 'completed':
        return orders.completed
      case 'cancelled':
        return orders.cancelled
      default:
        return []
    }
  }

  const getTabCount = (tab: string) => {
    switch (tab) {
      case 'pending':
        return orders.pending.length
      case 'completed':
        return orders.completed.length
      case 'cancelled':
        return orders.cancelled.length
      default:
        return 0
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              accessibilityLabel="Back button"
            >
              <ArrowLeftIcon size={24} color={theme.colors.text} />
            </TouchableOpacity>
            <Text style={styles.title}>My Orders</Text>
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading orders...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            accessibilityLabel="Back button"
          >
            <ArrowLeftIcon size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>My Orders</Text>
        </View>
      </View>

      <View style={styles.tabsContainer}>
        <View style={styles.tabsWrapper}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "pending" && styles.activeTab]}
            onPress={() => setActiveTab("pending")}
            accessibilityLabel="Pending tab"
          >
            <View style={[styles.tabContent, activeTab === "pending" && styles.activeTabContent]}>
              <Text style={[styles.tabText, activeTab === "pending" && styles.activeTabText]}>
                Pending
              </Text>
              {getTabCount('pending') > 0 && (
                <View style={[styles.tabBadge, activeTab === "pending" && styles.activeTabBadge]}>
                  <Text style={[styles.tabBadgeText, activeTab === "pending" && styles.activeTabBadgeText]}>
                    {getTabCount('pending')}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === "completed" && styles.activeTab]}
            onPress={() => setActiveTab("completed")}
            accessibilityLabel="Completed tab"
          >
            <View style={[styles.tabContent, activeTab === "completed" && styles.activeTabContent]}>
              <Text style={[styles.tabText, activeTab === "completed" && styles.activeTabText]}>
                Completed
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === "cancelled" && styles.activeTab]}
            onPress={() => setActiveTab("cancelled")}
            accessibilityLabel="Cancelled tab"
          >
            <View style={[styles.tabContent, activeTab === "cancelled" && styles.activeTabContent]}>
              <Text style={[styles.tabText, activeTab === "cancelled" && styles.activeTabText]}>
                Cancelled
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={getTabData()}
        renderItem={
          activeTab === "pending"
            ? renderPendingOrder
            : activeTab === "completed"
              ? renderCompletedOrder
              : renderCancelledOrder
        }
        keyExtractor={(item) => item.order_id}
        contentContainerStyle={styles.ordersList}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
          />
        }
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
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    padding: spacing.xs,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: theme.colors.text,
    marginLeft: spacing.md,
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
  tabsContainer: {
    backgroundColor: "#F8F9FA",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  tabsWrapper: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: spacing.xs,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: 8,
    marginHorizontal: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  activeTab: {
    backgroundColor: theme.colors.primary,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  tabContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  activeTabContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  tabText: {
    fontSize: fontSize.sm,
    fontWeight: "600",
    color: theme.colors.placeholder,
  },
  activeTabText: {
    fontSize: fontSize.sm,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  tabBadge: {
    backgroundColor: "#E0E0E0",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    paddingHorizontal: spacing.xs,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: spacing.xs,
  },
  activeTabBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    paddingHorizontal: spacing.xs,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: spacing.xs,
  },
  tabBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: theme.colors.text,
  },
  activeTabBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  ordersList: {
    padding: spacing.md,
  },
  orderCard: {
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
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.md,
  },
  sellerInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
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
    fontSize: fontSize.md,
    fontWeight: "bold",
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
  },
  openStatus: {
    color: "#4CAF50",
  },
  closedStatus: {
    color: "#F44336",
  },
  headerActions: {
    alignItems: "flex-end",
  },
  likeButton: {
    padding: spacing.xs,
    marginBottom: spacing.xs,
  },
  orderTime: {
    fontSize: fontSize.sm,
    color: theme.colors.placeholder,
  },
  itemsContainer: {
    marginBottom: spacing.md,
  },
  orderItem: {
    flexDirection: "row",
    marginBottom: spacing.xs,
  },
  itemQuantity: {
    fontSize: fontSize.sm,
    fontWeight: "bold",
    marginRight: spacing.sm,
    width: 30,
  },
  itemName: {
    fontSize: fontSize.sm,
    flex: 1,
  },
  itemPrice: {
    fontSize: fontSize.sm,
    fontWeight: "bold",
  },
  notesContainer: {
    marginBottom: spacing.md,
    backgroundColor: "#F9F9F9",
    padding: spacing.sm,
    borderRadius: 4,
  },
  notesLabel: {
    fontSize: fontSize.sm,
    fontWeight: "bold",
    marginBottom: spacing.xs,
  },
  notesText: {
    fontSize: fontSize.sm,
    color: theme.colors.text,
  },
  orderFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    paddingTop: spacing.md,
  },
  orderTotal: {
    fontSize: fontSize.md,
    fontWeight: "bold",
  },
  cancelButton: {
    backgroundColor: theme.colors.error,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  actionButtons: {
    flexDirection: "row",
  },
  reorderButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    minWidth: 100,
    justifyContent: 'center',
  },
  reorderButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    marginLeft: 4,
  },
  disabledButton: {
    opacity: 0.6,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 4,
  },
  statusText: {
    fontSize: fontSize.sm,
    fontWeight: "bold",
    marginLeft: 4,
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

export default OrdersScreen
