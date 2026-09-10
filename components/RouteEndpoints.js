/**
 * แถบต้นทางและปลายทางของหน้าวางแผนเส้นทาง
 *
 * กดที่ช่องไหน หน้าจอจะเปิดรายการสถานที่ให้เลือกสำหรับช่องนั้น
 * ปุ่ม ⇅ สลับต้นทางกับปลายทาง (ขากลับ)
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { COLORS, SPACING, FONT_SIZES, RADIUS } from '../constants/theme';

function EndpointRow({ label, endpoint, isActive, isLocating, onPress }) {
  let text = 'แตะเพื่อเลือก';
  if (isLocating) text = 'กำลังหาตำแหน่งของคุณ...';
  else if (endpoint) text = `${endpoint.emoji || '📌'} ${endpoint.name}`;

  return (
    <Pressable
      style={[styles.row, isActive && styles.rowActive]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${text}`}
    >
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue} numberOfLines={1}>
        {text}
      </Text>
    </Pressable>
  );
}

/**
 * @param activeTarget 'origin' | 'destination' | null ช่องที่กำลังเลือกอยู่ (ไฮไลต์ไว้)
 * @param isLocating กำลังหาตำแหน่ง GPS เพื่อใช้เป็นต้นทาง
 */
export default function RouteEndpoints({
  origin,
  destination,
  activeTarget,
  isLocating,
  onPressOrigin,
  onPressDestination,
  onSwap,
}) {
  return (
    <View style={styles.box}>
      <View style={styles.rows}>
        <EndpointRow
          label="ต้นทาง"
          endpoint={origin}
          isActive={activeTarget === 'origin'}
          isLocating={isLocating}
          onPress={onPressOrigin}
        />
        <EndpointRow
          label="ปลายทาง"
          endpoint={destination}
          isActive={activeTarget === 'destination'}
          onPress={onPressDestination}
        />
      </View>
      <Pressable
        style={styles.swapButton}
        onPress={onSwap}
        accessibilityRole="button"
        accessibilityLabel="สลับต้นทางกับปลายทาง"
      >
        <Text style={styles.swapText}>⇅</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
  },
  rows: {
    flex: 1,
    gap: SPACING.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.surface,
  },
  rowActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.background,
  },
  rowLabel: {
    width: 56,
    fontSize: FONT_SIZES.small,
    color: COLORS.textMuted,
  },
  rowValue: {
    flex: 1,
    fontSize: FONT_SIZES.body,
    color: COLORS.text,
    fontWeight: '600',
  },
  swapButton: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swapText: {
    fontSize: FONT_SIZES.title,
    color: COLORS.primary,
  },
});
