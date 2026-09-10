/**
 * แถบบอกจุดเสี่ยงถัดไปบนเส้นทาง (เอกสารบทที่ 5.2 "อีก 4.2 กิโลเมตรข้างหน้าจะถึงจุดเสี่ยง")
 *
 * แสดงเฉพาะเมื่อเริ่มโหมดเดินทางจากหน้าวางแผนเส้นทาง
 * @param status ผลจาก describeRouteStatus ใน utils/routeProgress.js
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { formatDistance } from '../utils/format';
import { COLORS, SPACING, FONT_SIZES, RADIUS } from '../constants/theme';

export default function NextRiskPanel({ status }) {
  if (!status) return null;

  if (status.kind === 'offRoute') {
    return (
      <View style={[styles.panel, styles.warning]}>
        <Text style={styles.text}>
          ออกนอกเส้นทางที่วางแผนไว้ {formatDistance(status.offRouteM)} กำลังเตือนด้วยระยะเส้นตรงแทน
        </Text>
      </View>
    );
  }

  if (status.kind === 'done') {
    return (
      <View style={styles.panel}>
        <Text style={styles.text}>ผ่านจุดเสี่ยงบนเส้นทางครบแล้ว</Text>
      </View>
    );
  }

  return (
    <View style={styles.panel}>
      <Text style={styles.label}>จุดเสี่ยงถัดไป</Text>
      <Text style={styles.name} numberOfLines={1}>
        {status.point.name}
      </Text>
      <Text style={styles.distance}>อีก {formatDistance(status.remainingM)} ตามเส้นทาง</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    marginHorizontal: SPACING.md,
    marginTop: SPACING.sm,
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  warning: {
    backgroundColor: COLORS.warningBackground,
    borderColor: COLORS.warningBorder,
  },
  label: {
    fontSize: FONT_SIZES.small,
    color: COLORS.textMuted,
  },
  name: {
    fontSize: FONT_SIZES.subtitle,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  distance: {
    fontSize: FONT_SIZES.body,
    color: COLORS.primary,
    fontWeight: '600',
  },
  text: {
    fontSize: FONT_SIZES.body,
    color: COLORS.text,
  },
});
