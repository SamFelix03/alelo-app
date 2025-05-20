"use client"

import React from 'react'
import { useState } from "react"
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
} from "react-native"
import { useNavigation } from "@react-navigation/native"
import { theme, spacing, fontSize } from "../../theme"
import { Ionicons } from "@expo/vector-icons"
import SellerHeader from '../../components/SellerHeader'

// Mock data for orders
const MOCK_ORDERS = {
  pending: [
    {
      id: "1",
      buyer: {
        name: "John Doe",
        avatar: "https://via.placeholder.com/50?text=JD",
      },
      items: [
        { name: "Tomatoes", quantity: 2, price: "$5.00" },
        { name: "Cucumbers", quantity: 1, price: "$2.50" },
      ],
      total: "$7.50",
      address: "123 Main St, San Francisco, CA",
      timestamp: new Date(),
    },
    {
      id: "2",
      buyer: {
        name: "Jane Smith",
        avatar: "https://via.placeholder.com/50?text=JS",
      },
      items: [
        { name: "Apples", quantity: 3, price: "$6.00" },
        { name: "Bananas", quantity: 2, price: "$3.00" },
      ],
      total: "$9.00",
      address: "456 Oak St, San Francisco, CA",
      timestamp: new Date(),
    },
  ],
  preparing: [
    {
      id: "3",
      buyer: {
        name: "Bob Johnson",
        avatar: "https://via.placeholder.com/50?text=BJ",
      },
      items: [
        { name: "Bread", quantity: 1, price: "$2.00" },
        { name: "Croissants", quantity: 2, price: "$4.00" },
      ],
      total: "$6.00",
      address: "789 Pine St, San Francisco, CA",
      timestamp: new Date(),
      progress: 50, // percentage
    },
  ],
  completed: [
    {
      id: "4",
      buyer: {
        name: "Alice Williams",
        avatar: "https://via.placeholder.com/50?text=AW",
      },
      items: [
        { name: "Milk", quantity: 2, price: "$3.00" },
        { name: "Cheese", quantity: 1, price: "$4.50" },
      ],
      total: "$7.50",
      address: "101 Maple St, San Francisco, CA",
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    },
  ],
  cancelled: [
    {
      id: "5",
      buyer: {
        name: "Charlie Brown",
        avatar: "https://via.placeholder.com/50?text=CB",
      },
      items: [
        { name: "Turmeric", quantity: 1, price: "$2.00" },
        { name: "Cinnamon", quantity: 1, price: "$3.00" },
      ],
      total: "$5.00",
      address: "202 Cedar St, San Francisco, CA",
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      reason: "Too long wait",
    },
  ],
}

const OrdersScreen = () => {
  const navigation = useNavigation()
  const [activeTab, setActiveTab] = useState("pending") // 'pending', 'preparing', 'completed', 'cancelled'

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

  const handleAcceptOrder = (orderId) => {
    Alert.alert("Accept Order", "Are you sure you want to accept this order?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Accept",
        onPress: () => {
          // In a real app, this would update the order status in the backend
          console.log(`Accepted order ${orderId}`)
        },
      },
    ])
  }

  const handleCancelOrder = (orderId) => {
    Alert.alert("Cancel Order", "Please provide a reason for cancellation:", [
      {
        text: "Out of Stock",
        onPress: () => console.log(`Cancelled order ${orderId}: Out of Stock`),
      },
      {
        text: "Too Busy",
        onPress: () => console.log(`Cancelled order ${orderId}: Too Busy`),
      },
      {
        text: "Other",
        onPress: () => console.log(`Cancelled order ${orderId}: Other`),
      },
      {
        text: "Back",
        style: "cancel",
      },
    ])
  }

  const handleMarkAsReady = (orderId) => {
    Alert.alert("Mark as Ready", "Is this order ready for pickup?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Yes, Ready",
        onPress: () => {
          // In a real app, this would update the order status in the backend
          console.log(`Marked order ${orderId} as ready`)
        },
      },
    ])
  }

  const renderPendingOrder = ({ item }) => (
    <View style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <View style={styles.buyerInfo}>
          <Image
            source={{ uri: item.buyer.avatar }}
            style={styles.buyerAvatar}
            accessibilityLabel={`${item.buyer.name} avatar`}
          />
          <Text style={styles.buyerName}>{item.buyer.name}</Text>
        </View>

        <Text style={styles.orderTime}>{formatDate(item.timestamp)}</Text>
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

      <View style={styles.addressContainer}>
        <Ionicons name="location" size={16} color={theme.colors.placeholder} />
        <Text style={styles.addressText}>{item.address}</Text>
      </View>

      <View style={styles.orderFooter}>
        <Text style={styles.orderTotal}>Total: {item.total}</Text>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => handleCancelOrder(item.id)}
            accessibilityLabel="Cancel order button"
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.acceptButton}
            onPress={() => handleAcceptOrder(item.id)}
            accessibilityLabel="Accept order button"
          >
            <Text style={styles.acceptButtonText}>Accept</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )

  const renderPreparingOrder = ({ item }) => (
    <View style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <View style={styles.buyerInfo}>
          <Image
            source={{ uri: item.buyer.avatar }}
            style={styles.buyerAvatar}
            accessibilityLabel={`${item.buyer.name} avatar`}
          />
          <Text style={styles.buyerName}>{item.buyer.name}</Text>
        </View>

        <Text style={styles.orderTime}>{formatDate(item.timestamp)}</Text>
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

      <View style={styles.addressContainer}>
        <Ionicons name="location" size={16} color={theme.colors.placeholder} />
        <Text style={styles.addressText}>{item.address}</Text>
      </View>

      <View style={styles.progressContainer}>
        <Text style={styles.progressLabel}>Preparing</Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${item.progress}%` }]} />
        </View>
        <Text style={styles.progressLabel}>Ready</Text>
      </View>

      <View style={styles.orderFooter}>
        <Text style={styles.orderTotal}>Total: {item.total}</Text>

        <TouchableOpacity
          style={styles.readyButton}
          onPress={() => handleMarkAsReady(item.id)}
          accessibilityLabel="Mark as ready button"
        >
          <Text style={styles.readyButtonText}>Mark as Ready</Text>
        </TouchableOpacity>
      </View>
    </View>
  )

  const renderCompletedOrder = ({ item }) => (
    <View style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <View style={styles.buyerInfo}>
          <Image
            source={{ uri: item.buyer.avatar }}
            style={styles.buyerAvatar}
            accessibilityLabel={`${item.buyer.name} avatar`}
          />
          <Text style={styles.buyerName}>{item.buyer.name}</Text>
        </View>

        <Text style={styles.orderTime}>{formatDate(item.timestamp)}</Text>
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

      <View style={styles.addressContainer}>
        <Ionicons name="location" size={16} color={theme.colors.placeholder} />
        <Text style={styles.addressText}>{item.address}</Text>
      </View>

      <View style={styles.orderFooter}>
        <Text style={styles.orderTotal}>Total: {item.total}</Text>

        <View style={styles.statusBadge}>
          <Ionicons name="checkmark-circle" size={16} color={theme.colors.completed} />
          <Text style={[styles.statusText, { color: theme.colors.completed }]}>Completed</Text>
        </View>
      </View>
    </View>
  )

  const renderCancelledOrder = ({ item }) => (
    <View style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <View style={styles.buyerInfo}>
          <Image
            source={{ uri: item.buyer.avatar }}
            style={styles.buyerAvatar}
            accessibilityLabel={`${item.buyer.name} avatar`}
          />
          <Text style={styles.buyerName}>{item.buyer.name}</Text>
        </View>

        <Text style={styles.orderTime}>{formatDate(item.timestamp)}</Text>
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

      <View style={styles.addressContainer}>
        <Ionicons name="location" size={16} color={theme.colors.placeholder} />
        <Text style={styles.addressText}>{item.address}</Text>
      </View>

      <View style={styles.orderFooter}>
        <View>
          <Text style={styles.orderTotal}>Total: {item.total}</Text>
          <View style={styles.reasonContainer}>
            <Text style={styles.reasonLabel}>Reason:</Text>
            <Text style={styles.reasonText}>{item.reason}</Text>
          </View>
        </View>

        <View style={styles.statusBadge}>
          <Ionicons name="close-circle" size={16} color={theme.colors.cancelled} />
          <Text style={[styles.statusText, { color: theme.colors.cancelled }]}>Cancelled</Text>
        </View>
      </View>
    </View>
  )

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="receipt" size={50} color={theme.colors.disabled} />
      <Text style={styles.emptyText}>No orders yet</Text>
      <Text style={styles.emptySubtext}>Orders will appear here!</Text>
    </View>
  )

  return (
    <SafeAreaView style={styles.container}>
      <SellerHeader title="Orders" />
      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "pending" && styles.activeTab]}
            onPress={() => setActiveTab("pending")}
            accessibilityLabel="Pending tab"
          >
            <Text style={[styles.tabText, activeTab === "pending" && styles.activeTabText]}>Pending</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === "preparing" && styles.activeTab]}
            onPress={() => setActiveTab("preparing")}
            accessibilityLabel="Preparing tab"
          >
            <Text style={[styles.tabText, activeTab === "preparing" && styles.activeTabText]}>Preparing</Text>
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
        </ScrollView>
      </View>

      <FlatList
        data={MOCK_ORDERS[activeTab]}
        renderItem={
          activeTab === "pending"
            ? renderPendingOrder
            : activeTab === "preparing"
              ? renderPreparingOrder
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
  tabsContainer: {
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  tab: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
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
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  progressLabel: {
    fontSize: fontSize.sm,
    fontWeight: "bold",
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: "#F5F5F5",
    borderRadius: 4,
    marginHorizontal: spacing.md,
  },
  progressFill: {
    height: "100%",
    backgroundColor: theme.colors.primary,
    borderRadius: 4,
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
  },
  acceptButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  readyButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
  },
  readyButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
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
  reasonContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.xs,
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
