import { useState, useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import { Platform } from 'react-native';
import { 
  LocationCoords, 
  LocationError, 
  getCurrentLocation, 
  startLocationTracking,
  updateSellerLocation,
  updateBuyerLocation,
  getNearbySellersByLocation,
  isLocationServicesEnabled,
  requestLocationPermission,
  getSellerLastLocation,
  getBuyerLastLocation,
  storeLocationPreference
} from '../lib/locationService';

interface UseLocationReturn {
  currentLocation: LocationCoords | null;
  isLoading: boolean;
  error: LocationError | null;
  hasPermission: boolean;
  isManualLocation: boolean;
  startTracking: () => Promise<void>;
  stopTracking: () => void;
  refreshLocation: () => Promise<void>;
  setManualLocation: (location: LocationCoords) => void;
  loadSavedLocation: (userId: string, userType?: 'buyer' | 'seller') => Promise<void>;
  updateLocation: (userId: string, userType?: 'buyer' | 'seller') => Promise<boolean>;
  getNearbySellersByLocation: (radiusKm?: number) => Promise<any[]>;
  checkPermissions: () => Promise<void>;
}

export const useLocation = (): UseLocationReturn => {
  const [currentLocation, setCurrentLocation] = useState<LocationCoords | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<LocationError | null>(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [isManualLocation, setIsManualLocation] = useState(false);
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);
  const isCheckingPermissions = useRef(false);

  // Check permissions and get initial location on mount
  useEffect(() => {
    const initializeLocation = async () => {
      await checkPermissions();
    };
    
    initializeLocation();
    
    // Cleanup on unmount
    return () => {
      stopTracking();
    };
  }, []);

  const checkPermissions = async (): Promise<void> => {
    if (isCheckingPermissions.current) {
      return; // Prevent concurrent permission checks
    }
    
    isCheckingPermissions.current = true;
    
    try {
      const servicesEnabled = await isLocationServicesEnabled();
      if (!servicesEnabled) {
        setError({ 
          code: 'SERVICES_DISABLED', 
          message: 'Location services are disabled. Please enable location services in your device settings.' 
        });
        setHasPermission(false);
        return;
      }

      const permissionResult = await requestLocationPermission();
      setHasPermission(permissionResult.granted);
      
      if (!permissionResult.granted) {
        setError({ 
          code: 'PERMISSION_DENIED', 
          message: permissionResult.error || 'Location permission denied' 
        });
      } else {
        setError(null);
      }
    } catch (err) {
      console.error('Error checking permissions:', err);
      setError({ code: 'PERMISSION_ERROR', message: 'Failed to check location permissions' });
      setHasPermission(false);
    } finally {
      isCheckingPermissions.current = false;
    }
  };

  const loadSavedLocation = async (userId: string, userType: 'buyer' | 'seller' = 'seller'): Promise<void> => {
    try {
      console.log(`Loading saved location for ${userType}:`, userId);
      
      let savedLocation: LocationCoords | null = null;
      
      if (userType === 'buyer') {
        savedLocation = await getBuyerLastLocation(userId);
      } else {
        savedLocation = await getSellerLastLocation(userId);
      }
      
      if (savedLocation) {
        setCurrentLocation(savedLocation);
        setIsManualLocation(true); // Assume saved location is manual unless GPS updates it
        setError(null);
        console.log(`Loaded saved ${userType} location:`, savedLocation);
      } else {
        console.log(`No saved location found for ${userType}`);
      }
    } catch (error) {
      console.error('Error loading saved location:', error);
      setError({ code: 'LOAD_ERROR', message: 'Failed to load saved location' });
    }
  };

  const refreshLocation = async (): Promise<void> => {
    if (!hasPermission) {
      await checkPermissions();
      if (!hasPermission) {
        return;
      }
    }

    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Refreshing location...');
      const location = await getCurrentLocation(1);
      
      if (location) {
        setCurrentLocation(location);
        setIsManualLocation(false); // Reset manual flag when we get GPS location
        console.log('Location refreshed successfully:', location);
      } else {
        console.log('Location refresh failed, no location returned');
        setError({ 
          code: 'LOCATION_UNAVAILABLE', 
          message: 'Unable to get current location. You can set your location manually instead.' 
        });
      }
    } catch (err) {
      console.error('Error in refreshLocation:', err);
      setError({ 
        code: 'LOCATION_ERROR', 
        message: 'Failed to get location. You can set your location manually instead.' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const setManualLocation = (location: LocationCoords): void => {
    setCurrentLocation(location);
    setIsManualLocation(true);
    setError(null);
    console.log('Manual location set:', location);
  };

  const startTracking = async (): Promise<void> => {
    if (!hasPermission) {
      await checkPermissions();
      if (!hasPermission) {
        return;
      }
    }

    // If we have a manual location, don't start GPS tracking
    if (isManualLocation && currentLocation) {
      console.log('Using manual location, skipping GPS tracking');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('Starting location tracking...');
      const subscription = await startLocationTracking(
        (location: LocationCoords) => {
          setCurrentLocation(location);
          setIsManualLocation(false);
          setError(null); // Clear any previous errors
          console.log('Location updated from tracking:', location);
        },
        (error: LocationError) => {
          console.error('Location tracking error:', error);
          setError(error);
        }
      );

      if (subscription) {
        locationSubscription.current = subscription;
        console.log('Location tracking started successfully');
      } else {
        setError({ code: 'TRACKING_FAILED', message: 'Failed to start location tracking' });
      }
    } catch (err) {
      console.error('Error in startTracking:', err);
      setError({ code: 'TRACKING_ERROR', message: 'Error starting location tracking' });
    } finally {
      setIsLoading(false);
    }
  };

  const stopTracking = (): void => {
    if (locationSubscription.current) {
      try {
        locationSubscription.current.remove();
        locationSubscription.current = null;
        console.log('Location tracking stopped');
      } catch (error) {
        console.error('Error stopping location tracking:', error);
      }
    }
  };

  const updateLocation = async (userId: string, userType: 'buyer' | 'seller' = 'seller'): Promise<boolean> => {
    if (!currentLocation) {
      setError({ code: 'NO_LOCATION', message: 'No current location available' });
      return false;
    }

    try {
      // Store location preference along with the location (only for sellers for now)
      if (userType === 'seller') {
        await storeLocationPreference(userId, isManualLocation, currentLocation);
      }
      
      let success: boolean;
      
      if (userType === 'buyer') {
        success = await updateBuyerLocation(userId, currentLocation);
      } else {
        success = await updateSellerLocation(userId, currentLocation);
      }
      
      if (!success) {
        setError({ code: 'UPDATE_FAILED', message: 'Failed to update location in database' });
      } else {
        console.log(`Successfully updated ${userType} location in database`);
      }
      
      return success;
    } catch (err) {
      console.error('Error updating location:', err);
      setError({ code: 'UPDATE_ERROR', message: 'Error updating location' });
      return false;
    }
  };

  const getNearbySellersByLocationHook = async (radiusKm: number = 5): Promise<any[]> => {
    if (!currentLocation) {
      setError({ code: 'NO_LOCATION', message: 'No current location available' });
      return [];
    }

    try {
      const sellers = await getNearbySellersByLocation(currentLocation, radiusKm);
      return sellers;
    } catch (err) {
      console.error('Error fetching nearby sellers:', err);
      setError({ code: 'FETCH_ERROR', message: 'Error fetching nearby sellers' });
      return [];
    }
  };

  return {
    currentLocation,
    isLoading,
    error,
    hasPermission,
    isManualLocation,
    startTracking,
    stopTracking,
    refreshLocation,
    setManualLocation,
    loadSavedLocation,
    updateLocation,
    getNearbySellersByLocation: getNearbySellersByLocationHook,
    checkPermissions,
  };
}; 