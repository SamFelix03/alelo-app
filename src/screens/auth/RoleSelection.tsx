import { View, StyleSheet, Image, Text, TouchableOpacity, SafeAreaView } from "react-native"
import { useNavigation } from "@react-navigation/native"
import { theme, spacing, fontSize } from "../../theme"

const RoleSelection = () => {
  const navigation = useNavigation()

  const handleRoleSelection = (role: "buyer" | "seller") => {
    navigation.navigate("OtpVerification", { role })
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.logoContainer}>
        <Image source={{ uri: "https://via.placeholder.com/150" }} style={styles.logo} accessibilityLabel="App logo" />
        <Text style={styles.title}>Welcome to StreetVend</Text>
        <Text style={styles.subtitle}>Connect with local vendors in real-time</Text>
      </View>

      <View style={styles.roleContainer}>
        <Text style={styles.question}>How would you like to use StreetVend?</Text>

        <TouchableOpacity
          style={[styles.roleButton, styles.buyerButton]}
          onPress={() => handleRoleSelection("buyer")}
          accessibilityLabel="I'm a Buyer button"
          accessibilityHint="Select if you want to buy goods"
        >
          <Image
            source={{ uri: "https://via.placeholder.com/50" }}
            style={styles.roleIcon}
            accessibilityLabel="Buyer icon"
          />
          <Text style={styles.roleText}>I'm a Buyer</Text>
          <Text style={styles.roleDescription}>Find and purchase from local vendors</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.roleButton, styles.sellerButton]}
          onPress={() => handleRoleSelection("seller")}
          accessibilityLabel="I'm a Seller button"
          accessibilityHint="Select if you want to sell goods"
        >
          <Image
            source={{ uri: "https://via.placeholder.com/50" }}
            style={styles.roleIcon}
            accessibilityLabel="Seller icon"
          />
          <Text style={styles.roleText}>I'm a Seller</Text>
          <Text style={styles.roleDescription}>Sell your products to nearby customers</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    padding: spacing.lg,
  },
  logoContainer: {
    alignItems: "center",
    marginTop: spacing.xxl,
    marginBottom: spacing.xxl,
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: spacing.lg,
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
  roleContainer: {
    flex: 1,
    justifyContent: "center",
  },
  question: {
    fontSize: fontSize.lg,
    fontWeight: "bold",
    marginBottom: spacing.xl,
    textAlign: "center",
  },
  roleButton: {
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    flexDirection: "row",
    alignItems: "center",
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
  roleIcon: {
    width: 50,
    height: 50,
    marginRight: spacing.lg,
  },
  roleText: {
    fontSize: fontSize.xl,
    fontWeight: "bold",
    flex: 1,
  },
  roleDescription: {
    fontSize: fontSize.sm,
    color: theme.colors.placeholder,
    marginTop: spacing.xs,
    flex: 1,
  },
})

export default RoleSelection
