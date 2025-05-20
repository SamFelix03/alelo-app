import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
  SafeAreaView,
  StatusBar,
} from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { theme, spacing, fontSize } from '../../theme'
import { supabase } from '../../lib/supabase'
import * as ImagePicker from 'expo-image-picker'
import { decode } from 'base64-arraybuffer'
import SellerHeader from '../../components/SellerHeader'

// Types based on schema
type ProductType = 'fruits' | 'vegetables' | 'prepared_food' | 'beverages' | 'crafts' | 'other'
type PriceUnit = 'kg' | 'g' | 'piece' | 'dozen' | 'liter' | 'ml' | 'bunch' | 'pack'

interface ProductTemplate {
  template_id: string
  name: string
  description: string | null
  image_url: string | null
  suggested_price: number
  price_unit: PriceUnit
  product_type: ProductType
}

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
  isTemplate?: boolean
}

const PRODUCT_TYPES: ProductType[] = [
  'fruits',
  'vegetables',
  'prepared_food',
  'beverages',
  'crafts',
  'other'
]

const PRICE_UNITS: PriceUnit[] = [
  'kg',
  'g',
  'piece',
  'dozen',
  'liter',
  'ml',
  'bunch',
  'pack'
]

const ProductFormScreen = () => {
  const navigation = useNavigation()
  const route = useRoute()
  const { product, isTemplate } = route.params as RouteParams

  const [name, setName] = useState(product?.name ?? '')
  const [description, setDescription] = useState(product?.description ?? '')
  const [price, setPrice] = useState(product?.price?.toString() ?? '')
  const [priceUnit, setPriceUnit] = useState<PriceUnit>(
    product?.price_unit ?? 'piece'
  )
  const [productType, setProductType] = useState<ProductType>(
    product?.product_type ?? 'other'
  )
  const [imageUrl, setImageUrl] = useState(product?.image_url ?? '')
  const [isLoading, setIsLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const handleImagePick = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Please allow access to your photo library to pick images.')
        return
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      })

      if (!result.canceled && result.assets[0]) {
        setIsLoading(true)
        setUploadProgress(0)

        try {
          const { data: { user } } = await supabase.auth.getUser()
          if (!user?.phone) throw new Error('No user phone found')

          const asset = result.assets[0]
          const ext = asset.uri.substring(asset.uri.lastIndexOf('.') + 1)
          const fileName = `${user.phone}/${Date.now()}.${ext}`

          if (!asset.base64) throw new Error('No base64 data')

          // Upload to Supabase Storage
          const { data, error } = await supabase.storage
            .from('product_images')
            .upload(fileName, decode(asset.base64), {
              contentType: `image/${ext}`,
              upsert: true,
            })

          if (error) throw error

          // Get public URL
          const { data: { publicUrl } } = supabase.storage
            .from('product_images')
            .getPublicUrl(fileName)

          setImageUrl(publicUrl)
          setUploadProgress(100)
        } catch (error) {
          console.error('Error uploading image:', error)
          Alert.alert('Error', 'Failed to upload image. Please try again.')
        } finally {
          setIsLoading(false)
        }
      }
    } catch (error) {
      console.error('Error picking image:', error)
      Alert.alert('Error', 'Failed to pick image. Please try again.')
    }
  }

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a product name')
      return
    }

    if (!price.trim() || isNaN(Number(price)) || Number(price) <= 0) {
      Alert.alert('Error', 'Please enter a valid price')
      return
    }

    if (!imageUrl) {
      Alert.alert('Error', 'Please add a product image')
      return
    }

    try {
      setIsLoading(true)

      // Get current seller's ID
      const { data: { user } } = await supabase.auth.getUser()
      if (!user?.phone) throw new Error('No user phone found')

      const { data: sellerData, error: sellerError } = await supabase
        .from('sellers')
        .select('seller_id')
        .eq('phone_number', user.phone)
        .single()

      if (sellerError) throw sellerError
      if (!sellerData?.seller_id) throw new Error('Seller not found')

      if (isTemplate) {
        // Creating a new template product
        const { error } = await supabase.from('product_templates').insert({
          name: name.trim(),
          description: description.trim() || null,
          image_url: imageUrl,
          suggested_price: Number(price),
          price_unit: priceUnit,
          product_type: productType,
        })

        if (error) throw error

        Alert.alert('Success', 'Product template added successfully!')
      } else if (product?.seller_product_id) {
        // If there's a new image and an old one exists, delete the old one
        if (imageUrl !== product.image_url && product.image_url) {
          const oldImagePath = product.image_url.split('/').pop()
          if (oldImagePath) {
            await supabase.storage
              .from('product_images')
              .remove([oldImagePath])
          }
        }

        // Updating existing seller product
        const { error } = await supabase
          .from('seller_products')
          .update({
            name: name.trim(),
            description: description.trim() || null,
            image_url: imageUrl,
            price: Number(price),
            price_unit: priceUnit,
            product_type: productType,
            is_active: true,
          })
          .eq('seller_product_id', product.seller_product_id)

        if (error) throw error

        Alert.alert('Success', 'Product updated successfully!')
      } else {
        // Creating new seller product
        const { error } = await supabase
          .from('seller_products')
          .insert({
            seller_id: sellerData.seller_id,
            name: name.trim(),
            description: description.trim() || null,
            image_url: imageUrl,
            price: Number(price),
            price_unit: priceUnit,
            product_type: productType,
            is_available: true,
            is_active: true,
          })

        if (error) throw error

        Alert.alert('Success', 'Product added to your catalog!')
      }

      navigation.goBack()
    } catch (error) {
      console.error('Error saving product:', error)
      Alert.alert('Error', 'Failed to save product. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const renderImagePickerContent = () => {
    if (isLoading && uploadProgress < 100) {
      return (
        <View style={styles.imagePlaceholder}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.uploadProgressText}>{uploadProgress}%</Text>
        </View>
      )
    }

    if (imageUrl) {
      return (
        <View style={styles.imagePreviewContainer}>
          <Image source={{ uri: imageUrl }} style={styles.imagePreview} />
          <TouchableOpacity 
            style={styles.changeImageButton}
            onPress={handleImagePick}
          >
            <Ionicons name="camera" size={20} color="#FFFFFF" />
            <Text style={styles.changeImageText}>Change</Text>
          </TouchableOpacity>
        </View>
      )
    }

    return (
      <View style={styles.imagePlaceholder}>
        <Ionicons name="camera" size={32} color={theme.colors.placeholder} />
        <Text style={styles.imagePlaceholderText}>Add Image</Text>
      </View>
    )
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
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <SellerHeader 
            title={isTemplate ? 'Add to Catalog' : product ? 'Edit Product' : 'Add Product'}
          />
          
          <ScrollView style={styles.scrollView}>
            <View style={styles.form}>
              <TouchableOpacity
                style={styles.imagePickerButton}
                onPress={handleImagePick}
                disabled={isLoading}
              >
                {renderImagePickerContent()}
              </TouchableOpacity>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Name</Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="Product name"
                  placeholderTextColor={theme.colors.placeholder}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Product description"
                  placeholderTextColor={theme.colors.placeholder}
                  multiline
                  numberOfLines={4}
                />
              </View>

              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: spacing.sm }]}>
                  <Text style={styles.label}>Price</Text>
                  <TextInput
                    style={styles.input}
                    value={price}
                    onChangeText={setPrice}
                    placeholder="0.00"
                    placeholderTextColor={theme.colors.placeholder}
                    keyboardType="decimal-pad"
                  />
                </View>

                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Unit</Text>
                  <TouchableOpacity
                    style={styles.pickerButton}
                    onPress={() => {
                      const currentIndex = PRICE_UNITS.indexOf(priceUnit)
                      const nextIndex = (currentIndex + 1) % PRICE_UNITS.length
                      setPriceUnit(PRICE_UNITS[nextIndex])
                    }}
                  >
                    <Text style={styles.pickerButtonText}>{priceUnit}</Text>
                    <Ionicons name="chevron-down" size={20} color={theme.colors.text} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Category</Text>
                <TouchableOpacity
                  style={styles.pickerButton}
                  onPress={() => {
                    const currentIndex = PRODUCT_TYPES.indexOf(productType)
                    const nextIndex = (currentIndex + 1) % PRODUCT_TYPES.length
                    setProductType(PRODUCT_TYPES[nextIndex])
                  }}
                >
                  <Text style={styles.pickerButtonText}>
                    {productType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color={theme.colors.text} />
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={() => navigation.goBack()}
              disabled={isLoading}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={handleSave}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={[styles.buttonText, styles.saveButtonText]}>Save</Text>
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
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  form: {
    padding: spacing.lg,
  },
  imagePickerButton: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    marginBottom: spacing.lg,
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: {
    marginTop: spacing.sm,
    color: theme.colors.placeholder,
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    marginBottom: spacing.xs,
    color: theme.colors.text,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: spacing.md,
    fontSize: fontSize.md,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: spacing.md,
  },
  pickerButtonText: {
    fontSize: fontSize.md,
    color: theme.colors.text,
  },
  footer: {
    flexDirection: 'row',
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  button: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F5F5F5',
    marginRight: spacing.md,
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
  },
  buttonText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: theme.colors.text,
  },
  saveButtonText: {
    color: '#FFFFFF',
  },
  imagePreviewContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  changeImageButton: {
    position: 'absolute',
    bottom: spacing.md,
    right: spacing.md,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: 20,
  },
  changeImageText: {
    color: '#FFFFFF',
    marginLeft: spacing.xs,
    fontSize: fontSize.sm,
  },
  uploadProgressText: {
    marginTop: spacing.sm,
    color: theme.colors.primary,
    fontSize: fontSize.md,
  },
})

export default ProductFormScreen 