/**
 * ช่องกรอกข้อความพร้อมหัวข้อ ใช้ในฟอร์มบันทึกจุดเสี่ยง
 * ตอนพิมพ์อยู่ กรอบเปลี่ยนเป็นสีกรมท่า ให้รู้ว่ากำลังกรอกช่องไหน
 */

import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { COLORS, TEXT, RADIUS } from '../constants/theme';

export default function TextField({ label, required = false, value, onChangeText, placeholder, multiline = false }) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.field}>
      <Text style={styles.label}>
        {label}
        {required ? <Text style={styles.required}> *</Text> : null}
      </Text>
      <TextInput
        style={[styles.input, multiline && styles.multiline, isFocused && styles.focused]}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textMuted}
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
        accessibilityLabel={label}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: 6,
  },
  label: {
    ...TEXT.smallStrong,
    color: COLORS.text,
  },
  required: {
    color: COLORS.danger,
  },
  input: {
    ...TEXT.body,
    color: COLORS.text,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    outlineStyle: 'none',
  },
  multiline: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  focused: {
    borderColor: COLORS.primary,
    boxShadow: `0 0 0 3px ${COLORS.primarySoft}`,
  },
});
