/**
 * กล่องการ์ดพื้นขาว มุมโค้ง มีเงาอ่อน ใช้เป็นพื้นของเนื้อหาทุกก้อนในแอป
 *
 * ส่ง onPress มา = การ์ดกดได้ บนเว็บยกขึ้นเล็กน้อยเมื่อเอาเมาส์ชี้ ให้รู้ว่ากดได้
 * padded = false สำหรับการ์ดที่จัดระยะภายในเอง (เช่น การ์ดที่มีแผนที่เต็มกรอบ)
 */

import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../constants/theme';

export default function Card({ children, onPress, style, padded = true, accessibilityLabel }) {
  if (!onPress) {
    return <View style={[styles.card, padded && styles.padded, style]}>{children}</View>;
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed, hovered }) => [
        styles.card,
        padded && styles.padded,
        styles.pressable,
        hovered && styles.hovered,
        pressed && styles.pressed,
        style,
      ]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card,
  },
  padded: {
    padding: SPACING.md,
  },
  pressable: {
    cursor: 'pointer',
  },
  hovered: {
    borderColor: '#CBD3DE',
    ...SHADOWS.raised,
  },
  pressed: {
    backgroundColor: COLORS.cardHover,
  },
});
