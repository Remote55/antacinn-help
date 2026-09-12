/**
 * ช่องต้นทางและปลายทางของหน้าวางแผนเส้นทาง
 *
 * กดที่ช่องไหน หน้าจอจะเปิดรายการสถานที่ให้เลือกสำหรับช่องนั้น
 * ปุ่มลูกศรขึ้นลงสลับต้นทางกับปลายทาง (ขากลับ)
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Icon from './Icon';
import { COLORS, TEXT, SPACING, RADIUS } from '../constants/theme';

function EndpointRow({ label, icon, iconColor, endpoint, isActive, isLocating, onPress }) {
  let text = 'แตะเพื่อเลือก';
  if (isLocating) text = 'กำลังหาตำแหน่งของคุณ...';
  else if (endpoint) text = endpoint.emoji ? `${endpoint.emoji} ${endpoint.name}` : endpoint.name;

  return (
    <Pressable
      style={({ hovered }) => [styles.row, isActive ? styles.rowActive : hovered && styles.rowHovered]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${text}`}
    >
      <Icon name={icon} size={18} color={iconColor} />
      <View style={styles.rowText}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowValue} numberOfLines={1}>
          {text}
        </Text>
      </View>
      <Icon name="chevron-down" size={16} color={COLORS.textMuted} />
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
  style,
}) {
  return (
    <View style={[styles.box, style]}>
      <View style={styles.rows}>
        <EndpointRow
          label="ต้นทาง"
          icon="radio-button-on"
          iconColor={COLORS.userLocation}
          endpoint={origin}
          isActive={activeTarget === 'origin'}
          isLocating={isLocating}
          onPress={onPressOrigin}
        />
        <EndpointRow
          label="ปลายทาง"
          icon="location"
          iconColor={COLORS.danger}
          endpoint={destination}
          isActive={activeTarget === 'destination'}
          onPress={onPressDestination}
        />
      </View>
      <Pressable
        style={({ hovered }) => [styles.swapButton, hovered && styles.rowHovered]}
        onPress={onSwap}
        accessibilityRole="button"
        accessibilityLabel="สลับต้นทางกับปลายทาง"
      >
        <Icon name="swap-vertical" size={20} color={COLORS.primary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  rows: {
    flex: 1,
    gap: SPACING.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.card,
    cursor: 'pointer',
  },
  rowHovered: {
    borderColor: '#CBD3DE',
    backgroundColor: COLORS.cardHover,
  },
  rowActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primarySoft,
  },
  rowText: {
    flex: 1,
  },
  rowLabel: {
    ...TEXT.caption,
    color: COLORS.textMuted,
  },
  rowValue: {
    ...TEXT.bodyStrong,
    color: COLORS.text,
  },
  swapButton: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
});
