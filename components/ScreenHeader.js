/**
 * หัวข้อสีกรมท่าด้านบนของแต่ละหน้า ตามม็อกอัพในเอกสาร
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING, FONT_SIZES } from '../constants/theme';

export default function ScreenHeader({ title, subtitle }) {
  return (
    <View style={styles.header}>
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
    gap: SPACING.xs,
  },
  title: {
    color: COLORS.white,
    fontSize: FONT_SIZES.heading,
    fontWeight: 'bold',
  },
  subtitle: {
    color: COLORS.white,
    fontSize: FONT_SIZES.body,
    opacity: 0.85,
  },
});
