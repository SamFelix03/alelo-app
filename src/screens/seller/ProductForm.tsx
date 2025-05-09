"use client"

import { useState } from "react"
import {
  View,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  SafeAreaView,
  Alert,
} from "react-native"
import { useNavigation, useRoute } from "@react-navigation/native"
import { theme, spacing, fontSize } from "../../theme"
import { Ionicons } from "@expo/vector-icons"

const CATEGORIES = ["Vegetables", "Fruits", "Bakery", "Dairy", "Meat", "Seafood", "Spices", "Other"]

const UNITS = ["kg", "g", "lb", "oz", "dozen", "piece", "bunch", "liter", "ml"]

const ProductForm = () => {
  const navigation = useNavigation()
  const route = useRoute()
  const { product } = route.params || {}

  const [name, setName] = useState(product?.name || "")
  const [price, setPrice] = useState(product?.price ? product.price.replace(/[^0-9.]/g, "") : "")
  const [unit, setUnit] = useState(product?.price ? product.price.split("/")[1] : "kg")
  const [category, setCategory] = useState(product?.category || "Vegetables")
  const [image, setImage] = useState(product?.image || null)
  const [showCategoryPicker, setShowCategoryPicker] = useState(false)
  const [showUnitPicker, setShowUnitPicker] = useState(false)

  const handleImagePicker = () => {
    // In a real app, this would use react-native-image-picker
    // For this example, we'll just set a placeholder
    setImage("https://via.placeholder.com/300?text=Product+Image")
  }

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert("Error", "Please enter a product name.")
      return
    }

    if (!price.trim()) {
      Alert.alert("Error", "Please enter a product price.")
      return
    }

    if (!image) {
      Alert.alert("Error", "Please add a product image.")
      return
    }

    // In a real app, this would save the product to the backend
    Alert.alert("Success", `Product ${product ? "updated" : "added"} successfully!`, [
      {
        text: "OK",
        onPress: () => navigation.goBack(),
      },
    ])
  }

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

        <Text style={styles.title}>{product ? "Edit Product" : "Add Product"}</Text>

        <TouchableOpacity style={styles.saveButton} onPress={handleSave} accessibilityLabel="Save button">
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity
          style={styles.imagePickerContainer}
          onPress={handleImagePicker}
          accessibilityLabel="Upload product image"
        >
          {image ? (
            <Image source={{ uri: image }} style={styles.productImage} accessibilityLabel="Selected product image" />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="camera" size={40} color={theme.colors.placeholder} />
              <Text style={styles.imagePlaceholderText}>Tap to upload</Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Product Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Enter product name"
            accessibilityLabel="Product name input"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Price</Text>
          <View style={styles.priceContainer}>
            <Text style={styles.currencySymbol}>$</Text>
            <TextInput
              style={styles.priceInput}
              value={price}
              onChangeText={setPrice}
              placeholder="0.00"
              keyboardType="decimal-pad"
              accessibilityLabel="Price input"
            />
            <Text style={styles.pricePerText}>per</Text>
            <TouchableOpacity
              style={styles.unitSelector}
              onPress={() => setShowUnitPicker(!showUnitPicker)}
              accessibilityLabel="Unit selector"
            >
              <Text style={styles.unitText}>{unit}</Text>
              <Ionicons name="chevron-down" size={16} color={theme.colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        {showUnitPicker && (
          <View style={styles.pickerContainer}>
            {UNITS.map((unitOption) => (
              <TouchableOpacity
                key={unitOption}
                style={[styles.pickerItem, unit === unitOption && styles.pickerItemSelected]}
                onPress={() => {
                  setUnit(unitOption)
                  setShowUnitPicker(false)
                }}
                accessibilityLabel={`${unitOption} option`}
              >
                <Text style={[styles.pickerItemText, unit === unitOption && styles.pickerItemTextSelected]}>
                  {unitOption}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.formGroup}>
          <Text style={styles.label}>Category</Text>
          <TouchableOpacity
            style={styles.categorySelector}
            onPress={() => setShowCategoryPicker(!showCategoryPicker)}
            accessibilityLabel="Category selector"
          >
            <Text style={styles.categoryText}>{category}</Text>
            <Ionicons name="chevron-down" size={16} color={theme.colors.text} />
          </TouchableOpacity>
        </View>

        {showCategoryPicker && (
          <View style={styles.pickerContainer}>
            {CATEGORIES.map((categoryOption) => (
              <TouchableOpacity
                key={categoryOption}
                style={[styles.pickerItem, category === categoryOption && styles.pickerItemSelected]}
                onPress={() => {
                  setCategory(categoryOption)
                  setShowCategoryPicker(false)
                }}
                accessibilityLabel={`${categoryOption} option`}
              >
                <Text style={[styles.pickerItemText, category === categoryOption && styles.pickerItemTextSelected]}>
                  {categoryOption}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
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
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  backButton: {
    padding: spacing.xs,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: "bold",
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  content: {
    padding: spacing.lg,
  },
  imagePickerContainer: {
    alignSelf: "center",
    marginBottom: spacing.xl,
  },
  productImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
  },
  imagePlaceholder: {
    width: 200,
    height: 200,
    borderRadius: 12,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.disabled,
    borderStyle: "dashed",
  },
  imagePlaceholderText: {
    marginTop: spacing.xs,
    color: theme.colors.placeholder,
  },
  formGroup: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: fontSize.md,
    fontWeight: "bold",
    marginBottom: spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.placeholder,
    borderRadius: 8,
    padding: spacing.md,
    fontSize: fontSize.md,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.placeholder,
    borderRadius: 8,
    padding: spacing.md,
  },
  currencySymbol: {
    fontSize: fontSize.md,
    fontWeight: "bold",
    marginRight: spacing.xs,
  },
  priceInput: {
    flex: 1,
    fontSize: fontSize.md,
  },
  pricePerText: {
    fontSize: fontSize.md,
    color: theme.colors.placeholder,
    marginHorizontal: spacing.sm,
  },
  unitSelector: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 4,
  },
  unitText: {
    fontSize: fontSize.md,
    marginRight: spacing.xs,
  },
  categorySelector: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.placeholder,
    borderRadius: 8,
    padding: spacing.md,
  },
  categoryText: {
    fontSize: fontSize.md,
  },
  pickerContainer: {
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    marginBottom: spacing.lg,
    padding: spacing.sm,
  },
  pickerItem: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 4,
    marginBottom: spacing.xs,
  },
  pickerItemSelected: {
    backgroundColor: theme.colors.primary,
  },
  pickerItemText: {
    fontSize: fontSize.md,
  },
  pickerItemTextSelected: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
})

export default ProductForm
