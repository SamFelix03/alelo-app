import React from 'react'
import { View, Text, StyleSheet, Platform, StatusBar } from 'react-native'
import { theme, spacing, fontSize } from '../theme'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

interface SellerHeaderProps {
  title: string
  rightElement?: React.ReactNode
}

export const HEADER_HEIGHT = Platform.OS === 'ios' ? 100 : 80

const SellerHeader: React.FC<SellerHeaderProps> = ({ title, rightElement }) => {
  const insets = useSafeAreaInsets()
  
  return (
    <View style={[
      styles.container,
      {
        paddingTop: Math.max(insets.top, StatusBar.currentHeight || 0),
      }
    ]}>
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
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
  },
  rightElement: {
    flexDirection: 'row',
    alignItems: 'center',
  },
})

export default SellerHeader 