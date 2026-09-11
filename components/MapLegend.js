/**
 * คำอธิบายสัญลักษณ์บนหน้าแผนที่
 *
 * ผู้ใช้ครั้งแรกไม่รู้ว่าสีหมุดหมายถึงอะไร และหมุดขอบน้ำเงินต่างจากหมุดขอบขาวอย่างไร
 * สีดึงจาก RISK_LEVELS ตัวเดียวกับที่ใช้วาดหมุด เปลี่ยนสีระดับความเสี่ยงเมื่อไร คำอธิบายเปลี่ยนตามเอง
 * กล่องนี้ไม่รับการแตะ (pointerEvents: 'none') ผู้ใช้ลากแผนที่ผ่านกล่องได้
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { RISK_LEVELS } from '../constants/config';
import { COLORS, SPACING, FONT_SIZES, RADIUS } from '../constants/theme';

export default function MapLegend() {
  return (
    <View style={styles.legend}>
      <View style={styles.row}>
        {RISK_LEVELS.map((level) => (
          <View key={level.id} style={styles.item}>
            <View style={[styles.dot, { backgroundColor: level.color }]} />
            <Text style={styles.label}>{level.label}</Text>
          </View>
        ))}
      </View>
      <View style={styles.item}>
        <View style={[styles.dot, styles.officialDot]} />
        <Text style={styles.label}>ขอบน้ำเงิน = ข้อมูลทางการ</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  legend: {
    position: 'absolute',
    left: SPACING.md,
    bottom: SPACING.lg,
    maxWidth: '75%',
    gap: SPACING.xs,
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
    pointerEvents: 'none',
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: SPACING.sm,
    rowGap: SPACING.xs,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  // พื้นเทาเป็นกลาง เพราะหมุดทางการมีได้ทุกสี จุดที่ต้องสังเกตคือขอบ
  officialDot: {
    borderWidth: 3,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.border,
  },
  label: {
    fontSize: FONT_SIZES.small,
    color: COLORS.text,
  },
});
