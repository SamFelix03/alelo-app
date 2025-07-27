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
  ActivityIndicator,
  Alert,
  Switch
} from "react-native"
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native"
import { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { theme, spacing, fontSize } from "../../theme"
import { ArrowLeftIcon, MapPinIcon, PhotoIcon } from "react-native-heroicons/outline"
import { supabase } from "../../lib/supabase"
import { useAuth } from "../../context/AuthContext"
import * as ImagePicker from 'expo-image-picker'
import { decode } from 'base64-arraybuffer'
import LocationPicker from "../../components/LocationPicker"
import { LocationCoords } from "../../lib/locationService"
import { storeUserData } from "../../lib/auth"

// Define types for our route params and navigation
type RootStackParamList = {
  SellerOnboarding: { phoneNumber: string };
  SellerTabs: undefined;
};

type SellerOnboardingScreenRouteProp = RouteProp<RootStackParamList, 'SellerOnboarding'>;
type SellerOnboardingScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'SellerOnboarding'>;

// Business hours type
type BusinessHoursDay = {
  open: string;
  close: string;
  isOpen: boolean;
};

type BusinessHours = {
  [key: string]: BusinessHoursDay;
  monday: BusinessHoursDay;
  tuesday: BusinessHoursDay;
  wednesday: BusinessHoursDay;
  thursday: BusinessHoursDay;
  friday: BusinessHoursDay;
  saturday: BusinessHoursDay;
  sunday: BusinessHoursDay;
};

const SellerOnboarding = () => {
  const navigation = useNavigation<SellerOnboardingScreenNavigationProp>()
  const route = useRoute<SellerOnboardingScreenRouteProp>()
  const { phoneNumber } = route.params
  const { refreshUserProfile, refreshAuthState } = useAuth()

  // State for seller fields that match database schema
  const [name, setName] = useState("")
  const [location, setLocation] = useState<LocationCoords | null>(null)
  const [address, setAddress] = useState("")
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [businessHours, setBusinessHours] = useState<BusinessHours>({
    monday: { open: "09:00", close: "17:00", isOpen: true },
    tuesday: { open: "09:00", close: "17:00", isOpen: true },
    wednesday: { open: "09:00", close: "17:00", isOpen: true },
    thursday: { open: "09:00", close: "17:00", isOpen: true },
    friday: { open: "09:00", close: "17:00", isOpen: true },
    saturday: { open: "10:00", close: "15:00", isOpen: true },
    sunday: { open: "10:00", close: "15:00", isOpen: false }
  })
  const [loading, setLoading] = useState(false)
  const [showLocationPicker, setShowLocationPicker] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)

  const handleLocationPicker = () => {
    setShowLocationPicker(true)
  }

  const handleLocationSelected = (selectedLocation: LocationCoords) => {
    setLocation(selectedLocation)
    setShowLocationPicker(false)
  }

  const handleLocationPickerCancel = () => {
    setShowLocationPicker(false)
  }

  const handleImagePicker = async () => {
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
        setIsUploadingImage(true)
        try {
          const asset = result.assets[0]
          
          // Generate a unique file path using phone number and timestamp
          const ext = asset.uri.substring(asset.uri.lastIndexOf(".") + 1)
          const fileName = `sellers/${phoneNumber.replace(/[^\w]/g, '_')}/${Date.now()}.${ext}`

          // Upload the image
          const { data, error } = await supabase.storage
            .from('profile_pictures')
            .upload(fileName, decode(asset.base64!), {
              contentType: `image/${ext}`,
              cacheControl: '3600',
              upsert: false
            })

          if (error) throw error

          // Get the public URL
          const { data: { publicUrl } } = supabase.storage
            .from('profile_pictures')
            .getPublicUrl(fileName)

          setLogoUrl(publicUrl)
        } catch (error) {
          console.error('Error uploading image:', error)
          Alert.alert('Error', 'Failed to upload image. Please try again.')
        }
        setIsUploadingImage(false)
      }
    } catch (error) {
      console.error('Error picking image:', error)
      Alert.alert('Error', 'Failed to pick image. Please try again.')
    }
  }

  const updateBusinessHours = (day: string, field: keyof BusinessHoursDay, value: string | boolean) => {
    setBusinessHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value
      }
    }))
  }

  const handleComplete = async () => {
    if (!name) {
      Alert.alert("Error", "Please enter your business name")
      return
    }
    
    setLoading(true)

    try {
      // Convert location to PostGIS format if it exists
      let locationGeoJSON = null
      if (location) {
        locationGeoJSON = `POINT(${location.longitude} ${location.latitude})`
      }
      
      // Insert seller record
      const { data, error } = await supabase
        .from('sellers')
        .insert([
          {
            phone_number: phoneNumber,
            name: name,
            current_location: locationGeoJSON,
            logo_url: logoUrl,
            address: address,
            is_open: isOpen,
            business_hours: businessHours
          }
        ])
        
      if (error) {
        console.error('Error creating seller profile:', error)
        Alert.alert("Error", "There was an error creating your business profile")
        setLoading(false)
        return
      }
      
      // Store authentication data to mark user as logged in
      const stored = await storeUserData(phoneNumber, 'seller')
      if (!stored) {
        Alert.alert("Error", "There was an error saving your session")
        setLoading(false)
        return
      }

      // Refresh the auth state to immediately log the user in
      await refreshAuthState()
      
      setLoading(false)
      
    } catch (error) {
      console.error('Error creating seller profile:', error)
      Alert.alert("Error", "There was an error creating your business profile")
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity
          style={styles.backButton} 
          onPress={() => navigation.goBack()} 
          accessibilityLabel="Back button"
        >
          <ArrowLeftIcon size={24} color={theme.colors.text} />
        </TouchableOpacity>

        <Text style={styles.title}>Set Up Your Business</Text>
        <Text style={styles.subtitle}>Please provide the following information</Text>
        
        {/* Business Name Input - matches 'name' field */}
        <Text style={styles.inputLabel}>Business Name</Text>
        <TextInput
          placeholder="Business Name"
          value={name}
          onChangeText={setName}
          style={styles.input}
          accessibilityLabel="Business name input"
        />

        {/* Address Input - matches 'address' field */}
        <Text style={styles.inputLabel}>Business Address</Text>
        <TextInput
          placeholder="Business Address"
          value={address}
          onChangeText={setAddress}
          style={styles.input}
          multiline
          accessibilityLabel="Address input"
        />
        
        {/* Location Picker - matches 'current_location' field */}
        <Text style={styles.inputLabel}>Business Location</Text>
        <TouchableOpacity
          style={styles.locationButton}
          onPress={handleLocationPicker}
          accessibilityLabel="Set location button"
        >
          <MapPinIcon size={20} color={theme.colors.primary} />
          <Text style={styles.locationButtonText}>
            {location ? "Location Selected (Tap to change)" : "Set Your Business Location"}
          </Text>
        </TouchableOpacity>

        {/* Logo Upload - matches 'logo_url' field */}
        <Text style={styles.inputLabel}>Business Logo</Text>
        <TouchableOpacity
          style={styles.imagePickerContainer}
          onPress={handleImagePicker}
          disabled={isUploadingImage}
          accessibilityLabel="Upload business logo"
        >
          {logoUrl ? (
            <Image
              source={{ uri: logoUrl }}
              style={styles.logoImage}
              accessibilityLabel="Selected business logo"
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <PhotoIcon size={40} color={theme.colors.placeholder} />
              <Text style={styles.imagePlaceholderText}>Tap to upload logo</Text>
            </View>
          )}
          {isUploadingImage && (
            <View style={styles.uploadingOverlay}>
              <ActivityIndicator size="small" color="#FFFFFF" />
            </View>
          )}
        </TouchableOpacity>

        {/* Business Status - matches 'is_open' field */}
        <Text style={styles.inputLabel}>Initial Business Status</Text>
        <View style={styles.switchContainer}>
          <Text style={styles.switchLabel}>Open for Business</Text>
          <Switch
            value={isOpen}
            onValueChange={setIsOpen}
            trackColor={{ false: "#D1D1D1", true: "#E8F5E9" }}
            thumbColor={isOpen ? theme.colors.primary : "#F5F5F5"}
            ios_backgroundColor="#D1D1D1"
            accessibilityLabel="Business status toggle"
          />
        </View>

        {/* Business Hours - matches 'business_hours' field */}
        <Text style={styles.inputLabel}>Business Hours</Text>
        <View style={styles.businessHoursContainer}>
          {Object.keys(businessHours).map(day => (
            <View key={day} style={styles.dayRow}>
              <View style={styles.dayInfo}>
                <Text style={styles.dayName}>{day.charAt(0).toUpperCase() + day.slice(1)}</Text>
                <Switch
                  value={businessHours[day].isOpen}
                  onValueChange={(value) => updateBusinessHours(day, 'isOpen', value)}
                  trackColor={{ false: "#D1D1D1", true: "#E8F5E9" }}
                  thumbColor={businessHours[day].isOpen ? theme.colors.primary : "#F5F5F5"}
                  ios_backgroundColor="#D1D1D1"
                  style={styles.daySwitch}
                />
            </View>

              {businessHours[day].isOpen && (
                <View style={styles.hoursInputRow}>
                  <TextInput
                    style={styles.timeInput}
                    value={businessHours[day].open}
                    onChangeText={(text) => updateBusinessHours(day, 'open', text)}
                    placeholder="09:00"
                    accessibilityLabel={`${day} opening time`}
                  />
                  <Text style={styles.timeSeparator}>to</Text>
                  <TextInput
                    style={styles.timeInput}
                    value={businessHours[day].close}
                    onChangeText={(text) => updateBusinessHours(day, 'close', text)}
                    placeholder="17:00"
                    accessibilityLabel={`${day} closing time`}
                  />
                </View>
              )}
            </View>
          ))}
        </View>

        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleComplete}
          disabled={loading || !name}
          accessibilityLabel="Complete registration button"
        >
          {loading ? 
            <ActivityIndicator color="#FFFFFF" /> : 
            <Text style={styles.buttonText}>Complete Registration</Text>
          }
        </TouchableOpacity>
      </ScrollView>

      <LocationPicker
        visible={showLocationPicker}
        onLocationSelected={handleLocationSelected}
        onCancel={handleLocationPickerCancel}
        initialLocation={location || undefined}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollContent: {
    flexGrow: 1,
    padding: spacing.lg,
  },
  backButton: {
    padding: spacing.sm,
    alignSelf: 'flex-start',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: "bold",
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  subtitle: {
    fontSize: fontSize.md,
    color: theme.colors.placeholder,
    marginBottom: spacing.xl,
    textAlign: "center",
  },
  inputLabel: {
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
    marginBottom: spacing.lg,
  },
  imagePickerContainer: {
    alignSelf: "center",
    marginBottom: spacing.xl,
    position: "relative",
  },
  logoImage: {
    width: 150,
    height: 150,
    borderRadius: 75,
  },
  imagePlaceholder: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.disabled,
  },
  imagePlaceholderText: {
    marginTop: spacing.sm,
    color: theme.colors.placeholder,
    fontSize: fontSize.sm,
  },
  uploadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 75,
    justifyContent: "center",
    alignItems: "center",
  },
  locationButton: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  locationButtonText: {
    marginLeft: spacing.sm,
    color: theme.colors.primary,
    fontSize: fontSize.md,
  },
  switchContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
  },
  switchLabel: {
    fontSize: fontSize.md,
  },
  businessHoursContainer: {
    borderWidth: 1,
    borderColor: theme.colors.placeholder,
    borderRadius: 8,
    marginBottom: spacing.xl,
  },
  dayRow: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.placeholder,
    padding: spacing.md,
  },
  dayInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dayName: {
    fontSize: fontSize.md,
    fontWeight: "bold",
  },
  daySwitch: {
    transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }],
  },
  hoursInputRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.sm,
  },
  timeInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colors.placeholder,
    borderRadius: 4,
    padding: spacing.sm,
    fontSize: fontSize.sm,
    textAlign: "center",
  },
  timeSeparator: {
    marginHorizontal: spacing.md,
    color: theme.colors.placeholder,
  },
  button: {
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    paddingVertical: spacing.md,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: spacing.lg,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: fontSize.md,
    fontWeight: "bold",
  },
})

export default SellerOnboarding
