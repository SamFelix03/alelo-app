import * as Location from 'expo-location';
import { supabase } from './supabase';

export interface LocationCoords {
  latitude: number;
  longitude: number;
}

export interface LocationError {
  code: string;
  message: string;
}

// Check if location services are enabled
export const isLocationServicesEnabled = async (): Promise<boolean> => {
  try {
    const enabled = await Location.hasServicesEnabledAsync();
    return enabled;
  } catch (error) {
    console.error('Error checking location services:', error);
    return false;
  }
};

// Request location permissions with better error handling
export const requestLocationPermission = async (): Promise<{ granted: boolean; error?: string }> => {
  try {
    // First check if location services are enabled
    const servicesEnabled = await isLocationServicesEnabled();
    if (!servicesEnabled) {
      return { 
        granted: false, 
        error: 'Location services are disabled. Please enable location services in your device settings.' 
      };
    }

    // Check current permission status
    const { status: existingStatus } = await Location.getForegroundPermissionsAsync();
    
    if (existingStatus === 'granted') {
      return { granted: true };
    }

    // Request permission if not already granted
    const { status } = await Location.requestForegroundPermissionsAsync();
    
    if (status !== 'granted') {
      return { 
        granted: false, 
        error: 'Location permission was denied. Please enable location access in your device settings to use this feature.' 
      };
    }
    
    return { granted: true };
  } catch (error) {
    console.error('Error requesting location permission:', error);
    return { 
      granted: false, 
      error: 'Failed to request location permission. Please try again.' 
    };
  }
};

// Get current location with improved error handling and retry limits
export const getCurrentLocation = async (maxRetries: number = 1): Promise<LocationCoords | null> => {
  console.log(`Getting location - single attempt with short timeout`);
  
  try {
    const permissionResult = await requestLocationPermission();
    if (!permissionResult.granted) {
      console.log('Location permission not granted:', permissionResult.error);
      return null;
    }

    try {
      // Try to get location with a very short timeout
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced, // Use balanced for faster response
        timeInterval: 5000, // Very short 5 second timeout
        distanceInterval: 1,
      });

      console.log(`Successfully got location quickly`);
      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
    } catch (locationError) {
      console.log(`Location failed quickly:`, locationError);
      return null;
    }
  } catch (error) {
    console.error('Error getting current location:', error);
    return null;
  }
};

// Start watching location for sellers with improved error handling
export const startLocationTracking = async (
  onLocationUpdate: (location: LocationCoords) => void,
  onError?: (error: LocationError) => void
): Promise<Location.LocationSubscription | null> => {
  try {
    const permissionResult = await requestLocationPermission();
    if (!permissionResult.granted) {
      onError?.({ 
        code: 'PERMISSION_DENIED', 
        message: permissionResult.error || 'Location permission denied' 
      });
      return null;
    }

    const subscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Balanced, // Use balanced for better battery life
        timeInterval: 30000, // Update every 30 seconds
        distanceInterval: 50, // Update when moved 50 meters
      },
      (location: Location.LocationObject) => {
        onLocationUpdate({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      }
    );

    return subscription;
  } catch (error) {
    console.error('Error starting location tracking:', error);
    onError?.({ code: 'TRACKING_ERROR', message: 'Failed to start location tracking' });
    return null;
  }
};

// Get seller's last known location from database
export const getSellerLastLocation = async (sellerId: string): Promise<LocationCoords | null> => {
  try {
    // Use RPC function to properly extract coordinates from PostGIS geography
    const { data, error } = await supabase
      .rpc('get_seller_location', {
        seller_uuid: sellerId
      });

    if (error) {
      console.error('Error fetching seller location:', error);
      return null;
    }

    if (data && data.length > 0) {
      const location = {
        latitude: data[0].latitude,
        longitude: data[0].longitude
      };
      console.log('Successfully retrieved saved location:', location);
      return location;
    }

    console.log('No location found in database for seller:', sellerId);
    return null;
  } catch (error) {
    console.error('Error in getSellerLastLocation:', error);
    return null;
  }
};

// Store seller location preference (manual vs GPS) in local storage
export const storeLocationPreference = async (sellerId: string, isManual: boolean, location: LocationCoords): Promise<void> => {
  try {
    // Store in database
    await updateSellerLocation(sellerId, location);
    
    // Also store preference locally for faster access
    const locationData = {
      sellerId,
      location,
      isManual,
      timestamp: new Date().toISOString()
    };
    
    // In a real app, you might use AsyncStorage here
    console.log('Stored location preference:', locationData);
  } catch (error) {
    console.error('Error storing location preference:', error);
  }
};

// Update seller location in database
export const updateSellerLocation = async (
  sellerId: string,
  location: LocationCoords
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('sellers')
      .update({
        current_location: `POINT(${location.longitude} ${location.latitude})`,
        updated_at: new Date().toISOString(),
      })
      .eq('seller_id', sellerId);

    if (error) {
      console.error('Error updating seller location:', error);
      return false;
    }

    // Also add to location history
    await supabase
      .from('seller_location_history')
      .insert({
        seller_id: sellerId,
        location: `POINT(${location.longitude} ${location.latitude})`,
        timestamp: new Date().toISOString(),
      });

    console.log('Successfully updated seller location in database:', location);
    return true;
  } catch (error) {
    console.error('Error updating seller location:', error);
    return false;
  }
};

// Get nearby sellers for buyers
export const getNearbySellersByLocation = async (
  buyerLocation: LocationCoords,
  radiusKm: number = 5
): Promise<any[]> => {
  try {
    // Use the PostGIS function to find nearby sellers
    const { data, error } = await supabase
      .rpc('find_nearby_sellers', {
        buyer_lat: buyerLocation.latitude,
        buyer_lng: buyerLocation.longitude,
        radius_km: radiusKm
      });

    if (error) {
      console.error('Error fetching nearby sellers:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getNearbySellersByLocation:', error);
    return [];
  }
};

// Calculate distance between two points
export const calculateDistance = (
  point1: LocationCoords,
  point2: LocationCoords
): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (point2.latitude - point1.latitude) * Math.PI / 180;
  const dLon = (point2.longitude - point1.longitude) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(point1.latitude * Math.PI / 180) * Math.cos(point2.latitude * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  return Math.round(distance * 100) / 100; // Round to 2 decimal places
};

// Format distance for display
export const formatDistance = (distanceKm: number): string => {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)}m`;
  }
  return `${distanceKm}km`;
};

// Get nearby customers who need items that overlap with seller's available stock
export const getNearbyCustomersWithNeeds = async (
  sellerLocation: LocationCoords,
  sellerId: string,
  radiusMeters: number = 500
): Promise<any[]> => {
  try {
    // First, get the seller's available products
    const { data: sellerProducts, error: productsError } = await supabase
      .from('products')
      .select('name')
      .eq('seller_id', sellerId)
      .eq('is_available', true);

    if (productsError) {
      console.error('Error fetching seller products:', productsError);
      return [];
    }

    if (!sellerProducts || sellerProducts.length === 0) {
      console.log('No available products for seller');
      return [];
    }

    // Get product names that the seller has
    const sellerProductNames = sellerProducts.map(p => p.name);
    console.log('Seller has products:', sellerProductNames);

    // Find nearby buyers who have orders with items matching seller's product names
    const { data: nearbyCustomers, error: customersError } = await supabase
      .rpc('find_nearby_customers_with_needs', {
        seller_lat: sellerLocation.latitude,
        seller_lng: sellerLocation.longitude,
        radius_meters: radiusMeters,
        seller_product_names: sellerProductNames
      });

    if (customersError) {
      console.error('Error fetching nearby customers:', customersError);
      return [];
    }

    return nearbyCustomers || [];
  } catch (error) {
    console.error('Error in getNearbyCustomersWithNeeds:', error);
    return [];
  }
};

// Get all nearby customers (within radius) regardless of needs
export const getAllNearbyCustomers = async (
  sellerLocation: LocationCoords,
  radiusMeters: number = 500
): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .rpc('find_nearby_customers', {
        seller_lat: sellerLocation.latitude,
        seller_lng: sellerLocation.longitude,
        radius_meters: radiusMeters
      });

    if (error) {
      console.error('Error fetching nearby customers:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getAllNearbyCustomers:', error);
    return [];
  }
};

// Update buyer location in database
export const updateBuyerLocation = async (
  buyerId: string,
  location: LocationCoords
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('buyers')
      .update({
        current_location: `POINT(${location.longitude} ${location.latitude})`,
        updated_at: new Date().toISOString(),
      })
      .eq('buyer_id', buyerId);

    if (error) {
      console.error('Error updating buyer location:', error);
      return false;
    }

    console.log('Successfully updated buyer location in database:', location);
    return true;
  } catch (error) {
    console.error('Error updating buyer location:', error);
    return false;
  }
};

// Get buyer's last known location from database
export const getBuyerLastLocation = async (buyerId: string): Promise<LocationCoords | null> => {
  try {
    // Use RPC function to properly extract coordinates from PostGIS geography
    const { data, error } = await supabase
      .rpc('get_buyer_location', {
        buyer_uuid: buyerId
      });

    if (error) {
      console.error('Error fetching buyer location:', error);
      return null;
    }

    if (data && data.length > 0) {
      const location = {
        latitude: data[0].latitude,
        longitude: data[0].longitude
      };
      console.log('Successfully retrieved buyer saved location:', location);
      return location;
    }

    console.log('No location found in database for buyer:', buyerId);
    return null;
  } catch (error) {
    console.error('Error in getBuyerLastLocation:', error);
    return null;
  }
}; 