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
    product_id?: string;
    name: string;
    price: number;
    price_unit: string;
    product_type: string;
    image_url: string | null;
    description?: string;
  };
  isEdit?: boolean;
}

const CATEGORIES = [
  { label: "Fruits", value: "fruits" },
  { label: "Vegetables", value: "vegetables" },
  { label: "Prepared Food", value: "prepared_food" },
  { label: "Beverages", value: "beverages" },
  { label: "Crafts", value: "crafts" },
  { label: "Other", value: "other" }
]

const UNITS = ["kg", "g", "lb", "oz", "dozen", "piece", "bunch", "liter", "ml"]

const ProductForm = () => {
  const navigation = useNavigation()
  const route = useRoute()
  const { product, isEdit } = (route.params as RouteParams) || {}
  const { userInfo } = useAuth()

  const [name, setName] = useState(product?.name || "")
  const [price, setPrice] = useState(product?.price?.toString() || "")
  const [unit, setUnit] = useState(product?.price_unit || "kg")
  const [category, setCategory] = useState(product?.product_type || "fruits")
  const [description, setDescription] = useState(product?.description || "")
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

    setIsSaving(true)
    try {
      const productData = {
        seller_id: sellerId,
        name: name.trim(),
        price: Number(price),
        price_unit: unit,
        product_type: category,
        image_url: image,
        description: description.trim() || null,
        is_available: true
      }

      let result;
      if (isEdit && product?.product_id) {
        // Update existing product
        result = await supabase
          .from('products')
          .update(productData)
          .eq('product_id', product.product_id)
      } else {
        // Create new product
        result = await supabase
          .from('products')
          .insert([productData])
      }

      if (result.error) {
        throw result.error
      }

      Alert.alert(
        "Success", 
        isEdit ? "Product updated successfully!" : "Product added successfully!",
        [
          {
            text: "OK",
            onPress: () => navigation.goBack()
          }
        ]
      )
    } catch (error) {
      console.error('Error saving product:', error)
      Alert.alert('Error', 'Failed to save product. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>
          {isEdit ? "Edit Product" : "Add Product"}
        </Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.form}>
          {/* Image Upload Section */}
          <TouchableOpacity
            style={styles.imageContainer}
            onPress={handleImagePicker}
            disabled={isUploading}
            accessibilityLabel="Upload product image"
          >
            {image ? (
              <Image source={{ uri: image }} style={styles.productImage} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="camera" size={40} color={theme.colors.placeholder} />
                <Text style={styles.imagePlaceholderText}>Add Photo</Text>
              </View>
            )}
            {isUploading && (
              <View style={styles.uploadingOverlay}>
                <ActivityIndicator size="small" color="#FFFFFF" />
              </View>
            )}
          </TouchableOpacity>

          {/* Product Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Product Name *</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Enter product name"
              placeholderTextColor={theme.colors.placeholder}
              accessibilityLabel="Product name input"
            />
          </View>

          {/* Description */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Enter product description (optional)"
              placeholderTextColor={theme.colors.placeholder}
              multiline
              numberOfLines={3}
              accessibilityLabel="Product description input"
            />
          </View>

          {/* Price and Unit Row */}
          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 2, marginRight: spacing.sm }]}>
              <Text style={styles.label}>Price *</Text>
              <TextInput
                style={styles.input}
                value={price}
                onChangeText={setPrice}
                placeholder="0.00"
                placeholderTextColor={theme.colors.placeholder}
                keyboardType="decimal-pad"
                accessibilityLabel="Product price input"
              />
            </View>

            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Unit</Text>
              <TouchableOpacity
                style={styles.picker}
                onPress={() => setShowUnitPicker(!showUnitPicker)}
                accessibilityLabel="Select price unit"
              >
                <Text style={styles.pickerText}>{unit}</Text>
                <Ionicons name="chevron-down" size={20} color={theme.colors.placeholder} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Unit Picker */}
          {showUnitPicker && (
            <View style={styles.pickerContainer}>
              {UNITS.map((unitOption) => (
                <TouchableOpacity
                  key={unitOption}
                  style={[styles.pickerOption, unit === unitOption && styles.pickerOptionSelected]}
                  onPress={() => {
                    setUnit(unitOption)
                    setShowUnitPicker(false)
                  }}
                  accessibilityLabel={`Select ${unitOption} unit`}
                >
                  <Text style={[styles.pickerOptionText, unit === unitOption && styles.pickerOptionTextSelected]}>
                    {unitOption}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Category */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Category</Text>
            <TouchableOpacity
              style={styles.picker}
              onPress={() => setShowCategoryPicker(!showCategoryPicker)}
              accessibilityLabel="Select product category"
            >
              <Text style={styles.pickerText}>
                {CATEGORIES.find(cat => cat.value === category)?.label || category}
              </Text>
              <Ionicons name="chevron-down" size={20} color={theme.colors.placeholder} />
            </TouchableOpacity>
          </View>

          {/* Category Picker */}
          {showCategoryPicker && (
            <View style={styles.pickerContainer}>
              {CATEGORIES.map((categoryOption) => (
                <TouchableOpacity
                  key={categoryOption.value}
                  style={[styles.pickerOption, category === categoryOption.value && styles.pickerOptionSelected]}
                  onPress={() => {
                    setCategory(categoryOption.value)
                    setShowCategoryPicker(false)
                  }}
                  accessibilityLabel={`Select ${categoryOption.label} category`}
                >
                  <Text style={[styles.pickerOptionText, category === categoryOption.value && styles.pickerOptionTextSelected]}>
                    {categoryOption.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Save Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isSaving}
          accessibilityLabel="Save product"
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>
              {isEdit ? "Update Product" : "Add Product"}
            </Text>
          )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.sm,
    fontSize: fontSize.md,
    color: theme.colors.placeholder,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingTop: Platform.OS === 'ios' ? 60 : spacing.xl,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  backButton: {
    padding: spacing.sm,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: theme.colors.text,
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  form: {
    padding: spacing.lg,
  },
  imageContainer: {
    alignSelf: "center",
    marginBottom: spacing.xl,
    position: "relative",
  },
  productImage: {
    width: 150,
    height: 150,
    borderRadius: 12,
    resizeMode: "cover",
  },
  imagePlaceholder: {
    width: 150,
    height: 150,
    borderRadius: 12,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#E0E0E0",
    borderStyle: "dashed",
  },
  imagePlaceholderText: {
    marginTop: spacing.sm,
    fontSize: fontSize.sm,
    color: theme.colors.placeholder,
  },
  uploadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: fontSize.md,
    fontWeight: "600",
    color: theme.colors.text,
    marginBottom: spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    padding: spacing.md,
    fontSize: fontSize.md,
    color: theme.colors.text,
    backgroundColor: "#FFFFFF",
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  picker: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    padding: spacing.md,
    backgroundColor: "#FFFFFF",
  },
  pickerText: {
    fontSize: fontSize.md,
    color: theme.colors.text,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    marginTop: spacing.xs,
    maxHeight: 200,
  },
  pickerOption: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  pickerOptionSelected: {
    backgroundColor: theme.colors.primary + "20",
  },
  pickerOptionText: {
    fontSize: fontSize.md,
    color: theme.colors.text,
  },
  pickerOptionTextSelected: {
    color: theme.colors.primary,
    fontWeight: "600",
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    padding: spacing.md,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
  },
  saveButtonDisabled: {
    backgroundColor: theme.colors.disabled,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: fontSize.md,
    fontWeight: "600",
  },
})

export default ProductForm
