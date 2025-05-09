"use client"

import { useState } from "react"
import { View, StyleSheet, Text, TextInput, FlatList, TouchableOpacity, Image, SafeAreaView } from "react-native"
import { useNavigation } from "@react-navigation/native"
import { theme, spacing, fontSize } from "../../theme"
import { Ionicons } from "@expo/vector-icons"

// Mock data for products
const MOCK_PRODUCTS = [
  {
    id: "1",
    name: "Fresh Tomatoes",
    image: "https://via.placeholder.com/150?text=Tomatoes",
    priceRange: "$2 - $5/kg",
    sellers: 5,
  },
  {
    id: "2",
    name: "Organic Apples",
    image: "https://via.placeholder.com/150?text=Apples",
    priceRange: "$3 - $6/kg",
    sellers: 3,
  },
  {
    id: "3",
    name: "Fresh Bread",
    image: "https://via.placeholder.com/150?text=Bread",
    priceRange: "$2 - $4/loaf",
    sellers: 2,
  },
  {
    id: "4",
    name: "Milk",
    image: "https://via.placeholder.com/150?text=Milk",
    priceRange: "$1 - $3/liter",
    sellers: 4,
  },
  {
    id: "5",
    name: "Eggs",
    image: "https://via.placeholder.com/150?text=Eggs",
    priceRange: "$3 - $5/dozen",
    sellers: 3,
  },
  {
    id: "6",
    name: "Potatoes",
    image: "https://via.placeholder.com/150?text=Potatoes",
    priceRange: "$1 - $3/kg",
    sellers: 6,
  },
]

const ShopScreen = () => {
  const navigation = useNavigation()
  const [searchQuery, setSearchQuery] = useState("")
  const [products, setProducts] = useState(MOCK_PRODUCTS)

  const handleSearch = (text) => {
    setSearchQuery(text)

    if (text.trim() === "") {
      setProducts(MOCK_PRODUCTS)
      return
    }

    const filtered = MOCK_PRODUCTS.filter((product) => product.name.toLowerCase().includes(text.toLowerCase()))

    setProducts(filtered)
  }

  const navigateToProductDetail = (product) => {
    navigation.navigate("ProductDetail", { product })
  }

  const renderProductItem = ({ item }) => (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() => navigateToProductDetail(item)}
      accessibilityLabel={`${item.name} card`}
    >
      <Image source={{ uri: item.image }} style={styles.productImage} accessibilityLabel={`${item.name} image`} />
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{item.name}</Text>
        <Text style={styles.priceRange}>{item.priceRange}</Text>
        <View style={styles.sellerCount}>
          <Ionicons name="people" size={14} color={theme.colors.placeholder} />
          <Text style={styles.sellerCountText}>{item.sellers} sellers</Text>
        </View>
      </View>
    </TouchableOpacity>
  )

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Shop</Text>

        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={theme.colors.placeholder} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for products"
            value={searchQuery}
            onChangeText={handleSearch}
            accessibilityLabel="Search products input"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch("")} accessibilityLabel="Clear search">
              <Ionicons name="close-circle" size={20} color={theme.colors.placeholder} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {products.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="basket" size={50} color={theme.colors.disabled} />
          <Text style={styles.emptyText}>No products found</Text>
          <Text style={styles.emptySubtext}>Try adjusting your search</Text>
        </View>
      ) : (
        <FlatList
          data={products}
          renderItem={renderProductItem}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.gridContent}
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
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: fontSize.md,
  },
  gridContent: {
    padding: spacing.md,
  },
  productCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    margin: spacing.xs,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productImage: {
    width: "100%",
    height: 150,
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
  priceRange: {
    fontSize: fontSize.sm,
    color: theme.colors.primary,
    marginBottom: spacing.xs,
  },
  sellerCount: {
    flexDirection: "row",
    alignItems: "center",
  },
  sellerCountText: {
    fontSize: fontSize.xs,
    color: theme.colors.placeholder,
    marginLeft: 4,
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

export default ShopScreen
