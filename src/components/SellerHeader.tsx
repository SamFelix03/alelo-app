import React from 'react'
import { View, Text, StyleSheet, Platform, StatusBar, TouchableOpacity } from 'react-native'
import { theme, spacing, fontSize } from '../theme'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'

interface SellerHeaderProps {
  title: string
  rightElement?: React.ReactNode
  onBack?: () => void
}

export const HEADER_HEIGHT = Platform.OS === 'ios' ? 100 : 80

const SellerHeader: React.FC<SellerHeaderProps> = ({ title, rightElement, onBack }) => {
  const insets = useSafeAreaInsets()
  
  return (
    <View style={[
      styles.container,
      {
        paddingTop: Math.max(insets.top, StatusBar.currentHeight || 0),
      }
    ]}>
      <View style={styles.content}>
        {onBack && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
        )}
        <Text style={[styles.title, onBack && styles.titleWithBack]}>{title}</Text>
        {rightElement && (
          <View style={styles.rightElement}>
            {rightElement}
          </View>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.text,
    flex: 1,
  },
  titleWithBack: {
    marginLeft: spacing.md,
  },
  rightElement: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: spacing.xs,
    marginLeft: -spacing.xs,
  },
})

export default SellerHeader 