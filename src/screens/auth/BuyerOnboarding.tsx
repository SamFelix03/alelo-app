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
import { Ionicons } from "@expo/vector-icons"
import { supabase } from "../../lib/supabase"
import { useAuth } from "../../context/AuthContext"

// Define types for our route params and navigation
type RootStackParamList = {
  BuyerOnboarding: { phoneNumber: string };
  BuyerTabs: undefined;
};

type BuyerOnboardingScreenRouteProp = RouteProp<RootStackParamList, 'BuyerOnboarding'>;
type BuyerOnboardingScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'BuyerOnboarding'>;

// Location type
type Location = {
  latitude: number;
  longitude: number;
};

const BuyerOnboarding = () => {
  const navigation = useNavigation<BuyerOnboardingScreenNavigationProp>()
  const route = useRoute<BuyerOnboardingScreenRouteProp>()
  const { phoneNumber } = route.params
  const { refreshUserProfile } = useAuth();

  // State for buyer fields that match database schema
  const [name, setName] = useState("")
  const [location, setLocation] = useState<Location | null>(null)
  const [address, setAddress] = useState("")
  const [profilePicUrl, setProfilePicUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleLocationPicker = () => {
    // In a real app, this would use location services
    // For this example, we'll just set mock coordinates for San Francisco
    setLocation({
      latitude: 37.7749,
      longitude: -122.4194
    })
    Alert.alert("Location Set", "Mock location has been set to San Francisco")
  }

  const handleImagePicker = () => {
    // In a real app, this would use react-native-image-picker
    // For this example, we'll just set a placeholder
    setProfilePicUrl("https://via.placeholder.com/150")
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
      
      setLoading(false)

      // Refresh the user profile in AuthContext to get the latest data
      await refreshUserProfile();
      
      // The AuthNavigator will automatically redirect to BuyerTabs
      // No need to navigate manually
      
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
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
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
          <Ionicons name="location" size={20} color={theme.colors.primary} />
          <Text style={styles.locationButtonText}>
            {location ? "Location Selected (Tap to change)" : "Set Your Current Location"}
          </Text>
        </TouchableOpacity>
        
        {/* Profile Picture - matches 'profile_pic_url' field */}
        <Text style={styles.inputLabel}>Profile Picture</Text>
            <TouchableOpacity
              style={styles.imagePickerContainer}
              onPress={handleImagePicker}
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
                  <Ionicons name="camera" size={40} color={theme.colors.placeholder} />
                  <Text style={styles.imagePlaceholderText}>Tap to upload</Text>
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
