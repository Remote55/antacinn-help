/**
 * แถบบอกจุดเสี่ยงถัดไปบนเส้นทาง (เอกสารบทที่ 5.2 "อีก 4.2 กิโลเมตรข้างหน้าจะถึงจุดเสี่ยง")
 *
 * แสดงเฉพาะเมื่อเริ่มโหมดเดินทางจากหน้าวางแผนเส้นทาง
 * @param status ผลจาก describeRouteStatus ใน utils/routeProgress.js
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from './Icon';
import { formatDistance } from '../utils/format';
import { COLORS, TEXT, SPACING, RADIUS } from '../constants/theme';

export default function NextRiskPanel({ status, style }) {
  if (!status) return null;

  if (status.kind === 'offRoute') {
    return (
      <View style={[styles.panel, styles.warning, style]}>
        <Icon name="git-branch-outline" size={20} color={COLORS.caution} />
        <Text style={styles.text}>
          ออกนอกเส้นทางที่วางแผนไว้ {formatDistance(status.offRouteM)} กำลังเตือนด้วยระยะเส้นตรงแทน
        </Text>
      </View>
    );
  }

  if (status.kind === 'done') {
    return (
      <View style={[styles.panel, style]}>
        <Icon name="flag-outline" size={20} color={COLORS.primary} />
        <Text style={styles.text}>ผ่านจุดเสี่ยงบนเส้นทางครบแล้ว</Text>
      </View>
    );
  }

  return (
    <View style={[styles.panel, style]}>
      <Icon name="arrow-up-circle-outline" size={22} color={COLORS.primary} />
      <View style={styles.textBox}>
        <Text style={styles.label}>จุดเสี่ยงถัดไป</Text>
        <Text style={styles.name} numberOfLines={1}>
          {status.point.name}
        </Text>
      </View>
      <Text style={styles.distance}>อีก {formatDistance(status.remainingM)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  warning: {
    backgroundColor: COLORS.warningBackground,
    borderColor: COLORS.warningBorder,
  },
  textBox: {
    flex: 1,
  },
  label: {
    ...TEXT.caption,
    color: COLORS.textMuted,
  },
  name: {
    ...TEXT.bodyStrong,
    color: COLORS.text,
  },
  distance: {
    ...TEXT.bodyStrong,
    color: COLORS.primary,
    marginLeft: SPACING.sm,
  },
  text: {
    flex: 1,
    ...TEXT.body,
    color: COLORS.text,
  },
});
