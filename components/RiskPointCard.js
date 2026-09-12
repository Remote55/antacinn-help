/**
 * การ์ดแสดงจุดเสี่ยงหนึ่งจุด ใช้ในหน้าแรก หน้าวางแผนเส้นทาง และแผงรายการบนแผนที่
 *
 * แสดง: ไอคอนประเภทอันตรายบนพื้นสีระดับความเสี่ยง ชื่อจุด อำเภอ ป้ายคะแนน ป้ายยืนยันข้อมูล
 * และระยะทาง (ถ้ามี) — ดูสีกรอบไอคอนก็รู้ระดับความเสี่ยงได้ทันทีโดยไม่ต้องอ่าน
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Card from './Card';
import Icon from './Icon';
import RiskBadge from './RiskBadge';
import VerificationBadge from './VerificationBadge';
import { hazardFor } from '../utils/hazards';
import { COLORS, TEXT, SPACING, RADIUS } from '../constants/theme';

export default function RiskPointCard({ point, distanceLabel, onPress, style }) {
  const hazard = hazardFor(point.type);

  return (
    <Card onPress={onPress} style={[styles.card, style]} accessibilityLabel={`${point.name} ${point.riskLevel.label}`}>
      <View style={styles.header}>
        <View style={[styles.iconTile, { backgroundColor: point.riskLevel.color }]}>
          <Icon name={hazard.icon} size={20} color={point.riskLevel.textColor} />
        </View>
        <View style={styles.titleBox}>
          <Text style={styles.name} numberOfLines={2}>
            {point.name}
          </Text>
          <Text style={styles.meta} numberOfLines={1}>
            {point.district} · {hazard.label}
          </Text>
        </View>
        {distanceLabel ? <Text style={styles.distance}>{distanceLabel}</Text> : null}
      </View>

      <View style={styles.footer}>
        <RiskBadge riskLevel={point.riskLevel} score={point.riskScore} hasStatistics={point.hasStatistics} />
        {/* บอกทุกจุดว่ายืนยันจากเอกสารทางการแล้วหรือยัง ไม่ให้เข้าใจผิดว่าเป็นสถิติทางการ */}
        <VerificationBadge verified={point.verified} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  iconTile: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleBox: {
    flex: 1,
    gap: 2,
  },
  name: {
    ...TEXT.h3,
    fontSize: 16,
    color: COLORS.text,
  },
  meta: {
    ...TEXT.small,
    color: COLORS.textMuted,
  },
  distance: {
    ...TEXT.smallStrong,
    color: COLORS.primary,
    backgroundColor: COLORS.primarySoft,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
    overflow: 'hidden',
  },
  footer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: SPACING.sm,
    // การ์ดยืดสูงเท่าใบอื่นในแถว (components/Grid.js) ป้ายจึงชิดล่างเสมอ
    marginTop: 'auto',
  },
});
