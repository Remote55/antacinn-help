/**
 * ป้ายสีแสดงระดับความเสี่ยง เช่น "เสี่ยง · 43"
 *
 * ใช้ซ้ำทุกที่ที่ต้องแสดงคะแนน เพื่อให้หน้าตาเหมือนกันทั้งแอป
 * สีตัวอักษรมากับระดับความเสี่ยง (riskLevel.textColor) ให้อ่านออกบนพื้นทุกสี
 * จุดที่ยังไม่มีสถิติ (hasStatistics = false) แสดง "ยังไม่มีสถิติ" แทนเลข 0
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { formatRiskLabel } from '../utils/format';
import { TEXT, SPACING, RADIUS } from '../constants/theme';

export default function RiskBadge({ riskLevel, score, hasStatistics = true, size = 'normal' }) {
  const isLarge = size === 'large';

  return (
    <View style={[styles.badge, { backgroundColor: riskLevel.color }, isLarge && styles.badgeLarge]}>
      <Text style={[isLarge ? styles.textLarge : styles.text, { color: riskLevel.textColor }]} numberOfLines={1}>
        {formatRiskLabel(riskLevel, score, hasStatistics)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
  },
  badgeLarge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
  },
  text: {
    ...TEXT.caption,
    lineHeight: 18,
  },
  textLarge: {
    ...TEXT.bodyStrong,
  },
});
