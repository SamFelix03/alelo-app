"use client"

import { useState } from "react"
import { View, StyleSheet, Text, Image, TouchableOpacity, FlatList, SafeAreaView, ScrollView } from "react-native"
import { useNavigation, useRoute } from "@react-navigation/native"
import { theme, spacing, fontSize } from "../../theme"
import { Ionicons } from "@expo/vector-icons"

// Mock data for products
const MOCK_PRODUCTS = [
  {
    id: "1",
    name: "Fresh Tomatoes",
    image: "https://via.placeholder.com/150?text=Tomatoes",
    price: "$2.50/kg",
    inStock: true,
  },
  {
    id: "2",
    name: "Organic Apples",
    image: "https://via.placeholder.com/150?text=Apples",
    price: "$3.00/kg",
    inStock: true,
  },
  {
    id: "3",
    name: "Fresh Bread",
    image: "https://via.placeholder.com/150?text=Bread",
    price: "$2.00/loaf",
    inStock: false,
  },
  {
    id: "4",
    name: "Milk",
    image: "https://via.placeholder.com/150?text=Milk",
    price: "$1.50/liter",
    inStock: true,
  },
  {
    id: "5",
    name: "Eggs",
    image: "https://via.placeholder.com/150?text=Eggs",
    price: "$3.50/dozen",
    inStock: true,
  },
  {
    id: "6",
    name: "Potatoes",
    image: "https://via.placeholder.com/150?text=Potatoes",
    price: "$1.20/kg",
    inStock: true,
  },
]

const SellerProfile = () => {
  const navigation = useNavigation()
  const route = useRoute()
  const { seller } = route.params

  const [isLiked, setIsLiked] = useState(false)
  const [viewMode, setViewMode] = useState("grid") // 'grid' or 'list'
  const [cart, setCart] = useState([])

  const toggleLike = () => {
    setIsLiked(!isLiked)
  }

  const toggleViewMode = () => {
    setViewMode(viewMode === "grid" ? "list" : "grid")
  }

  const addToCart = (product) => {
    const existingItem = cart.find((item) => item.id === product.id)

    if (existingItem) {
      const updatedCart = cart.map((item) => (item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item))
      setCart(updatedCart)
    } else {
      setCart([...cart, { ...product, quantity: 1 }])
    }
  }

  const navigateToCart = () => {
    if (cart.length > 0) {
      navigation.navigate("CartScreen", { cart, seller })
    }
  }

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0)
  }

  const renderGridItem = ({ item }) => (
    <View style={styles.gridItem}>
      <View style={[styles.productCard, !item.inStock && styles.productCardOutOfStock]}>
        {!item.inStock && (
          <View style={styles.outOfStockOverlay}>
            <Text style={styles.outOfStockText}>Out of Stock</Text>
          </View>
        )}

        <Image source={{ uri: item.image }} style={styles.productImage} accessibilityLabel={`${item.name} image`} />

        <View style={styles.productInfo}>
          <Text style={styles.productName}>{item.name}</Text>
          <Text style={styles.productPrice}>{item.price}</Text>
        </View>

        {item.inStock && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => addToCart(item)}
            accessibilityLabel={`Add ${item.name} to cart`}
          >
            <Ionicons name="add" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  )

  const renderListItem = ({ item }) => (
    <View style={[styles.listItem, !item.inStock && styles.listItemOutOfStock]}>
      {!item.inStock && (
        <View style={styles.outOfStockOverlayList}>
          <Text style={styles.outOfStockText}>Out of Stock</Text>
        </View>
      )}

      <Image source={{ uri: item.image }} style={styles.listItemImage} accessibilityLabel={`${item.name} image`} />

      <View style={styles.listItemInfo}>
        <Text style={styles.productName}>{item.name}</Text>
        <Text style={styles.productPrice}>{item.price}</Text>
      </View>

      {item.inStock && (
        <TouchableOpacity
          style={styles.addButtonList}
          onPress={() => addToCart(item)}
          accessibilityLabel={`Add ${item.name} to cart`}
        >
          <Ionicons name="add" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      )}
    </View>
  )

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Image
            source={{ uri: "https://via.placeholder.com/400x150?text=Cover+Photo" }}
            style={styles.coverPhoto}
            accessibilityLabel="Seller cover photo"
          />

          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              accessibilityLabel="Back button"
            >
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.likeButton}
              onPress={toggleLike}
              accessibilityLabel={`${isLiked ? "Unlike" : "Like"} seller`}
            >
              <Ionicons
                name={isLiked ? "heart" : "heart-outline"}
                size={24}
                color={isLiked ? theme.colors.error : "#FFFFFF"}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.logoContainer}>
            <Image source={{ uri: seller.logo }} style={styles.sellerLogo} accessibilityLabel="Seller logo" />
          </View>
        </View>

        <View style={styles.sellerInfo}>
          <Text style={styles.sellerName}>{seller.name}</Text>

          <View style={styles.sellerMetaRow}>
            <View style={styles.distanceContainer}>
              <Ionicons name="location" size={16} color={theme.colors.placeholder} />
              <Text style={styles.distanceText}>{seller.distance}</Text>
            </View>

            {seller.rating && (
              <View style={styles.ratingContainer}>
                <Ionicons name="star" size={16} color="#FFD700" />
                <Text style={styles.ratingText}>{seller.rating}</Text>
              </View>
            )}
          </View>

          <View style={[styles.statusBadge, seller.isOpen ? styles.openBadge : styles.closedBadge]}>
            <Text style={[styles.statusText, seller.isOpen ? styles.openText : styles.closedText]}>
              {seller.isOpen ? "Open" : "Closed"}
            </Text>
            <Text style={styles.hoursText}>{seller.isOpen ? "Closes at 8:00 PM" : "Opens tomorrow at 8:00 AM"}</Text>
          </View>
        </View>

        <View style={styles.productsHeader}>
          <Text style={styles.sectionTitle}>Products</Text>

          <TouchableOpacity
            style={styles.viewModeButton}
            onPress={toggleViewMode}
            accessibilityLabel={`Switch to ${viewMode === "grid" ? "list" : "grid"} view`}
          >
            <Ionicons name={viewMode === "grid" ? "list" : "grid"} size={20} color={theme.colors.text} />
          </TouchableOpacity>
        </View>

        {viewMode === "grid" ? (
          <FlatList
            data={MOCK_PRODUCTS}
            renderItem={renderGridItem}
            keyExtractor={(item) => item.id}
            numColumns={2}
            contentContainerStyle={styles.productsGrid}
            scrollEnabled={false}
          />
        ) : (
          <FlatList
            data={MOCK_PRODUCTS}
            renderItem={renderListItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.productsList}
            scrollEnabled={false}
          />
        )}
      </ScrollView>

      {cart.length > 0 && (
        <TouchableOpacity style={styles.cartButton} onPress={navigateToCart} accessibilityLabel="View cart button">
          <View style={styles.cartBadge}>
            <Text style={styles.cartBadgeText}>{getTotalItems()}</Text>
          </View>
          <Ionicons name="cart" size={24} color="#FFFFFF" />
          <Text style={styles.cartText}>View Cart</Text>
        </TouchableOpacity>
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
    position: "relative",
  },
  coverPhoto: {
    width: "100%",
    height: 150,
    resizeMode: "cover",
  },
  headerButtons: {
    position: "absolute",
    top: spacing.md,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  likeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  logoContainer: {
    position: "absolute",
    bottom: -40,
    alignSelf: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 50,
    padding: 5,
  },
  sellerLogo: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  sellerInfo: {
    marginTop: 50,
    padding: spacing.lg,
    alignItems: "center",
  },
  sellerName: {
    fontSize: fontSize.xl,
    fontWeight: "bold",
    marginBottom: spacing.xs,
  },
  sellerMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  distanceContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: spacing.md,
  },
  distanceText: {
    fontSize: fontSize.sm,
    color: theme.colors.placeholder,
    marginLeft: 4,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  ratingText: {
    fontSize: fontSize.sm,
    marginLeft: 4,
  },
  statusBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    alignItems: "center",
  },
  openBadge: {
    backgroundColor: "#E8F5E9",
  },
  closedBadge: {
    backgroundColor: "#FFEBEE",
  },
  statusText: {
    fontSize: fontSize.sm,
    fontWeight: "bold",
  },
  openText: {
    color: theme.colors.primary,
  },
  closedText: {
    color: theme.colors.error,
  },
  hoursText: {
    fontSize: fontSize.xs,
    color: theme.colors.placeholder,
    marginTop: 2,
  },
  productsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: "bold",
  },
  viewModeButton: {
    padding: spacing.sm,
  },
  productsGrid: {
    padding: spacing.md,
  },
  gridItem: {
    width: "50%",
    padding: spacing.xs,
  },
  productCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productCardOutOfStock: {
    opacity: 0.7,
  },
  outOfStockOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  outOfStockText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: fontSize.sm,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 4,
  },
  productImage: {
    width: "100%",
    height: 120,
    resizeMode: "cover",
  },
  productInfo: {
    padding: spacing.md,
  },
  productName: {
    fontSize: fontSize.md,
    fontWeight: "bold",
    marginBottom: spacing.xs,
  },
  productPrice: {
    fontSize: fontSize.sm,
    color: theme.colors.primary,
    fontWeight: "bold",
  },
  addButton: {
    position: "absolute",
    bottom: spacing.md,
    right: spacing.md,
    backgroundColor: theme.colors.primary,
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  productsList: {
    padding: spacing.md,
  },
  listItem: {
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
  listItemOutOfStock: {
    opacity: 0.7,
  },
  outOfStockOverlayList: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
    borderRadius: 12,
  },
  listItemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: spacing.md,
  },
  listItemInfo: {
    flex: 1,
    justifyContent: "center",
  },
  addButtonList: {
    backgroundColor: theme.colors.primary,
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
  },
  cartButton: {
    position: "absolute",
    bottom: spacing.lg,
    alignSelf: "center",
    backgroundColor: theme.colors.primary,
    flexDirection: "row",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 30,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  cartBadge: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: theme.colors.error,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  cartBadgeText: {
    color: "#FFFFFF",
    fontSize: fontSize.xs,
    fontWeight: "bold",
  },
  cartText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: fontSize.md,
    marginLeft: spacing.md,
  },
})

export default SellerProfile
