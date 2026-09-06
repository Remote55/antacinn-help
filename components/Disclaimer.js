/**
 * แถบข้อความปฏิเสธความรับผิดชอบ
 *
 * ตามเอกสารข้อ 7.4: ต้องแสดงในหน้าหลักและหน้ารายละเอียด
 * เพื่อชี้แจงว่าแอปนี้เป็นเครื่องมือประกอบการตัดสินใจ ไม่ใช่ระบบเตือนภัยทางการ
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { DISCLAIMER_TEXT, UNVERIFIED_TEXT } from '../constants/config';
import { COLORS, SPACING, FONT_SIZES, RADIUS } from '../constants/theme';

/**
 * @param variant 'general' = ข้อความทั่วไป, 'unverified' = เตือนว่าจุดนี้ยังไม่ยืนยันแหล่งที่มา
 */
export default function Disclaimer({ variant = 'general' }) {
  const text = variant === 'unverified' ? UNVERIFIED_TEXT : DISCLAIMER_TEXT;

  return (
    <View style={styles.box}>
      <Text style={styles.text}>{text}</Text>
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
  text: {
    fontSize: FONT_SIZES.small,
    color: COLORS.text,
    lineHeight: 20,
  },
});
