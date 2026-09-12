/**
 * ส่วนท้ายของหน้าแรก: ข้อความปฏิเสธความรับผิดชอบ ที่มาของข้อมูล และผู้จัดทำ
 *
 * บอกที่มาของข้อมูลทุกแหล่งให้ผู้ใช้ตรวจสอบได้ (เหตุผลเดียวกับป้าย "ข้อมูลทางการ" / "ยังไม่ยืนยัน")
 */

import React from 'react';
import { View, Text, Pressable, Linking, StyleSheet } from 'react-native';
import Container from './Container';
import Disclaimer from './Disclaimer';
import Logo from './Logo';
import Icon from './Icon';
import { useLayout } from '../hooks/useLayout';
import { COLORS, TEXT, SPACING } from '../constants/theme';

const SOURCE_CODE_URL = 'https://github.com/Remote55/antacinn-help';

const DATA_SOURCES = [
  { icon: 'stats-chart-outline', text: 'สถิติอุบัติเหตุบนทางหลวง: ศูนย์ข้อมูลเปิดกระทรวงคมนาคม (datagov.mot.go.th) ปี 2563–2568' },
  { icon: 'map-outline', text: 'แผนที่: © ผู้ร่วมพัฒนา OpenStreetMap · เส้นทาง: OSRM' },
  { icon: 'partly-sunny-outline', text: 'สภาพคลื่นและฝน: Open-Meteo (ข้อมูลพยากรณ์ ไม่ใช่ประกาศทางการ)' },
];

export default function SiteFooter() {
  const { isWide } = useLayout();

  return (
    <View style={styles.footer}>
      <Container style={styles.inner}>
        <Disclaimer />

        <View style={[styles.columns, isWide && styles.columnsWide]}>
          <View style={styles.about}>
            <Logo size={32} subtitle="แผนที่เตือนจุดเสี่ยงสำหรับนักท่องเที่ยว" />
            <Text style={styles.small}>
              รายวิชา 344-312 Mobile Application Development ภาคการศึกษาที่ 1/2569 · กลุ่ม 3
            </Text>
            <Pressable
              onPress={() => Linking.openURL(SOURCE_CODE_URL)}
              accessibilityRole="link"
              style={({ hovered }) => [styles.link, hovered && styles.linkHovered]}
            >
              <Icon name="logo-github" size={16} color={COLORS.primary} />
              <Text style={styles.linkText}>ซอร์สโค้ดและที่มาของข้อมูลบน GitHub</Text>
            </Pressable>
          </View>

          <View style={styles.sources}>
            <Text style={styles.heading}>ที่มาของข้อมูล</Text>
            {DATA_SOURCES.map((source) => (
              <View key={source.text} style={styles.sourceRow}>
                <Icon name={source.icon} size={16} color={COLORS.textMuted} />
                <Text style={styles.small}>{source.text}</Text>
              </View>
            ))}
          </View>
        </View>
      </Container>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    marginTop: SPACING.xl,
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  inner: {
    paddingVertical: SPACING.xl,
    gap: SPACING.lg,
  },
  columns: {
    gap: SPACING.lg,
  },
  columnsWide: {
    flexDirection: 'row',
  },
  about: {
    flex: 1,
    gap: 12,
  },
  sources: {
    flex: 1,
    gap: SPACING.sm,
  },
  heading: {
    ...TEXT.smallStrong,
    color: COLORS.text,
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
  },
  small: {
    flex: 1,
    ...TEXT.small,
    color: COLORS.textMuted,
  },
  link: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    cursor: 'pointer',
  },
  linkHovered: {
    opacity: 0.8,
  },
  linkText: {
    ...TEXT.smallStrong,
    color: COLORS.primary,
    textDecorationLine: 'underline',
  },
});
