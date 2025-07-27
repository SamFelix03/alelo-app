import { useState } from "react"
import { View, StyleSheet, Image, Text, TextInput, TouchableOpacity, SafeAreaView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from "react-native"
import { useNavigation } from "@react-navigation/native"
import { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { theme, spacing, fontSize } from "../../theme"
import { supabase } from "../../lib/supabase"

// Define navigation prop types
type AuthStackParamList = {
  RoleSelection: undefined;
  OtpVerification: { role: "buyer" | "seller" | null, phoneNumber: string, existingUser?: boolean, existingUserType?: string };
};

type RoleSelectionNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'RoleSelection'>;

const RoleSelection = () => {
  const navigation = useNavigation<RoleSelectionNavigationProp>()
  const [phoneNumber, setPhoneNumber] = useState("")
  const [countryCode, setCountryCode] = useState("+91")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleContinue = async () => {
    if (phoneNumber.length < 10) {
      setError("Please enter a valid phone number")
      return
    }

    setLoading(true)
    setError("")

    try {
      const formattedPhone = `${countryCode}${phoneNumber}`
      
      // Check if user already exists in the database
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('*')
        .eq('phone_number', formattedPhone)
        .single()
      
      if (checkError && checkError.code !== 'PGRST116') {
        // PGRST116 is the error code for "no rows returned" - this means user doesn't exist
        console.error("Error checking user:", checkError)
        throw new Error("Failed to check if user exists")
      }
      
      if (existingUser) {
        // User exists - proceed to OTP verification with existing user info
        navigation.navigate("OtpVerification", { 
          role: null,
          phoneNumber: formattedPhone,
          existingUser: true,
          existingUserType: existingUser.user_type
        })
      } else {
        // User doesn't exist - proceed to OTP verification as new user
        navigation.navigate("OtpVerification", { 
          role: null,
          phoneNumber: formattedPhone,
          existingUser: false
        })
      }
    } catch (error) {
      console.error("Error in phone verification:", error)
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"} 
        style={styles.keyboardAvoidView}
      >
        <View style={styles.logoContainer}>
        <Image source={{ uri: "https://yrpfcforiwwwrvcanyhb.supabase.co/storage/v1/object/public/seller_logos/logo.png" }} style={styles.logo} accessibilityLabel="App logo" />
        <Text style={styles.title}>Alelo</Text>
          <Text style={styles.subtitle}>Shop Peacefully at Your Doorstep</Text>
        </View>

        <View style={styles.phoneContainer}>
          <Text style={styles.question}>Enter your phone number to continue</Text>

          <View style={styles.phoneInputContainer}>
            <View style={styles.countryCodeContainer}>
              <Text style={styles.countryCode}>{countryCode}</Text>
            </View>
            <TextInput
              style={styles.phoneInput}
              placeholder="Phone Number"
              keyboardType="phone-pad"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              maxLength={10}
              accessibilityLabel="Phone number input"
            />
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.continueButton, loading && styles.buttonDisabled]}
            onPress={handleContinue}
            disabled={loading}
            accessibilityLabel="Continue button"
          >
            {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.buttonText}>Continue</Text>}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    padding: spacing.lg,
  },
  keyboardAvoidView: {
    flex: 1,
  },
  logoContainer: {
    alignItems: "center",
    marginTop: spacing.xxl,
    marginBottom: spacing.xxl,
  },
  logo: {
    width: 150,
    height: 150,
    marginBottom: spacing.lg,
    resizeMode: 'contain',
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: "bold",
    color: theme.colors.primary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: theme.colors.text,
    textAlign: "center",
  },
  phoneContainer: {
    flex: 1,
    justifyContent: "center",
    marginBottom: spacing.xxl,
  },
  question: {
    fontSize: fontSize.lg,
    fontWeight: "bold",
    marginBottom: spacing.xl,
    textAlign: "center",
  },
  phoneInputContainer: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    marginBottom: spacing.md,
  },
  countryCodeContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRightWidth: 1,
    borderRightColor: "#E0E0E0",
    justifyContent: "center",
  },
  countryCode: {
    fontSize: fontSize.md,
    color: theme.colors.text,
  },
  phoneInput: {
    flex: 1,
    padding: spacing.md,
    fontSize: fontSize.md,
  },
  errorText: {
    color: "#E53935",
    marginBottom: spacing.md,
    fontSize: fontSize.sm,
  },
  continueButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    padding: spacing.md,
    alignItems: "center",
    marginTop: spacing.md,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: fontSize.md,
  },
})

export default RoleSelection
