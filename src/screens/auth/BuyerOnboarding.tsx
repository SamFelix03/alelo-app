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
} from "react-native"
import { useNavigation } from "@react-navigation/native"
import { theme, spacing, fontSize } from "../../theme"
import { Ionicons } from "@expo/vector-icons"

const BuyerOnboarding = () => {
  const navigation = useNavigation()
  const [step, setStep] = useState(1)
  const [name, setName] = useState("")
  const [address, setAddress] = useState("")
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleImagePicker = () => {
    // In a real app, this would use react-native-image-picker
    // For this example, we'll just set a placeholder
    setProfileImage("https://via.placeholder.com/150")
  }

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1)
    } else {
      handleFinish()
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
    } else {
      navigation.goBack()
    }
  }

  const handleFinish = () => {
    setLoading(true)

    // Simulate API call
    setTimeout(() => {
      setLoading(false)
      navigation.navigate("BuyerTabs")
    }, 1500)
  }

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Add a Profile Picture</Text>
            <Text style={styles.stepDescription}>Help vendors recognize you when you place an order</Text>

            <TouchableOpacity
              style={styles.imagePickerContainer}
              onPress={handleImagePicker}
              accessibilityLabel="Upload profile picture"
            >
              {profileImage ? (
                <Image
                  source={{ uri: profileImage }}
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
              style={[styles.button, !profileImage && styles.buttonDisabled]}
              onPress={handleNext}
              disabled={!profileImage}
              accessibilityLabel="Next button"
            >
              <Text style={styles.buttonText}>Next</Text>
            </TouchableOpacity>
          </View>
        )

      case 2:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>What's Your Name?</Text>
            <Text style={styles.stepDescription}>This is how vendors will identify you</Text>

            <TextInput
              style={styles.input}
              placeholder="Your Name"
              value={name}
              onChangeText={setName}
              maxLength={30}
              accessibilityLabel="Name input"
            />

            <TouchableOpacity
              style={[styles.button, name.length < 2 && styles.buttonDisabled]}
              onPress={handleNext}
              disabled={name.length < 2}
              accessibilityLabel="Next button"
            >
              <Text style={styles.buttonText}>Next</Text>
            </TouchableOpacity>
          </View>
        )

      case 3:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Where Are You Located?</Text>
            <Text style={styles.stepDescription}>This helps us find vendors near you</Text>

            <View style={styles.addressInputContainer}>
              <Ionicons name="search" size={20} color={theme.colors.placeholder} style={styles.searchIcon} />
              <TextInput
                style={styles.addressInput}
                placeholder="Search for your address"
                value={address}
                onChangeText={setAddress}
                accessibilityLabel="Address input"
              />
            </View>

            <View style={styles.mapPreview}>
              <Image
                source={{ uri: "https://via.placeholder.com/400x200?text=Map+Preview" }}
                style={styles.mapImage}
                accessibilityLabel="Map preview"
              />
            </View>

            <TouchableOpacity
              style={[styles.button, address.length < 5 && styles.buttonDisabled]}
              onPress={handleFinish}
              disabled={address.length < 5 || loading}
              accessibilityLabel="Finish button"
            >
              {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.buttonText}>Finish</Text>}
            </TouchableOpacity>
          </View>
        )

      default:
        return null
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={handleBack} accessibilityLabel="Back button">
        <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.progressContainer}>
          {[1, 2, 3].map((i) => (
            <View
              key={i}
              style={[styles.progressDot, step >= i ? styles.progressDotActive : styles.progressDotInactive]}
              accessibilityLabel={`Step ${i} ${step >= i ? "active" : "inactive"}`}
            />
          ))}
        </View>

        {renderStep()}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  backButton: {
    padding: spacing.md,
    marginTop: spacing.md,
  },
  scrollContent: {
    flexGrow: 1,
    padding: spacing.lg,
  },
  progressContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: spacing.xl,
  },
  progressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: spacing.xs,
  },
  progressDotActive: {
    backgroundColor: theme.colors.primary,
  },
  progressDotInactive: {
    backgroundColor: theme.colors.disabled,
  },
  stepContainer: {
    flex: 1,
    justifyContent: "center",
  },
  stepTitle: {
    fontSize: fontSize.xl,
    fontWeight: "bold",
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  stepDescription: {
    fontSize: fontSize.md,
    color: theme.colors.placeholder,
    marginBottom: spacing.xl,
    textAlign: "center",
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
    borderStyle: "dashed",
  },
  imagePlaceholderText: {
    marginTop: spacing.xs,
    color: theme.colors.placeholder,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.placeholder,
    borderRadius: 8,
    padding: spacing.md,
    fontSize: fontSize.md,
    marginBottom: spacing.xl,
  },
  addressInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.placeholder,
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  addressInput: {
    flex: 1,
    fontSize: fontSize.md,
  },
  mapPreview: {
    marginBottom: spacing.xl,
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: theme.colors.disabled,
  },
  mapImage: {
    width: "100%",
    height: 200,
  },
  button: {
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    padding: spacing.md,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: fontSize.lg,
    fontWeight: "bold",
  },
})

export default BuyerOnboarding
