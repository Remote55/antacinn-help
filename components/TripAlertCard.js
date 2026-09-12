/**
 * การ์ดเตือนตัวใหญ่ในโหมดเดินทาง
 *
 * ออกแบบให้อ่านได้ในหนึ่งวินาทีขณะขับขี่: ตัวอักษรใหญ่ สีตามระดับความเสี่ยง
 * ระยะที่แสดงคำนวณใหม่ทุกครั้งที่ตำแหน่งเปลี่ยน จึงนับถอยหลังจริง
 * (เดิมค้างที่ค่าตอนเริ่มเตือน ขยับเข้าใกล้แล้วตัวเลขไม่ลด)
 *
 * สีตัวอักษรมากับระดับความเสี่ยง (riskLevel.textColor): เข้มบนเหลืองและส้ม ขาวบนแดง
 * ไม่ลดความทึบของบรรทัดรอง เพราะจะทำให้คมชัดต่ำกว่าเกณฑ์ ใช้ขนาดตัวอักษรแบ่งลำดับความสำคัญแทน
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Icon from './Icon';
import { formatDistance, formatRiskLabel } from '../utils/format';
import { TEXT, SPACING, RADIUS, SHADOWS } from '../constants/theme';

export default function TripAlertCard({ point, liveDistanceM, onPress, onDismiss, style }) {
  const textColor = { color: point.riskLevel.textColor };

  return (
    <Pressable
      style={[styles.card, { backgroundColor: point.riskLevel.color }, style]}
      onPress={onPress}
      accessibilityRole="alert"
    >
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Icon name="warning" size={22} color={point.riskLevel.textColor} />
          <Text style={[styles.title, textColor]}>ระวัง!</Text>
        </View>
        <Text style={[styles.distance, textColor]}>อีก {formatDistance(liveDistanceM)}</Text>
        <Pressable onPress={onDismiss} hitSlop={12} accessibilityRole="button" accessibilityLabel="ปิดการเตือน">
          <Icon name="close" size={24} color={point.riskLevel.textColor} />
        </Pressable>
      </View>
      <Text style={[styles.name, textColor]}>{point.name}</Text>
      <Text style={[styles.meta, textColor]}>
        {formatRiskLabel(point.riskLevel, point.riskScore, point.hasStatistics)}
      </Text>
      <Text style={[styles.hint, textColor]}>แตะเพื่อดูรายละเอียด</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    gap: SPACING.xs,
    cursor: 'pointer',
    ...SHADOWS.raised,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  title: {
    ...TEXT.h3,
  },
  distance: {
    ...TEXT.alert,
  },
  name: {
    ...TEXT.h2,
  },
  meta: {
    ...TEXT.body,
  },
  hint: {
    ...TEXT.small,
  },
});
