"use client"

import { useState, useEffect } from "react"
import {
  View,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  SafeAreaView,
  ActivityIndicator,
} from "react-native"
import { useNavigation } from "@react-navigation/native"
import { theme, spacing, fontSize } from "../../theme"
import { Ionicons } from "@expo/vector-icons"

// Mock data for search results
const MOCK_PRODUCTS = [
  {
    id: "1",
    name: "Fresh Tomatoes",
    image: "https://via.placeholder.com/150?text=Tomatoes",
    priceRange: "$2 - $5/kg",
    sellers: 5,
    category: "Vegetables",
  },
  {
    id: "2",
    name: "Organic Apples",
    image: "https://via.placeholder.com/150?text=Apples",
    priceRange: "$3 - $6/kg",
    sellers: 3,
    category: "Fruits",
  },
  {
    id: "3",
    name: "Fresh Bread",
    image: "https://via.placeholder.com/150?text=Bread",
    priceRange: "$2 - $4/loaf",
    sellers: 2,
    category: "Bakery",
  },
]

const MOCK_SELLERS = [
  {
    id: "1",
    name: "Fresh Veggies",
    logo: "https://via.placeholder.com/50?text=FV",
    distance: "0.5 km",
    rating: 4.8,
    isOpen: true,
  },
  {
    id: "2",
    name: "Fruit Paradise",
    logo: "https://via.placeholder.com/50?text=FP",
    distance: "0.8 km",
    rating: 4.5,
    isOpen: true,
  },
]

const RECENT_SEARCHES = ["tomatoes", "bread", "milk", "eggs"]

const SearchScreen = () => {
  const navigation = useNavigation()
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState({ products: [], sellers: [] })
  const [recentSearches, setRecentSearches] = useState(RECENT_SEARCHES)
  const [isSearching, setIsSearching] = useState(false)
  const [activeTab, setActiveTab] = useState("all") // 'all', 'products', 'sellers'

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setSearchResults({ products: [], sellers: [] })
      return
    }

    setIsSearching(true)

    // Simulate API call with a delay
    const timer = setTimeout(() => {
      const filteredProducts = MOCK_PRODUCTS.filter((product) =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()),
      )

      const filteredSellers = MOCK_SELLERS.filter((seller) =>
        seller.name.toLowerCase().includes(searchQuery.toLowerCase()),
      )

      setSearchResults({
        products: filteredProducts,
        sellers: filteredSellers,
      })
      setIsSearching(false)
    }, 500)

    return () => clearTimeout(timer)
  }, [searchQuery])

  const handleSearch = (text) => {
    setSearchQuery(text)
  }

  const handleClearSearch = () => {
    setSearchQuery("")
  }

  const handleRecentSearchPress = (search) => {
    setSearchQuery(search)
  }

  const handleClearRecentSearches = () => {
    setRecentSearches([])
  }

  const handleSubmitSearch = () => {
    if (searchQuery.trim() === "") return

    // Add to recent searches if not already there
    if (!recentSearches.includes(searchQuery.toLowerCase())) {
      setRecentSearches([searchQuery.toLowerCase(), ...recentSearches.slice(0, 4)])
    }
  }

  const navigateToProductDetail = (product) => {
    navigation.navigate("ProductDetail", { product })
  }

  const navigateToSellerProfile = (seller) => {
    navigation.navigate("SellerProfile", { seller })
  }

  const renderProductItem = ({ item }) => (
    <TouchableOpacity
      style={styles.productItem}
      onPress={() => navigateToProductDetail(item)}
      accessibilityLabel={`${item.name} product item`}
    >
      <Image source={{ uri: item.image }} style={styles.productImage} accessibilityLabel={`${item.name} image`} />

      <View style={styles.productInfo}>
        <Text style={styles.productName}>{item.name}</Text>
        <Text style={styles.productPrice}>{item.priceRange}</Text>
        <View style={styles.productMeta}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{item.category}</Text>
          </View>
          <Text style={styles.sellerCount}>{item.sellers} sellers</Text>
        </View>
      </View>
    </TouchableOpacity>
  )

  const renderSellerItem = ({ item }) => (
    <TouchableOpacity
      style={styles.sellerItem}
      onPress={() => navigateToSellerProfile(item)}
      accessibilityLabel={`${item.name} seller item`}
    >
      <Image source={{ uri: item.logo }} style={styles.sellerLogo} accessibilityLabel={`${item.name} logo`} />

      <View style={styles.sellerInfo}>
        <Text style={styles.sellerName}>{item.name}</Text>
        <View style={styles.sellerMeta}>
          <Text style={styles.sellerDistance}>{item.distance}</Text>
          {item.rating && (
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={14} color="#FFD700" />
              <Text style={styles.ratingText}>{item.rating}</Text>
            </View>
          )}
        </View>
        <View style={[styles.statusBadge, item.isOpen ? styles.openBadge : styles.closedBadge]}>
          <Text style={[styles.statusText, item.isOpen ? styles.openText : styles.closedText]}>
            {item.isOpen ? "Open" : "Closed"}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  )

  const renderRecentSearchItem = ({ item }) => (
    <TouchableOpacity
      style={styles.recentSearchItem}
      onPress={() => handleRecentSearchPress(item)}
      accessibilityLabel={`${item} recent search`}
    >
      <Ionicons name="time" size={16} color={theme.colors.placeholder} />
      <Text style={styles.recentSearchText}>{item}</Text>
    </TouchableOpacity>
  )

  const renderContent = () => {
    if (searchQuery.trim() === "") {
      // Show recent searches when search is empty
      return (
        <View style={styles.recentSearchesContainer}>
          <View style={styles.recentSearchesHeader}>
            <Text style={styles.recentSearchesTitle}>Recent Searches</Text>
            {recentSearches.length > 0 && (
              <TouchableOpacity onPress={handleClearRecentSearches} accessibilityLabel="Clear recent searches button">
                <Text style={styles.clearText}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>

          {recentSearches.length > 0 ? (
            <FlatList
              data={recentSearches}
              renderItem={renderRecentSearchItem}
              keyExtractor={(item) => item}
              scrollEnabled={false}
            />
          ) : (
            <Text style={styles.noRecentSearchesText}>No recent searches</Text>
          )}
        </View>
      )
    }

    if (isSearching) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Searching...</Text>
        </View>
      )
    }

    const { products, sellers } = searchResults
    const hasResults = products.length > 0 || sellers.length > 0

    if (!hasResults) {
      return (
        <View style={styles.noResultsContainer}>
          <Ionicons name="search" size={50} color={theme.colors.disabled} />
          <Text style={styles.noResultsText}>No results found</Text>
          <Text style={styles.noResultsSubtext}>Try a different search term</Text>
        </View>
      )
    }

    // Show tabs and results
    return (
      <View style={styles.resultsContainer}>
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "all" && styles.activeTab]}
            onPress={() => setActiveTab("all")}
            accessibilityLabel="All results tab"
          >
            <Text style={[styles.tabText, activeTab === "all" && styles.activeTabText]}>
              All ({products.length + sellers.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === "products" && styles.activeTab]}
            onPress={() => setActiveTab("products")}
            accessibilityLabel="Products tab"
          >
            <Text style={[styles.tabText, activeTab === "products" && styles.activeTabText]}>
              Products ({products.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === "sellers" && styles.activeTab]}
            onPress={() => setActiveTab("sellers")}
            accessibilityLabel="Sellers tab"
          >
            <Text style={[styles.tabText, activeTab === "sellers" && styles.activeTabText]}>
              Sellers ({sellers.length})
            </Text>
          </TouchableOpacity>
        </View>

        {(activeTab === "all" || activeTab === "products") && products.length > 0 && (
          <View>
            {activeTab === "all" && <Text style={styles.sectionTitle}>Products</Text>}
            <FlatList
              data={products}
              renderItem={renderProductItem}
              keyExtractor={(item) => `product-${item.id}`}
              scrollEnabled={false}
            />
          </View>
        )}

        {(activeTab === "all" || activeTab === "sellers") && sellers.length > 0 && (
          <View>
            {activeTab === "all" && <Text style={styles.sectionTitle}>Sellers</Text>}
            <FlatList
              data={sellers}
              renderItem={renderSellerItem}
              keyExtractor={(item) => `seller-${item.id}`}
              scrollEnabled={false}
            />
          </View>
        )}
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={theme.colors.placeholder} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for products or sellers"
            value={searchQuery}
            onChangeText={handleSearch}
            onSubmitEditing={handleSubmitSearch}
            returnKeyType="search"
            autoFocus
            accessibilityLabel="Search input"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={handleClearSearch} accessibilityLabel="Clear search">
              <Ionicons name="close-circle" size={20} color={theme.colors.placeholder} />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
          accessibilityLabel="Cancel button"
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>

      <FlatList data={[{ key: "content" }]} renderItem={() => renderContent()} keyExtractor={(item) => item.key} />
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
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    padding: spacing.sm,
    marginRight: spacing.sm,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: fontSize.md,
  },
  cancelButton: {
    padding: spacing.xs,
  },
  cancelText: {
    color: theme.colors.primary,
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
  noResultsContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  noResultsText: {
    fontSize: fontSize.lg,
    fontWeight: "bold",
    marginTop: spacing.md,
  },
  noResultsSubtext: {
    fontSize: fontSize.md,
    color: theme.colors.placeholder,
    marginTop: spacing.xs,
  },
  recentSearchesContainer: {
    padding: spacing.md,
  },
  recentSearchesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  recentSearchesTitle: {
    fontSize: fontSize.md,
    fontWeight: "bold",
  },
  clearText: {
    color: theme.colors.primary,
    fontSize: fontSize.sm,
  },
  recentSearchItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  recentSearchText: {
    fontSize: fontSize.md,
    marginLeft: spacing.sm,
  },
  noRecentSearchesText: {
    fontSize: fontSize.md,
    color: theme.colors.placeholder,
    textAlign: "center",
    marginTop: spacing.lg,
  },
  resultsContainer: {
    flex: 1,
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
    fontSize: fontSize.sm,
    color: theme.colors.placeholder,
  },
  activeTabText: {
    color: theme.colors.primary,
    fontWeight: "bold",
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: "bold",
    padding: spacing.md,
    backgroundColor: "#F5F5F5",
  },
  productItem: {
    flexDirection: "row",
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: spacing.md,
  },
  productInfo: {
    flex: 1,
    justifyContent: "center",
  },
  productName: {
    fontSize: fontSize.md,
    fontWeight: "bold",
    marginBottom: spacing.xs,
  },
  productPrice: {
    fontSize: fontSize.sm,
    color: theme.colors.primary,
    marginBottom: spacing.xs,
  },
  productMeta: {
    flexDirection: "row",
    alignItems: "center",
  },
  categoryBadge: {
    backgroundColor: "#F5F5F5",
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: spacing.sm,
  },
  categoryText: {
    fontSize: fontSize.xs,
    color: theme.colors.placeholder,
  },
  sellerCount: {
    fontSize: fontSize.xs,
    color: theme.colors.placeholder,
  },
  sellerItem: {
    flexDirection: "row",
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  sellerLogo: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: spacing.md,
  },
  sellerInfo: {
    flex: 1,
    justifyContent: "center",
  },
  sellerName: {
    fontSize: fontSize.md,
    fontWeight: "bold",
    marginBottom: spacing.xs,
  },
  sellerMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  sellerDistance: {
    fontSize: fontSize.sm,
    color: theme.colors.placeholder,
    marginRight: spacing.md,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  ratingText: {
    fontSize: fontSize.sm,
    marginLeft: 2,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: "flex-start",
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
})

export default SearchScreen
