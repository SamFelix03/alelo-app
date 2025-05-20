"use client"

import React, { useState, useEffect } from 'react'
import {
  View,
  StyleSheet,
  Text,
  Image,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal,
  StatusBar,
  Platform,
} from "react-native"
import { useNavigation } from "@react-navigation/native"
import { theme, spacing, fontSize } from "../../theme"
import { Ionicons } from "@expo/vector-icons"
import { supabase } from "../../lib/supabase"
import { TAB_BAR_HEIGHT } from "../../navigation/SellerTabs"
import SellerHeader from "../../components/SellerHeader"
import { ProductTemplate } from "../../types/products"
import { NativeStackNavigationProp } from "@react-navigation/native-stack"

interface DisplayProduct extends ProductTemplate {
  isSelected?: boolean;
  isInCatalog?: boolean;
  seller_product_id?: string;
  current_price?: number;
  is_available?: boolean;
}

type RootStackParamList = {
  ProductForm: { 
    product?: DisplayProduct;
    isTemplate?: boolean;
  };
  ProductTemplates: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const ProductTemplatesScreen = () => {
  const navigation = useNavigation<NavigationProp>()
  const [templates, setTemplates] = useState<ProductTemplate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedTemplate, setSelectedTemplate] = useState<ProductTemplate | null>(null)
  const [price, setPrice] = useState("")
  const [priceUnit, setPriceUnit] = useState("")

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('product_templates')
        .select('*')
        .order('name')

      if (error) throw error

      setTemplates(data || [])
    } catch (error) {
      console.error('Error fetching templates:', error)
      Alert.alert('Error', 'Failed to load product templates. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddToCatalog = async () => {
    if (!selectedTemplate) return
    if (!price.trim() || isNaN(Number(price)) || Number(price) <= 0) {
      Alert.alert('Error', 'Please enter a valid price')
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No user found')

      const { data: sellerData, error: sellerError } = await supabase
        .from('sellers')
        .select('seller_id')
        .eq('phone_number', user.phone)
        .single()

      if (sellerError) throw sellerError

      const { error: insertError } = await supabase
        .from('seller_products')
        .insert({
          seller_id: sellerData.seller_id,
          template_id: selectedTemplate.template_id,
          name: selectedTemplate.name,
          description: selectedTemplate.description,
          image_url: selectedTemplate.image_url,
          price: Number(price),
          price_unit: priceUnit || selectedTemplate.price_unit,
          product_type: selectedTemplate.product_type,
          is_available: true,
          is_active: true
        })

      if (insertError) throw insertError

      Alert.alert('Success', 'Product added to your catalog!')
      setSelectedTemplate(null)
      setPrice("")
      navigation.goBack()
    } catch (error) {
      console.error('Error adding product to catalog:', error)
      Alert.alert('Error', 'Failed to add product to catalog. Please try again.')
    }
  }

  const handleCreateNew = () => {
    navigation.navigate('ProductForm', { isTemplate: false })
  }

  const renderTemplateItem = ({ item }: { item: ProductTemplate }) => (
    <TouchableOpacity
      style={styles.templateCard}
      onPress={() => {
        setSelectedTemplate(item)
        setPrice(item.suggested_price.toString())
        setPriceUnit(item.price_unit)
      }}
    >
      <Image 
        source={{ uri: item.image_url || 'https://via.placeholder.com/100' }}
        style={styles.templateImage}
      />
      <View style={styles.templateInfo}>
        <Text style={styles.templateName}>{item.name}</Text>
        <Text style={styles.templatePrice}>
          Suggested: ${item.suggested_price}/{item.price_unit}
        </Text>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>
            {item.product_type.replace('_', ' ')}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  )

  return (
    <>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
      />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <SellerHeader title="Add Product" />
          
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
          ) : (
            <>
              <View style={styles.header}>
                <Text style={styles.subtitle}>Choose from Templates</Text>
                <Text style={styles.description}>
                  Select a template to quickly add a product to your catalog, or create a new one from scratch
                </Text>
              </View>

              <FlatList
                data={templates}
                renderItem={renderTemplateItem}
                keyExtractor={(item) => item.template_id}
                numColumns={2}
                contentContainerStyle={styles.templateGrid}
              />

              <TouchableOpacity
                style={styles.createNewButton}
                onPress={handleCreateNew}
              >
                <Ionicons name="add-circle-outline" size={24} color={theme.colors.primary} />
                <Text style={styles.createNewText}>Create New Product</Text>
              </TouchableOpacity>

              <Modal
                visible={!!selectedTemplate}
                transparent
                animationType="slide"
                onRequestClose={() => setSelectedTemplate(null)}
              >
                <View style={styles.modalOverlay}>
                  <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Add to Catalog</Text>
                    
                    <View style={styles.selectedProduct}>
                      <Image 
                        source={{ uri: selectedTemplate?.image_url || 'https://via.placeholder.com/50' }}
                        style={styles.selectedImage}
                      />
                      <Text style={styles.selectedName}>{selectedTemplate?.name}</Text>
                    </View>

                    <View style={styles.priceInputContainer}>
                      <Text style={styles.inputLabel}>Set Your Price</Text>
                      <View style={styles.priceRow}>
                        <Text style={styles.currencySymbol}>$</Text>
                        <TextInput
                          style={styles.priceInput}
                          value={price}
                          onChangeText={setPrice}
                          keyboardType="decimal-pad"
                          placeholder="0.00"
                        />
                        <Text style={styles.perUnit}>per {priceUnit}</Text>
                      </View>
                    </View>

                    <View style={styles.modalButtons}>
                      <TouchableOpacity
                        style={[styles.modalButton, styles.cancelButton]}
                        onPress={() => setSelectedTemplate(null)}
                      >
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={[styles.modalButton, styles.addButton]}
                        onPress={handleAddToCatalog}
                      >
                        <Text style={styles.addButtonText}>Add to Catalog</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </Modal>
            </>
          )}
        </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  subtitle: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    marginBottom: spacing.sm,
  },
  description: {
    fontSize: fontSize.md,
    color: theme.colors.placeholder,
  },
  templateGrid: {
    padding: spacing.md,
    paddingBottom: TAB_BAR_HEIGHT + 100,
  },
  templateCard: {
    flex: 1,
    margin: spacing.xs,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  templateImage: {
    width: '100%',
    height: 120,
    resizeMode: 'cover',
  },
  templateInfo: {
    padding: spacing.md,
  },
  templateName: {
    fontSize: fontSize.md,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  templatePrice: {
    fontSize: fontSize.sm,
    color: theme.colors.primary,
    marginBottom: spacing.xs,
  },
  categoryBadge: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  categoryText: {
    fontSize: fontSize.xs,
    color: theme.colors.placeholder,
  },
  createNewButton: {
    position: 'absolute',
    bottom: TAB_BAR_HEIGHT + spacing.lg,
    left: spacing.lg,
    right: spacing.lg,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  createNewText: {
    marginLeft: spacing.sm,
    fontSize: fontSize.md,
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: spacing.lg,
  },
  modalTitle: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  selectedProduct: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  selectedImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: spacing.md,
  },
  selectedName: {
    fontSize: fontSize.md,
    fontWeight: 'bold',
  },
  priceInputContainer: {
    marginBottom: spacing.xl,
  },
  inputLabel: {
    fontSize: fontSize.md,
    fontWeight: 'bold',
    marginBottom: spacing.sm,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.placeholder,
    borderRadius: 8,
    padding: spacing.md,
  },
  currencySymbol: {
    fontSize: fontSize.lg,
    fontWeight: 'bold',
    marginRight: spacing.xs,
  },
  priceInput: {
    flex: 1,
    fontSize: fontSize.lg,
  },
  perUnit: {
    fontSize: fontSize.md,
    color: theme.colors.placeholder,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    padding: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F5F5F5',
    marginRight: spacing.md,
  },
  addButton: {
    backgroundColor: theme.colors.primary,
  },
  cancelButtonText: {
    color: theme.colors.text,
    fontWeight: 'bold',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
})

export default ProductTemplatesScreen 