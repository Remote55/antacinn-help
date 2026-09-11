/**
 * การ์ดสถานที่ยอดนิยม (เอกสารบทที่ 4)
 *
 * บอกว่ารอบสถานที่นี้มีจุดเสี่ยงกี่จุด และจุดที่อันตรายที่สุดอยู่ระดับไหน
 * ถ้าไม่มีจุดเสี่ยงในระบบ บอกว่า "ยังไม่มีข้อมูล" ไม่บอกว่าปลอดภัย
 * (เหตุผลเดียวกับที่ห้ามใช้สีเขียว: ไม่มีข้อมูล ไม่ได้แปลว่าปลอดภัย)
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import RiskBadge from './RiskBadge';
import { DISTANCE } from '../constants/config';
import { COLORS, SPACING, FONT_SIZES, RADIUS } from '../constants/theme';

const RADIUS_LABEL = `${DISTANCE.PLACE_RISK_RADIUS / 1000} กม.`;

/**
 * @param place สถานที่จาก usePlaces (มี risk แล้ว)
 * @param onShowMap กด "ดูบนแผนที่"
 * @param onNavigate กด "นำทางไปที่นี่"
 * @param style ใช้กำหนดความกว้างเมื่ออยู่ในแถวเลื่อนแนวนอน
 */
export default function PlaceCard({ place, onShowMap, onNavigate, style }) {
  const { count, highest } = place.risk;

  return (
    <View style={[styles.card, style]}>
      <View style={styles.header}>
        <Text style={styles.emoji}>{place.emoji}</Text>
        <View style={styles.titleBox}>
          <Text style={styles.name} numberOfLines={2}>
            {place.name}
          </Text>
          <Text style={styles.district}>{place.district}</Text>
        </View>
      </View>

      {count > 0 ? (
        <View style={styles.riskRow}>
          <Text style={styles.riskText}>
            จุดเสี่ยงรอบ {RADIUS_LABEL} {count} จุด · สูงสุด
          </Text>
          <RiskBadge riskLevel={highest.riskLevel} score={highest.riskScore} hasStatistics={highest.hasStatistics} />
        </View>
      ) : (
        <Text style={styles.noDataText}>ยังไม่มีข้อมูลจุดเสี่ยงในรัศมี {RADIUS_LABEL}</Text>
      )}

      <View style={styles.buttonRow}>
        <Pressable style={styles.secondaryButton} onPress={onShowMap} accessibilityRole="button">
          <Text style={styles.secondaryText}>🗺️ ดูบนแผนที่</Text>
        </Pressable>
        <Pressable style={styles.primaryButton} onPress={onNavigate} accessibilityRole="button">
          <Text style={styles.primaryText}>นำทางไปที่นี่</Text>
        </Pressable>
      </View>
    </View>
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
    gap: SPACING.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
  },
  emoji: {
    fontSize: FONT_SIZES.heading,
  },
  titleBox: {
    flex: 1,
  },
  name: {
    fontSize: FONT_SIZES.subtitle,
    fontWeight: '600',
    color: COLORS.text,
  },
  district: {
    fontSize: FONT_SIZES.small,
    color: COLORS.textMuted,
  },
  riskRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  riskText: {
    fontSize: FONT_SIZES.small,
    color: COLORS.text,
  },
  noDataText: {
    fontSize: FONT_SIZES.small,
    color: COLORS.textMuted,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  secondaryButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
  },
  secondaryText: {
    fontSize: FONT_SIZES.small,
    color: COLORS.primary,
    fontWeight: '600',
  },
  primaryButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
  },
  primaryText: {
    fontSize: FONT_SIZES.small,
    color: COLORS.white,
    fontWeight: '600',
  },
});
