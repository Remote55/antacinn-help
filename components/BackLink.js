/**
 * ปุ่ม "ย้อนกลับ" ในเนื้อหาของหน้า ใช้บนจอกว้าง
 *
 * บนจอกว้างซ่อนแถบหัวของหน้ารายละเอียด (มีแถบเมนูบนแทนแล้ว) จึงต้องมีปุ่มย้อนกลับในหน้า
 * ถ้าเปิดหน้านี้ตรง ๆ โดยไม่มีหน้าก่อนหน้า ให้กลับไปหน้าแรก
 */

import React from 'react';
import { Text, Pressable, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from './Icon';
import { COLORS, TEXT, SPACING, RADIUS } from '../constants/theme';

export default function BackLink({ label = 'ย้อนกลับ' }) {
  const navigation = useNavigation();

  function goBack() {
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.navigate('MainTabs', { screen: 'Home' });
  }

  return (
    <Pressable
      onPress={goBack}
      accessibilityRole="button"
      style={({ hovered }) => [styles.link, hovered && styles.hovered]}
    >
      <Icon name="arrow-back" size={18} color={COLORS.primary} />
      <Text style={styles.text}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  link: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    marginLeft: -SPACING.sm,
    borderRadius: RADIUS.sm,
    cursor: 'pointer',
  },
  hovered: {
    backgroundColor: COLORS.primarySoft,
  },
  text: {
    ...TEXT.smallStrong,
    color: COLORS.primary,
  },
});
