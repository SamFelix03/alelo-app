"use client"

import { useState, useEffect } from "react"
import { View, StyleSheet, Text, Image, TouchableOpacity, ScrollView, Switch, SafeAreaView, Alert, ActivityIndicator, Modal, TextInput, Platform } from "react-native"
import { useNavigation } from "@react-navigation/native"
import { theme, spacing, fontSize } from "../../theme"
import { 
  CameraIcon, 
  MapPinIcon, 
  PencilIcon, 
  DocumentTextIcon, 
  ChevronRightIcon,
  BellIcon,
  BuildingStorefrontIcon,
  PhoneIcon,
  UserIcon,
  ArrowRightOnRectangleIcon,
  XMarkIcon
} from "react-native-heroicons/outline"
import { signOut } from "../../lib/auth"
import { useAuth } from "../../context/AuthContext"
import { supabase } from "../../lib/supabase"
import * as ImagePicker from 'expo-image-picker'
import { decode } from 'base64-arraybuffer'

type NotificationSettings = {
  orderUpdates: boolean;
  promotions: boolean;
  sellerAlerts: boolean;
};

const ProfileScreen = () => {
  const navigation = useNavigation()
  const { userInfo, refreshUserProfile, refreshAuthState } = useAuth();
  const [notifications, setNotifications] = useState<NotificationSettings>({
    orderUpdates: true,
    promotions: false,
    sellerAlerts: true,
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editProfilePic, setEditProfilePic] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [loadingLogout, setLoadingLogout] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  useEffect(() => {
    if (userInfo?.profileData) {
      setEditName(userInfo.profileData.name || "");
      setEditAddress(userInfo.profileData.address || "");
      setEditProfilePic(userInfo.profileData.profile_pic_url || null);
    }
  }, [userInfo?.profileData]);

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
          const fileName = `buyers/${userInfo?.phoneNumber?.replace(/[^\w]/g, '_')}/${Date.now()}.${ext}`

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

          setEditProfilePic(publicUrl)
          
          // If not in editing mode, save immediately
          if (!isEditing) {
            await updateProfilePicture(publicUrl)
          }
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

  const updateProfilePicture = async (profilePicUrl: string) => {
    try {
      const { error } = await supabase
        .from('buyers')
        .update({ profile_pic_url: profilePicUrl })
        .eq('phone_number', userInfo?.phoneNumber);
      
      if (error) throw error;
      
      await refreshUserProfile();
      Alert.alert("Success", "Profile picture updated successfully");
    } catch (error) {
      console.error('Error updating profile picture:', error);
      Alert.alert("Error", "Failed to update profile picture. Please try again.");
    }
  }

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
      const { error } = await supabase
        .from('buyers')
        .update({
          name: editName,
          address: editAddress,
          profile_pic_url: editProfilePic
        })
        .eq('phone_number', userInfo?.phoneNumber);
      
      if (error) {
        throw error;
      }
      
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
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
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
          }
        }
      ]
    );
  };

  const navigateToOrders = () => {
    // @ts-ignore - Navigation type issue
    navigation.navigate('Orders');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileImageContainer}>
            <Image
              source={{ 
                uri: userInfo?.profileData?.profile_pic_url || "https://via.placeholder.com/120?text=" + (userInfo?.profileData?.name?.charAt(0) || "U")
              }}
              style={styles.profileImage}
              accessibilityLabel="Profile picture"
            />
            <TouchableOpacity
              style={styles.cameraButton}
              onPress={handleImagePicker}
              disabled={isUploadingImage}
              accessibilityLabel="Change profile picture"
            >
              {isUploadingImage ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <CameraIcon size={16} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>

          <Text style={styles.profileName}>{userInfo?.profileData?.name || "Your Name"}</Text>
          <Text style={styles.profilePhone}>{userInfo?.phoneNumber || ""}</Text>
          {userInfo?.profileData?.address && (
            <View style={styles.addressContainer}>
              <MapPinIcon size={16} color={theme.colors.placeholder} />
              <Text style={styles.profileAddress}>{userInfo.profileData.address}</Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.editProfileButton}
            onPress={handleEditProfile}
            accessibilityLabel="Edit profile button"
          >
            <PencilIcon size={16} color={theme.colors.primary} />
            <Text style={styles.editProfileButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Orders Section */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>My Activity</Text>
          <View style={styles.settingsCard}>
            <TouchableOpacity 
              style={styles.settingItem}
              onPress={navigateToOrders}
              activeOpacity={0.7}
            >
              <View style={styles.settingLeft}>
                <View style={styles.settingIconContainer}>
                  <DocumentTextIcon size={20} color={theme.colors.primary} />
                </View>
                <View>
                  <Text style={styles.settingTitle}>My Orders</Text>
                  <Text style={styles.settingSubtitle}>View your order history</Text>
                </View>
              </View>
              <ChevronRightIcon size={20} color={theme.colors.placeholder} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Settings Sections */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <View style={styles.settingsCard}>
            <TouchableOpacity 
              style={styles.settingItem}
              onPress={() => handleToggleNotification("orderUpdates")}
              activeOpacity={0.7}
            >
              <View style={styles.settingLeft}>
                <View style={styles.settingIconContainer}>
                  <BellIcon size={20} color={theme.colors.primary} />
                </View>
                <View>
                  <Text style={styles.settingTitle}>Order Updates</Text>
                  <Text style={styles.settingSubtitle}>Get notified about order status</Text>
                </View>
              </View>
              <Switch
                value={notifications.orderUpdates}
                onValueChange={() => handleToggleNotification("orderUpdates")}
                trackColor={{ false: "#E0E0E0", true: theme.colors.primary + "40" }}
                thumbColor={notifications.orderUpdates ? theme.colors.primary : "#F5F5F5"}
                ios_backgroundColor="#E0E0E0"
              />
            </TouchableOpacity>

            <View style={styles.separator} />

            <TouchableOpacity 
              style={styles.settingItem}
              onPress={() => handleToggleNotification("sellerAlerts")}
              activeOpacity={0.7}
            >
              <View style={styles.settingLeft}>
                <View style={styles.settingIconContainer}>
                  <BuildingStorefrontIcon size={20} color={theme.colors.primary} />
                </View>
                <View>
                  <Text style={styles.settingTitle}>Seller Alerts</Text>
                  <Text style={styles.settingSubtitle}>Updates from your favorite sellers</Text>
                </View>
              </View>
              <Switch
                value={notifications.sellerAlerts}
                onValueChange={() => handleToggleNotification("sellerAlerts")}
                trackColor={{ false: "#E0E0E0", true: theme.colors.primary + "40" }}
                thumbColor={notifications.sellerAlerts ? theme.colors.primary : "#F5F5F5"}
                ios_backgroundColor="#E0E0E0"
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Account Section */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.settingsCard}>
            <View style={styles.infoItem}>
              <View style={styles.settingLeft}>
                <View style={styles.settingIconContainer}>
                  <PhoneIcon size={20} color={theme.colors.primary} />
                </View>
                <View>
                  <Text style={styles.settingTitle}>Phone Number</Text>
                  <Text style={styles.settingSubtitle}>{userInfo?.phoneNumber || ""}</Text>
                </View>
              </View>
            </View>

            <View style={styles.separator} />

            <View style={styles.infoItem}>
              <View style={styles.settingLeft}>
                <View style={styles.settingIconContainer}>
                  <UserIcon size={20} color={theme.colors.primary} />
                </View>
                <View>
                  <Text style={styles.settingTitle}>Account Type</Text>
                  <Text style={styles.settingSubtitle}>Customer</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Logout Section */}
        <View style={styles.logoutSection}>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            disabled={loadingLogout}
            activeOpacity={0.7}
          >
            {loadingLogout ? (
              <ActivityIndicator size="small" color="#E53935" />
            ) : (
              <>
                <ArrowRightOnRectangleIcon size={20} color="#E53935" />
                <Text style={styles.logoutText}>Logout</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Version */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>Version 1.0.0</Text>
        </View>
      </ScrollView>
      
      {/* Edit Profile Modal */}
      <Modal
        visible={isEditing}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsEditing(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <TouchableOpacity 
                onPress={() => setIsEditing(false)}
                style={styles.closeButton}
              >
                <XMarkIcon size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Profile Picture Section */}
              <View style={styles.modalImageSection}>
                <TouchableOpacity
                  style={styles.modalImageContainer}
                  onPress={handleImagePicker}
                  disabled={isUploadingImage}
                >
                  <Image
                    source={{ 
                      uri: editProfilePic || "https://via.placeholder.com/100?text=" + (editName?.charAt(0) || "U")
                    }}
                    style={styles.modalProfileImage}
                  />
                  <View style={styles.modalCameraOverlay}>
                    {isUploadingImage ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <CameraIcon size={20} color="#FFFFFF" />
                    )}
                  </View>
                </TouchableOpacity>
                <Text style={styles.imageHint}>Tap to change photo</Text>
              </View>
            
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Name *</Text>
                <TextInput
                  style={styles.input}
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="Enter your name"
                  placeholderTextColor={theme.colors.placeholder}
                />
              </View>
            
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Address</Text>
                <TextInput
                  style={[styles.input, styles.addressInput]}
                  value={editAddress}
                  onChangeText={setEditAddress}
                  placeholder="Enter your address"
                  placeholderTextColor={theme.colors.placeholder}
                  multiline
                  textAlignVertical="top"
                />
              </View>
            </ScrollView>
            
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.modalActionButton, styles.cancelButton]} 
                onPress={() => setIsEditing(false)}
                disabled={isSaving}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalActionButton, styles.saveButton, isSaving && styles.disabledButton]} 
                onPress={handleSaveProfile}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveButtonText}>Save Changes</Text>
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
    backgroundColor: "#F8F9FA",
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: Platform.OS === 'ios' ? 60 : spacing.xl,
    paddingBottom: spacing.lg,
    backgroundColor: "#FFFFFF",
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: theme.colors.text,
  },
  profileCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    borderRadius: 16,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  profileImageContainer: {
    position: "relative",
    marginBottom: spacing.lg,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#F5F5F5",
  },
  cameraButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: theme.colors.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  profileName: {
    fontSize: 24,
    fontWeight: "700",
    color: theme.colors.text,
    marginBottom: spacing.xs,
    textAlign: "center",
  },
  profilePhone: {
    fontSize: 16,
    color: theme.colors.placeholder,
    marginBottom: spacing.sm,
  },
  addressContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  profileAddress: {
    fontSize: 14,
    color: theme.colors.placeholder,
    marginLeft: spacing.xs,
    textAlign: "center",
  },
  editProfileButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.primary + "15",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 25,
  },
  editProfileButtonText: {
    color: theme.colors.primary,
    fontWeight: "600",
    marginLeft: spacing.xs,
  },
  settingsSection: {
    marginTop: spacing.lg,
    marginHorizontal: spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: theme.colors.text,
    marginBottom: spacing.md,
    marginLeft: spacing.sm,
  },
  settingsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.lg,
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  settingIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary + "15",
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.text,
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    color: theme.colors.placeholder,
  },
  infoItem: {
    padding: spacing.lg,
  },
  separator: {
    height: 1,
    backgroundColor: "#F0F0F0",
    marginLeft: spacing.lg + 40 + spacing.md,
  },
  logoutSection: {
    marginTop: spacing.lg,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: "#E53935",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  logoutText: {
    color: "#E53935",
    fontWeight: "600",
    fontSize: 16,
    marginLeft: spacing.sm,
  },
  versionContainer: {
    alignItems: "center",
    paddingBottom: spacing.xl,
  },
  versionText: {
    color: theme.colors.placeholder,
    fontSize: 14,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "90%",
    paddingBottom: Platform.OS === 'ios' ? 34 : spacing.lg,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: theme.colors.text,
  },
  closeButton: {
    padding: spacing.xs,
  },
  modalImageSection: {
    alignItems: "center",
    paddingVertical: spacing.lg,
  },
  modalImageContainer: {
    position: "relative",
    marginBottom: spacing.sm,
  },
  modalProfileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#F5F5F5",
  },
  modalCameraOverlay: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: theme.colors.primary,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  imageHint: {
    fontSize: 14,
    color: theme.colors.placeholder,
  },
  inputContainer: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.text,
    marginBottom: spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    padding: spacing.md,
    fontSize: 16,
    backgroundColor: "#FFFFFF",
    color: theme.colors.text,
  },
  addressInput: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  modalActions: {
    flexDirection: "row",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    gap: spacing.md,
  },
  modalActionButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 50,
  },
  cancelButton: {
    backgroundColor: "#F5F5F5",
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
  },
  cancelButtonText: {
    color: theme.colors.text,
    fontWeight: "600",
    fontSize: 16,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
  },
  disabledButton: {
    opacity: 0.7,
  },
})

export default ProfileScreen
