/**
 * การ์ดแสดงจุดเสี่ยงหนึ่งจุด ใช้ในหน้าแรกและหน้าวางแผนเส้นทาง
 *
 * แสดง: ไอคอนประเภท ชื่อจุด อำเภอ ป้ายคะแนน และระยะทาง (ถ้ามี)
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import RiskBadge from './RiskBadge';
import VerificationBadge from './VerificationBadge';
import { HAZARD_TYPES } from '../constants/config';
import { COLORS, SPACING, FONT_SIZES, RADIUS } from '../constants/theme';

/** หาไอคอนและป้ายชื่อของประเภทอันตราย */
function getHazardInfo(typeId) {
  return HAZARD_TYPES.find((h) => h.id === typeId) || { icon: '📍', label: 'ไม่ระบุ' };
}

export default function RiskPointCard({ point, distanceLabel, onPress }) {
  const hazard = getHazardInfo(point.type);

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={onPress}
    >
      <View style={styles.header}>
        <Text style={styles.icon}>{hazard.icon}</Text>
        <Text style={styles.name} numberOfLines={2}>
          {point.name}
        </Text>
        {distanceLabel && <Text style={styles.distance}>{distanceLabel}</Text>}
      </View>

      <Text style={styles.meta}>
        {point.district} · {hazard.label}
      </Text>

      <View style={styles.footer}>
        <RiskBadge riskLevel={point.riskLevel} score={point.riskScore} />
        {/* บอกทุกจุดว่ายืนยันจากเอกสารทางการแล้วหรือยัง ไม่ให้เข้าใจผิดว่าเป็นสถิติทางการ */}
        <VerificationBadge verified={point.verified} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    gap: SPACING.xs,
  },
  cardPressed: {
    backgroundColor: COLORS.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
  },
  icon: {
    fontSize: FONT_SIZES.title,
  },
  name: {
    flex: 1,
    fontSize: FONT_SIZES.subtitle,
    fontWeight: '600',
    color: COLORS.text,
  },
  distance: {
    fontSize: FONT_SIZES.small,
    color: COLORS.textMuted,
  },
  meta: {
    fontSize: FONT_SIZES.small,
    color: COLORS.textMuted,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  },
});
