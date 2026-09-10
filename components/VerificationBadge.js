/**
 * ป้ายบอกว่าข้อมูลจุดนี้ยืนยันจากเอกสารทางการแล้วหรือยัง
 *
 * เอกสารบทที่ 6.2 กำหนดว่าข้อมูลที่ยืนยันแล้วต้อง "แสดงสัญลักษณ์ที่แตกต่างกัน"
 * ใช้ทั้งในการ์ดจุดเสี่ยงและหน้ารายละเอียด ให้หน้าตาเหมือนกันทั้งแอป
 *
 * จงใจไม่ใช้สีเขียวกับป้าย "ข้อมูลทางการ" เพราะสีเขียวสื่อว่าปลอดภัย
 * ข้อมูลทางการแปลว่า "เชื่อถือได้" ไม่ได้แปลว่าปลอดภัย
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING, FONT_SIZES, RADIUS } from '../constants/theme';

export default function VerificationBadge({ verified }) {
  if (verified) {
    return (
      <View style={styles.verifiedBox}>
        <Text style={styles.verifiedText}>✓ ข้อมูลทางการ</Text>
      </View>
    );
  }
  return <Text style={styles.unverifiedText}>⚠️ ยังไม่ยืนยัน</Text>;
}

const styles = StyleSheet.create({
  verifiedBox: {
    backgroundColor: COLORS.verifiedBackground,
    borderRadius: RADIUS.pill,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
  },
  verifiedText: {
    fontSize: FONT_SIZES.small,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  unverifiedText: {
    fontSize: FONT_SIZES.small,
    color: COLORS.textMuted,
  },
});
