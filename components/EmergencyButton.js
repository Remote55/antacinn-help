/**
 * ปุ่มโทรฉุกเฉิน กดแล้วเปิดแอปโทรศัพท์พร้อมเบอร์ที่กรอกไว้
 *
 * ใช้ Linking ของ React Native ซึ่งทำงานได้ทั้งบนมือถือและเว็บ
 * variant  'block'   ปุ่มใหญ่เต็มความกว้าง (หน้ารายละเอียด หน้าขอโทษเมื่อแอปพัง)
 *          'compact' ปุ่มเล็ก (แถบเมนูบนของเว็บ)
 */

import React from 'react';
import { View, Text, Pressable, Linking, StyleSheet } from 'react-native';
import Button from './Button';
import Icon from './Icon';
import { showMessage } from './dialogs';
import { COLORS, TEXT, SPACING, RADIUS } from '../constants/theme';

export default function EmergencyButton({ label, tel, variant = 'block' }) {
  async function handlePress() {
    const url = 'tel:' + tel;
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        showMessage('โทรออกไม่ได้', 'กรุณาโทรที่หมายเลข ' + tel + ' ด้วยตนเอง');
      }
    } catch (error) {
      showMessage('โทรออกไม่ได้', 'กรุณาโทรที่หมายเลข ' + tel + ' ด้วยตนเอง');
    }
  }

  if (variant === 'compact') {
    return (
      <Button
        variant="danger"
        size="sm"
        icon="call"
        title={`โทร ${tel}`}
        onPress={handlePress}
        accessibilityLabel={`โทร ${tel} ${label}`}
      />
    );
  }

  return (
    <Pressable
      style={({ pressed, hovered }) => [styles.block, (pressed || hovered) && styles.blockActive]}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={`โทร ${tel} ${label}`}
    >
      <View style={styles.iconCircle}>
        <Icon name="call" size={20} color={COLORS.white} />
      </View>
      <View style={styles.textBox}>
        <Text style={styles.number}>โทร {tel}</Text>
        <Text style={styles.label}>{label}</Text>
      </View>
      <Icon name="chevron-forward" size={18} color={COLORS.white} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  block: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    backgroundColor: COLORS.danger,
    borderRadius: RADIUS.md,
    paddingVertical: 12,
    paddingHorizontal: SPACING.md,
    cursor: 'pointer',
  },
  blockActive: {
    backgroundColor: COLORS.dangerDark,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBox: {
    flex: 1,
  },
  number: {
    ...TEXT.h3,
    color: COLORS.white,
  },
  label: {
    ...TEXT.small,
    color: COLORS.white,
  },
});
