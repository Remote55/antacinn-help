/**
 * แถบข้อความกำกับ
 *
 * ตามเอกสารข้อ 7.4: ต้องแสดงข้อความปฏิเสธความรับผิดชอบในหน้าหลักและหน้ารายละเอียด
 * เพื่อชี้แจงว่าแอปนี้เป็นเครื่องมือประกอบการตัดสินใจ ไม่ใช่ระบบเตือนภัยทางการ
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from './Icon';
import { DISCLAIMER_TEXT, UNVERIFIED_TEXT, VERIFIED_TEXT } from '../constants/config';
import { COLORS, TEXT, SPACING, RADIUS } from '../constants/theme';

const VARIANTS = {
  general: { text: DISCLAIMER_TEXT, icon: 'information-circle-outline', iconColor: COLORS.caution, box: 'warning' },
  unverified: { text: UNVERIFIED_TEXT, icon: 'alert-circle-outline', iconColor: COLORS.caution, box: 'warning' },
  verified: { text: VERIFIED_TEXT, icon: 'shield-checkmark-outline', iconColor: COLORS.primary, box: 'verified' },
};

/**
 * @param variant 'general'    = ข้อความปฏิเสธความรับผิดชอบทั่วไป
 *                'unverified' = เตือนว่าจุดนี้ยังไม่ยืนยันแหล่งที่มา
 *                'verified'   = บอกว่าจุดนี้มาจากเอกสารทางการ (สีฟ้า ไม่ใช่สีเตือน)
 */
export default function Disclaimer({ variant = 'general', style }) {
  const config = VARIANTS[variant] || VARIANTS.general;

  return (
    <View style={[styles.box, config.box === 'verified' ? styles.verifiedBox : styles.warningBox, style]}>
      <Icon name={config.icon} size={18} color={config.iconColor} style={styles.icon} />
      <Text style={styles.text}>{config.text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    padding: 12,
  },
  warningBox: {
    backgroundColor: COLORS.warningBackground,
    borderColor: COLORS.warningBorder,
  },
  verifiedBox: {
    backgroundColor: COLORS.verifiedBackground,
    borderColor: '#BBDEFB',
  },
  icon: {
    marginTop: 1,
  },
  text: {
    flex: 1,
    ...TEXT.small,
    color: COLORS.text,
  },
});
