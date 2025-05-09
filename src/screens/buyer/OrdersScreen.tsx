"use client"

import { useState } from "react"
import { View, StyleSheet, Text, Image, TouchableOpacity, FlatList, SafeAreaView } from "react-native"
import { useNavigation } from "@react-navigation/native"
import { theme, spacing, fontSize } from "../../theme"
import { Ionicons } from "@expo/vector-icons"

// Mock data for orders
const MOCK_ORDERS = {
  pending: [
    {
      id: "1",
      seller: {
        name: "Fresh Veggies",
        logo: "https://via.placeholder.com/50?text=FV",
      },
      items: [
        { name: "Tomatoes", quantity: 2, price: "$5.00" },
        { name: "Cucumbers", quantity: 1, price: "$2.50" },
      ],
      total: "$7.50",
      status: "pending",
      estimatedTime: "15 mins",
      timestamp: new Date(),
    },
    {
      id: "2",
      seller: {
        name: "Fruit Paradise",
        logo: "https://via.placeholder.com/50?text=FP",
      },
      items: [
        { name: "Apples", quantity: 3, price: "$6.00" },
        { name: "Bananas", quantity: 2, price: "$3.00" },
      ],
      total: "$9.00",
      status: "pending",
      estimatedTime: "20 mins",
      timestamp: new Date(),
    },
  ],
  completed: [
    {
      id: "3",
      seller: {
        name: "Bakery on Wheels",
        logo: "https://via.placeholder.com/50?text=BW",
      },
      items: [
        { name: "Bread", quantity: 1, price: "$2.00" },
        { name: "Croissants", quantity: 2, price: "$4.00" },
      ],
      total: "$6.00",
      status: "completed",
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      rated: false,
    },
    {
      id: "4",
      seller: {
        name: "Dairy Delights",
        logo: "https://via.placeholder.com/50?text=DD",
      },
      items: [
        { name: "Milk", quantity: 2, price: "$3.00" },
        { name: "Cheese", quantity: 1, price: "$4.50" },
      ],
      total: "$7.50",
      status: "completed",
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      rated: true,
    },
  ],
  cancelled: [
    {
      id: "5",
      seller: {
        name: "Spice Market",
        logo: "https://via.placeholder.com/50?text=SM",
      },
      items: [
        { name: "Turmeric", quantity: 1, price: "$2.00" },
        { name: "Cinnamon", quantity: 1, price: "$3.00" },
      ],
      total: "$5.00",
      status: "cancelled",
      reason: "Too long wait",
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    },
  ],
}

const OrdersScreen = () => {
  const navigation = useNavigation()
  const [activeTab, setActiveTab] = useState("pending") // 'pending', 'completed', 'cancelled'

  const formatDate = (date) => {
    const now = new Date()
    const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24))

    if (diffInDays === 0) {
      return "Today"
    } else if (diffInDays === 1) {
      return "Yesterday"
    } else {
      return date.toLocaleDateString()
    }
  }

  const handleCancelOrder = (orderId) => {
    // In a real app, this would open a modal to select a reason
    console.log(`Cancelling order ${orderId}`)
  }

  const handleReorder = (order) => {
    // In a real app, this would add the items to the cart
    console.log(`Reordering ${order.id}`)
  }

  const handleRateOrder = (orderId) => {
    // In a real app, this would open a rating modal
    console.log(`Rating order ${orderId}`)
  }

  const renderPendingOrder = ({ item }) => (
    <View style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <View style={styles.sellerInfo}>
          <Image
            source={{ uri: item.seller.logo }}
            style={styles.sellerLogo}
            accessibilityLabel={`${item.seller.name} logo`}
          />
          <Text style={styles.sellerName}>{item.seller.name}</Text>
        </View>

        <View style={styles.timerContainer}>
          <Ionicons name="time" size={16} color={theme.colors.primary} />
          <Text style={styles.timerText}>Arriving in {item.estimatedTime}</Text>
        </View>
      </View>

      <View style={styles.itemsContainer}>
        {item.items.map((product, index) => (
          <View key={index} style={styles.orderItem}>
            <Text style={styles.itemQuantity}>{product.quantity}x</Text>
            <Text style={styles.itemName}>{product.name}</Text>
            <Text style={styles.itemPrice}>{product.price}</Text>
          </View>
        ))}
      </View>

      <View style={styles.orderFooter}>
        <Text style={styles.orderTotal}>Total: {item.total}</Text>

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => handleCancelOrder(item.id)}
          accessibilityLabel="Cancel order button"
        >
          <Text style={styles.cancelButtonText}>Cancel Order</Text>
        </TouchableOpacity>
      </View>
    </View>
  )

  const renderCompletedOrder = ({ item }) => (
    <View style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <View style={styles.sellerInfo}>
          <Image
            source={{ uri: item.seller.logo }}
            style={styles.sellerLogo}
            accessibilityLabel={`${item.seller.name} logo`}
          />
          <Text style={styles.sellerName}>{item.seller.name}</Text>
        </View>

        <Text style={styles.orderDate}>{formatDate(item.timestamp)}</Text>
      </View>

      <View style={styles.itemsContainer}>
        {item.items.map((product, index) => (
          <View key={index} style={styles.orderItem}>
            <Text style={styles.itemQuantity}>{product.quantity}x</Text>
            <Text style={styles.itemName}>{product.name}</Text>
            <Text style={styles.itemPrice}>{product.price}</Text>
          </View>
        ))}
      </View>

      <View style={styles.orderFooter}>
        <Text style={styles.orderTotal}>Total: {item.total}</Text>

        <View style={styles.actionButtons}>
          {!item.rated && (
            <TouchableOpacity
              style={styles.rateButton}
              onPress={() => handleRateOrder(item.id)}
              accessibilityLabel="Rate order button"
            >
              <Ionicons name="star" size={16} color="#FFFFFF" />
              <Text style={styles.rateButtonText}>Rate</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.reorderButton}
            onPress={() => handleReorder(item)}
            accessibilityLabel="Reorder button"
          >
            <Ionicons name="refresh" size={16} color="#FFFFFF" />
            <Text style={styles.reorderButtonText}>Reorder</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )

  const renderCancelledOrder = ({ item }) => (
    <View style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <View style={styles.sellerInfo}>
          <Image
            source={{ uri: item.seller.logo }}
            style={styles.sellerLogo}
            accessibilityLabel={`${item.seller.name} logo`}
          />
          <Text style={styles.sellerName}>{item.seller.name}</Text>
        </View>

        <Text style={styles.orderDate}>{formatDate(item.timestamp)}</Text>
      </View>

      <View style={styles.itemsContainer}>
        {item.items.map((product, index) => (
          <View key={index} style={styles.orderItem}>
            <Text style={styles.itemQuantity}>{product.quantity}x</Text>
            <Text style={styles.itemName}>{product.name}</Text>
            <Text style={styles.itemPrice}>{product.price}</Text>
          </View>
        ))}
      </View>

      <View style={styles.orderFooter}>
        <Text style={styles.orderTotal}>Total: {item.total}</Text>

        <View style={styles.reasonContainer}>
          <Text style={styles.reasonLabel}>Reason:</Text>
          <Text style={styles.reasonText}>{item.reason}</Text>
        </View>
      </View>
    </View>
  )

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="receipt" size={50} color={theme.colors.disabled} />
      <Text style={styles.emptyText}>No orders yet</Text>
      <Text style={styles.emptySubtext}>Your orders will appear here!</Text>
    </View>
  )

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Orders</Text>
      </View>

      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "pending" && styles.activeTab]}
          onPress={() => setActiveTab("pending")}
          accessibilityLabel="Pending tab"
        >
          <Text style={[styles.tabText, activeTab === "pending" && styles.activeTabText]}>Pending</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "completed" && styles.activeTab]}
          onPress={() => setActiveTab("completed")}
          accessibilityLabel="Completed tab"
        >
          <Text style={[styles.tabText, activeTab === "completed" && styles.activeTabText]}>Completed</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "cancelled" && styles.activeTab]}
          onPress={() => setActiveTab("cancelled")}
          accessibilityLabel="Cancelled tab"
        >
          <Text style={[styles.tabText, activeTab === "cancelled" && styles.activeTabText]}>Cancelled</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={MOCK_ORDERS[activeTab]}
        renderItem={
          activeTab === "pending"
            ? renderPendingOrder
            : activeTab === "completed"
              ? renderCompletedOrder
              : renderCancelledOrder
        }
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.ordersList}
        ListEmptyComponent={renderEmptyState}
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
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: "bold",
  },
  tabsContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.primary,
  },
  tabText: {
    fontSize: fontSize.md,
    color: theme.colors.placeholder,
  },
  activeTabText: {
    color: theme.colors.primary,
    fontWeight: "bold",
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
  sellerInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  sellerLogo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: spacing.sm,
  },
  sellerName: {
    fontSize: fontSize.md,
    fontWeight: "bold",
  },
  timerContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F5E9",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 4,
  },
  timerText: {
    fontSize: fontSize.sm,
    color: theme.colors.primary,
    marginLeft: 4,
    fontWeight: "bold",
  },
  orderDate: {
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
  orderFooter: {
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    paddingTop: spacing.md,
  },
  orderTotal: {
    fontSize: fontSize.md,
    fontWeight: "bold",
    marginBottom: spacing.md,
  },
  cancelButton: {
    backgroundColor: theme.colors.error,
    borderRadius: 8,
    padding: spacing.sm,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  rateButton: {
    backgroundColor: "#FFD700",
    borderRadius: 8,
    padding: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    marginRight: spacing.md,
  },
  rateButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    marginLeft: 4,
  },
  reorderButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    padding: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
  },
  reorderButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    marginLeft: 4,
  },
  reasonContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  reasonLabel: {
    fontSize: fontSize.sm,
    fontWeight: "bold",
    marginRight: spacing.xs,
  },
  reasonText: {
    fontSize: fontSize.sm,
    color: theme.colors.error,
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
})

export default OrdersScreen
