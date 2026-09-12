/**
 * ช่องค้นหาพร้อมไอคอนแว่นขยายและปุ่มล้างคำค้น ใช้ในหน้าแรกและตัวเลือกสถานที่
 *
 * size = 'lg' ช่องใหญ่ในส่วนหัวของหน้าแรก
 * ตอนพิมพ์อยู่ กรอบเปลี่ยนเป็นสีกรมท่า (แทนกรอบสีฟ้าของเบราว์เซอร์ ผู้ใช้คีย์บอร์ดยังเห็นว่าอยู่ที่ช่องไหน)
 */

import React, { useState } from 'react';
import { View, TextInput, Pressable, StyleSheet } from 'react-native';
import Icon from './Icon';
import { COLORS, TEXT, SPACING, RADIUS, SHADOWS } from '../constants/theme';

export default function SearchBox({ value, onChangeText, placeholder, size = 'md', autoFocus = false, style }) {
  const [isFocused, setIsFocused] = useState(false);
  const isLarge = size === 'lg';

  return (
    <View style={[styles.box, isLarge && styles.boxLarge, isFocused && styles.boxFocused, style]}>
      <Icon name="search" size={isLarge ? 22 : 18} color={isFocused ? COLORS.primary : COLORS.textMuted} />
      <TextInput
        style={[styles.input, isLarge && styles.inputLarge]}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textMuted}
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        autoFocus={autoFocus}
        accessibilityLabel={placeholder}
        returnKeyType="search"
      />
      {value ? (
        <Pressable onPress={() => onChangeText('')} hitSlop={8} accessibilityRole="button" accessibilityLabel="ล้างคำค้นหา">
          <Icon name="close-circle" size={20} color={COLORS.textMuted} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    minHeight: 46,
  },
  boxLarge: {
    minHeight: 56,
    paddingHorizontal: SPACING.md,
    borderWidth: 2,
    borderColor: COLORS.card,
    ...SHADOWS.raised,
  },
  boxFocused: {
    borderColor: COLORS.primary,
  },
  input: {
    flex: 1,
    ...TEXT.body,
    color: COLORS.text,
    paddingVertical: SPACING.sm,
    // เว็บ: ไม่ต้องมีกรอบสีฟ้าซ้อนในช่อง กรอบของกล่องด้านนอกเปลี่ยนสีบอกแทนแล้ว
    outlineStyle: 'none',
  },
  inputLarge: {
    fontSize: 16,
  },
});
