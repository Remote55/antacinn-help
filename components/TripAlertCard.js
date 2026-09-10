/**
 * การ์ดเตือนตัวใหญ่ในโหมดเดินทาง
 *
 * ออกแบบให้อ่านได้ในหนึ่งวินาทีขณะขับขี่: ตัวอักษรใหญ่ สีตามระดับความเสี่ยง
 * ระยะที่แสดงคำนวณใหม่ทุกครั้งที่ตำแหน่งเปลี่ยน จึงนับถอยหลังจริง
 * (เดิมค้างที่ค่าตอนเริ่มเตือน ขยับเข้าใกล้แล้วตัวเลขไม่ลด)
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { formatDistance } from '../utils/format';
import { COLORS, SPACING, FONT_SIZES, RADIUS } from '../constants/theme';

export default function TripAlertCard({ point, liveDistanceM, onPress, onDismiss }) {
  return (
    <Pressable style={[styles.card, { backgroundColor: point.riskLevel.color }]} onPress={onPress}>
      <View style={styles.header}>
        <Text style={styles.title}>⚠️ ระวัง!</Text>
        <Text style={styles.distance}>อีก {formatDistance(liveDistanceM)}</Text>
        <Pressable onPress={onDismiss} hitSlop={12} accessibilityLabel="ปิดการเตือน">
          <Text style={styles.close}>✕</Text>
        </Pressable>
      </View>
      <Text style={styles.name}>{point.name}</Text>
      <Text style={styles.meta}>
        {point.riskLevel.label} · {point.riskScore}
      </Text>
      <Text style={styles.hint}>แตะเพื่อดูรายละเอียด</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    margin: SPACING.md,
    marginBottom: 0,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    gap: SPACING.xs,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    color: COLORS.white,
    fontSize: FONT_SIZES.subtitle,
    fontWeight: 'bold',
  },
  distance: {
    color: COLORS.white,
    fontSize: FONT_SIZES.alert,
    fontWeight: 'bold',
  },
  close: {
    color: COLORS.white,
    fontSize: FONT_SIZES.title,
  },
  name: {
    color: COLORS.white,
    fontSize: FONT_SIZES.title,
    fontWeight: '600',
  },
  meta: {
    color: COLORS.white,
    fontSize: FONT_SIZES.body,
    opacity: 0.9,
  },
  hint: {
    color: COLORS.white,
    fontSize: FONT_SIZES.small,
    opacity: 0.8,
  },
});
