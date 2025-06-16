"use client"

import React, { useState, useEffect } from "react"
import { View, StyleSheet, Text, Image, TouchableOpacity, SafeAreaView, FlatList, Platform, Alert, RefreshControl, Linking } from "react-native"
import { useNavigation } from "@react-navigation/native"
import { theme, spacing, fontSize } from "../../theme"
import { Ionicons } from "@expo/vector-icons"
import { useLocation } from "../../hooks/useLocation"
import { useAuth } from "../../context/AuthContext"
import { getNearbyCustomersWithNeeds, getAllNearbyCustomers, getBuyerLastLocation } from "../../lib/locationService"

interface Customer {
  buyer_id: string;
  buyer_name: string;
  buyer_address: string;
  distance_meters: number;
  needed_items?: any[];
  latest_order_date?: string;
}

const CustomersScreen = () => {
  const navigation = useNavigation()
  const { userInfo } = useAuth()
  const { currentLocation, loadSavedLocation } = useLocation()
  
  const [customers, setCustomers] = useState<Customer[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showAllCustomers, setShowAllCustomers] = useState(true)
  const [radiusMeters, setRadiusMeters] = useState(500)

  // Load seller's saved location when component mounts
  useEffect(() => {
    const loadSellerLocation = async () => {
      if (userInfo?.profileData?.seller_id) {
        await loadSavedLocation(userInfo.profileData.seller_id);
      }
    };

    loadSellerLocation();
  }, [userInfo?.profileData?.seller_id]);

  // Load customers when component mounts or when location/settings change
  useEffect(() => {
    loadCustomers()
  }, [currentLocation, showAllCustomers, radiusMeters, userInfo?.profileData?.seller_id])

  const loadCustomers = async () => {
    if (!currentLocation || !userInfo?.profileData?.seller_id) {
      console.log('Missing location or seller ID')
      return
    }

    setIsLoading(true)
    try {
      let customerData: Customer[] = []
      
      if (showAllCustomers) {
        // Show all nearby customers regardless of needs
        customerData = await getAllNearbyCustomers(currentLocation, radiusMeters)
      } else {
        // Show only customers who need items that overlap with seller's stock
        customerData = await getNearbyCustomersWithNeeds(
          currentLocation, 
          userInfo.profileData.seller_id, 
          radiusMeters
        )
      }

      setCustomers(customerData)
      console.log(`Loaded ${customerData.length} customers`)
    } catch (error) {
      console.error('Error loading customers:', error)
      Alert.alert('Error', 'Failed to load nearby customers')
    } finally {
      setIsLoading(false)
    }
  }

  const formatDistance = (distanceMeters: number): string => {
    if (distanceMeters < 1000) {
      return `${Math.round(distanceMeters)}m`
    }
    return `${(distanceMeters / 1000).toFixed(1)}km`
  }

  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'No orders yet'
    
    const date = new Date(dateString)
    const now = new Date()
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

    if (diffInDays === 0) {
      return "Today"
    } else if (diffInDays === 1) {
      return "Yesterday"
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  const renderNeededItems = (neededItems?: any[]) => {
    if (!neededItems || neededItems.length === 0) {
      return (
        <Text style={styles.noItemsText}>No specific orders yet</Text>
      )
    }

    return (
      <View style={styles.neededItemsContainer}>
        <Text style={styles.neededItemsTitle}>Items they need:</Text>
        {neededItems.slice(0, 3).map((item, index) => (
          <View key={index} style={styles.neededItem}>
            <Text style={styles.itemName}>
              • {item.product_name} ({item.quantity} units)
            </Text>
            <Text style={styles.itemType}>{item.product_type}</Text>
          </View>
        ))}
        {neededItems.length > 3 && (
          <Text style={styles.moreItemsText}>
            +{neededItems.length - 3} more items
          </Text>
        )}
      </View>
    )
  }

  const renderCustomerItem = ({ item }: { item: Customer }) => (
    <TouchableOpacity 
      style={styles.customerCard}
      onPress={() => navigateToCustomer(item)}
      activeOpacity={0.7}
    >
      <View style={styles.customerHeader}>
        <View style={styles.customerInfo}>
          <View style={styles.customerIcon}>
            <Ionicons name="person" size={24} color={theme.colors.primary} />
          </View>
          <View style={styles.customerDetails}>
            <Text style={styles.customerName}>{item.buyer_name}</Text>
            <View style={styles.metaInfo}>
              <Text style={styles.distance}>{formatDistance(item.distance_meters)} away</Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.navigationIcon}
            onPress={(e) => {
              e.stopPropagation() // Prevent card press
              navigateToCustomer(item)
            }}
          >
            <Ionicons name="navigate" size={20} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {renderNeededItems(item.needed_items)}

      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.navigateButton]}
          onPress={(e) => {
            e.stopPropagation() // Prevent card press
            navigateToCustomer(item)
          }}
        >
          <Ionicons name="navigate" size={16} color="#FFFFFF" />
          <Text style={styles.actionButtonText}>Navigate</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  )

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="people" size={50} color={theme.colors.disabled} />
      <Text style={styles.emptyText}>
        {showAllCustomers ? 'No customers nearby' : 'No customers need your items'}
      </Text>
      <Text style={styles.emptySubtext}>
        {showAllCustomers 
          ? 'Try increasing the search radius' 
          : 'Try showing all customers or check your available products'
        }
      </Text>
      {!showAllCustomers && (
        <TouchableOpacity 
          style={styles.showAllButton}
          onPress={() => setShowAllCustomers(true)}
        >
          <Text style={styles.showAllButtonText}>Show All Nearby Customers</Text>
        </TouchableOpacity>
      )}
    </View>
  )

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.title}>Nearby Customers</Text>
      {currentLocation && (
        <Text style={styles.locationText}>
          Within {radiusMeters}m of your location
        </Text>
      )}
    </View>
  )

  const renderFilters = () => (
    <View style={styles.filtersContainer}>
      <View style={styles.filterRow}>
        <Text style={styles.filterLabel}>Show customers who:</Text>
        <TouchableOpacity
          style={[styles.toggleButton, !showAllCustomers && styles.toggleButtonActive]}
          onPress={() => setShowAllCustomers(!showAllCustomers)}
        >
          <Text style={[styles.toggleButtonText, !showAllCustomers && styles.toggleButtonTextActive]}>
            {showAllCustomers ? 'All nearby' : 'Need your items'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filterRow}>
        <Text style={styles.filterLabel}>Search radius:</Text>
        <View style={styles.radiusButtons}>
          {[250, 500, 1000].map((radius) => (
            <TouchableOpacity
              key={radius}
              style={[styles.radiusButton, radiusMeters === radius && styles.radiusButtonActive]}
              onPress={() => setRadiusMeters(radius)}
            >
              <Text style={[styles.radiusButtonText, radiusMeters === radius && styles.radiusButtonTextActive]}>
                {radius}m
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  )

  // Get customer location and open navigation
  const navigateToCustomer = async (customer: Customer) => {
    try {
      console.log('Getting location for customer:', customer.buyer_id)
      
      // Get the customer's location from database
      const customerLocation = await getBuyerLastLocation(customer.buyer_id)
      
      if (!customerLocation) {
        Alert.alert('Location Unavailable', 'Customer location is not available for navigation.')
        return
      }

      console.log('Customer location retrieved:', customerLocation)

      // Create the maps URL for navigation
      const { latitude, longitude } = customerLocation
      const destination = `${latitude},${longitude}`
      const label = encodeURIComponent(customer.buyer_name)

      let mapsUrl: string

      if (Platform.OS === 'ios') {
        // iOS: Use Apple Maps
        mapsUrl = `http://maps.apple.com/?daddr=${destination}&dirflg=d&t=m`
      } else {
        // Android: Use Google Maps
        mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`
      }

      console.log('Opening maps URL:', mapsUrl)

      // Check if the URL can be opened
      const canOpen = await Linking.canOpenURL(mapsUrl)
      if (canOpen) {
        await Linking.openURL(mapsUrl)
      } else {
        // Fallback: Open in browser with Google Maps
        const fallbackUrl = `https://www.google.com/maps/dir/?api=1&destination=${destination}`
        await Linking.openURL(fallbackUrl)
      }
    } catch (error) {
      console.error('Error navigating to customer:', error)
      Alert.alert('Navigation Error', 'Unable to open navigation. Please try again.')
    }
  }

  if (!currentLocation) {
    return (
      <SafeAreaView style={styles.container}>
        {renderHeader()}
        <View style={styles.emptyContainer}>
          <Ionicons name="location" size={50} color={theme.colors.disabled} />
          <Text style={styles.emptyText}>Location Required</Text>
          <Text style={styles.emptySubtext}>
            Please enable location services to find nearby customers
          </Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      {renderFilters()}
      
      <FlatList
        data={customers}
        renderItem={renderCustomerItem}
        keyExtractor={(item) => item.buyer_id}
        contentContainerStyle={styles.customersList}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={loadCustomers}
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
  locationText: {
    fontSize: fontSize.sm,
    color: theme.colors.placeholder,
    marginTop: spacing.xs,
  },
  filtersContainer: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
    backgroundColor: "#F8F9FA",
  },
  filterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  filterLabel: {
    fontSize: fontSize.md,
    color: theme.colors.text,
  },
  toggleButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: 20,
    backgroundColor: "#E0E0E0",
  },
  toggleButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  toggleButtonText: {
    fontSize: fontSize.sm,
    color: theme.colors.text,
  },
  toggleButtonTextActive: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  radiusButtons: {
    flexDirection: "row",
  },
  radiusButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: 20,
    marginLeft: spacing.sm,
    backgroundColor: "#E0E0E0",
  },
  radiusButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  radiusButtonText: {
    fontSize: fontSize.sm,
    color: theme.colors.text,
  },
  radiusButtonTextActive: {
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
    marginBottom: spacing.md,
  },
  customerInfo: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  customerIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#F0F0F0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
  },
  customerDetails: {
    flex: 1,
  },
  customerName: {
    fontSize: fontSize.lg,
    fontWeight: "bold",
    marginBottom: spacing.xs,
  },
  customerAddress: {
    fontSize: fontSize.md,
    color: theme.colors.placeholder,
    marginBottom: spacing.xs,
  },
  metaInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  distance: {
    fontSize: fontSize.sm,
    color: theme.colors.primary,
    fontWeight: "bold",
  },
  lastOrder: {
    fontSize: fontSize.sm,
    color: theme.colors.placeholder,
  },
  neededItemsContainer: {
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  neededItemsTitle: {
    fontSize: fontSize.md,
    fontWeight: "bold",
    marginBottom: spacing.sm,
    color: theme.colors.text,
  },
  neededItem: {
    marginBottom: spacing.xs,
  },
  itemName: {
    fontSize: fontSize.sm,
    color: theme.colors.text,
  },
  itemType: {
    fontSize: fontSize.xs,
    color: theme.colors.placeholder,
    marginLeft: spacing.md,
  },
  moreItemsText: {
    fontSize: fontSize.sm,
    color: theme.colors.primary,
    fontStyle: "italic",
    marginTop: spacing.xs,
  },
  noItemsText: {
    fontSize: fontSize.sm,
    color: theme.colors.placeholder,
    fontStyle: "italic",
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
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: fontSize.md,
    color: theme.colors.placeholder,
    marginTop: spacing.xs,
    textAlign: "center",
  },
  showAllButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 8,
    marginTop: spacing.lg,
  },
  showAllButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: fontSize.md,
  },
  navigationIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: spacing.md,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: spacing.md,
  },
  actionButton: {
    backgroundColor: theme.colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.sm,
    borderRadius: 8,
    paddingHorizontal: spacing.lg,
  },
  navigateButton: {
    backgroundColor: "#2196F3", // Blue for navigation
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    marginLeft: spacing.xs,
    fontSize: fontSize.sm,
  },
})

export default CustomersScreen
