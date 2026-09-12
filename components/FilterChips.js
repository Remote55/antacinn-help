/**
 * แถวชิปให้เลือกประเภทอันตราย
 *
 * ใช้ 2 ที่:
 *   - หน้าแผนที่: เลือกได้หลายอันพร้อมกัน เพื่อกรองหมุด
 *   - หน้าบันทึกจุด: ส่ง singleSelect เป็น true เพื่อให้เลือกได้ทีละอัน
 *
 * wrap = true  เรียงหลายบรรทัด (แผงข้างบนจอกว้าง ฟอร์มบันทึก)
 * wrap = false เลื่อนแนวนอนบรรทัดเดียว (มือถือ ประหยัดที่บนจอ)
 */

import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import Chip from './Chip';
import { HAZARD_TYPES } from '../constants/config';
import { SPACING } from '../constants/theme';

export default function FilterChips({ selectedIds, onChange, singleSelect = false, wrap = false, style }) {
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

  const chips = HAZARD_TYPES.map((hazard) => (
    <Chip
      key={hazard.id}
      label={hazard.label}
      icon={hazard.icon}
      selected={selectedIds.includes(hazard.id)}
      onPress={() => toggle(hazard.id)}
    />
  ));

  if (wrap) {
    return <View style={[styles.wrapRow, style]}>{chips}</View>;
  }

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.scrollRow, style]}>
      {chips}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrapRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  scrollRow: {
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
});
