"use client"

import { useState, useRef, useEffect } from "react"
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
  Alert
} from "react-native"
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native"
import { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { theme, spacing, fontSize } from "../../theme"
import { Ionicons } from "@expo/vector-icons"
import { supabase } from "../../lib/supabase"
import { storeUserData } from "../../lib/auth"
import { useAuth } from "../../context/AuthContext"

// Define types for our route params and navigation
type RootStackParamList = {
  OtpVerification: { 
    role: "buyer" | "seller" | null, 
    phoneNumber: string, 
    existingUser?: boolean, 
    existingUserType?: string 
  };
  BuyerOnboarding: { phoneNumber: string };
  SellerOnboarding: { phoneNumber: string };
  RoleSelection: undefined;
};

type OtpVerificationScreenRouteProp = RouteProp<RootStackParamList, 'OtpVerification'>;
type OtpVerificationScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'OtpVerification'>;

const OtpVerification = () => {
  const navigation = useNavigation<OtpVerificationScreenNavigationProp>()
  const route = useRoute<OtpVerificationScreenRouteProp>()
  const { role, phoneNumber: routePhoneNumber, existingUser, existingUserType } = route.params
  const { refreshAuthState } = useAuth();

  const [phoneNumber, setPhoneNumber] = useState(routePhoneNumber || "")
  const [countryCode, setCountryCode] = useState("+91")
  const [otpSent, setOtpSent] = useState(!!routePhoneNumber)
  const [otp, setOtp] = useState(["", "", "", ""])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [selectedRole, setSelectedRole] = useState<"buyer" | "seller" | null>(role)
  const [showRoleSelection, setShowRoleSelection] = useState(false)

  const otpInputs = useRef<Array<TextInput | null>>([null, null, null, null])

  useEffect(() => {
    // If phoneNumber is passed from route, automatically trigger OTP send
    if (routePhoneNumber && !otpSent) {
      setOtpSent(true);
    }
  }, [routePhoneNumber]);

  // Function to create user in database
  const createUser = async (phoneNumber: string, userType: string) => {
    try {
      // Check if user already exists
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('*')
        .eq('phone_number', phoneNumber)
        .single();
      
      // If user exists, just store the session data
      if (existingUser) {
        await storeUserData(phoneNumber, userType);
        return true;
      }
      
      // Insert into users table if new user
      const { data, error } = await supabase
        .from('users')
        .insert([
          { 
            phone_number: phoneNumber,
            user_type: userType,
            is_verified: true,
          }
        ]);
        
      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }
      
      // Store phone number for future use
      await storeUserData(phoneNumber, userType);
      return true;
      
    } catch (error) {
      console.error('Error creating user:', error);
      Alert.alert("Error", "Failed to create user account");
      return false;
    }
  };

  const handleSendOtp = () => {
    if (phoneNumber.length < 10) {
      setError("Please enter a valid phone number")
      return
    }

    setLoading(true)
    setError("")

    // Simulate OTP sending - no actual SMS is sent
    setTimeout(() => {
      setLoading(false)
      setOtpSent(true)
    }, 1000)
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

  const handleVerifyOtp = async () => {
    const enteredOtp = otp.join("")
    if (enteredOtp.length !== 4) {
      setError("Please enter a valid OTP")
      return
    }

    setLoading(true)
    setError("")

    // Mock verification - all 4-digit codes are accepted
    setTimeout(async () => {
      setLoading(false)
      
      if (existingUser && existingUserType) {
        // If this is an existing user, store their credentials and they will be auto-redirected
        const success = await storeUserData(phoneNumber, existingUserType);
        if (!success) {
          Alert.alert("Error", "Failed to authenticate. Please try again.");
          return;
        }
        
        // Force refresh auth state to trigger navigation
        await refreshAuthState();
        return;
      } 
      
      // For new users, need to select role or continue with onboarding
      if (selectedRole) {
        // If role is selected, create/update user and proceed to onboarding
        const success = await createUser(phoneNumber, selectedRole);
        
        if (success) {
          // Navigate to appropriate onboarding screen based on role
          if (selectedRole === "buyer") {
            navigation.navigate("BuyerOnboarding", { phoneNumber });
          } else {
            navigation.navigate("SellerOnboarding", { phoneNumber });
          }
        }
      } else {
        // If role is not selected, show role selection
        setShowRoleSelection(true);
      }
    }, 1000)
  }

  const handleRoleSelection = (selectedRole: "buyer" | "seller") => {
    setSelectedRole(selectedRole);
    setLoading(true);
    
    // Create user with selected role and navigate
    createUser(phoneNumber, selectedRole).then(success => {
      setLoading(false);
      if (success) {
        if (selectedRole === "buyer") {
          navigation.navigate("BuyerOnboarding", { phoneNumber });
        } else {
          navigation.navigate("SellerOnboarding", { phoneNumber });
        }
      }
    }).catch(err => {
      setLoading(false);
      Alert.alert("Error", "Failed to create user account");
    });
  }

  const handleResendOtp = () => {
    setOtp(["", "", "", ""])
    setLoading(true)

    // Simulate OTP resending - no actual SMS is sent
    setTimeout(() => {
      setLoading(false)
    }, 1000)
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

        {showRoleSelection ? (
          <View style={styles.content}>
            <Text style={styles.title}>Choose Your Role</Text>
            <Text style={styles.subtitle}>How would you like to use StreetVend?</Text>

            <TouchableOpacity
              style={[styles.roleButton, styles.buyerButton]}
              onPress={() => handleRoleSelection("buyer")}
              disabled={loading}
              accessibilityLabel="I'm a Buyer button"
            >
              <Text style={styles.roleText}>I'm a Buyer</Text>
              <Text style={styles.roleDescription}>Find and purchase from local vendors</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.roleButton, styles.sellerButton]}
              onPress={() => handleRoleSelection("seller")}
              disabled={loading}
              accessibilityLabel="I'm a Seller button"
            >
              <Text style={styles.roleText}>I'm a Seller</Text>
              <Text style={styles.roleDescription}>Sell your products to nearby customers</Text>
            </TouchableOpacity>

            {loading && <ActivityIndicator size="large" color={theme.colors.primary} style={styles.loader} />}
          </View>
        ) : (
          <View style={styles.content}>
            <Text style={styles.title}>Verify Your Phone</Text>
            <Text style={styles.subtitle}>
              {otpSent
                ? `We've sent a verification code to ${phoneNumber}`
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
                      ref={(input) => {
                        otpInputs.current[index] = input;
                      }}
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
                
                <Text style={styles.mockHint}>
                  For demo purposes, any 4-digit code will work
                </Text>
              </>
            )}
          </View>
        )}
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
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
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
    textAlign: "center",
    marginBottom: spacing.xl,
    color: theme.colors.placeholder,
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
  otpContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.xl,
  },
  otpInput: {
    width: 60,
    height: 60,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    fontSize: 24,
    textAlign: "center",
  },
  button: {
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    padding: spacing.md,
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: fontSize.md,
  },
  resendButton: {
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  resendText: {
    color: theme.colors.primary,
    fontSize: fontSize.sm,
  },
  mockHint: {
    textAlign: "center",
    color: theme.colors.placeholder,
    fontStyle: "italic",
    fontSize: fontSize.sm,
  },
  errorText: {
    color: "#E53935",
    marginBottom: spacing.md,
    fontSize: fontSize.sm,
  },
  roleButton: {
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buyerButton: {
    backgroundColor: "#E8F5E9",
    borderColor: theme.colors.primary,
    borderWidth: 1,
  },
  sellerButton: {
    backgroundColor: "#FFF3E0",
    borderColor: theme.colors.secondary,
    borderWidth: 1,
  },
  roleText: {
    fontSize: fontSize.xl,
    fontWeight: "bold",
    marginBottom: spacing.xs,
  },
  roleDescription: {
    fontSize: fontSize.sm,
    color: theme.colors.placeholder,
  },
  loader: {
    marginTop: spacing.xl,
  }
})

export default OtpVerification
