/**
 * แถบบอกว่ากำลังออฟไลน์ และอะไรยังใช้ได้บ้าง
 *
 * ผู้ใช้ที่เห็นแผนที่เป็นสีเทาโดยไม่มีคำอธิบาย จะคิดว่าแอปเสียแล้วเลิกใช้
 * ทั้งที่ข้อมูลจุดเสี่ยงและคำแนะนำอยู่ในแอปครบ ใช้ได้โดยไม่ต้องมีเน็ต
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from './Icon';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { COLORS, TEXT, SPACING } from '../constants/theme';

export default function OfflineBanner() {
  const isOnline = useOnlineStatus();
  if (isOnline) return null;

  return (
    <View style={styles.banner} accessibilityRole="alert">
      <Icon name="cloud-offline-outline" size={18} color={COLORS.caution} />
      <Text style={styles.text}>
        ออฟไลน์อยู่ · ดูจุดเสี่ยงและคำแนะนำได้ตามปกติ แต่แผนที่พื้นหลัง เส้นทางจริง และสภาพอากาศต้องใช้อินเทอร์เน็ต
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.warningBackground,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.warningBorder,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  text: {
    flex: 1,
    ...TEXT.small,
    color: COLORS.text,
  },
});
