"use client"

import React, { useState, useEffect } from "react"
import { View, StyleSheet, Text, Image, TouchableOpacity, FlatList, SafeAreaView, Alert, ActivityIndicator, Platform } from "react-native"
import { useNavigation, useFocusEffect } from "@react-navigation/native"
import { theme, spacing, fontSize } from "../../theme"
import { 
  CheckIcon, 
  XMarkIcon, 
  PencilIcon, 
  TrashIcon, 
  Squares2X2Icon, 
  ListBulletIcon, 
  ShoppingBagIcon, 
  PlusIcon 
} from "react-native-heroicons/outline"
import { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { supabase } from "../../lib/supabase"
import { useAuth } from "../../context/AuthContext"

interface Product {
  product_id: string;
  name: string;
  image_url: string | null;
  price: number;
  price_unit: string;
  product_type: 'fruits' | 'vegetables' | 'prepared_food' | 'beverages' | 'crafts' | 'other';
  description: string | null;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

interface DisplayProduct extends Product {
  isSelected?: boolean;
}

type RootStackParamList = {
  ProductForm: { 
    product?: DisplayProduct;
    isEdit?: boolean;
  } | undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const ProductsScreen = () => {
  const navigation = useNavigation<NavigationProp>()
  const { userInfo } = useAuth()
  const [products, setProducts] = useState<DisplayProduct[]>([])
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isBusinessStarted, setIsBusinessStarted] = useState(false)
  const [sellerId, setSellerId] = useState<string | null>(null)

  // Function to fetch products
  const fetchProducts = async () => {
    try {
      setIsLoading(true)
      if (!userInfo) return

      // Get current seller's ID and status
      const { data: sellerData, error: sellerError } = await supabase
        .from('sellers')
        .select('seller_id, is_open')
        .eq('phone_number', userInfo.phoneNumber)
        .single()

      if (sellerError) throw sellerError

      setSellerId(sellerData.seller_id)
      setIsBusinessStarted(sellerData.is_open)

      // Get seller's products
      const { data: sellerProducts, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('seller_id', sellerData.seller_id)
        .order('created_at', { ascending: false })

      if (productsError) throw productsError

      const displayProducts: DisplayProduct[] = (sellerProducts || []).map(product => ({
        ...product,
        isSelected: false
      }))

      setProducts(displayProducts)
      setSelectedProducts([])
    } catch (error) {
      console.error('Error fetching data:', error)
      Alert.alert('Error', 'Failed to load products. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch products when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      fetchProducts()
    }, [userInfo])
  )

  const handleStartBusiness = async () => {
    if (products.length === 0) {
      Alert.alert('No Products', 'Please add at least one product to start your business.')
      return
    }

    try {
      setIsLoading(true)
      
      if (!sellerId) throw new Error('No seller ID found')

      // Update seller status to open
      const { error: updateError } = await supabase
        .from('sellers')
        .update({ is_open: true })
        .eq('seller_id', sellerId)

      if (updateError) throw updateError

      setIsBusinessStarted(true)
      Alert.alert('Success', 'Your business is now visible to customers!')

    } catch (error) {
      console.error('Error starting business:', error)
      Alert.alert('Error', 'Failed to start business. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const toggleProductSelection = (productId: string) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    )
    
    setProducts(prev => prev.map(product => 
      product.product_id === productId 
        ? { ...product, isSelected: !product.isSelected }
        : product
    ))
  }

  const toggleViewMode = () => {
    setViewMode(viewMode === "grid" ? "list" : "grid")
  }

  const toggleStockStatus = async (productId: string) => {
    try {
      const product = products.find(p => p.product_id === productId)
      if (!product) return

      const newAvailability = !product.is_available

      const { error } = await supabase
        .from('products')
        .update({ is_available: newAvailability })
        .eq('product_id', productId)

      if (error) throw error

      setProducts(prev => prev.map(p => 
        p.product_id === productId 
          ? { ...p, is_available: newAvailability }
          : p
      ))

    } catch (error) {
      console.error('Error updating stock status:', error)
      Alert.alert('Error', 'Failed to update stock status. Please try again.')
    }
  }

  const handleAddProduct = () => {
    navigation.navigate('ProductForm')
  }

  const handleEditProduct = (product: DisplayProduct) => {
    navigation.navigate('ProductForm', { product, isEdit: true })
  }

  const handleBatchAction = async () => {
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
        onPress: async () => {
          try {
            const { error } = await supabase
              .from('products')
              .update({ is_available: false })
              .in('product_id', selectedProducts)

            if (error) throw error

            setProducts(prev => prev.map(product =>
              selectedProducts.includes(product.product_id) 
                ? { ...product, is_available: false, isSelected: false }
                : product
            ))
            setSelectedProducts([])
            Alert.alert('Success', 'Products marked as out of stock.')
          } catch (error) {
            console.error('Error updating products:', error)
            Alert.alert('Error', 'Failed to update products. Please try again.')
          }
        },
      },
    ])
  }

  const handleDeleteProduct = async (product: DisplayProduct) => {
    Alert.alert(
      "Delete Product",
      "Are you sure you want to delete this product?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setIsLoading(true)
              const { error } = await supabase
                .from('products')
                .delete()
                .eq('product_id', product.product_id)

              if (error) throw error

              // Refresh products list
              await fetchProducts()
              Alert.alert("Success", "Product deleted successfully!")
            } catch (error) {
              console.error('Error deleting product:', error)
              Alert.alert("Error", "Failed to delete product. Please try again.")
            } finally {
              setIsLoading(false)
            }
          }
        }
      ]
    )
  }

  const renderGridItem = ({ item }: { item: DisplayProduct }) => (
    <View style={styles.gridItem}>
      <TouchableOpacity
        style={[styles.productCard, item.isSelected && styles.productCardSelected]}
        onPress={() => toggleProductSelection(item.product_id)}
        accessibilityLabel={`${item.name} card`}
      >
        <View style={styles.imageContainer}>
          <Image 
            source={{ uri: item.image_url || `https://via.placeholder.com/200?text=${item.name.charAt(0)}` }} 
            style={styles.productImage} 
            accessibilityLabel={`${item.name} image`} 
          />

          {!item.is_available && (
            <View style={styles.outOfStockOverlay}>
              <Text style={styles.outOfStockText}>Out of Stock</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.stockToggle, item.is_available ? styles.inStockToggle : styles.outOfStockToggle]}
            onPress={() => toggleStockStatus(item.product_id)}
            accessibilityLabel={`Toggle ${item.name} stock status`}
          >
            {item.is_available ? <CheckIcon size={16} color="#FFFFFF" /> : <XMarkIcon size={16} color="#FFFFFF" />}
          </TouchableOpacity>
        </View>

        <View style={styles.productInfo}>
          <Text style={styles.productName}>{item.name}</Text>
          <Text style={styles.productPrice}>${item.price}/{item.price_unit}</Text>

          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{item.product_type}</Text>
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => handleEditProduct(item)}
              accessibilityLabel={`Edit ${item.name}`}
            >
              <PencilIcon size={16} color={theme.colors.primary} />
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDeleteProduct(item)}
              accessibilityLabel={`Delete ${item.name}`}
            >
              <TrashIcon size={16} color={theme.colors.error} />
              <Text style={styles.deleteButtonText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  )

  const renderListItem = ({ item }: { item: DisplayProduct }) => (
    <TouchableOpacity
      style={[styles.listItem, item.isSelected && styles.listItemSelected]}
      onPress={() => toggleProductSelection(item.product_id)}
      accessibilityLabel={`${item.name} list item`}
    >
      <View style={styles.listImageContainer}>
        <Image 
          source={{ uri: item.image_url || `https://via.placeholder.com/200?text=${item.name.charAt(0)}` }} 
          style={styles.listItemImage} 
          accessibilityLabel={`${item.name} image`} 
        />

        {!item.is_available && (
          <View style={styles.outOfStockOverlayList}>
            <Text style={styles.outOfStockText}>Out of Stock</Text>
          </View>
        )}
      </View>

      <View style={styles.listItemInfo}>
        <Text style={styles.productName}>{item.name}</Text>
        <Text style={styles.productPrice}>${item.price}/{item.price_unit}</Text>

        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{item.product_type}</Text>
        </View>

        <View style={styles.listActionButtons}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => handleEditProduct(item)}
            accessibilityLabel={`Edit ${item.name}`}
          >
            <PencilIcon size={16} color={theme.colors.primary} />
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteProduct(item)}
            accessibilityLabel={`Delete ${item.name}`}
          >
            <TrashIcon size={16} color={theme.colors.error} />
            <Text style={styles.deleteButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.stockToggleList, item.is_available ? styles.inStockToggle : styles.outOfStockToggle]}
        onPress={() => toggleStockStatus(item.product_id)}
        accessibilityLabel={`Toggle ${item.name} stock status`}
      >
        {item.is_available ? <CheckIcon size={16} color="#FFFFFF" /> : <XMarkIcon size={16} color="#FFFFFF" />}
      </TouchableOpacity>
    </TouchableOpacity>
  )

  return (
    <SafeAreaView style={styles.container}>
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <>
          <View style={styles.header}>
            <Text style={styles.title}>Products</Text>

            <TouchableOpacity
              style={styles.viewModeButton}
              onPress={toggleViewMode}
              accessibilityLabel={`Switch to ${viewMode === "grid" ? "list" : "grid"} view`}
            >
              <Squares2X2Icon size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          {!isBusinessStarted && (
            <View style={styles.startBusinessContainer}>
              <TouchableOpacity
                style={styles.startBusinessButton}
                onPress={handleStartBusiness}
                disabled={isLoading}
              >
                <Text style={styles.startBusinessText}>Start Business</Text>
              </TouchableOpacity>
            </View>
          )}

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

          {products.length === 0 ? (
            <View style={styles.emptyContainer}>
              <ShoppingBagIcon size={64} color={theme.colors.placeholder} />
              <Text style={styles.emptyTitle}>No Products Yet</Text>
              <Text style={styles.emptyDescription}>
                Add your first product to start selling to customers
              </Text>
            </View>
          ) : (
            <>
              {viewMode === "grid" ? (
                <FlatList
                  key="grid"
                  data={products}
                  renderItem={renderGridItem}
                  keyExtractor={(item) => item.product_id}
                  numColumns={2}
                  contentContainerStyle={styles.productsGrid}
                  removeClippedSubviews={true}
                  initialNumToRender={6}
                  maxToRenderPerBatch={10}
                  windowSize={5}
                />
              ) : (
                <FlatList
                  key="list"
                  data={products}
                  renderItem={renderListItem}
                  keyExtractor={(item) => item.product_id}
                  numColumns={1}
                  contentContainerStyle={styles.productsList}
                  removeClippedSubviews={true}
                  initialNumToRender={8}
                  maxToRenderPerBatch={10}
                  windowSize={5}
                />
              )}
            </>
          )}

          {/* Floating Action Button */}
          <TouchableOpacity
            style={styles.fab}
            onPress={handleAddProduct}
            accessibilityLabel="Add new product"
          >
            <PlusIcon size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </>
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
  viewModeButton: {
    padding: spacing.sm,
  },
  startBusinessContainer: {
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  startBusinessButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  startBusinessText: {
    color: '#FFFFFF',
    fontSize: fontSize.sm,
    fontWeight: '600',
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  emptyDescription: {
    fontSize: fontSize.md,
    color: theme.colors.placeholder,
    textAlign: 'center',
    lineHeight: 22,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    right: 16,
    bottom: Platform.OS === 'ios' ? 100 : 72,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
    zIndex: 999,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  listActionButtons: {
    flexDirection: 'row',
    marginTop: spacing.xs,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.xs,
    borderRadius: 4,
    backgroundColor: '#F0F0F0',
    marginRight: spacing.sm,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.xs,
    borderRadius: 4,
    backgroundColor: '#FFF0F0',
  },
  editButtonText: {
    marginLeft: 4,
    fontSize: fontSize.sm,
    color: theme.colors.primary,
  },
  deleteButtonText: {
    marginLeft: 4,
    fontSize: fontSize.sm,
    color: theme.colors.error,
  },
})

export default ProductsScreen
