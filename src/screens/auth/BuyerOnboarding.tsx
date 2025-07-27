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
} from "react-native"
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native"
import { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { theme, spacing, fontSize } from "../../theme"
import { ArrowLeftIcon, MapPinIcon, CameraIcon } from "react-native-heroicons/outline"
import { supabase } from "../../lib/supabase"
import { useAuth } from "../../context/AuthContext"
import * as ImagePicker from 'expo-image-picker'
import { decode } from 'base64-arraybuffer'
import LocationPicker from "../../components/LocationPicker"
import { LocationCoords } from "../../lib/locationService"
import { storeUserData } from "../../lib/auth"

// Define types for our route params and navigation
type RootStackParamList = {
  BuyerOnboarding: { phoneNumber: string };
  BuyerTabs: undefined;
};

type BuyerOnboardingScreenRouteProp = RouteProp<RootStackParamList, 'BuyerOnboarding'>;
type BuyerOnboardingScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'BuyerOnboarding'>;

const BuyerOnboarding = () => {
  const navigation = useNavigation<BuyerOnboardingScreenNavigationProp>()
  const route = useRoute<BuyerOnboardingScreenRouteProp>()
  const { phoneNumber } = route.params
  const { refreshUserProfile, refreshAuthState } = useAuth();

  // State for buyer fields that match database schema
  const [name, setName] = useState("")
  const [location, setLocation] = useState<LocationCoords | null>(null)
  const [address, setAddress] = useState("")
  const [profilePicUrl, setProfilePicUrl] = useState<string | null>(null)
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
          const fileName = `buyers/${phoneNumber.replace(/[^\w]/g, '_')}/${Date.now()}.${ext}`

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

          setProfilePicUrl(publicUrl)
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

  const handleComplete = async () => {
    if (!name) {
      Alert.alert("Error", "Please enter your name")
      return
    }
    
    setLoading(true)
    
    try {
      // Convert location to PostGIS format if it exists
      let locationGeoJSON = null
      if (location) {
        locationGeoJSON = `POINT(${location.longitude} ${location.latitude})`
      }
      
      // Insert buyer record
      const { data, error } = await supabase
        .from('buyers')
        .insert([
          {
            phone_number: phoneNumber,
            name: name,
            current_location: locationGeoJSON,
            profile_pic_url: profilePicUrl,
            address: address
          }
        ])
        
      if (error) {
        console.error('Error creating buyer profile:', error)
        Alert.alert("Error", "There was an error creating your profile")
        setLoading(false)
        return
      }
      
      // Store authentication data to mark user as logged in
      const stored = await storeUserData(phoneNumber, 'buyer')
      if (!stored) {
        Alert.alert("Error", "There was an error saving your session")
        setLoading(false)
        return
      }

      // Refresh the auth state to immediately log the user in
      await refreshAuthState()
      
      setLoading(false)
      
    } catch (error) {
      console.error('Error creating buyer profile:', error)
      Alert.alert("Error", "There was an error creating your profile")
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
      
        <Text style={styles.title}>Create Your Profile</Text>
        <Text style={styles.subtitle}>Please provide the following information</Text>
        
        {/* Name Input - matches 'name' field */}
        <Text style={styles.inputLabel}>Your Name</Text>
        <TextInput
          placeholder="Full Name"
          value={name}
          onChangeText={setName}
          style={styles.input}
          accessibilityLabel="Name input"
        />
        
        {/* Address Input - matches 'address' field */}
        <Text style={styles.inputLabel}>Your Address</Text>
        <TextInput
          placeholder="Home Address"
          value={address}
          onChangeText={setAddress}
          style={styles.input}
          multiline
          accessibilityLabel="Address input"
        />
        
        {/* Location Picker - matches 'current_location' field */}
        <Text style={styles.inputLabel}>Your Location</Text>
        <TouchableOpacity 
          style={styles.locationButton}
          onPress={handleLocationPicker}
          accessibilityLabel="Set location button"
        >
          <MapPinIcon size={20} color={theme.colors.primary} />
          <Text style={styles.locationButtonText}>
            {location ? "Location Selected (Tap to change)" : "Set Your Current Location"}
          </Text>
        </TouchableOpacity>
        
        {/* Profile Picture - matches 'profile_pic_url' field */}
        <Text style={styles.inputLabel}>Profile Picture</Text>
        <TouchableOpacity
          style={styles.imagePickerContainer}
          onPress={handleImagePicker}
          disabled={isUploadingImage}
          accessibilityLabel="Upload profile picture"
        >
          {profilePicUrl ? (
            <Image
              source={{ uri: profilePicUrl }}
              style={styles.profileImage}
              accessibilityLabel="Selected profile picture"
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <CameraIcon size={40} color={theme.colors.placeholder} />
              <Text style={styles.imagePlaceholderText}>Tap to upload</Text>
            </View>
          )}
          {isUploadingImage && (
            <View style={styles.uploadingOverlay}>
              <ActivityIndicator size="small" color="#FFFFFF" />
            </View>
          )}
        </TouchableOpacity>

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
  profileImage: {
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

export default BuyerOnboarding
