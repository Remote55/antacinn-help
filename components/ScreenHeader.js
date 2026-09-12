/**
 * หัวของหน้าหลัก: ไอคอน ชื่อหน้าตัวใหญ่ และคำอธิบายสั้น
 *
 * มือถือ: แถบขาวชิดขอบบนของจอ
 * จอกว้าง: วางในเนื้อหาของหน้าเป็นหัวเรื่อง (แถบเมนูบนเป็นหัวของเว็บอยู่แล้ว)
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from './Icon';
import { useLayout } from '../hooks/useLayout';
import { COLORS, TEXT, SPACING, RADIUS } from '../constants/theme';

export default function ScreenHeader({ title, subtitle, icon }) {
  const { isWide } = useLayout();

  return (
    <View style={[styles.header, isWide ? styles.headerWide : styles.headerNarrow]}>
      {icon ? (
        <View style={styles.iconTile}>
          <Icon name={icon} size={22} color={COLORS.primary} />
        </View>
      ) : null}
      <View style={styles.textBox}>
        <Text style={styles.title} accessibilityRole="header">
          {title}
        </Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerNarrow: {
    backgroundColor: COLORS.card,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerWide: {
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.lg,
  },
  iconTile: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBox: {
    flex: 1,
  },
  title: {
    ...TEXT.h1,
    color: COLORS.text,
  },
  subtitle: {
    ...TEXT.body,
    color: COLORS.textMuted,
  },
});
