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
} from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { theme, spacing, fontSize } from '../../theme'
import { supabase } from '../../lib/supabase'
import * as ImagePicker from 'expo-image-picker'
import { DisplayProduct, ProductType, PriceUnit } from '../../types/products'

interface RouteParams {
  product?: DisplayProduct
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
  const [price, setPrice] = useState(product?.current_price?.toString() ?? '')
  const [priceUnit, setPriceUnit] = useState<typeof PRICE_UNITS[number]>(
    (product?.price_unit as typeof PRICE_UNITS[number]) ?? 'piece'
  )
  const [productType, setProductType] = useState<typeof PRODUCT_TYPES[number]>(
    (product?.product_type as typeof PRODUCT_TYPES[number]) ?? 'other'
  )
  const [imageUrl, setImageUrl] = useState(product?.image_url ?? '')
  const [isLoading, setIsLoading] = useState(false)

  const handleImagePick = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      })

      if (!result.canceled) {
        // Here you would typically upload the image to your storage
        // and get back a URL. For now, we'll just store the local URI
        setImageUrl(result.assets[0].uri)
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

    try {
      setIsLoading(true)

      if (isTemplate) {
        // Creating a new template product
        const { error } = await supabase.from('product_templates').insert({
          name: name.trim(),
          description: description.trim(),
          image_url: imageUrl,
          suggested_price: Number(price),
          price_unit: priceUnit,
          product_type: productType,
        })

        if (error) throw error

        Alert.alert('Success', 'Product added to catalog successfully!')
      } else if (product?.seller_product_id) {
        // Updating existing seller product
        const { error } = await supabase
          .from('seller_products')
          .update({
            name: name.trim(),
            description: description.trim(),
            image_url: imageUrl,
            price: Number(price),
            price_unit: priceUnit,
            product_type: productType,
          })
          .eq('seller_product_id', product.seller_product_id)

        if (error) throw error

        Alert.alert('Success', 'Product updated successfully!')
      }

      navigation.goBack()
    } catch (error) {
      console.error('Error saving product:', error)
      Alert.alert('Error', 'Failed to save product. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>
            {isTemplate ? 'Add to Catalog' : product ? 'Edit Product' : 'Add Product'}
          </Text>
        </View>

        <View style={styles.form}>
          <TouchableOpacity
            style={styles.imagePickerButton}
            onPress={handleImagePick}
          >
            {imageUrl ? (
              <Image source={{ uri: imageUrl }} style={styles.imagePreview} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="camera" size={32} color={theme.colors.placeholder} />
                <Text style={styles.imagePlaceholderText}>Add Image</Text>
              </View>
            )}
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
                  // Here you would typically show a picker
                  // For now, we'll just cycle through the units
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
                // Here you would typically show a picker
                // For now, we'll just cycle through the types
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
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
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
})

export default ProductFormScreen 