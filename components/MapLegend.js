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
import { COLORS, TEXT, SPACING, RADIUS, SHADOWS } from '../constants/theme';

export default function MapLegend({ style }) {
  return (
    <View style={[styles.legend, style]}>
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
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.card,
    ...SHADOWS.raised,
    pointerEvents: 'none',
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 12,
    rowGap: SPACING.xs,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: COLORS.white,
    boxShadow: '0 0 0 1px rgba(16, 24, 40, 0.15)',
  },
  // พื้นเทาเป็นกลาง เพราะหมุดทางการมีได้ทุกสี จุดที่ต้องสังเกตคือขอบ
  officialDot: {
    borderWidth: 3,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.border,
  },
  label: {
    ...TEXT.caption,
    color: COLORS.text,
  },
});
