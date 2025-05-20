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
  StatusBar,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
} from "react-native"
import { useNavigation, useRoute } from "@react-navigation/native"
import { theme, spacing, fontSize } from "../../theme"
import { Ionicons } from "@expo/vector-icons"
import SellerHeader from "../../components/SellerHeader"
import * as ImagePicker from 'expo-image-picker'
import { decode } from 'base64-arraybuffer'
import { supabase } from "../../lib/supabase"
import { useAuth } from "../../context/AuthContext"

// Types based on schema
type ProductType = 'fruits' | 'vegetables' | 'prepared_food' | 'beverages' | 'crafts' | 'other'
type PriceUnit = 'kg' | 'g' | 'lb' | 'oz' | 'dozen' | 'piece' | 'bunch' | 'liter' | 'ml'

interface SellerProduct {
  seller_product_id: string
  seller_id: string
  template_id: string | null
  name: string
  description: string | null
  image_url: string | null
  price: number
  price_unit: PriceUnit
  product_type: ProductType
  is_available: boolean
  is_active: boolean
}

interface RouteParams {
  product?: SellerProduct
}

const PRODUCT_TYPES: ProductType[] = ['fruits', 'vegetables', 'prepared_food', 'beverages', 'crafts', 'other']
const PRICE_UNITS: PriceUnit[] = ['kg', 'g', 'lb', 'oz', 'dozen', 'piece', 'bunch', 'liter', 'ml']

const ProductForm = () => {
  const navigation = useNavigation()
  const route = useRoute()
  const { product } = (route.params as RouteParams) || {}
  const { userInfo } = useAuth()

  const [name, setName] = useState(product?.name || "")
  const [description, setDescription] = useState(product?.description || "")
  const [price, setPrice] = useState(product?.price ? product.price.toString() : "")
  const [unit, setUnit] = useState<PriceUnit>(product?.price_unit || "kg")
  const [productType, setProductType] = useState<ProductType>(product?.product_type || "vegetables")
  const [image, setImage] = useState<string | null>(product?.image_url || null)
  const [showTypePicker, setShowTypePicker] = useState(false)
  const [showUnitPicker, setShowUnitPicker] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const handleImagePicker = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      })

      if (!result.canceled && result.assets[0]) {
        setImage(result.assets[0].uri)
      }
    } catch (error) {
      Alert.alert("Error", "Failed to pick image")
    }
  }

  const uploadImage = async (uri: string): Promise<string | null> => {
    try {
      if (!userInfo?.phoneNumber) {
        throw new Error('User not authenticated')
      }

      // Get the file extension
      const ext = uri.substring(uri.lastIndexOf(".") + 1)
      
      // Create a unique file name using phone number instead of user id
      const fileName = `${userInfo.phoneNumber}/${Date.now()}.${ext}`
      
      // Fetch the image data
      const response = await fetch(uri)
      const blob = await response.blob()
      
      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('product_images')
        .upload(fileName, blob, {
          contentType: `image/${ext}`,
          upsert: true
        })

      if (error) throw error

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('product_images')
        .getPublicUrl(fileName)

      return publicUrl
    } catch (error) {
      console.error('Error uploading image:', error)
      return null
    }
  }

  const handleSave = async () => {
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

    if (!userInfo?.phoneNumber) {
      Alert.alert("Error", "You must be logged in to save products.")
      return
    }

    setIsLoading(true)

    try {
      // Upload image if it's a new image (not a URL)
      let imageUrl = image
      if (image && !image.startsWith('http')) {
        const uploadedUrl = await uploadImage(image)
        if (!uploadedUrl) throw new Error('Failed to upload image')
        imageUrl = uploadedUrl
      }

      // Get seller_id from userInfo
      const { data: sellerData, error: sellerError } = await supabase
        .from('sellers')
        .select('seller_id')
        .eq('phone_number', userInfo.phoneNumber)
        .single()

      if (sellerError || !sellerData) {
        throw new Error('Failed to get seller information')
      }

      const productData = {
        name,
        description,
        image_url: imageUrl,
        price: parseFloat(price),
        price_unit: unit,
        product_type: productType,
        is_available: true,
        is_active: true,
        seller_id: sellerData.seller_id,
        ...(product ? { seller_product_id: product.seller_product_id } : {})
      }

      if (product) {
        // Update existing product
        const { error } = await supabase
          .from('seller_products')
          .update(productData)
          .eq('seller_product_id', product.seller_product_id)

        if (error) throw error
      } else {
        // Insert new product
        const { error } = await supabase
          .from('seller_products')
          .insert([productData])

        if (error) throw error
      }

      Alert.alert(
        "Success",
        `Product ${product ? "updated" : "added"} successfully!`,
        [{ text: "OK", onPress: () => navigation.goBack() }]
      )
    } catch (error) {
      console.error('Error saving product:', error)
      Alert.alert("Error", "Failed to save product. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
      />
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView 
          style={styles.container}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        >
          <SellerHeader 
            title={product ? "Edit Product" : "Add Product"}
            onBack={() => navigation.goBack()}
          />

          <ScrollView 
            style={styles.content}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            removeClippedSubviews={Platform.OS === 'android'}
          >
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
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description || ''}
                onChangeText={setDescription}
                placeholder="Enter product description"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                accessibilityLabel="Product description input"
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
                {PRICE_UNITS.map((unitOption) => (
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
              <Text style={styles.label}>Product Type</Text>
              <TouchableOpacity
                style={styles.typeSelector}
                onPress={() => setShowTypePicker(!showTypePicker)}
                accessibilityLabel="Product type selector"
              >
                <Text style={styles.typeText}>{productType.replace('_', ' ')}</Text>
                <Ionicons name="chevron-down" size={16} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            {showTypePicker && (
              <View style={styles.pickerContainer}>
                {PRODUCT_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[styles.pickerItem, productType === type && styles.pickerItemSelected]}
                    onPress={() => {
                      setProductType(type)
                      setShowTypePicker(false)
                    }}
                    accessibilityLabel={`${type.replace('_', ' ')} option`}
                  >
                    <Text style={[styles.pickerItemText, productType === type && styles.pickerItemTextSelected]}>
                      {type.replace('_', ' ')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <View style={styles.bottomPadding} />
          </ScrollView>

          <View style={styles.saveButtonContainer}>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSave}
              disabled={isLoading}
              accessibilityLabel="Save product"
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.saveButtonText}>Save Product</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  content: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    padding: spacing.lg,
    flexGrow: 1,
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
  textArea: {
    height: 100,
    textAlignVertical: 'top',
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
  typeSelector: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.placeholder,
    borderRadius: 8,
    padding: spacing.md,
  },
  typeText: {
    fontSize: fontSize.md,
    textTransform: 'capitalize',
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
    textTransform: 'capitalize',
  },
  pickerItemTextSelected: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  bottomPadding: {
    height: 80,
  },
  saveButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: fontSize.md,
    fontWeight: "bold",
  },
})

export default ProductForm
