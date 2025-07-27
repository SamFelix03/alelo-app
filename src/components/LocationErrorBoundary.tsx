import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { theme, spacing, fontSize } from '../theme';
import { MapPinIcon, ExclamationTriangleIcon } from "react-native-heroicons/outline"

interface LocationErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

interface LocationErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error | null; retry: () => void }>;
}

class LocationErrorBoundary extends React.Component<LocationErrorBoundaryProps, LocationErrorBoundaryState> {
  constructor(props: LocationErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): LocationErrorBoundaryState {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('LocationErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // Log error to crash reporting service if available
    // Example: Sentry.captureException(error, { extra: errorInfo });
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // Check if custom fallback is provided
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error} retry={this.handleRetry} />;
      }

      // Default fallback UI
      return (
        <View style={styles.container}>
          <View style={styles.errorContainer}>
            <MapPinIcon size={50} color={theme.colors.error} />
            <Text style={styles.errorTitle}>Location Service Error</Text>
            <Text style={styles.errorMessage}>
              We're having trouble with location services. This might be due to:
            </Text>
            
            <View style={styles.reasonsList}>
              <Text style={styles.reasonItem}>• Location permissions not granted</Text>
              <Text style={styles.reasonItem}>• Location services disabled</Text>
              <Text style={styles.reasonItem}>• Network connectivity issues</Text>
              <Text style={styles.reasonItem}>• Device location hardware issues</Text>
            </View>

            <TouchableOpacity style={styles.retryButton} onPress={this.handleRetry}>
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.settingsButton} 
              onPress={() => {
                Alert.alert(
                  'Location Settings',
                  'Please check your device location settings:\n\n1. Enable Location Services\n2. Grant location permission to this app\n3. Ensure you have a stable internet connection',
                  [{ text: 'OK' }]
                );
              }}
            >
              <Text style={styles.settingsButtonText}>Check Settings</Text>
            </TouchableOpacity>

            {__DEV__ && this.state.error && (
              <View style={styles.debugContainer}>
                <Text style={styles.debugTitle}>Debug Info (Dev Mode):</Text>
                <Text style={styles.debugText}>{this.state.error.toString()}</Text>
                {this.state.errorInfo && (
                  <Text style={styles.debugText}>{this.state.errorInfo.componentStack}</Text>
                )}
              </View>
            )}
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

// Default fallback component for location errors
export const DefaultLocationErrorFallback: React.FC<{ error: Error | null; retry: () => void }> = ({ error, retry }) => (
  <View style={styles.container}>
    <View style={styles.errorContainer}>
      <ExclamationTriangleIcon size={50} color={theme.colors.error} />
      <Text style={styles.errorTitle}>Location Unavailable</Text>
      <Text style={styles.errorMessage}>
        Unable to access location services. Please check your settings and try again.
      </Text>
      
      <TouchableOpacity style={styles.retryButton} onPress={retry}>
        <Text style={styles.retryButtonText}>Retry</Text>
      </TouchableOpacity>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: '#FFFFFF',
  },
  errorContainer: {
    alignItems: 'center',
    maxWidth: 300,
  },
  errorTitle: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: theme.colors.error,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: fontSize.md,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  reasonsList: {
    alignSelf: 'stretch',
    marginBottom: spacing.lg,
  },
  reasonItem: {
    fontSize: fontSize.sm,
    color: theme.colors.placeholder,
    marginBottom: spacing.xs,
    lineHeight: 18,
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.md,
    minWidth: 120,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: fontSize.md,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  settingsButton: {
    backgroundColor: 'transparent',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    minWidth: 120,
  },
  settingsButtonText: {
    color: theme.colors.primary,
    fontSize: fontSize.md,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  debugContainer: {
    marginTop: spacing.lg,
    padding: spacing.md,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    alignSelf: 'stretch',
  },
  debugTitle: {
    fontSize: fontSize.sm,
    fontWeight: 'bold',
    color: theme.colors.error,
    marginBottom: spacing.xs,
  },
  debugText: {
    fontSize: fontSize.xs,
    color: theme.colors.text,
    fontFamily: 'monospace',
    lineHeight: 16,
  },
});

export default LocationErrorBoundary; 