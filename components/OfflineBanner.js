/**
 * แถบบอกว่ากำลังออฟไลน์ และอะไรยังใช้ได้บ้าง
 *
 * ผู้ใช้ที่เห็นแผนที่เป็นสีเทาโดยไม่มีคำอธิบาย จะคิดว่าแอปเสียแล้วเลิกใช้
 * ทั้งที่ข้อมูลจุดเสี่ยงและคำแนะนำอยู่ในแอปครบ ใช้ได้โดยไม่ต้องมีเน็ต
 */

import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { COLORS, SPACING, FONT_SIZES } from '../constants/theme';

export default function OfflineBanner() {
  const isOnline = useOnlineStatus();
  if (isOnline) return null;

  return (
    <Text style={styles.banner} accessibilityRole="alert">
      ออฟไลน์อยู่ · ดูจุดเสี่ยงและคำแนะนำได้ตามปกติ แต่แผนที่พื้นหลัง เส้นทางจริง และสภาพอากาศต้องใช้อินเทอร์เน็ต
    </Text>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: COLORS.warningBackground,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.warningBorder,
    color: COLORS.text,
    fontSize: FONT_SIZES.small,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
});
