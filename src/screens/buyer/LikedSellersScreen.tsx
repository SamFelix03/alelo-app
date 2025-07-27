"use client"

import { useState, useEffect, useCallback } from "react"
import { 
  View, 
  StyleSheet, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  Image, 
  SafeAreaView, 
  ActivityIndicator,
  Platform,
  RefreshControl,
  Alert
} from "react-native"
import { useNavigation, useFocusEffect } from "@react-navigation/native"
import { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { theme, spacing, fontSize } from "../../theme"
import { StarIcon, HeartIcon, MapPinIcon } from "react-native-heroicons/outline"
import { HeartIcon as HeartSolid } from "react-native-heroicons/solid"
import { useAuth } from "../../context/AuthContext"
import { supabase } from "../../lib/supabase"

// Type definitions for the navigation and data
type RootStackParamList = {
  SellerProfile: { seller: Seller };
};

type LikedSellersScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface Seller {
  seller_id: string;
  name: string;
  logo_url: string | null;
  address: string | null;
  latitude: number;
  longitude: number;
  distance?: number; // in meters
  is_open: boolean;
  rating?: number;
  liked_at: string; // When the seller was liked
}

const LikedSellersScreen = () => {
  const navigation = useNavigation<LikedSellersScreenNavigationProp>()
  const { userInfo } = useAuth()

  const [likedSellers, setLikedSellers] = useState<Seller[]>([])
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  // Fetch liked sellers when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchLikedSellers()
    }, [])
  )

  const fetchLikedSellers = async (isRefresh: boolean = false) => {
    if (!userInfo?.profileData?.buyer_id) return

    if (isRefresh) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }

    try {
      // First, get the liked seller IDs for this buyer
      const { data: likedData, error: likedError } = await supabase
        .from('buyer_liked_sellers')
        .select('seller_id, created_at')
        .eq('buyer_id', userInfo.profileData.buyer_id)
        .order('created_at', { ascending: false })

      if (likedError) {
        console.error('Error fetching liked sellers:', likedError)
        Alert.alert('Error', 'Failed to fetch liked sellers. Please try again.')
        return
      }

      if (!likedData || likedData.length === 0) {
        setLikedSellers([])
        return
      }

      // Get the full seller details for each liked seller
      const sellerIds = likedData.map(item => item.seller_id)
      
      const { data: sellersData, error: sellersError } = await supabase
        .from('sellers')
        .select(`
          seller_id,
          name,
          logo_url,
          address,
          is_open,
          current_location
        `)
        .in('seller_id', sellerIds)

      if (sellersError) {
        console.error('Error fetching seller details:', sellersError)
        Alert.alert('Error', 'Failed to fetch seller details. Please try again.')
        return
      }

      // Combine liked data with seller details
      const likedSellersWithDetails: Seller[] = (sellersData || []).map((seller: any) => {
        const likedInfo = likedData.find(liked => liked.seller_id === seller.seller_id)
        
        // Extract coordinates from PostGIS geography if available
        let latitude = 37.78825 // Default latitude
        let longitude = -122.4324 // Default longitude
        
        if (seller.current_location) {
          // Parse PostGIS geography format if needed
          // For now, use default coordinates
        }

        return {
          seller_id: seller.seller_id,
          name: seller.name,
          logo_url: seller.logo_url,
          address: seller.address,
          latitude,
          longitude,
          is_open: seller.is_open,
          rating: 4.5, // Default rating for now
          liked_at: likedInfo?.created_at || ''
        }
      })

      // Sort by most recently liked
      likedSellersWithDetails.sort((a, b) => 
        new Date(b.liked_at).getTime() - new Date(a.liked_at).getTime()
      )

      setLikedSellers(likedSellersWithDetails)
      console.log(`Found ${likedSellersWithDetails.length} liked sellers`)
    } catch (error) {
      console.error('Error fetching liked sellers:', error)
      Alert.alert('Error', 'Failed to fetch liked sellers.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = () => {
    fetchLikedSellers(true)
  }

  const toggleLike = async (sellerId: string) => {
    if (!userInfo?.profileData?.buyer_id) return

    try {
      // Remove from liked sellers
      const { error } = await supabase
        .from('buyer_liked_sellers')
        .delete()
        .eq('buyer_id', userInfo.profileData.buyer_id)
        .eq('seller_id', sellerId)

      if (error) {
        console.error('Error unliking seller:', error)
        Alert.alert('Error', 'Failed to unlike seller. Please try again.')
        return
      }

      // Remove from local state
      setLikedSellers(prev => prev.filter(seller => seller.seller_id !== sellerId))
    } catch (error) {
      console.error('Error unliking seller:', error)
      Alert.alert('Error', 'Failed to unlike seller.')
    }
  }

  const navigateToSellerProfile = (seller: Seller) => {
    // @ts-ignore - Navigation type issue, will be fixed with proper navigation types
    navigation.navigate("SellerProfile", { seller })
  }

  const formatLikedDate = (dateString: string): string => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

    if (diffInDays === 0) {
      return "Liked today"
    } else if (diffInDays === 1) {
      return "Liked yesterday"
    } else if (diffInDays < 7) {
      return `Liked ${diffInDays} days ago`
    } else {
      return `Liked on ${date.toLocaleDateString()}`
    }
  }

  const renderSellerItem = ({ item }: { item: Seller }) => (
    <View style={styles.sellerCard}>
      <Image 
        source={{ 
          uri: item.logo_url || `https://via.placeholder.com/60?text=${item.name.charAt(0)}` 
        }} 
        style={styles.sellerLogo} 
        accessibilityLabel={`${item.name} logo`} 
      />

      <View style={styles.sellerInfo}>
        <Text style={styles.sellerName}>{item.name}</Text>

        <View style={styles.sellerMetaRow}>
          {item.rating && (
            <View style={styles.ratingContainer}>
              <StarIcon size={14} color="#FFD700" />
              <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
            </View>
          )}
        </View>

        {item.address && (
          <Text style={styles.sellerAddress} numberOfLines={1}>{item.address}</Text>
        )}

        <Text style={styles.likedDate}>{formatLikedDate(item.liked_at)}</Text>

        <View style={[styles.statusBadge, item.is_open ? styles.openBadge : styles.closedBadge]}>
          <Text style={[styles.statusText, item.is_open ? styles.openText : styles.closedText]}>
            {item.is_open ? "Open" : "Closed"}
          </Text>
        </View>
      </View>

      <View style={styles.sellerActions}>
        <TouchableOpacity
          style={styles.likeButton}
          onPress={() => toggleLike(item.seller_id)}
          accessibilityLabel={`Unlike ${item.name}`}
        >
          <HeartIcon size={24} color={theme.colors.error} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.viewMenuButton, !item.is_open && styles.viewMenuButtonDisabled]}
          onPress={() => navigateToSellerProfile(item)}
          disabled={!item.is_open}
          accessibilityLabel={`View ${item.name} menu`}
        >
          <Text style={[styles.viewMenuText, !item.is_open && styles.viewMenuTextDisabled]}>
            View Shop
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  )

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <HeartIcon size={50} color={theme.colors.disabled} />
      <Text style={styles.emptyText}>No liked vendors yet</Text>
      <Text style={styles.emptySubtext}>
        Start exploring and like your favorite vendors to see them here
      </Text>
    </View>
  )

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Liked Vendors</Text>
        <Text style={styles.subtitle}>
          {likedSellers.length} vendor{likedSellers.length !== 1 ? 's' : ''} liked
        </Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading liked vendors...</Text>
        </View>
      ) : likedSellers.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={likedSellers}
          renderItem={renderSellerItem}
          keyExtractor={(item) => item.seller_id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[theme.colors.primary]}
              tintColor={theme.colors.primary}
              title="Pull to refresh"
              titleColor={theme.colors.placeholder}
            />
          }
        />
      )}
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
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
    paddingTop: Platform.OS === 'ios' ? 60 : spacing.xl,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: theme.colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: theme.colors.placeholder,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: fontSize.md,
    color: theme.colors.placeholder,
  },
  listContent: {
    padding: spacing.md,
  },
  sellerCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sellerLogo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: spacing.md,
    backgroundColor: "#F5F5F5",
  },
  sellerInfo: {
    flex: 1,
    justifyContent: "center",
  },
  sellerName: {
    fontSize: fontSize.lg,
    fontWeight: "bold",
    marginBottom: spacing.xs,
  },
  sellerMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  ratingText: {
    fontSize: fontSize.sm,
    marginLeft: 2,
  },
  sellerAddress: {
    fontSize: fontSize.xs,
    color: theme.colors.placeholder,
    marginBottom: spacing.xs,
  },
  likedDate: {
    fontSize: fontSize.xs,
    color: theme.colors.primary,
    marginBottom: spacing.xs,
    fontWeight: "500",
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: "flex-start",
  },
  openBadge: {
    backgroundColor: "#E8F5E9",
  },
  closedBadge: {
    backgroundColor: "#FFEBEE",
  },
  statusText: {
    fontSize: fontSize.xs,
    fontWeight: "bold",
  },
  openText: {
    color: theme.colors.primary,
  },
  closedText: {
    color: theme.colors.error,
  },
  sellerActions: {
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  likeButton: {
    marginBottom: spacing.md,
  },
  viewMenuButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
  },
  viewMenuButtonDisabled: {
    backgroundColor: theme.colors.disabled,
  },
  viewMenuText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: fontSize.sm,
  },
  viewMenuTextDisabled: {
    color: "#FFFFFF",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  emptyText: {
    fontSize: fontSize.lg,
    fontWeight: "bold",
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  emptySubtext: {
    fontSize: fontSize.md,
    color: theme.colors.placeholder,
    textAlign: "center",
    lineHeight: 22,
  },
})

export default LikedSellersScreen
