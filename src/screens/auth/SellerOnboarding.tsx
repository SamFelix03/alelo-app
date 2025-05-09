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

const SellerOnboarding = () => {
  const navigation = useNavigation()
  const [step, setStep] = useState(1)
  const [name, setName] = useState("")
  const [address, setAddress] = useState("")
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const [businessLicense, setBusinessLicense] = useState<string | null>(null)
  const [businessCategory, setBusinessCategory] = useState("")
  const [openingTime, setOpeningTime] = useState("8:00 AM")
  const [closingTime, setClosingTime] = useState("8:00 PM")
  const [loading, setLoading] = useState(false)

  const handleImagePicker = () => {
    // In a real app, this would use react-native-image-picker
    // For this example, we'll just set a placeholder
    setProfileImage("https://via.placeholder.com/150")
  }

  const handleLicensePicker = () => {
    // In a real app, this would use react-native-document-picker
    // For this example, we'll just set a placeholder
    setBusinessLicense("business_license.pdf")
  }

  const handleNext = () => {
    if (step < 4) {
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
      navigation.navigate("SellerTabs")
    }, 1500)
  }

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Add a Profile Picture</Text>
            <Text style={styles.stepDescription}>Help customers recognize your business</Text>

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
            <Text style={styles.stepTitle}>Business Information</Text>
            <Text style={styles.stepDescription}>Tell us about your business</Text>

            <TextInput
              style={styles.input}
              placeholder="Business Name"
              value={name}
              onChangeText={setName}
              maxLength={30}
              accessibilityLabel="Business name input"
            />

            <View style={styles.categoryContainer}>
              <Text style={styles.categoryLabel}>Business Category</Text>
              <View style={styles.categoryButtons}>
                {["Food", "Groceries", "Bakery", "Other"].map((category) => (
                  <TouchableOpacity
                    key={category}
                    style={[styles.categoryButton, businessCategory === category && styles.categoryButtonActive]}
                    onPress={() => setBusinessCategory(category)}
                    accessibilityLabel={`${category} category button`}
                  >
                    <Text
                      style={[
                        styles.categoryButtonText,
                        businessCategory === category && styles.categoryButtonTextActive,
                      ]}
                    >
                      {category}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity
              style={[styles.button, (name.length < 2 || !businessCategory) && styles.buttonDisabled]}
              onPress={handleNext}
              disabled={name.length < 2 || !businessCategory}
              accessibilityLabel="Next button"
            >
              <Text style={styles.buttonText}>Next</Text>
            </TouchableOpacity>
          </View>
        )

      case 3:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Business License</Text>
            <Text style={styles.stepDescription}>Upload your business license or permit</Text>

            <TouchableOpacity
              style={styles.licensePickerContainer}
              onPress={handleLicensePicker}
              accessibilityLabel="Upload business license"
            >
              {businessLicense ? (
                <View style={styles.licenseContainer}>
                  <Ionicons name="document" size={40} color={theme.colors.primary} />
                  <Text style={styles.licenseText}>{businessLicense}</Text>
                </View>
              ) : (
                <View style={styles.licensePlaceholder}>
                  <Ionicons name="cloud-upload" size={40} color={theme.colors.placeholder} />
                  <Text style={styles.licensePlaceholderText}>Tap to upload license</Text>
                  <Text style={styles.licensePlaceholderSubtext}>PDF or image</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, !businessLicense && styles.buttonDisabled]}
              onPress={handleNext}
              disabled={!businessLicense}
              accessibilityLabel="Next button"
            >
              <Text style={styles.buttonText}>Next</Text>
            </TouchableOpacity>
          </View>
        )

      case 4:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Business Hours</Text>
            <Text style={styles.stepDescription}>Set your default operating hours</Text>

            <View style={styles.hoursContainer}>
              <View style={styles.hourRow}>
                <Text style={styles.hourLabel}>Opening Time</Text>
                <TouchableOpacity style={styles.timeSelector} accessibilityLabel="Opening time selector">
                  <Text style={styles.timeText}>{openingTime}</Text>
                  <Ionicons name="chevron-down" size={16} color={theme.colors.text} />
                </TouchableOpacity>
              </View>

              <View style={styles.hourRow}>
                <Text style={styles.hourLabel}>Closing Time</Text>
                <TouchableOpacity style={styles.timeSelector} accessibilityLabel="Closing time selector">
                  <Text style={styles.timeText}>{closingTime}</Text>
                  <Ionicons name="chevron-down" size={16} color={theme.colors.text} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.addressInputContainer}>
              <Text style={styles.addressLabel}>Business Address</Text>
              <View style={styles.addressSearchContainer}>
                <Ionicons name="search" size={20} color={theme.colors.placeholder} style={styles.searchIcon} />
                <TextInput
                  style={styles.addressInput}
                  placeholder="Search for your business address"
                  value={address}
                  onChangeText={setAddress}
                  accessibilityLabel="Address input"
                />
              </View>
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
          {[1, 2, 3, 4].map((i) => (
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
  categoryContainer: {
    marginBottom: spacing.xl,
  },
  categoryLabel: {
    fontSize: fontSize.md,
    fontWeight: "bold",
    marginBottom: spacing.sm,
  },
  categoryButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  categoryButton: {
    backgroundColor: "#F5F5F5",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  categoryButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  categoryButtonText: {
    fontSize: fontSize.sm,
  },
  categoryButtonTextActive: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  licensePickerContainer: {
    alignSelf: "center",
    marginBottom: spacing.xl,
  },
  licenseContainer: {
    backgroundColor: "#F5F5F5",
    padding: spacing.lg,
    borderRadius: 8,
    alignItems: "center",
  },
  licenseText: {
    marginTop: spacing.sm,
    color: theme.colors.text,
    fontWeight: "bold",
  },
  licensePlaceholder: {
    width: 250,
    height: 150,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.disabled,
    borderStyle: "dashed",
    borderRadius: 8,
  },
  licensePlaceholderText: {
    marginTop: spacing.xs,
    color: theme.colors.placeholder,
    fontWeight: "bold",
  },
  licensePlaceholderSubtext: {
    color: theme.colors.placeholder,
    fontSize: fontSize.sm,
  },
  hoursContainer: {
    marginBottom: spacing.xl,
  },
  hourRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  hourLabel: {
    fontSize: fontSize.md,
    fontWeight: "bold",
  },
  timeSelector: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
  },
  timeText: {
    fontSize: fontSize.md,
    marginRight: spacing.sm,
  },
  addressInputContainer: {
    marginBottom: spacing.lg,
  },
  addressLabel: {
    fontSize: fontSize.md,
    fontWeight: "bold",
    marginBottom: spacing.sm,
  },
  addressSearchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.placeholder,
    borderRadius: 8,
    padding: spacing.md,
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

export default SellerOnboarding
