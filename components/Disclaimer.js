/**
 * แถบข้อความกำกับ
 *
 * ตามเอกสารข้อ 7.4: ต้องแสดงข้อความปฏิเสธความรับผิดชอบในหน้าหลักและหน้ารายละเอียด
 * เพื่อชี้แจงว่าแอปนี้เป็นเครื่องมือประกอบการตัดสินใจ ไม่ใช่ระบบเตือนภัยทางการ
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { DISCLAIMER_TEXT, UNVERIFIED_TEXT, VERIFIED_TEXT } from '../constants/config';
import { COLORS, SPACING, FONT_SIZES, RADIUS } from '../constants/theme';

const TEXTS = {
  general: DISCLAIMER_TEXT,
  unverified: UNVERIFIED_TEXT,
  verified: '✓ ' + VERIFIED_TEXT,
};

/**
 * @param variant 'general'    = ข้อความปฏิเสธความรับผิดชอบทั่วไป
 *                'unverified' = เตือนว่าจุดนี้ยังไม่ยืนยันแหล่งที่มา
 *                'verified'   = บอกว่าจุดนี้มาจากเอกสารทางการ (สีฟ้า ไม่ใช่สีเตือน)
 */
export default function Disclaimer({ variant = 'general' }) {
  return (
    <View style={[styles.box, variant === 'verified' && styles.verifiedBox]}>
      <Text style={styles.text}>{TEXTS[variant] || DISCLAIMER_TEXT}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: COLORS.warningBackground,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.warningBorder,
    borderRadius: RADIUS.sm,
    padding: SPACING.md,
    marginVertical: SPACING.sm,
  },
  verifiedBox: {
    backgroundColor: COLORS.verifiedBackground,
    borderLeftColor: COLORS.primary,
  },
  text: {
    fontSize: FONT_SIZES.small,
    color: COLORS.text,
    lineHeight: 20,
  },
});
