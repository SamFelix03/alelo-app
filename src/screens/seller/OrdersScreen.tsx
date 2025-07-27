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
  Linking,
} from "react-native"
import { useNavigation, useFocusEffect } from "@react-navigation/native"
import { theme, spacing, fontSize } from "../../theme"
import { 
  PhoneIcon, 
  MapIcon, 
  MapPinIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  ReceiptRefundIcon 
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
  buyer_id: string;
  status: 'pending' | 'completed' | 'cancelled';
  total_amount: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  buyer_name: string;
  buyer_phone: string;
  buyer_address: string | null;
  buyer_profile_pic: string | null;
  items: OrderItem[];
}

const OrdersScreen = () => {
  const navigation = useNavigation()
  const { userInfo } = useAuth()
  const [activeTab, setActiveTab] = useState("pending") // 'pending', 'history', 'cancelled'
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

  const fetchOrders = async () => {
    if (!userInfo?.profileData?.seller_id) {
      console.log('No seller ID found')
      setLoading(false)
      return
    }

    try {
      // Fetch orders with buyer information and order items
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          order_id,
          buyer_id,
          status,
          total_amount,
          notes,
          created_at,
          updated_at,
          buyers (
            name,
            phone_number,
            address,
            profile_pic_url
          )
        `)
        .eq('seller_id', userInfo.profileData.seller_id)
        .order('created_at', { ascending: false })

      if (ordersError) throw ordersError

      // For each order, fetch the order items with product details
      const ordersWithItems = await Promise.all(
        (ordersData || []).map(async (order) => {
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
            return {
              ...order,
              buyer_name: (order.buyers as any)?.name || 'Unknown',
              buyer_phone: (order.buyers as any)?.phone_number || '',
              buyer_address: (order.buyers as any)?.address || '',
              buyer_profile_pic: (order.buyers as any)?.profile_pic_url || null,
              items: []
            }
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
            buyer_name: (order.buyers as any)?.name || 'Unknown',
            buyer_phone: (order.buyers as any)?.phone_number || '',
            buyer_address: (order.buyers as any)?.address || '',
            buyer_profile_pic: (order.buyers as any)?.profile_pic_url || null,
            items
          }
        })
      )

      // Group orders by status
      const groupedOrders = {
        pending: ordersWithItems.filter(order => order.status === 'pending'),
        completed: ordersWithItems.filter(order => order.status === 'completed'),
        cancelled: ordersWithItems.filter(order => order.status === 'cancelled')
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
  }, [userInfo?.profileData?.seller_id])

  // Refresh orders when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchOrders()
    }, [userInfo?.profileData?.seller_id])
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
    return `$${amount.toFixed(2)}`
  }

  const updateOrderStatus = async (orderId: string, newStatus: 'completed' | 'cancelled') => {
    setUpdatingOrder(orderId)
    
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('order_id', orderId)

      if (error) throw error

      // Refresh orders to show updated status
      await fetchOrders()
      
      Alert.alert(
        'Success', 
        `Order ${newStatus === 'completed' ? 'completed' : 'cancelled'} successfully!`
      )
    } catch (error) {
      console.error('Error updating order status:', error)
      Alert.alert('Error', 'Failed to update order status. Please try again.')
    } finally {
      setUpdatingOrder(null)
    }
  }

  const handleCompleteOrder = (orderId: string) => {
    Alert.alert(
      "Complete Order", 
      "Are you sure you want to mark this order as completed?", 
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Complete",
          onPress: () => updateOrderStatus(orderId, 'completed'),
        },
      ]
    )
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
          onPress: () => updateOrderStatus(orderId, 'cancelled'),
        },
      ]
    )
  }

  const handleCallBuyer = (buyerPhone: string, buyerName: string) => {
    if (!buyerPhone) {
      Alert.alert('No Phone Number', 'This buyer has no phone number on file.')
      return
    }

    Alert.alert(
      'Call Buyer',
      `Call ${buyerName} at ${buyerPhone}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call',
          onPress: () => {
            const phoneUrl = `tel:${buyerPhone}`
            Linking.canOpenURL(phoneUrl)
              .then((supported) => {
                if (supported) {
                  return Linking.openURL(phoneUrl)
                } else {
                  Alert.alert('Error', 'Phone calls are not supported on this device.')
                }
              })
              .catch(() => {
                Alert.alert('Error', 'Failed to make phone call.')
              })
          }
        }
      ]
    )
  }

  const handleNavigateToBuyer = (buyerAddress: string | null, buyerName: string) => {
    if (!buyerAddress) {
      Alert.alert('No Address', 'This buyer has no address on file.')
      return
    }

    Alert.alert(
      'Navigate to Buyer',
      `Navigate to ${buyerName}'s location?\n\n${buyerAddress}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Navigate',
          onPress: () => {
            const encodedAddress = encodeURIComponent(buyerAddress)
            
            // Try different map apps based on platform
            const mapUrls = Platform.select({
              ios: [
                `maps://app?daddr=${encodedAddress}`, // Apple Maps
                `comgooglemaps://?daddr=${encodedAddress}`, // Google Maps
                `https://maps.google.com/maps?daddr=${encodedAddress}` // Web fallback
              ],
              android: [
                `google.navigation:q=${encodedAddress}`, // Google Maps Navigation
                `geo:0,0?q=${encodedAddress}`, // Generic geo intent
                `https://maps.google.com/maps?daddr=${encodedAddress}` // Web fallback
              ]
            })

            const tryOpenMap = async (urls: string[], index = 0): Promise<void> => {
              if (index >= urls.length) {
                Alert.alert('Error', 'No map app available to navigate.')
                return
              }

              try {
                const canOpen = await Linking.canOpenURL(urls[index])
                if (canOpen) {
                  await Linking.openURL(urls[index])
                } else {
                  await tryOpenMap(urls, index + 1)
                }
              } catch (error) {
                await tryOpenMap(urls, index + 1)
              }
            }

            if (mapUrls) {
              tryOpenMap(mapUrls)
            } else {
              Alert.alert('Error', 'Navigation not supported on this platform.')
            }
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
        <View style={styles.buyerInfo}>
          <Image
            source={{ 
              uri: item.buyer_profile_pic || "https://via.placeholder.com/50?text=" + item.buyer_name.charAt(0)
            }}
            style={styles.buyerAvatar}
            accessibilityLabel={`${item.buyer_name} avatar`}
          />
          <View style={styles.buyerDetails}>
            <Text style={styles.buyerName}>{item.buyer_name}</Text>
            <Text style={styles.orderTime}>{formatDate(item.created_at)}</Text>
          </View>
        </View>

        <View style={styles.contactButtons}>
          <TouchableOpacity
            style={styles.contactButton}
            onPress={() => handleCallBuyer(item.buyer_phone, item.buyer_name)}
            accessibilityLabel={`Call ${item.buyer_name}`}
          >
            <PhoneIcon size={18} color={theme.colors.primary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.contactButton}
            onPress={() => handleNavigateToBuyer(item.buyer_address, item.buyer_name)}
            accessibilityLabel={`Navigate to ${item.buyer_name}`}
          >
            <MapIcon size={18} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.itemsContainer}>
        {item.items.map(renderOrderItem)}
      </View>

      {item.buyer_address && (
        <View style={styles.addressContainer}>
          <MapPinIcon size={16} color={theme.colors.placeholder} />
          <Text style={styles.addressText}>{item.buyer_address}</Text>
        </View>
      )}

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
            style={[styles.cancelButton, updatingOrder === item.order_id && styles.disabledButton]}
            onPress={() => handleCancelOrder(item.order_id)}
            disabled={updatingOrder === item.order_id}
            accessibilityLabel="Cancel order button"
          >
            {updatingOrder === item.order_id ? (
              <ActivityIndicator size="small" color={theme.colors.error} />
            ) : (
              <Text style={styles.cancelButtonText}>Cancel</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.acceptButton, updatingOrder === item.order_id && styles.disabledButton]}
            onPress={() => handleCompleteOrder(item.order_id)}
            disabled={updatingOrder === item.order_id}
            accessibilityLabel="Complete order button"
          >
            {updatingOrder === item.order_id ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.acceptButtonText}>Complete</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )

  const renderHistoryOrder = ({ item }: { item: Order }) => (
    <View style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <View style={styles.buyerInfo}>
          <Image
            source={{ 
              uri: item.buyer_profile_pic || "https://via.placeholder.com/50?text=" + item.buyer_name.charAt(0)
            }}
            style={styles.buyerAvatar}
            accessibilityLabel={`${item.buyer_name} avatar`}
          />
          <View style={styles.buyerDetails}>
            <Text style={styles.buyerName}>{item.buyer_name}</Text>
            <Text style={styles.orderTime}>{formatDate(item.created_at)}</Text>
          </View>
        </View>

        <View style={styles.contactButtons}>
          <TouchableOpacity
            style={styles.contactButton}
            onPress={() => handleCallBuyer(item.buyer_phone, item.buyer_name)}
            accessibilityLabel={`Call ${item.buyer_name}`}
          >
            <PhoneIcon size={18} color={theme.colors.primary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.contactButton}
            onPress={() => handleNavigateToBuyer(item.buyer_address, item.buyer_name)}
            accessibilityLabel={`Navigate to ${item.buyer_name}`}
          >
            <MapIcon size={18} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.itemsContainer}>
        {item.items.map(renderOrderItem)}
      </View>

      {item.buyer_address && (
        <View style={styles.addressContainer}>
          <MapPinIcon size={16} color={theme.colors.placeholder} />
          <Text style={styles.addressText}>{item.buyer_address}</Text>
        </View>
      )}

      {item.notes && (
        <View style={styles.notesContainer}>
          <Text style={styles.notesLabel}>Notes:</Text>
          <Text style={styles.notesText}>{item.notes}</Text>
        </View>
      )}

      <View style={styles.orderFooter}>
        <Text style={styles.orderTotal}>Total: {formatPrice(item.total_amount)}</Text>

        <View style={styles.statusBadge}>
          <CheckCircleIcon size={16} color={theme.colors.primary} />
          <Text style={[styles.statusText, { color: theme.colors.primary }]}>Completed</Text>
        </View>
      </View>
    </View>
  )

  const renderCancelledOrder = ({ item }: { item: Order }) => (
    <View style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <View style={styles.buyerInfo}>
          <Image
            source={{ 
              uri: item.buyer_profile_pic || "https://via.placeholder.com/50?text=" + item.buyer_name.charAt(0)
            }}
            style={styles.buyerAvatar}
            accessibilityLabel={`${item.buyer_name} avatar`}
          />
          <View style={styles.buyerDetails}>
            <Text style={styles.buyerName}>{item.buyer_name}</Text>
            <Text style={styles.orderTime}>{formatDate(item.created_at)}</Text>
          </View>
        </View>

        <View style={styles.contactButtons}>
          <TouchableOpacity
            style={styles.contactButton}
            onPress={() => handleCallBuyer(item.buyer_phone, item.buyer_name)}
            accessibilityLabel={`Call ${item.buyer_name}`}
          >
            <PhoneIcon size={18} color={theme.colors.primary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.contactButton}
            onPress={() => handleNavigateToBuyer(item.buyer_address, item.buyer_name)}
            accessibilityLabel={`Navigate to ${item.buyer_name}`}
          >
            <MapIcon size={18} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.itemsContainer}>
        {item.items.map(renderOrderItem)}
      </View>

      {item.buyer_address && (
        <View style={styles.addressContainer}>
          <MapPinIcon size={16} color={theme.colors.placeholder} />
          <Text style={styles.addressText}>{item.buyer_address}</Text>
        </View>
      )}

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
      <Text style={styles.emptySubtext}>Orders will appear here!</Text>
    </View>
  )

  const getTabData = () => {
    switch (activeTab) {
      case 'pending':
        return orders.pending
      case 'history':
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
      case 'history':
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
          <Text style={styles.title}>Orders</Text>
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
        <Text style={styles.title}>Orders</Text>
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
            style={[styles.tab, activeTab === "history" && styles.activeTab]}
            onPress={() => setActiveTab("history")}
            accessibilityLabel="History tab"
          >
            <View style={[styles.tabContent, activeTab === "history" && styles.activeTabContent]}>
              <Text style={[styles.tabText, activeTab === "history" && styles.activeTabText]}>
                History
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
            : activeTab === "history"
              ? renderHistoryOrder
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
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: theme.colors.text,
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
    alignItems: "center",
    marginBottom: spacing.md,
  },
  buyerInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  buyerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: spacing.sm,
  },
  buyerDetails: {
    flexDirection: "column",
  },
  buyerName: {
    fontSize: fontSize.md,
    fontWeight: "bold",
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
  addressContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
    backgroundColor: "#F5F5F5",
    padding: spacing.sm,
    borderRadius: 4,
  },
  addressText: {
    fontSize: fontSize.sm,
    color: theme.colors.placeholder,
    marginLeft: 4,
    flex: 1,
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
  actionButtons: {
    flexDirection: "row",
  },
  cancelButton: {
    backgroundColor: "#F5F5F5",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    marginRight: spacing.md,
    minWidth: 80,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: theme.colors.error,
    fontWeight: "bold",
  },
  acceptButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  acceptButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
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
  },
  contactButtons: {
    flexDirection: "row",
  },
  contactButton: {
    padding: spacing.sm,
  },
})

export default OrdersScreen
