/**
 * แถบเมนูด้านบนแบบเว็บ (แสดงเฉพาะจอกว้าง ตั้งแต่ 900 px)
 *
 * อยู่นอกตัวนำทาง (วางใน App.js) จึงแสดงครบทุกหน้า รวมหน้ารายละเอียดและโหมดเดินทาง
 * บนมือถือใช้แถบแท็บด้านล่างแทน (navigation/RootNavigator.js)
 *
 * @param activeRoute ชื่อหน้าที่เปิดอยู่ ใช้ไฮไลต์เมนู
 * @param onNavigate  เรียกพร้อมชื่อหน้า (Home, Map, RoutePlanner, SavePoint)
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Logo from './Logo';
import Icon from './Icon';
import EmergencyButton from './EmergencyButton';
import { DEFAULT_EMERGENCY } from '../constants/config';
import { COLORS, TEXT, SPACING, RADIUS, SHADOWS, LAYOUT } from '../constants/theme';

export const NAV_ITEMS = [
  { route: 'Home', label: 'หน้าแรก', icon: 'home-outline', activeIcon: 'home' },
  { route: 'Map', label: 'แผนที่จุดเสี่ยง', icon: 'map-outline', activeIcon: 'map' },
  { route: 'RoutePlanner', label: 'วางแผนเส้นทาง', icon: 'navigate-outline', activeIcon: 'navigate' },
  { route: 'SavePoint', label: 'บันทึกจุดเสี่ยง', icon: 'add-circle-outline', activeIcon: 'add-circle' },
];

function NavLink({ item, isActive, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="link"
      accessibilityState={{ selected: isActive }}
      style={({ hovered }) => [styles.link, isActive ? styles.linkActive : hovered && styles.linkHovered]}
    >
      <Icon
        name={isActive ? item.activeIcon : item.icon}
        size={18}
        color={isActive ? COLORS.primary : COLORS.textSecondary}
      />
      <Text style={[styles.linkText, isActive && styles.linkTextActive]}>{item.label}</Text>
    </Pressable>
  );
}

export default function TopNavBar({ activeRoute, onNavigate }) {
  return (
    <View style={styles.bar} accessibilityRole="navigation">
      <Pressable
        onPress={() => onNavigate('Home')}
        accessibilityRole="link"
        accessibilityLabel="AntacinnHelp กลับหน้าแรก"
        style={styles.logoLink}
      >
        <Logo size={36} subtitle="หาดใหญ่ · เมืองสงขลา" />
      </Pressable>

      <View style={styles.links}>
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.route}
            item={item}
            isActive={activeRoute === item.route}
            onPress={() => onNavigate(item.route)}
          />
        ))}
      </View>

      <EmergencyButton variant="compact" label={DEFAULT_EMERGENCY.label} tel={DEFAULT_EMERGENCY.tel} />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    height: LAYOUT.NAV_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    ...SHADOWS.nav,
    // ให้เงาของแถบทับเนื้อหาด้านล่าง
    zIndex: 10,
  },
  logoLink: {
    cursor: 'pointer',
  },
  links: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: 14,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    cursor: 'pointer',
  },
  linkHovered: {
    backgroundColor: COLORS.page,
  },
  linkActive: {
    backgroundColor: COLORS.primarySoft,
  },
  linkText: {
    ...TEXT.smallStrong,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  linkTextActive: {
    color: COLORS.primary,
  },
});
