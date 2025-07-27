import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  Alert,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { XMarkIcon, BuildingOfficeIcon } from "react-native-heroicons/outline"
import { theme, spacing, fontSize } from '../theme';
import { LocationCoords } from '../lib/locationService';

interface LocationPickerProps {
  visible: boolean;
  onLocationSelected: (location: LocationCoords) => void;
  onCancel: () => void;
  initialLocation?: LocationCoords;
}

const LocationPicker: React.FC<LocationPickerProps> = ({
  visible,
  onLocationSelected,
  onCancel,
  initialLocation,
}) => {
  const [selectedLocation, setSelectedLocation] = useState<LocationCoords | null>(
    initialLocation || null
  );

  // Default to San Francisco if no initial location
  const defaultRegion: Region = {
    latitude: initialLocation?.latitude || 37.78825,
    longitude: initialLocation?.longitude || -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  };

  const [mapRegion, setMapRegion] = useState<Region>(defaultRegion);

  const handleMapPress = (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setSelectedLocation({ latitude, longitude });
  };

  const handleConfirm = () => {
    if (!selectedLocation) {
      Alert.alert('No Location Selected', 'Please tap on the map to select your location.');
      return;
    }

    onLocationSelected(selectedLocation);
  };

  const handleCancel = () => {
    setSelectedLocation(initialLocation || null);
    onCancel();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleCancel} style={styles.cancelButton}>
            <XMarkIcon size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Select Your Location</Text>
          <TouchableOpacity
            onPress={handleConfirm}
            style={[
              styles.confirmButton,
              !selectedLocation && styles.confirmButtonDisabled,
            ]}
            disabled={!selectedLocation}
          >
            <Text
              style={[
                styles.confirmButtonText,
                !selectedLocation && styles.confirmButtonTextDisabled,
              ]}
            >
              Confirm
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.instructionContainer}>
          <Text style={styles.instructionText}>
            Tap on the map to set your business location
          </Text>
        </View>

        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            provider={PROVIDER_GOOGLE}
            region={mapRegion}
            onRegionChangeComplete={setMapRegion}
            onPress={handleMapPress}
            showsUserLocation
            showsMyLocationButton
          >
            {selectedLocation && (
              <Marker
                coordinate={selectedLocation}
                title="Your Business Location"
                description="This is where customers will see you on the map"
              >
                <View style={styles.customMarker}>
                  <BuildingOfficeIcon size={24} color="#FFFFFF" />
                </View>
              </Marker>
            )}
          </MapView>
        </View>

        {selectedLocation && (
          <View style={styles.locationInfo}>
            <Text style={styles.locationInfoText}>
              Selected Location: {selectedLocation.latitude.toFixed(6)}, {selectedLocation.longitude.toFixed(6)}
            </Text>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  cancelButton: {
    padding: spacing.sm,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: theme.colors.text,
  },
  confirmButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
  },
  confirmButtonDisabled: {
    backgroundColor: '#D1D1D1',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: fontSize.md,
  },
  confirmButtonTextDisabled: {
    color: '#999999',
  },
  instructionContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: '#F5F5F5',
  },
  instructionText: {
    fontSize: fontSize.md,
    color: theme.colors.secondary,
    textAlign: 'center',
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  customMarker: {
    backgroundColor: theme.colors.primary,
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  locationInfo: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: '#F5F5F5',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  locationInfoText: {
    fontSize: fontSize.sm,
    color: theme.colors.secondary,
    textAlign: 'center',
  },
});

export default LocationPicker; 