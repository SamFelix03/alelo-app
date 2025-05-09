"use client"

import { useState } from "react"
import { View, StyleSheet, Text, Image, FlatList, TouchableOpacity, SafeAreaView, ScrollView } from "react-native"
import { useNavigation, useRoute } from "@react-navigation/native"
import { theme, spacing, fontSize } from "../../theme"
import { Ionicons } from "@expo/vector-icons"

// Mock data for sellers offering this product
const MOCK_SELLERS = [
  {
    id: "1",
    name: "Fresh Veggies",
    logo: "https://via.placeholder.com/50?text=FV",
    distance: "0.5 km",
    price: "$2.50/kg",
    rating: 4.8,
    isOpen: true,
  },
  {
    id: "2",
    name: "Fruit Paradise",
    logo: "https://via.placeholder.com/50?text=FP",
    distance: "0.8 km",
    price: "$3.00/kg",
    rating: 4.5,
    isOpen: true,
  },
  {
    id: "3",
    name: "Organic Market",
    logo: "https://via.placeholder.com/50?text=OM",
    distance: "1.2 km",
    price: "$4.50/kg",
    rating: 4.9,
    isOpen: false,
  },
]

const ProductDetail = () => {
  const navigation = useNavigation()
  const route = useRoute()
  const { product } = route.params

  const [quantity, setQuantity] = useState(1)
  const [selectedSeller, setSelectedSeller] = useState(null)

  const handleQuantityChange = (increment) => {
    const newQuantity = quantity + increment
    if (newQuantity >= 1) {
      setQuantity(newQuantity)
    }
  }

  const handleSellerSelect = (seller) => {
    setSelectedSeller(seller)
  }

  const navigateToSellerProfile = (seller) => {
    navigation.navigate("SellerProfile", { seller })
  }

  const handleBuyNow = () => {
    if (selectedSeller) {
      navigation.navigate("CartScreen", {
        product,
        quantity,
        seller: selectedSeller,
      })
    }
  }

  const renderSellerItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.sellerCard,
        selectedSeller?.id === item.id && styles.sellerCardSelected,
        !item.isOpen && styles.sellerCardDisabled,
      ]}
      onPress={() => item.isOpen && handleSellerSelect(item)}
      disabled={!item.isOpen}
      accessibilityLabel={`${item.name} seller card`}
    >
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

        <View style={styles.priceRow}>
          <Text style={styles.priceText}>{item.price}</Text>

          <View style={[styles.statusBadge, item.isOpen ? styles.openBadge : styles.closedBadge]}>
            <Text style={[styles.statusText, item.isOpen ? styles.openText : styles.closedText]}>
              {item.isOpen ? "Open" : "Closed"}
            </Text>
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={styles.viewButton}
        onPress={() => navigateToSellerProfile(item)}
        accessibilityLabel={`View ${item.name} profile`}
      >
        <Ionicons name="chevron-forward" size={20} color={theme.colors.primary} />
      </TouchableOpacity>
    </TouchableOpacity>
  )

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            accessibilityLabel="Back button"
          >
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>

          <Text style={styles.title}>{product.name}</Text>
        </View>

        <Image
          source={{ uri: product.image }}
          style={styles.productImage}
          accessibilityLabel={`${product.name} image`}
        />

        <View style={styles.productDetails}>
          <Text style={styles.productName}>{product.name}</Text>
          <Text style={styles.priceRange}>{product.priceRange}</Text>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>Available from {MOCK_SELLERS.length} sellers</Text>

          <View style={styles.quantityContainer}>
            <Text style={styles.quantityLabel}>Quantity:</Text>

            <View style={styles.quantityControls}>
              <TouchableOpacity
                style={[styles.quantityButton, quantity <= 1 && styles.quantityButtonDisabled]}
                onPress={() => handleQuantityChange(-1)}
                disabled={quantity <= 1}
                accessibilityLabel="Decrease quantity"
              >
                <Ionicons name="remove" size={20} color={quantity <= 1 ? theme.colors.disabled : theme.colors.text} />
              </TouchableOpacity>

              <Text style={styles.quantityText}>{quantity}</Text>

              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => handleQuantityChange(1)}
                accessibilityLabel="Increase quantity"
              >
                <Ionicons name="add" size={20} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <FlatList
          data={MOCK_SELLERS}
          renderItem={renderSellerItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.sellersList}
          scrollEnabled={false}
        />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.buyButton, (!selectedSeller || !selectedSeller.isOpen) && styles.buyButtonDisabled]}
          onPress={handleBuyNow}
          disabled={!selectedSeller || !selectedSeller.isOpen}
          accessibilityLabel="Buy now button"
        >
          <Text style={styles.buyButtonText}>{selectedSeller ? "Buy Now" : "Select a Seller"}</Text>
        </TouchableOpacity>
      </View>
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
  },
  backButton: {
    marginRight: spacing.md,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: "bold",
    flex: 1,
  },
  productImage: {
    width: "100%",
    height: 250,
    resizeMode: "cover",
  },
  productDetails: {
    padding: spacing.lg,
  },
  productName: {
    fontSize: fontSize.xl,
    fontWeight: "bold",
    marginBottom: spacing.xs,
  },
  priceRange: {
    fontSize: fontSize.lg,
    color: theme.colors.primary,
    fontWeight: "bold",
  },
  divider: {
    height: 1,
    backgroundColor: "#F0F0F0",
    marginVertical: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: "bold",
    marginBottom: spacing.md,
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.lg,
  },
  quantityLabel: {
    fontSize: fontSize.md,
    fontWeight: "bold",
  },
  quantityControls: {
    flexDirection: "row",
    alignItems: "center",
  },
  quantityButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
  },
  quantityButtonDisabled: {
    opacity: 0.5,
  },
  quantityText: {
    fontSize: fontSize.lg,
    fontWeight: "bold",
    marginHorizontal: spacing.md,
    minWidth: 30,
    textAlign: "center",
  },
  sellersList: {
    padding: spacing.md,
  },
  sellerCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  sellerCardSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: "#F9FFF9",
  },
  sellerCardDisabled: {
    opacity: 0.7,
  },
  sellerLogo: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: spacing.md,
  },
  sellerInfo: {
    flex: 1,
  },
  sellerName: {
    fontSize: fontSize.md,
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
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  priceText: {
    fontSize: fontSize.md,
    fontWeight: "bold",
    color: theme.colors.primary,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 4,
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
  viewButton: {
    justifyContent: "center",
    padding: spacing.xs,
  },
  footer: {
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    backgroundColor: "#FFFFFF",
  },
  buyButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    padding: spacing.md,
    alignItems: "center",
  },
  buyButtonDisabled: {
    backgroundColor: theme.colors.disabled,
  },
  buyButtonText: {
    color: "#FFFFFF",
    fontSize: fontSize.lg,
    fontWeight: "bold",
  },
})

export default ProductDetail
