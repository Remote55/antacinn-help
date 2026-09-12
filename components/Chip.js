/**
 * ชิปเลือกได้ (ตัวกรองประเภทอันตราย เส้นทางแนะนำ ความเร็วการจำลอง)
 * ตัวที่เลือกอยู่พื้นกรมท่า ตัวอื่นพื้นขาวขอบเทา
 */

import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import Icon from './Icon';
import { COLORS, TEXT, RADIUS } from '../constants/theme';

export default function Chip({ label, icon, selected = false, onPress, accessibilityLabel }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || label}
      accessibilityState={{ selected }}
      style={({ hovered }) => [styles.chip, selected ? styles.selected : hovered && styles.hovered]}
    >
      {icon ? <Icon name={icon} size={16} color={selected ? COLORS.white : COLORS.textSecondary} /> : null}
      <Text style={[styles.label, selected && styles.labelSelected]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    cursor: 'pointer',
  },
  hovered: {
    borderColor: COLORS.primary,
  },
  selected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  label: {
    ...TEXT.smallStrong,
    color: COLORS.textSecondary,
  },
  labelSelected: {
    color: COLORS.white,
  },
});
