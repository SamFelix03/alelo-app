"use client"

import { useState } from "react"
import {
  View,
  StyleSheet,
  Text,
  Image,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  ScrollView,
  Alert,
} from "react-native"
import { useNavigation, useRoute } from "@react-navigation/native"
import { theme, spacing, fontSize } from "../../theme"
import { Ionicons } from "@expo/vector-icons"

const CartScreen = () => {
  const navigation = useNavigation()
  const route = useRoute()
  const { cart: initialCart, seller, product, quantity } = route.params

  // If coming from ProductDetail, create a cart with the single product
  const initialCartItems = initialCart || (product ? [{ ...product, quantity }] : [])

  const [cart, setCart] = useState(initialCartItems)
  const [deliveryAddress, setDeliveryAddress] = useState("123 Main St, San Francisco, CA")

  const updateQuantity = (id, increment) => {
    const updatedCart = cart
      .map((item) => {
        if (item.id === id) {
          const newQuantity = item.quantity + increment
          return newQuantity > 0 ? { ...item, quantity: newQuantity } : null
        }
        return item
      })
      .filter(Boolean)

    setCart(updatedCart)
  }

  const calculateTotal = () => {
    return cart
      .reduce((total, item) => {
        const price = Number.parseFloat(item.price.replace(/[^0-9.]/g, ""))
        return total + price * item.quantity
      }, 0)
      .toFixed(2)
  }

  const handlePlaceOrder = () => {
    Alert.alert("Confirm Order", `Place order with ${seller.name} for $${calculateTotal()}?`, [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Confirm",
        onPress: () => {
          // In a real app, this would send the order to the backend
          navigation.navigate("BuyerTabs", { screen: "Orders" })
        },
      },
    ])
  }

  const renderCartItem = ({ item }) => (
    <View style={styles.cartItem}>
      <Image source={{ uri: item.image }} style={styles.itemImage} accessibilityLabel={`${item.name} image`} />

      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemPrice}>{item.price}</Text>
      </View>

      <View style={styles.quantityControls}>
        <TouchableOpacity
          style={styles.quantityButton}
          onPress={() => updateQuantity(item.id, -1)}
          accessibilityLabel={`Decrease ${item.name} quantity`}
        >
          <Ionicons name="remove" size={20} color={theme.colors.text} />
        </TouchableOpacity>

        <Text style={styles.quantityText}>{item.quantity}</Text>

        <TouchableOpacity
          style={styles.quantityButton}
          onPress={() => updateQuantity(item.id, 1)}
          accessibilityLabel={`Increase ${item.name} quantity`}
        >
          <Ionicons name="add" size={20} color={theme.colors.text} />
        </TouchableOpacity>
      </View>
    </View>
  )

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          accessibilityLabel="Back button"
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>

        <Text style={styles.title}>Your Cart</Text>
      </View>

      {cart.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="cart" size={50} color={theme.colors.disabled} />
          <Text style={styles.emptyText}>Your cart is empty</Text>
          <TouchableOpacity
            style={styles.continueShoppingButton}
            onPress={() => navigation.goBack()}
            accessibilityLabel="Continue shopping button"
          >
            <Text style={styles.continueShoppingText}>Continue Shopping</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView>
          <View style={styles.sellerInfo}>
            <Image source={{ uri: seller.logo }} style={styles.sellerLogo} accessibilityLabel="Seller logo" />

            <View>
              <Text style={styles.sellerName}>{seller.name}</Text>
              <View style={styles.sellerMetaRow}>
                <Ionicons name="location" size={14} color={theme.colors.placeholder} />
                <Text style={styles.sellerDistance}>{seller.distance}</Text>
              </View>
            </View>
          </View>

          <View style={styles.cartItemsContainer}>
            <Text style={styles.sectionTitle}>Items</Text>

            <FlatList data={cart} renderItem={renderCartItem} keyExtractor={(item) => item.id} scrollEnabled={false} />
          </View>

          <View style={styles.deliveryContainer}>
            <Text style={styles.sectionTitle}>Delivery Address</Text>

            <View style={styles.addressContainer}>
              <Ionicons name="location" size={20} color={theme.colors.primary} style={styles.addressIcon} />

              <View style={styles.addressInfo}>
                <Text style={styles.addressText}>{deliveryAddress}</Text>
                <TouchableOpacity accessibilityLabel="Change address button">
                  <Text style={styles.changeAddressText}>Change</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={styles.summaryContainer}>
            <Text style={styles.sectionTitle}>Order Summary</Text>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>${calculateTotal()}</Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Delivery Fee</Text>
              <Text style={styles.summaryValue}>$1.50</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>${(Number.parseFloat(calculateTotal()) + 1.5).toFixed(2)}</Text>
            </View>
          </View>
        </ScrollView>
      )}

      {cart.length > 0 && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.placeOrderButton}
            onPress={handlePlaceOrder}
            accessibilityLabel="Place order button"
          >
            <Text style={styles.placeOrderText}>Place Order</Text>
          </TouchableOpacity>
        </View>
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
    alignItems: "center",
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  backButton: {
    marginRight: spacing.md,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: "bold",
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
    marginBottom: spacing.lg,
  },
  continueShoppingButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 8,
  },
  continueShoppingText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  sellerInfo: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  sellerLogo: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: spacing.md,
  },
  sellerName: {
    fontSize: fontSize.md,
    fontWeight: "bold",
    marginBottom: spacing.xs,
  },
  sellerMetaRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  sellerDistance: {
    fontSize: fontSize.sm,
    color: theme.colors.placeholder,
    marginLeft: 4,
  },
  cartItemsContainer: {
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: "bold",
    marginBottom: spacing.md,
  },
  cartItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: spacing.md,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: fontSize.md,
    fontWeight: "bold",
    marginBottom: spacing.xs,
  },
  itemPrice: {
    fontSize: fontSize.sm,
    color: theme.colors.primary,
  },
  quantityControls: {
    flexDirection: "row",
    alignItems: "center",
  },
  quantityButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
  },
  quantityText: {
    fontSize: fontSize.md,
    fontWeight: "bold",
    marginHorizontal: spacing.sm,
    minWidth: 20,
    textAlign: "center",
  },
  deliveryContainer: {
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  addressContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  addressIcon: {
    marginRight: spacing.md,
    marginTop: 2,
  },
  addressInfo: {
    flex: 1,
  },
  addressText: {
    fontSize: fontSize.md,
    marginBottom: spacing.xs,
  },
  changeAddressText: {
    color: theme.colors.primary,
    fontSize: fontSize.sm,
  },
  summaryContainer: {
    padding: spacing.lg,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  summaryLabel: {
    fontSize: fontSize.md,
    color: theme.colors.placeholder,
  },
  summaryValue: {
    fontSize: fontSize.md,
  },
  divider: {
    height: 1,
    backgroundColor: "#F0F0F0",
    marginVertical: spacing.md,
  },
  totalLabel: {
    fontSize: fontSize.lg,
    fontWeight: "bold",
  },
  totalValue: {
    fontSize: fontSize.lg,
    fontWeight: "bold",
    color: theme.colors.primary,
  },
  footer: {
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    backgroundColor: "#FFFFFF",
  },
  placeOrderButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    padding: spacing.md,
    alignItems: "center",
  },
  placeOrderText: {
    color: "#FFFFFF",
    fontSize: fontSize.lg,
    fontWeight: "bold",
  },
})

export default CartScreen
