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
import Icon from './Icon';
import { COLORS, TEXT, RADIUS } from '../constants/theme';

export default function VerificationBadge({ verified }) {
  if (verified) {
    return (
      <View style={[styles.badge, styles.verified]}>
        <Icon name="shield-checkmark" size={13} color={COLORS.primary} />
        <Text style={[styles.text, styles.verifiedText]}>ข้อมูลทางการ</Text>
      </View>
    );
  }
  return (
    <View style={[styles.badge, styles.unverified]}>
      <Icon name="alert-circle-outline" size={13} color={COLORS.textMuted} />
      <Text style={[styles.text, styles.unverifiedText]}>ยังไม่ยืนยัน</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
  },
  verified: {
    backgroundColor: COLORS.verifiedBackground,
  },
  unverified: {
    backgroundColor: COLORS.page,
  },
  text: {
    ...TEXT.caption,
    lineHeight: 18,
  },
  verifiedText: {
    color: COLORS.primary,
  },
  unverifiedText: {
    color: COLORS.textMuted,
  },
});
