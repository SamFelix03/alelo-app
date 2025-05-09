"use client"

import { useState } from "react"
import { View, StyleSheet, Text, TextInput, FlatList, TouchableOpacity, Image, SafeAreaView } from "react-native"
import { useNavigation } from "@react-navigation/native"
import { theme, spacing, fontSize } from "../../theme"
import { Ionicons } from "@expo/vector-icons"

// Mock data for sellers
const MOCK_SELLERS = [
  {
    id: "1",
    name: "Fresh Veggies",
    logo: "https://via.placeholder.com/50?text=FV",
    distance: "0.5 km",
    rating: 4.8,
    isOpen: true,
    isLiked: true,
  },
  {
    id: "2",
    name: "Fruit Paradise",
    logo: "https://via.placeholder.com/50?text=FP",
    distance: "0.8 km",
    rating: 4.5,
    isOpen: true,
    isLiked: false,
  },
  {
    id: "3",
    name: "Bakery on Wheels",
    logo: "https://via.placeholder.com/50?text=BW",
    distance: "1.2 km",
    rating: 4.2,
    isOpen: false,
    isLiked: true,
  },
  {
    id: "4",
    name: "Dairy Delights",
    logo: "https://via.placeholder.com/50?text=DD",
    distance: "1.5 km",
    rating: 4.0,
    isOpen: true,
    isLiked: false,
  },
  {
    id: "5",
    name: "Spice Market",
    logo: "https://via.placeholder.com/50?text=SM",
    distance: "2.0 km",
    rating: 4.7,
    isOpen: true,
    isLiked: false,
  },
]

const ListScreen = () => {
  const navigation = useNavigation()
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("distance") // 'distance', 'rating', 'popularity'
  const [sellers, setSellers] = useState(MOCK_SELLERS)

  const handleSearch = (text) => {
    setSearchQuery(text)

    if (text.trim() === "") {
      setSellers(MOCK_SELLERS)
      return
    }

    const filtered = MOCK_SELLERS.filter((seller) => seller.name.toLowerCase().includes(text.toLowerCase()))

    setSellers(filtered)
  }

  const handleSort = (sortType) => {
    setSortBy(sortType)

    const sorted = [...sellers]

    if (sortType === "distance") {
      sorted.sort((a, b) => Number.parseFloat(a.distance) - Number.parseFloat(b.distance))
    } else if (sortType === "rating") {
      sorted.sort((a, b) => b.rating - a.rating)
    } else if (sortType === "popularity") {
      // In a real app, this would sort by popularity metrics
      // For this example, we'll just use a random sort
      sorted.sort(() => Math.random() - 0.5)
    }

    setSellers(sorted)
  }

  const toggleLike = (id) => {
    const updatedSellers = sellers.map((seller) =>
      seller.id === id ? { ...seller, isLiked: !seller.isLiked } : seller,
    )

    setSellers(updatedSellers)
  }

  const navigateToSellerProfile = (seller) => {
    navigation.navigate("SellerProfile", { seller })
  }

  const renderSellerItem = ({ item }) => (
    <View style={styles.sellerCard}>
      <Image source={{ uri: item.logo }} style={styles.sellerLogo} accessibilityLabel={`${item.name} logo`} />

      <View style={styles.sellerInfo}>
        <Text style={styles.sellerName}>{item.name}</Text>

        <View style={styles.sellerMetaRow}>
          <View style={styles.distanceContainer}>
            <Ionicons name="location" size={14} color={theme.colors.placeholder} />
            <Text style={styles.distanceText}>{item.distance}</Text>
          </View>

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

      <View style={styles.sellerActions}>
        <TouchableOpacity
          style={styles.likeButton}
          onPress={() => toggleLike(item.id)}
          accessibilityLabel={`${item.isLiked ? "Unlike" : "Like"} ${item.name}`}
        >
          <Ionicons
            name={item.isLiked ? "heart" : "heart-outline"}
            size={24}
            color={item.isLiked ? theme.colors.error : theme.colors.text}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.viewMenuButton, !item.isOpen && styles.viewMenuButtonDisabled]}
          onPress={() => navigateToSellerProfile(item)}
          disabled={!item.isOpen}
          accessibilityLabel={`View ${item.name} menu`}
        >
          <Text style={[styles.viewMenuText, !item.isOpen && styles.viewMenuTextDisabled]}>View Menu</Text>
        </TouchableOpacity>
      </View>
    </View>
  )

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Nearby Vendors</Text>

        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={theme.colors.placeholder} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search vendors or products"
            value={searchQuery}
            onChangeText={handleSearch}
            accessibilityLabel="Search input"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch("")} accessibilityLabel="Clear search">
              <Ionicons name="close-circle" size={20} color={theme.colors.placeholder} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.sortContainer}>
          <Text style={styles.sortLabel}>Sort by:</Text>

          <View style={styles.sortButtons}>
            <TouchableOpacity
              style={[styles.sortButton, sortBy === "distance" && styles.sortButtonActive]}
              onPress={() => handleSort("distance")}
              accessibilityLabel="Sort by distance"
            >
              <Text style={[styles.sortButtonText, sortBy === "distance" && styles.sortButtonTextActive]}>
                Distance
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.sortButton, sortBy === "rating" && styles.sortButtonActive]}
              onPress={() => handleSort("rating")}
              accessibilityLabel="Sort by rating"
            >
              <Text style={[styles.sortButtonText, sortBy === "rating" && styles.sortButtonTextActive]}>Rating</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.sortButton, sortBy === "popularity" && styles.sortButtonActive]}
              onPress={() => handleSort("popularity")}
              accessibilityLabel="Sort by popularity"
            >
              <Text style={[styles.sortButtonText, sortBy === "popularity" && styles.sortButtonTextActive]}>
                Popularity
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {sellers.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="search" size={50} color={theme.colors.disabled} />
          <Text style={styles.emptyText}>No vendors found</Text>
          <Text style={styles.emptySubtext}>Try adjusting your search</Text>
        </View>
      ) : (
        <FlatList
          data={sellers}
          renderItem={renderSellerItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
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
    marginBottom: spacing.md,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: fontSize.md,
  },
  sortContainer: {
    marginTop: spacing.sm,
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
  listContent: {
    padding: spacing.md,
  },
  sellerCard: {
    flexDirection: "row",
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
  sellerLogo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: spacing.md,
  },
  sellerInfo: {
    flex: 1,
    justifyContent: "center",
  },
  sellerName: {
    fontSize: fontSize.lg,
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
    marginRight: spacing.md,
  },
  distanceText: {
    fontSize: fontSize.sm,
    color: theme.colors.placeholder,
    marginLeft: 2,
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
  sellerActions: {
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  likeButton: {
    marginBottom: spacing.md,
  },
  viewMenuButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
  },
  viewMenuButtonDisabled: {
    backgroundColor: theme.colors.disabled,
  },
  viewMenuText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: fontSize.sm,
  },
  viewMenuTextDisabled: {
    color: "#FFFFFF",
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
  },
  emptySubtext: {
    fontSize: fontSize.md,
    color: theme.colors.placeholder,
    marginTop: spacing.xs,
  },
})

export default ListScreen
