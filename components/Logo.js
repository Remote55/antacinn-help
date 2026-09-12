/**
 * โลโก้ AntacinnHelp: สามเหลี่ยมเตือนสีเหลืองในกรอบกรมท่า (รูปเดียวกับไอคอนเว็บแอป) + ชื่อแอป
 *
 * @param inverted true = วางบนพื้นกรมท่า (ตัวอักษรขาว กรอบโปร่ง)
 * @param subtitle บรรทัดเล็กใต้ชื่อ เช่น "หาดใหญ่ · เมืองสงขลา"
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from './Icon';
import { COLORS, TEXT, SPACING } from '../constants/theme';

export default function Logo({ size = 36, inverted = false, subtitle }) {
  return (
    <View style={styles.row}>
      <View
        style={[
          styles.mark,
          { width: size, height: size, borderRadius: Math.round(size * 0.28) },
          inverted && styles.markInverted,
        ]}
      >
        <Icon name="warning" size={Math.round(size * 0.58)} color={COLORS.accent} />
      </View>
      <View>
        <Text style={[styles.name, inverted && styles.textInverted]}>AntacinnHelp</Text>
        {subtitle ? <Text style={[styles.subtitle, inverted && styles.subtitleInverted]}>{subtitle}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm + 2,
  },
  mark: {
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markInverted: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  name: {
    ...TEXT.h3,
    lineHeight: 22,
    color: COLORS.primary,
  },
  textInverted: {
    color: COLORS.white,
  },
  subtitle: {
    ...TEXT.caption,
    color: COLORS.textMuted,
  },
  subtitleInverted: {
    color: COLORS.onPrimaryMuted,
  },
});
