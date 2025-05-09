"use client"

import { useState, useRef } from "react"
import {
  View,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native"
import { useNavigation, useRoute } from "@react-navigation/native"
import { theme, spacing, fontSize } from "../../theme"
import { Ionicons } from "@expo/vector-icons"

const OtpVerification = () => {
  const navigation = useNavigation()
  const route = useRoute()
  const { role } = route.params as { role: "buyer" | "seller" }

  const [phoneNumber, setPhoneNumber] = useState("")
  const [countryCode, setCountryCode] = useState("+1")
  const [otpSent, setOtpSent] = useState(false)
  const [otp, setOtp] = useState(["", "", "", ""])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const otpInputs = useRef<Array<TextInput | null>>([])

  const handleSendOtp = () => {
    if (phoneNumber.length < 10) {
      setError("Please enter a valid phone number")
      return
    }

    setLoading(true)
    setError("")

    // Simulate OTP sending
    setTimeout(() => {
      setLoading(false)
      setOtpSent(true)
    }, 1500)
  }

  const handleOtpChange = (text: string, index: number) => {
    const newOtp = [...otp]
    newOtp[index] = text
    setOtp(newOtp)

    // Auto-focus next input
    if (text && index < 3) {
      otpInputs.current[index + 1]?.focus()
    }
  }

  const handleVerifyOtp = () => {
    const enteredOtp = otp.join("")
    if (enteredOtp.length !== 4) {
      setError("Please enter a valid OTP")
      return
    }

    setLoading(true)
    setError("")

    // Simulate OTP verification
    setTimeout(() => {
      setLoading(false)

      // Navigate to appropriate onboarding screen based on role
      if (role === "buyer") {
        navigation.navigate("BuyerOnboarding")
      } else {
        navigation.navigate("SellerOnboarding")
      }
    }, 1500)
  }

  const handleResendOtp = () => {
    setOtp(["", "", "", ""])
    setLoading(true)

    // Simulate OTP resending
    setTimeout(() => {
      setLoading(false)
    }, 1500)
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardAvoidView}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          accessibilityLabel="Back button"
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>

        <View style={styles.content}>
          <Text style={styles.title}>Verify Your Phone</Text>
          <Text style={styles.subtitle}>
            {otpSent
              ? `We've sent a verification code to ${countryCode} ${phoneNumber}`
              : "Enter your phone number to receive a verification code"}
          </Text>

          {!otpSent ? (
            <>
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
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleSendOtp}
                disabled={loading}
                accessibilityLabel="Send OTP button"
              >
                {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.buttonText}>Send OTP</Text>}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View style={styles.otpContainer}>
                {otp.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={(ref) => (otpInputs.current[index] = ref)}
                    style={styles.otpInput}
                    keyboardType="number-pad"
                    maxLength={1}
                    value={digit}
                    onChangeText={(text) => handleOtpChange(text, index)}
                    accessibilityLabel={`OTP digit ${index + 1}`}
                  />
                ))}
              </View>

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleVerifyOtp}
                disabled={loading}
                accessibilityLabel="Verify OTP button"
              >
                {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.buttonText}>Verify</Text>}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.resendButton}
                onPress={handleResendOtp}
                disabled={loading}
                accessibilityLabel="Resend OTP button"
              >
                <Text style={styles.resendText}>Didn't receive code? Resend</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  keyboardAvoidView: {
    flex: 1,
  },
  backButton: {
    padding: spacing.md,
    marginTop: spacing.md,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: "center",
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: "bold",
    marginBottom: spacing.md,
    textAlign: "center",
  },
  subtitle: {
    fontSize: fontSize.md,
    color: theme.colors.placeholder,
    marginBottom: spacing.xl,
    textAlign: "center",
  },
  phoneInputContainer: {
    flexDirection: "row",
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.placeholder,
    borderRadius: 8,
    overflow: "hidden",
  },
  countryCodeContainer: {
    backgroundColor: "#F5F5F5",
    paddingHorizontal: spacing.md,
    justifyContent: "center",
    borderRightWidth: 1,
    borderRightColor: theme.colors.placeholder,
  },
  countryCode: {
    fontSize: fontSize.md,
    fontWeight: "bold",
  },
  phoneInput: {
    flex: 1,
    padding: spacing.md,
    fontSize: fontSize.md,
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.xl,
  },
  otpInput: {
    width: 60,
    height: 60,
    borderWidth: 1,
    borderColor: theme.colors.placeholder,
    borderRadius: 8,
    textAlign: "center",
    fontSize: fontSize.xl,
    fontWeight: "bold",
  },
  button: {
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    padding: spacing.md,
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: fontSize.lg,
    fontWeight: "bold",
  },
  resendButton: {
    alignItems: "center",
  },
  resendText: {
    color: theme.colors.primary,
    fontSize: fontSize.md,
  },
  errorText: {
    color: theme.colors.error,
    marginBottom: spacing.md,
    textAlign: "center",
  },
})

export default OtpVerification
