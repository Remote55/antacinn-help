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
import { formatDistance, formatRiskLabel } from '../utils/format';
import { SPACING, FONT_SIZES, RADIUS } from '../constants/theme';

export default function TripAlertCard({ point, liveDistanceM, onPress, onDismiss }) {
  const textColor = { color: point.riskLevel.textColor };

  return (
    <Pressable style={[styles.card, { backgroundColor: point.riskLevel.color }]} onPress={onPress}>
      <View style={styles.header}>
        <Text style={[styles.title, textColor]}>⚠️ ระวัง!</Text>
        <Text style={[styles.distance, textColor]}>อีก {formatDistance(liveDistanceM)}</Text>
        <Pressable onPress={onDismiss} hitSlop={12} accessibilityLabel="ปิดการเตือน">
          <Text style={[styles.close, textColor]}>✕</Text>
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
    fontSize: FONT_SIZES.subtitle,
    fontWeight: 'bold',
  },
  distance: {
    fontSize: FONT_SIZES.alert,
    fontWeight: 'bold',
  },
  close: {
    fontSize: FONT_SIZES.title,
  },
  name: {
    fontSize: FONT_SIZES.title,
    fontWeight: '600',
  },
  meta: {
    fontSize: FONT_SIZES.body,
  },
  hint: {
    fontSize: FONT_SIZES.small,
  },
});
