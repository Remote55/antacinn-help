/**
 * แถวจุดเสี่ยงในแผงรายการข้างแผนที่ (จอกว้าง)
 *
 * กดครั้งแรก = เลือกจุด แผนที่เลื่อนไปที่จุดนั้น แถวเปลี่ยนเป็นสีกรมท่าอ่อนและมีปุ่ม "ดูรายละเอียด"
 * กดแถวที่เลือกอยู่แล้วซ้ำ = เปิดหน้ารายละเอียด (เหมือนกดปุ่ม)
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Icon from './Icon';
import Button from './Button';
import RiskBadge from './RiskBadge';
import VerificationBadge from './VerificationBadge';
import { hazardFor } from '../utils/hazards';
import { COLORS, TEXT, SPACING, RADIUS } from '../constants/theme';

export default function PointListItem({ point, isSelected, onSelect, onOpenDetail }) {
  const hazard = hazardFor(point.type);

  return (
    <Pressable
      onPress={isSelected ? onOpenDetail : onSelect}
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
      accessibilityLabel={`${point.name} ${point.riskLevel.label}`}
      style={({ hovered }) => [styles.item, isSelected ? styles.selected : hovered && styles.hovered]}
    >
      <View style={styles.row}>
        <View style={[styles.iconTile, { backgroundColor: point.riskLevel.color }]}>
          <Icon name={hazard.icon} size={18} color={point.riskLevel.textColor} />
        </View>
        <View style={styles.textBox}>
          <Text style={styles.name} numberOfLines={2}>
            {point.name}
          </Text>
          <Text style={styles.meta} numberOfLines={1}>
            {point.district} · {hazard.label}
          </Text>
          <View style={styles.badges}>
            <RiskBadge riskLevel={point.riskLevel} score={point.riskScore} hasStatistics={point.hasStatistics} />
            <VerificationBadge verified={point.verified} />
          </View>
        </View>
      </View>

      {isSelected && (
        <Button title="ดูรายละเอียด" icon="document-text-outline" size="sm" onPress={onOpenDetail} style={styles.detailButton} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  item: {
    padding: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'transparent',
    gap: SPACING.sm,
    cursor: 'pointer',
  },
  hovered: {
    backgroundColor: COLORS.page,
  },
  selected: {
    backgroundColor: COLORS.primarySoft,
    borderColor: COLORS.primary,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  iconTile: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.sm + 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBox: {
    flex: 1,
    gap: 2,
  },
  name: {
    ...TEXT.bodyStrong,
    color: COLORS.text,
  },
  meta: {
    ...TEXT.small,
    color: COLORS.textMuted,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  detailButton: {
    alignSelf: 'flex-start',
    marginLeft: 48,
  },
});
