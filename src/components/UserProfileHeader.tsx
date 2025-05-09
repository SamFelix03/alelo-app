import React from 'react';
import { View, StyleSheet, Text, Image, TouchableOpacity } from 'react-native';
import { theme, spacing, fontSize } from '../theme';
import { useAuth } from '../context/AuthContext';

interface UserProfileHeaderProps {
  onProfilePress?: () => void;
}

const UserProfileHeader: React.FC<UserProfileHeaderProps> = ({ onProfilePress }) => {
  const { userInfo } = useAuth();
  
  // Determine image source based on user type
  const profileImageUrl = userInfo?.userType === 'buyer' 
    ? userInfo?.profileData?.profile_pic_url 
    : userInfo?.profileData?.logo_url;
  
  // Get user name
  const userName = userInfo?.profileData?.name || '';
  
  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onProfilePress}
      activeOpacity={0.8}
    >
      <View style={styles.greeting}>
        <Text style={styles.welcomeText}>{getGreeting()}</Text>
        <Text style={styles.nameText}>{userName}</Text>
      </View>
      
      <Image
        source={{ uri: profileImageUrl || 'https://via.placeholder.com/40' }}
        style={styles.profileImage}
        accessibilityLabel="User profile image"
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    backgroundColor: '#FFFFFF',
  },
  greeting: {
    flex: 1,
  },
  welcomeText: {
    fontSize: fontSize.sm,
    color: theme.colors.placeholder,
  },
  nameText: {
    fontSize: fontSize.md,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
});

export default UserProfileHeader; 