/**
 * ปุ่มมาตรฐานของแอป ทุกหน้าใช้ตัวนี้ ปุ่มจึงหน้าตาเหมือนกันทั้งแอป
 *
 *   variant   primary   ปุ่มหลักของหน้า พื้นกรมท่า
 *             secondary ปุ่มรอง ขอบกรมท่า
 *             ghost     ปุ่มข้อความ ไม่มีกรอบ (เช่น "ดูทั้งหมด")
 *             danger    ปุ่มอันตราย พื้นแดง (โทรฉุกเฉิน หยุดโหมดเดินทาง)
 *   size      sm / md / lg
 *   icon      ชื่อไอคอน Ionicons วางหน้าข้อความ
 *
 * บนเว็บเปลี่ยนสีเมื่อเอาเมาส์ชี้ (hovered มีเฉพาะบนเว็บ บนมือถือไม่มีค่า จึงใช้สีตอนกดแทน)
 */

import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import Icon from './Icon';
import { COLORS, TEXT, SPACING, RADIUS } from '../constants/theme';

const VARIANTS = {
  primary: { background: COLORS.primary, hover: COLORS.primaryHover, border: COLORS.primary, text: COLORS.white },
  secondary: { background: COLORS.card, hover: COLORS.primarySoft, border: COLORS.primary, text: COLORS.primary },
  ghost: { background: 'transparent', hover: COLORS.primarySoft, border: 'transparent', text: COLORS.primary },
  danger: { background: COLORS.danger, hover: COLORS.dangerDark, border: COLORS.danger, text: COLORS.white },
};

export default function Button({
  title,
  icon,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  style,
  accessibilityLabel,
}) {
  const colors = VARIANTS[variant] || VARIANTS.primary;
  const isSmall = size === 'sm';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityState={{ disabled }}
      style={({ pressed, hovered }) => [
        styles.base,
        size === 'lg' && styles.large,
        isSmall && styles.small,
        {
          backgroundColor: (pressed || hovered) && !disabled ? colors.hover : colors.background,
          borderColor: colors.border,
        },
        disabled && styles.disabled,
        style,
      ]}
    >
      {icon ? <Icon name={icon} size={isSmall ? 16 : 18} color={colors.text} /> : null}
      {title ? (
        <Text style={[styles.text, isSmall && styles.textSmall, { color: colors.text }]} numberOfLines={1}>
          {title}
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    minHeight: 44,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    cursor: 'pointer',
  },
  large: {
    minHeight: 52,
    paddingHorizontal: SPACING.lg,
  },
  small: {
    minHeight: 36,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  disabled: {
    opacity: 0.45,
    cursor: 'auto',
  },
  text: {
    ...TEXT.button,
  },
  textSmall: {
    ...TEXT.smallStrong,
  },
});
