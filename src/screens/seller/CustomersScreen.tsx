"use client"

import { useState } from "react"
import { View, StyleSheet, Text, Image, TouchableOpacity, SafeAreaView, FlatList } from "react-native"
import { useNavigation } from "@react-navigation/native"
import { theme, spacing, fontSize } from "../../theme"
import { Ionicons } from "@expo/vector-icons"

// Mock data for customers
const MOCK_CUSTOMERS = [
  {
    id: "1",
    name: "John Doe",
    avatar: "https://via.placeholder.com/50?text=JD",
    lastOrder: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    totalSpent: "$75.50",
    orderCount: 8,
    isLiked: true,
  },
  {
    id: "2",
    name: "Jane Smith",
    avatar: "https://via.placeholder.com/50?text=JS",
    lastOrder: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    totalSpent: "$120.75",
    orderCount: 12,
    isLiked: true,
  },
  {
    id: "3",
    name: "Bob Johnson",
    avatar: "https://via.placeholder.com/50?text=BJ",
    lastOrder: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
    totalSpent: "$45.25",
    orderCount: 4,
    isLiked: false,
  },
  {
    id: "4",
    name: "Alice Williams",
    avatar: "https://via.placeholder.com/50?text=AW",
    lastOrder: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    totalSpent: "$95.00",
    orderCount: 10,
    isLiked: false,
  },
  {
    id: "5",
    name: "Charlie Brown",
    avatar: "https://via.placeholder.com/50?text=CB",
    lastOrder: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    totalSpent: "$35.50",
    orderCount: 3,
    isLiked: true,
  },
]

const CustomersScreen = () => {
  const navigation = useNavigation()
  const [sortBy, setSortBy] = useState("recent") // 'recent', 'spent', 'orders'
  const [showLikedOnly, setShowLikedOnly] = useState(false)
  const [minOrderCount, setMinOrderCount] = useState(0)
  const [customers, setCustomers] = useState(MOCK_CUSTOMERS)

  const formatDate = (date) => {
    const now = new Date()
    const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24))

    if (diffInDays === 0) {
      return "Today"
    } else if (diffInDays === 1) {
      return "Yesterday"
    } else {
      return `${diffInDays} days ago`
    }
  }

  const handleSort = (sortType) => {
    setSortBy(sortType)

    const sorted = [...MOCK_CUSTOMERS]

    if (sortType === "recent") {
      sorted.sort((a, b) => b.lastOrder - a.lastOrder)
    } else if (sortType === "spent") {
      sorted.sort((a, b) => Number.parseFloat(b.totalSpent.substring(1)) - Number.parseFloat(a.totalSpent.substring(1)))
    } else if (sortType === "orders") {
      sorted.sort((a, b) => b.orderCount - a.orderCount)
    }

    applyFilters(sorted)
  }

  const applyFilters = (customersToFilter = MOCK_CUSTOMERS) => {
    let filtered = [...customersToFilter]

    if (showLikedOnly) {
      filtered = filtered.filter((customer) => customer.isLiked)
    }

    if (minOrderCount > 0) {
      filtered = filtered.filter((customer) => customer.orderCount >= minOrderCount)
    }

    setCustomers(filtered)
  }

  const toggleLikedOnly = () => {
    const newValue = !showLikedOnly
    setShowLikedOnly(newValue)

    let filtered = [...MOCK_CUSTOMERS]

    if (newValue) {
      filtered = filtered.filter((customer) => customer.isLiked)
    }

    if (minOrderCount > 0) {
      filtered = filtered.filter((customer) => customer.orderCount >= minOrderCount)
    }

    if (sortBy === "recent") {
      filtered.sort((a, b) => b.lastOrder - a.lastOrder)
    } else if (sortBy === "spent") {
      filtered.sort(
        (a, b) => Number.parseFloat(b.totalSpent.substring(1)) - Number.parseFloat(a.totalSpent.substring(1)),
      )
    } else if (sortBy === "orders") {
      filtered.sort((a, b) => b.orderCount - a.orderCount)
    }

    setCustomers(filtered)
  }

  const setOrderCountFilter = (count) => {
    setMinOrderCount(count)

    let filtered = [...MOCK_CUSTOMERS]

    if (showLikedOnly) {
      filtered = filtered.filter((customer) => customer.isLiked)
    }

    filtered = filtered.filter((customer) => customer.orderCount >= count)

    if (sortBy === "recent") {
      filtered.sort((a, b) => b.lastOrder - a.lastOrder)
    } else if (sortBy === "spent") {
      filtered.sort(
        (a, b) => Number.parseFloat(b.totalSpent.substring(1)) - Number.parseFloat(a.totalSpent.substring(1)),
      )
    } else if (sortBy === "orders") {
      filtered.sort((a, b) => b.orderCount - a.orderCount)
    }

    setCustomers(filtered)
  }

  const renderCustomerItem = ({ item }) => (
    <View style={styles.customerCard}>
      <View style={styles.customerHeader}>
        <View style={styles.customerInfo}>
          <Image
            source={{ uri: item.avatar }}
            style={styles.customerAvatar}
            accessibilityLabel={`${item.name} avatar`}
          />

          <View>
            <Text style={styles.customerName}>{item.name}</Text>
            <Text style={styles.lastOrderText}>Last order: {formatDate(item.lastOrder)}</Text>
          </View>
        </View>

        {item.isLiked && (
          <View style={styles.likedBadge}>
            <Ionicons name="star" size={14} color="#FFFFFF" />
            <Text style={styles.likedText}>Liked</Text>
          </View>
        )}
      </View>

      <View style={styles.customerStats}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{item.totalSpent}</Text>
          <Text style={styles.statLabel}>Total Spent</Text>
        </View>

        <View style={styles.statItem}>
          <Text style={styles.statValue}>{item.orderCount}</Text>
          <Text style={styles.statLabel}>Orders</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.messageButton} accessibilityLabel={`Message ${item.name} button`}>
        <Ionicons name="chatbubble" size={16} color="#FFFFFF" />
        <Text style={styles.messageButtonText}>Message</Text>
      </TouchableOpacity>
    </View>
  )

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="people" size={50} color={theme.colors.disabled} />
      <Text style={styles.emptyText}>No customers found</Text>
      <Text style={styles.emptySubtext}>Try adjusting your filters</Text>
    </View>
  )

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Customers</Text>
      </View>

      <View style={styles.filtersContainer}>
        <View style={styles.sortContainer}>
          <Text style={styles.sortLabel}>Sort by:</Text>

          <View style={styles.sortButtons}>
            <TouchableOpacity
              style={[styles.sortButton, sortBy === "recent" && styles.sortButtonActive]}
              onPress={() => handleSort("recent")}
              accessibilityLabel="Sort by recent orders"
            >
              <Text style={[styles.sortButtonText, sortBy === "recent" && styles.sortButtonTextActive]}>Recent</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.sortButton, sortBy === "spent" && styles.sortButtonActive]}
              onPress={() => handleSort("spent")}
              accessibilityLabel="Sort by total spent"
            >
              <Text style={[styles.sortButtonText, sortBy === "spent" && styles.sortButtonTextActive]}>Spent</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.sortButton, sortBy === "orders" && styles.sortButtonActive]}
              onPress={() => handleSort("orders")}
              accessibilityLabel="Sort by order count"
            >
              <Text style={[styles.sortButtonText, sortBy === "orders" && styles.sortButtonTextActive]}>Orders</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.filterRow}>
          <Text style={styles.filterLabel}>Liked Customers Only</Text>
          <TouchableOpacity
            style={[styles.toggleButton, showLikedOnly && styles.toggleButtonActive]}
            onPress={toggleLikedOnly}
            accessibilityLabel="Toggle liked customers only"
          >
            <View style={[styles.toggleCircle, showLikedOnly && styles.toggleCircleActive]} />
          </TouchableOpacity>
        </View>

        <View style={styles.filterRow}>
          <Text style={styles.filterLabel}>Minimum Orders</Text>
          <View style={styles.orderCountButtons}>
            {[0, 5, 10].map((count) => (
              <TouchableOpacity
                key={count}
                style={[styles.orderCountButton, minOrderCount === count && styles.orderCountButtonActive]}
                onPress={() => setOrderCountFilter(count)}
                accessibilityLabel={`Set minimum ${count} orders`}
              >
                <Text
                  style={[styles.orderCountButtonText, minOrderCount === count && styles.orderCountButtonTextActive]}
                >
                  {count === 0 ? "All" : count + "+"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      <FlatList
        data={customers}
        renderItem={renderCustomerItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.customersList}
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
  filtersContainer: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  sortContainer: {
    marginBottom: spacing.md,
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
  filterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  filterLabel: {
    fontSize: fontSize.md,
  },
  toggleButton: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: theme.colors.disabled,
    padding: 2,
    justifyContent: "center",
  },
  toggleButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  toggleCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#FFFFFF",
  },
  toggleCircleActive: {
    alignSelf: "flex-end",
  },
  orderCountButtons: {
    flexDirection: "row",
  },
  orderCountButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: 20,
    marginLeft: spacing.sm,
    backgroundColor: "#F5F5F5",
  },
  orderCountButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  orderCountButtonText: {
    fontSize: fontSize.sm,
    color: theme.colors.text,
  },
  orderCountButtonTextActive: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  customersList: {
    padding: spacing.md,
  },
  customerCard: {
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
  customerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  customerInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  customerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: spacing.md,
  },
  customerName: {
    fontSize: fontSize.md,
    fontWeight: "bold",
    marginBottom: 2,
  },
  lastOrderText: {
    fontSize: fontSize.sm,
    color: theme.colors.placeholder,
  },
  likedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFD700",
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 4,
  },
  likedText: {
    fontSize: fontSize.xs,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginLeft: 2,
  },
  customerStats: {
    flexDirection: "row",
    marginBottom: spacing.md,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: fontSize.lg,
    fontWeight: "bold",
    marginBottom: 2,
  },
  statLabel: {
    fontSize: fontSize.xs,
    color: theme.colors.placeholder,
  },
  messageButton: {
    backgroundColor: theme.colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.sm,
    borderRadius: 8,
  },
  messageButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    marginLeft: spacing.xs,
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

export default CustomersScreen
