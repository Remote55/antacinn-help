/**
 * หัวข้อของแต่ละส่วนในหน้า: ชื่อ คำอธิบายสั้น และลิงก์ทางขวา (เช่น "ดูบนแผนที่")
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Icon from './Icon';
import { COLORS, TEXT, SPACING, RADIUS } from '../constants/theme';

export default function SectionHeader({ title, subtitle, icon, actionLabel, onAction }) {
  return (
    <View style={styles.row}>
      <View style={styles.titleBox}>
        <View style={styles.titleRow}>
          {icon ? <Icon name={icon} size={20} color={COLORS.primary} /> : null}
          <Text style={styles.title} accessibilityRole="header">
            {title}
          </Text>
        </View>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>

      {actionLabel ? (
        <Pressable
          onPress={onAction}
          accessibilityRole="link"
          style={({ hovered }) => [styles.action, hovered && styles.actionHovered]}
        >
          <Text style={styles.actionText}>{actionLabel}</Text>
          <Icon name="chevron-forward" size={16} color={COLORS.primary} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  titleBox: {
    flex: 1,
    gap: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  title: {
    ...TEXT.h2,
    color: COLORS.text,
  },
  subtitle: {
    ...TEXT.small,
    color: COLORS.textMuted,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
    // ห้ามลิงก์หดตัว ให้หัวข้อทางซ้ายเป็นฝ่ายขึ้นบรรทัดใหม่แทน
    flexShrink: 0,
    cursor: 'pointer',
  },
  actionHovered: {
    backgroundColor: COLORS.primarySoft,
  },
  actionText: {
    ...TEXT.smallStrong,
    color: COLORS.primary,
  },
});
