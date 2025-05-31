"use client"

import { useState, useEffect } from "react"
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
  Platform,
  ActivityIndicator,
} from "react-native"
import { useNavigation, useRoute } from "@react-navigation/native"
import { theme, spacing, fontSize } from "../../theme"
import { Ionicons } from "@expo/vector-icons"
import * as ImagePicker from 'expo-image-picker'
import { supabase } from "../../lib/supabase"
import { decode } from 'base64-arraybuffer'
import { useAuth } from "../../context/AuthContext"

interface RouteParams {
  product?: {
    seller_product_id?: string;
    name: string;
    price: string;
    price_unit: string;
    product_type: string;
    image_url: string | null;
    description?: string;
  };
}

const CATEGORIES = ["Vegetables", "Fruits", "Bakery", "Dairy", "Meat", "Seafood", "Spices", "Other"]

const UNITS = ["kg", "g", "lb", "oz", "dozen", "piece", "bunch", "liter", "ml"]

const ProductForm = () => {
  const navigation = useNavigation()
  const route = useRoute()
  const { product } = (route.params as RouteParams) || {}
  const { userInfo } = useAuth()

  const [name, setName] = useState(product?.name || "")
  const [price, setPrice] = useState(product?.price || "")
  const [unit, setUnit] = useState(product?.price_unit || "kg")
  const [category, setCategory] = useState(product?.product_type || "Vegetables")
  const [image, setImage] = useState(product?.image_url || null)
  const [showCategoryPicker, setShowCategoryPicker] = useState(false)
  const [showUnitPicker, setShowUnitPicker] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [sellerId, setSellerId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Fetch current seller's ID
    const fetchSellerId = async () => {
      try {
        setIsLoading(true)
        
        if (!userInfo) {
          Alert.alert('Error', 'Please log in to continue.')
          navigation.goBack()
          return
        }

        const { data: seller, error } = await supabase
          .from('sellers')
          .select('seller_id')
          .eq('phone_number', userInfo.phoneNumber)
          .single()

        if (error) {
          console.error('Error fetching seller ID:', error)
          Alert.alert('Error', 'Failed to load seller information.')
          navigation.goBack()
          return
        }

        if (!seller) {
          Alert.alert('Error', 'Seller profile not found.')
          navigation.goBack()
          return
        }

        setSellerId(seller.seller_id)
      } catch (error) {
        console.error('Error fetching seller ID:', error)
        Alert.alert('Error', 'Failed to load seller information.')
        navigation.goBack()
      } finally {
        setIsLoading(false)
      }
    }

    fetchSellerId()
  }, [navigation, userInfo])

  const handleImagePicker = async () => {
    if (!sellerId) {
      Alert.alert("Error", "Please wait for seller information to load.")
      return
    }

    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync()
      
      if (!permissionResult.granted) {
        Alert.alert("Permission Required", "Please allow access to your photo library to upload images.")
        return
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      })

      if (!result.canceled && result.assets[0]) {
        setIsUploading(true)
        try {
          const asset = result.assets[0]
          
          // Generate a unique file path using seller ID and timestamp
          const ext = asset.uri.substring(asset.uri.lastIndexOf(".") + 1)
          const fileName = `${sellerId}/${Date.now()}.${ext}`

          // Upload the image
          const { data, error } = await supabase.storage
            .from('product_images')
            .upload(fileName, decode(asset.base64!), {
              contentType: `image/${ext}`,
              cacheControl: '3600',
              upsert: false
            })

          if (error) throw error

          // Get the public URL
          const { data: { publicUrl } } = supabase.storage
            .from('product_images')
            .getPublicUrl(fileName)

          setImage(publicUrl)
        } catch (error) {
          console.error('Error uploading image:', error)
          Alert.alert('Error', 'Failed to upload image. Please try again.')
        }
        setIsUploading(false)
      }
    } catch (error) {
      console.error('Error picking image:', error)
      Alert.alert('Error', 'Failed to pick image. Please try again.')
    }
  }

  const handleSave = async () => {
    if (!sellerId) {
      Alert.alert("Error", "Seller information not loaded. Please try again.")
      return
    }

    if (!name.trim()) {
      Alert.alert("Error", "Please enter a product name.")
      return
    }

    if (!price.trim() || isNaN(Number(price)) || Number(price) <= 0) {
      Alert.alert("Error", "Please enter a valid price.")
      return
    }

    if (!image) {
      Alert.alert("Error", "Please add a product image.")
      return
    }

    setIsSaving(true)
    try {
      const productData = {
        seller_id: sellerId,
        name: name.trim(),
        price: Number(price),
        price_unit: unit,
        product_type: category.toLowerCase(),
        image_url: image,
        is_available: true,
        is_active: true,
        description: null, // Optional field
        template_id: null // Since this is a custom product
      }

      let result;
      if (product?.seller_product_id) {
        // Update existing product
        result = await supabase
          .from('seller_products')
          .update(productData)
          .eq('seller_product_id', product.seller_product_id)
          .select()
          .single()
      } else {
        // Add new product
        result = await supabase
          .from('seller_products')
          .insert(productData)
          .select()
          .single()
      }

      if (result.error) throw result.error

      Alert.alert(
        "Success", 
        `Product ${product ? "updated" : "added"} successfully!`,
        [{ text: "OK", onPress: () => navigation.goBack() }]
      )
    } catch (error) {
      console.error('Error saving product:', error)
      Alert.alert('Error', 'Failed to save product. Please try again.')
    } finally {
      setIsSaving(false)
    }
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

        <View style={styles.headerRight} />
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading seller information...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <TouchableOpacity
            style={styles.imagePickerContainer}
            onPress={handleImagePicker}
            disabled={isUploading || !sellerId}
            accessibilityLabel="Upload product image"
          >
            {image ? (
              <>
                <Image source={{ uri: image }} style={styles.productImage} accessibilityLabel="Selected product image" />
                {isUploading && (
                  <View style={styles.uploadingOverlay}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                  </View>
                )}
              </>
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="camera" size={40} color={theme.colors.placeholder} />
                <Text style={styles.imagePlaceholderText}>
                  {isUploading ? "Uploading..." : "Tap to upload"}
                </Text>
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
              editable={!isLoading}
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
                editable={!isLoading}
              />
              <Text style={styles.pricePerText}>per</Text>
              <TouchableOpacity
                style={styles.unitSelector}
                onPress={() => setShowUnitPicker(!showUnitPicker)}
                disabled={isLoading}
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
                  disabled={isLoading}
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
              disabled={isLoading}
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
                  disabled={isLoading}
                  accessibilityLabel={`${categoryOption} option`}
                >
                  <Text style={[styles.pickerItemText, category === categoryOption && styles.pickerItemTextSelected]}>
                    {categoryOption}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <TouchableOpacity 
            style={[
              styles.saveButton, 
              (isSaving || isUploading || isLoading) && styles.disabledButton
            ]} 
            onPress={handleSave}
            disabled={isSaving || isUploading || isLoading}
            accessibilityLabel="Save button"
          >
            {isSaving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonText}>Save Product</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
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
  backButton: {
    padding: spacing.xs,
  },
  headerRight: {
    width: 40, // Same width as backButton for balance
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: theme.colors.text,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl, // Extra padding at bottom for save button
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: spacing.md,
    borderRadius: 8,
    alignItems: "center",
    marginTop: spacing.xl,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: fontSize.md,
    fontWeight: "bold",
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
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.7,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: fontSize.md,
    color: theme.colors.text,
  },
})

export default ProductForm
