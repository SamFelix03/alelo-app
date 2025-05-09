"use client"

import { useState } from "react"
import { View, StyleSheet, Text, Image, TouchableOpacity, FlatList, SafeAreaView, Alert } from "react-native"
import { useNavigation } from "@react-navigation/native"
import { theme, spacing, fontSize } from "../../theme"
import { Ionicons } from "@expo/vector-icons"

// Mock data for products
const MOCK_PRODUCTS = [
  {
    id: "1",
    name: "Fresh Tomatoes",
    image: "https://via.placeholder.com/150?text=Tomatoes",
    price: "$2.50/kg",
    category: "Vegetables",
    inStock: true,
  },
  {
    id: "2",
    name: "Organic Apples",
    image: "https://via.placeholder.com/150?text=Apples",
    price: "$3.00/kg",
    category: "Fruits",
    inStock: true,
  },
  {
    id: "3",
    name: "Fresh Bread",
    image: "https://via.placeholder.com/150?text=Bread",
    price: "$2.00/loaf",
    category: "Bakery",
    inStock: false,
  },
  {
    id: "4",
    name: "Milk",
    image: "https://via.placeholder.com/150?text=Milk",
    price: "$1.50/liter",
    category: "Dairy",
    inStock: true,
  },
  {
    id: "5",
    name: "Eggs",
    image: "https://via.placeholder.com/150?text=Eggs",
    price: "$3.50/dozen",
    category: "Dairy",
    inStock: true,
  },
  {
    id: "6",
    name: "Potatoes",
    image: "https://via.placeholder.com/150?text=Potatoes",
    price: "$1.20/kg",
    category: "Vegetables",
    inStock: true,
  },
]

const ProductsScreen = () => {
  const navigation = useNavigation()
  const [products, setProducts] = useState(MOCK_PRODUCTS)
  const [viewMode, setViewMode] = useState("grid") // 'grid' or 'list'
  const [selectedProducts, setSelectedProducts] = useState([])

  const toggleViewMode = () => {
    setViewMode(viewMode === "grid" ? "list" : "grid")
  }

  const toggleProductSelection = (id) => {
    if (selectedProducts.includes(id)) {
      setSelectedProducts(selectedProducts.filter((productId) => productId !== id))
    } else {
      setSelectedProducts([...selectedProducts, id])
    }
  }

  const toggleStockStatus = (id) => {
    const updatedProducts = products.map((product) =>
      product.id === id ? { ...product, inStock: !product.inStock } : product,
    )

    setProducts(updatedProducts)
  }

  const handleAddProduct = () => {
    navigation.navigate("ProductForm")
  }

  const handleEditProduct = (product) => {
    navigation.navigate("ProductForm", { product })
  }

  const handleBatchAction = () => {
    if (selectedProducts.length === 0) {
      Alert.alert("No Products Selected", "Please select at least one product.")
      return
    }

    Alert.alert("Batch Action", `Mark ${selectedProducts.length} product(s) as out of stock?`, [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Confirm",
        onPress: () => {
          const updatedProducts = products.map((product) =>
            selectedProducts.includes(product.id) ? { ...product, inStock: false } : product,
          )

          setProducts(updatedProducts)
          setSelectedProducts([])
        },
      },
    ])
  }

  const renderGridItem = ({ item }) => (
    <View style={styles.gridItem}>
      <TouchableOpacity
        style={[styles.productCard, selectedProducts.includes(item.id) && styles.productCardSelected]}
        onPress={() => toggleProductSelection(item.id)}
        onLongPress={() => handleEditProduct(item)}
        accessibilityLabel={`${item.name} card`}
      >
        <View style={styles.imageContainer}>
          <Image source={{ uri: item.image }} style={styles.productImage} accessibilityLabel={`${item.name} image`} />

          {!item.inStock && (
            <View style={styles.outOfStockOverlay}>
              <Text style={styles.outOfStockText}>Out of Stock</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.stockToggle, item.inStock ? styles.inStockToggle : styles.outOfStockToggle]}
            onPress={() => toggleStockStatus(item.id)}
            accessibilityLabel={`Toggle ${item.name} stock status`}
          >
            <Ionicons name={item.inStock ? "checkmark" : "close"} size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.productInfo}>
          <Text style={styles.productName}>{item.name}</Text>
          <Text style={styles.productPrice}>{item.price}</Text>

          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{item.category}</Text>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  )

  const renderListItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.listItem, selectedProducts.includes(item.id) && styles.listItemSelected]}
      onPress={() => toggleProductSelection(item.id)}
      onLongPress={() => handleEditProduct(item)}
      accessibilityLabel={`${item.name} list item`}
    >
      <View style={styles.listImageContainer}>
        <Image source={{ uri: item.image }} style={styles.listItemImage} accessibilityLabel={`${item.name} image`} />

        {!item.inStock && (
          <View style={styles.outOfStockOverlayList}>
            <Text style={styles.outOfStockText}>Out of Stock</Text>
          </View>
        )}
      </View>

      <View style={styles.listItemInfo}>
        <Text style={styles.productName}>{item.name}</Text>
        <Text style={styles.productPrice}>{item.price}</Text>

        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{item.category}</Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.stockToggleList, item.inStock ? styles.inStockToggle : styles.outOfStockToggle]}
        onPress={() => toggleStockStatus(item.id)}
        accessibilityLabel={`Toggle ${item.name} stock status`}
      >
        <Ionicons name={item.inStock ? "checkmark" : "close"} size={16} color="#FFFFFF" />
      </TouchableOpacity>
    </TouchableOpacity>
  )

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Products</Text>

        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.viewModeButton}
            onPress={toggleViewMode}
            accessibilityLabel={`Switch to ${viewMode === "grid" ? "list" : "grid"} view`}
          >
            <Ionicons name={viewMode === "grid" ? "list" : "grid"} size={24} color={theme.colors.text} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.addButton} onPress={handleAddProduct} accessibilityLabel="Add product button">
            <Ionicons name="add" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {selectedProducts.length > 0 && (
        <View style={styles.batchActionContainer}>
          <Text style={styles.selectedText}>{selectedProducts.length} product(s) selected</Text>

          <TouchableOpacity
            style={styles.batchActionButton}
            onPress={handleBatchAction}
            accessibilityLabel="Mark as out of stock button"
          >
            <Text style={styles.batchActionText}>Mark as Out of Stock</Text>
          </TouchableOpacity>
        </View>
      )}

      {viewMode === "grid" ? (
        <FlatList
          data={products}
          renderItem={renderGridItem}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.productsGrid}
        />
      ) : (
        <FlatList
          data={products}
          renderItem={renderListItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.productsList}
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: "bold",
  },
  headerButtons: {
    flexDirection: "row",
    alignItems: "center",
  },
  viewModeButton: {
    padding: spacing.sm,
    marginRight: spacing.md,
  },
  addButton: {
    backgroundColor: theme.colors.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  batchActionContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.md,
    backgroundColor: "#F5F5F5",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  selectedText: {
    fontSize: fontSize.md,
    fontWeight: "bold",
  },
  batchActionButton: {
    backgroundColor: theme.colors.error,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
  },
  batchActionText: {
    color: "#FFFFFF",
    fontWeight: "bold",
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
  productCardSelected: {
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  imageContainer: {
    position: "relative",
  },
  productImage: {
    width: "100%",
    height: 120,
    resizeMode: "cover",
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
  stockToggle: {
    position: "absolute",
    top: spacing.sm,
    right: spacing.sm,
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  inStockToggle: {
    backgroundColor: theme.colors.primary,
  },
  outOfStockToggle: {
    backgroundColor: theme.colors.error,
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
    marginBottom: spacing.xs,
  },
  categoryBadge: {
    backgroundColor: "#F5F5F5",
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: "flex-start",
  },
  categoryText: {
    fontSize: fontSize.xs,
    color: theme.colors.placeholder,
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
  listItemSelected: {
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  listImageContainer: {
    position: "relative",
  },
  listItemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: spacing.md,
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
    borderRadius: 8,
  },
  listItemInfo: {
    flex: 1,
    justifyContent: "center",
  },
  stockToggleList: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
  },
})

export default ProductsScreen
