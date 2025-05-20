"use client"

import { useState, useEffect } from "react"
import { 
  View, 
  StyleSheet, 
  Text, 
  Image, 
  TouchableOpacity, 
  ScrollView, 
  Switch, 
  SafeAreaView, 
  Alert,
  TextInput,
  Modal,
  ActivityIndicator
} from "react-native"
import { useNavigation } from "@react-navigation/native"
import { theme, spacing, fontSize } from "../../theme"
import { Ionicons } from "@expo/vector-icons"
import { signOut } from "../../lib/auth"
import { useAuth } from "../../context/AuthContext"
import { supabase } from "../../lib/supabase"

type NotificationSettings = {
  orderUpdates: boolean;
  promotions: boolean;
  sellerAlerts: boolean;
};

const ProfileScreen = () => {
  const navigation = useNavigation();
  const { userInfo, refreshUserProfile, refreshAuthState } = useAuth();
  
  // State for notifications
  const [notifications, setNotifications] = useState<NotificationSettings>({
    orderUpdates: true,
    promotions: false,
    sellerAlerts: true,
  });
  
  // Editing state
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [loadingLogout, setLoadingLogout] = useState(false);

  // Load profile data when component mounts
  useEffect(() => {
    if (userInfo?.profileData) {
      setEditName(userInfo.profileData.name || "");
      setEditAddress(userInfo.profileData.address || "");
    }
  }, [userInfo?.profileData]);

  const handleEditProfile = () => {
    setIsEditing(true);
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      Alert.alert("Error", "Name cannot be empty");
      return;
    }

    setIsSaving(true);
    try {
      const tableName = userInfo?.userType === 'buyer' ? 'buyers' : 'sellers';
      
      const { error } = await supabase
        .from(tableName)
        .update({
          name: editName,
          address: editAddress
        })
        .eq('phone_number', userInfo?.phoneNumber);
      
      if (error) {
        throw error;
      }
      
      // Refresh user profile data
      await refreshUserProfile();
      setIsEditing(false);
      Alert.alert("Success", "Profile updated successfully");
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert("Error", "Failed to update profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleNotification = (type: keyof NotificationSettings) => {
    setNotifications({
      ...notifications,
      [type]: !notifications[type],
    });
  };

  const handleLogout = async () => {
    setLoadingLogout(true);
    try {
      await signOut(navigation);
      // Force a refresh of the auth context to ensure immediate UI update
      await refreshAuthState();
    } catch (error) {
      console.error('Error logging out:', error);
      Alert.alert('Error', 'Failed to log out. Please try again.');
    } finally {
      setLoadingLogout(false);
    }
  };

  // Get profile image based on user type
  const profileImage = userInfo?.userType === 'buyer' 
    ? userInfo?.profileData?.profile_pic_url 
    : userInfo?.profileData?.logo_url;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
        </View>

        <View style={styles.profileSection}>
          <View style={styles.profileInfo}>
            <Image
              source={{ uri: profileImage || "https://via.placeholder.com/100?text=User" }}
              style={styles.profileImage}
              accessibilityLabel="Profile picture"
            />

            <View>
              <Text style={styles.profileName}>{userInfo?.profileData?.name || "User"}</Text>
              <Text style={styles.profileLocation}>{userInfo?.profileData?.address || "No address"}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.editButton}
            onPress={handleEditProfile}
            accessibilityLabel="Edit profile button"
          >
            <Ionicons name="pencil" size={16} color="#FFFFFF" />
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Information</Text>
          <View style={styles.accountInfoItem}>
            <Text style={styles.accountInfoLabel}>Phone Number</Text>
            <Text style={styles.accountInfoValue}>{userInfo?.phoneNumber || ""}</Text>
        </View>
          <View style={styles.accountInfoItem}>
            <Text style={styles.accountInfoLabel}>Account Type</Text>
            <Text style={styles.accountInfoValue}>{userInfo?.userType === 'buyer' ? 'Customer' : 'Business'}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>

          <View style={styles.settingsGroup}>
            <TouchableOpacity
              style={styles.settingItem}
              onPress={() => handleToggleNotification("orderUpdates")}
            >
              <Text style={styles.settingText}>Order Updates</Text>
            <Switch
              value={notifications.orderUpdates}
              onValueChange={() => handleToggleNotification("orderUpdates")}
              trackColor={{ false: "#D1D1D1", true: "#E8F5E9" }}
              thumbColor={notifications.orderUpdates ? theme.colors.primary : "#F5F5F5"}
            />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.settingItem}
              onPress={() => handleToggleNotification("promotions")}
            >
              <Text style={styles.settingText}>Promotions & Deals</Text>
            <Switch
              value={notifications.promotions}
              onValueChange={() => handleToggleNotification("promotions")}
              trackColor={{ false: "#D1D1D1", true: "#E8F5E9" }}
              thumbColor={notifications.promotions ? theme.colors.primary : "#F5F5F5"}
            />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.settingItem}
              onPress={() => handleToggleNotification("sellerAlerts")}
            >
              <Text style={styles.settingText}>Seller Alerts</Text>
            <Switch
              value={notifications.sellerAlerts}
              onValueChange={() => handleToggleNotification("sellerAlerts")}
              trackColor={{ false: "#D1D1D1", true: "#E8F5E9" }}
              thumbColor={notifications.sellerAlerts ? theme.colors.primary : "#F5F5F5"}
            />
            </TouchableOpacity>
          </View>
        </View>

        {/* Logout Button */}
        <View style={styles.logoutContainer}>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            disabled={loadingLogout}
          >
            {loadingLogout ? (
              <ActivityIndicator size="small" color="#E53935" />
            ) : (
              <>
                <Ionicons name="log-out-outline" size={20} color="#E53935" style={styles.logoutIcon} />
          <Text style={styles.logoutText}>Logout</Text>
              </>
            )}
        </TouchableOpacity>
        </View>

        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>Version 1.0.0</Text>
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={isEditing}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsEditing(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            
            <Text style={styles.inputLabel}>Name</Text>
            <TextInput
              style={styles.input}
              value={editName}
              onChangeText={setEditName}
              placeholder="Enter your name"
            />
            
            <Text style={styles.inputLabel}>Address</Text>
            <TextInput
              style={[styles.input, styles.addressInput]}
              value={editAddress}
              onChangeText={setEditAddress}
              placeholder="Enter your address"
              multiline
            />
            
            <View style={styles.modalButtonsContainer}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={() => setIsEditing(false)}
                disabled={isSaving}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.saveButton, isSaving && styles.disabledButton]} 
                onPress={handleSaveProfile}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveButtonText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: "bold",
  },
  profileSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  profileInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: spacing.md,
  },
  profileName: {
    fontSize: fontSize.lg,
    fontWeight: "bold",
    marginBottom: spacing.xs,
  },
  profileLocation: {
    fontSize: fontSize.sm,
    color: theme.colors.placeholder,
  },
  editButton: {
    backgroundColor: theme.colors.primary,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
  },
  editButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    marginLeft: 4,
  },
  section: {
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: "bold",
    marginBottom: spacing.md,
  },
  accountInfoItem: {
    marginBottom: spacing.md,
  },
  accountInfoLabel: {
    fontSize: fontSize.md,
    fontWeight: "bold",
    marginBottom: 4,
  },
  accountInfoValue: {
    fontSize: fontSize.md,
    color: theme.colors.text,
  },
  settingsGroup: {
    marginBottom: spacing.lg,
  },
  settingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  settingText: {
    fontSize: fontSize.md,
    fontWeight: "bold",
  },
  logoutContainer: {
    padding: spacing.lg,
    alignItems: "center",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E53935",
    width: "80%",
  },
  logoutIcon: {
    marginRight: spacing.sm,
  },
  logoutText: {
    color: "#E53935",
    fontWeight: "bold",
    fontSize: fontSize.md,
  },
  versionContainer: {
    padding: spacing.lg,
    alignItems: "center",
  },
  versionText: {
    fontSize: fontSize.sm,
    color: theme.colors.placeholder,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: spacing.lg,
    width: "85%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: fontSize.xl,
    fontWeight: "bold",
    marginBottom: spacing.lg,
    textAlign: "center",
  },
  inputLabel: {
    fontSize: fontSize.md,
    fontWeight: "bold",
    marginBottom: spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    padding: spacing.md,
    fontSize: fontSize.md,
    marginBottom: spacing.lg,
  },
  addressInput: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  modalButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalButton: {
    flex: 1,
    padding: spacing.md,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    backgroundColor: "#F5F5F5",
    marginRight: spacing.md,
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
  },
  cancelButtonText: {
    color: theme.colors.text,
    fontWeight: "bold",
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  disabledButton: {
    opacity: 0.7,
  },
});

export default ProfileScreen;
