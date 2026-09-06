/**
 * แถวชิปให้เลือกประเภทอันตราย
 *
 * ใช้ 2 ที่:
 *   - หน้าแผนที่: เลือกได้หลายอันพร้อมกัน เพื่อกรองหมุด
 *   - หน้าบันทึกจุด: ส่ง singleSelect เป็น true เพื่อให้เลือกได้ทีละอัน
 */

import React from 'react';
import { Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { HAZARD_TYPES } from '../constants/config';
import { COLORS, SPACING, FONT_SIZES, RADIUS } from '../constants/theme';

export default function FilterChips({ selectedIds, onChange, singleSelect = false }) {
  function toggle(typeId) {
    if (singleSelect) {
      onChange([typeId]);
      return;
    }

    if (selectedIds.includes(typeId)) {
      onChange(selectedIds.filter((id) => id !== typeId));
    } else {
      onChange([...selectedIds, typeId]);
    }
  }

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {HAZARD_TYPES.map((hazard) => {
        const isSelected = selectedIds.includes(hazard.id);
        return (
          <Pressable
            key={hazard.id}
            style={[styles.chip, isSelected && styles.chipSelected]}
            onPress={() => toggle(hazard.id)}
          >
            <Text style={[styles.label, isSelected && styles.labelSelected]}>
              {hazard.icon} {hazard.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  chip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  chipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  label: {
    fontSize: FONT_SIZES.body,
    color: COLORS.text,
  },
  labelSelected: {
    color: COLORS.white,
    fontWeight: '600',
  },
});
