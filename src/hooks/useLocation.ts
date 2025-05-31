import { useState, useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import { 
  LocationCoords, 
  LocationError, 
  getCurrentLocation, 
  startLocationTracking,
  updateSellerLocation,
  getNearbySellersByLocation 
} from '../lib/locationService';

interface UseLocationReturn {
  currentLocation: LocationCoords | null;
  isLoading: boolean;
  error: LocationError | null;
  startTracking: () => Promise<void>;
  stopTracking: () => void;
  refreshLocation: () => Promise<void>;
  updateLocation: (sellerId: string) => Promise<boolean>;
  getNearbySellersByLocation: (radiusKm?: number) => Promise<any[]>;
}

export const useLocation = (): UseLocationReturn => {
  const [currentLocation, setCurrentLocation] = useState<LocationCoords | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<LocationError | null>(null);
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);

  // Get initial location on mount
  useEffect(() => {
    refreshLocation();
    
    // Cleanup on unmount
    return () => {
      stopTracking();
    };
  }, []);

  const refreshLocation = async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const location = await getCurrentLocation();
      if (location) {
        setCurrentLocation(location);
      } else {
        setError({ code: 'LOCATION_UNAVAILABLE', message: 'Unable to get current location' });
      }
    } catch (err) {
      setError({ code: 'LOCATION_ERROR', message: 'Failed to get location' });
    } finally {
      setIsLoading(false);
    }
  };

  const startTracking = async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const subscription = await startLocationTracking(
        (location: LocationCoords) => {
          setCurrentLocation(location);
        },
        (error: LocationError) => {
          setError(error);
        }
      );

      if (subscription) {
        locationSubscription.current = subscription;
      } else {
        setError({ code: 'TRACKING_FAILED', message: 'Failed to start location tracking' });
      }
    } catch (err) {
      setError({ code: 'TRACKING_ERROR', message: 'Error starting location tracking' });
    } finally {
      setIsLoading(false);
    }
  };

  const stopTracking = (): void => {
    if (locationSubscription.current) {
      locationSubscription.current.remove();
      locationSubscription.current = null;
    }
  };

  const updateLocation = async (sellerId: string): Promise<boolean> => {
    if (!currentLocation) {
      setError({ code: 'NO_LOCATION', message: 'No current location available' });
      return false;
    }

    try {
      const success = await updateSellerLocation(sellerId, currentLocation);
      if (!success) {
        setError({ code: 'UPDATE_FAILED', message: 'Failed to update location in database' });
      }
      return success;
    } catch (err) {
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
      setError({ code: 'FETCH_ERROR', message: 'Error fetching nearby sellers' });
      return [];
    }
  };

  return {
    currentLocation,
    isLoading,
    error,
    startTracking,
    stopTracking,
    refreshLocation,
    updateLocation,
    getNearbySellersByLocation: getNearbySellersByLocationHook,
  };
}; 