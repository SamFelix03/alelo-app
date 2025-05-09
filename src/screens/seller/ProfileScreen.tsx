"use client"

import { useState, useEffect } from "react"
import { View, StyleSheet, Text, Image, TouchableOpacity, ScrollView, Switch, SafeAreaView, Alert, ActivityIndicator, Modal, TextInput } from "react-native"
import { useNavigation } from "@react-navigation/native"
import { theme, spacing, fontSize } from "../../theme"
import { Ionicons } from "@expo/vector-icons"
import { signOut } from "../../lib/auth"
import { useAuth } from "../../context/AuthContext"
import { supabase } from "../../lib/supabase"

type NotificationSettings = {
  orderAlerts: boolean;
  customerProximity: boolean;
  promotions: boolean;
};

const SellerProfileScreen = () => {
  const navigation = useNavigation()
  const { userInfo, refreshUserProfile, refreshAuthState } = useAuth();
  const [isOpen, setIsOpen] = useState(userInfo?.profileData?.is_open || false);
  const [notifications, setNotifications] = useState<NotificationSettings>({
    orderAlerts: true,
    customerProximity: true,
    promotions: true,
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [loadingLogout, setLoadingLogout] = useState(false);

  useEffect(() => {
    if (userInfo?.profileData) {
      setEditName(userInfo.profileData.name || "");
      setEditAddress(userInfo.profileData.address || "");
      setIsOpen(userInfo.profileData.is_open || false);
    }
  }, [userInfo?.profileData]);

  const handleEditProfile = () => {
    setIsEditing(true);
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      Alert.alert("Error", "Business name cannot be empty");
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('sellers')
        .update({
          name: editName,
          address: editAddress
        })
        .eq('phone_number', userInfo?.phoneNumber);
      
      if (error) {
        throw error;
      }
      
      await refreshUserProfile();
      setIsEditing(false);
      Alert.alert("Success", "Business profile updated successfully");
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert("Error", "Failed to update profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleBusinessStatus = async () => {
    try {
      const newStatus = !isOpen;
      
      const { error } = await supabase
        .from('sellers')
        .update({
          is_open: newStatus
        })
        .eq('phone_number', userInfo?.phoneNumber);
      
      if (error) {
        throw error;
      }
      
      setIsOpen(newStatus);
      await refreshUserProfile();
      
    } catch (error) {
      console.error('Error updating business status:', error);
      Alert.alert("Error", "Failed to update business status. Please try again.");
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
      await refreshAuthState();
    } catch (error) {
      console.error('Error logging out:', error);
      Alert.alert('Error', 'Failed to log out. Please try again.');
    } finally {
      setLoadingLogout(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.title}>Business Profile</Text>
        </View>

        <View style={styles.profileSection}>
          <View style={styles.profileInfo}>
            <Image
              source={{ uri: userInfo?.profileData?.logo_url || "https://via.placeholder.com/100?text=Business" }}
              style={styles.profileImage}
              accessibilityLabel="Business profile picture"
            />

            <View>
              <Text style={styles.profileName}>{userInfo?.profileData?.name || "Your Business"}</Text>
              <Text style={styles.profileLocation}>{userInfo?.profileData?.address || "No address"}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.editButton}
            onPress={handleEditProfile}
            accessibilityLabel="Edit profile button"
          >
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Business Status</Text>

          <View style={styles.businessStatusContainer}>
            <Text style={styles.businessStatusLabel}>Open for orders</Text>
            <Switch
              value={isOpen}
              onValueChange={handleToggleBusinessStatus}
              trackColor={{ false: "#D1D1D1", true: "#E8F5E9" }}
              thumbColor={isOpen ? theme.colors.primary : "#F5F5F5"}
              ios_backgroundColor="#D1D1D1"
            />
          </View>

          <Text style={styles.businessStatusInfo}>
            {isOpen 
              ? "Your business is currently visible to customers and can receive orders." 
              : "Your business is currently hidden from customers and cannot receive orders."}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Information</Text>
          <View style={styles.accountInfoItem}>
            <Text style={styles.accountInfoLabel}>Phone Number</Text>
            <Text style={styles.accountInfoValue}>{userInfo?.phoneNumber || ""}</Text>
          </View>
          <View style={styles.accountInfoItem}>
            <Text style={styles.accountInfoLabel}>Account Type</Text>
            <Text style={styles.accountInfoValue}>Business</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>

          <View style={styles.settingsGroup}>
            <TouchableOpacity 
              style={styles.settingItem}
              onPress={() => handleToggleNotification("orderAlerts")}
            >
              <Text style={styles.settingText}>Order Alerts</Text>
              <Switch
                value={notifications.orderAlerts}
                onValueChange={() => handleToggleNotification("orderAlerts")}
                trackColor={{ false: "#D1D1D1", true: "#E8F5E9" }}
                thumbColor={notifications.orderAlerts ? theme.colors.primary : "#F5F5F5"}
              />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.settingItem}
              onPress={() => handleToggleNotification("customerProximity")}
            >
              <Text style={styles.settingText}>Customer Proximity</Text>
              <Switch
                value={notifications.customerProximity}
                onValueChange={() => handleToggleNotification("customerProximity")}
                trackColor={{ false: "#D1D1D1", true: "#E8F5E9" }}
                thumbColor={notifications.customerProximity ? theme.colors.primary : "#F5F5F5"}
              />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.settingItem}
              onPress={() => handleToggleNotification("promotions")}
            >
              <Text style={styles.settingText}>Promotion Alerts</Text>
              <Switch
                value={notifications.promotions}
                onValueChange={() => handleToggleNotification("promotions")}
                trackColor={{ false: "#D1D1D1", true: "#E8F5E9" }}
                thumbColor={notifications.promotions ? theme.colors.primary : "#F5F5F5"}
              />
            </TouchableOpacity>
          </View>
        </View>

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
      
      <Modal
        visible={isEditing}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsEditing(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Business Profile</Text>
            
            <Text style={styles.inputLabel}>Business Name</Text>
            <TextInput
              style={styles.input}
              value={editName}
              onChangeText={setEditName}
              placeholder="Enter business name"
            />
            
            <Text style={styles.inputLabel}>Business Address</Text>
            <TextInput
              style={[styles.input, styles.addressInput]}
              value={editAddress}
              onChangeText={setEditAddress}
              placeholder="Enter business address"
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
  )
}

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
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
  },
  editButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
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
  businessStatusContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  businessStatusLabel: {
    fontSize: fontSize.md,
    fontWeight: "bold",
  },
  businessStatusInfo: {
    fontSize: fontSize.sm,
    color: theme.colors.placeholder,
    fontStyle: "italic",
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
    paddingVertical: spacing.md,
  },
  settingText: {
    fontSize: fontSize.md,
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
    color: theme.colors.placeholder,
    fontSize: fontSize.sm,
  },
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
})

export default SellerProfileScreen
