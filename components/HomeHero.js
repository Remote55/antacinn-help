/**
 * ส่วนหัวของหน้าแรก (พื้นกรมท่า): บอกว่าเว็บนี้คืออะไร ช่องค้นหาใหญ่ และตัวเลขสรุปข้อมูล
 *
 * จอกว้าง: ข้อความและช่องค้นหาทางซ้าย แผนที่ย่อของจุดเสี่ยงทั้งหมดทางขวา กดเปิดแผนที่เต็มได้
 * มือถือ: โลโก้ หัวเรื่อง ช่องค้นหา และตัวเลขสรุป เรียงลงมา (ไม่มีแผนที่ย่อ ประหยัดเน็ตและพื้นที่จอ)
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppMap from './AppMap';
import Container from './Container';
import Logo from './Logo';
import SearchBox from './SearchBox';
import Button from './Button';
import MapLegend from './MapLegend';
import { useLayout } from '../hooks/useLayout';
import { DEFAULT_REGION } from '../constants/config';
import { COLORS, TEXT, SPACING, RADIUS, SHADOWS } from '../constants/theme';

const SEARCH_PLACEHOLDER = 'ค้นหาสถานที่หรือจุดเสี่ยง เช่น หาดสมิหลา';

function Stat({ value, label }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

/**
 * @param stats    [{ value, label }] ตัวเลขสรุป
 * @param markers  หมุดของแผนที่ย่อ (จอกว้าง)
 */
export default function HomeHero({ keyword, onChangeKeyword, stats, markers, onOpenMap, onMarkerPress }) {
  const { isWide } = useLayout();
  const insets = useSafeAreaInsets();

  const statRow = (
    <View style={[styles.stats, isWide && styles.statsWide]}>
      {stats.map((stat) => (
        <Stat key={stat.label} value={stat.value} label={stat.label} />
      ))}
    </View>
  );

  if (!isWide) {
    return (
      <View style={[styles.hero, { paddingTop: insets.top + SPACING.md }]}>
        <Container style={styles.narrowContent}>
          <Logo size={32} inverted subtitle="หาดใหญ่ · เมืองสงขลา" />
          <Text style={styles.titleNarrow} accessibilityRole="header">
            รู้ก่อนไป ว่าตรงไหนต้องระวัง
          </Text>
          <SearchBox value={keyword} onChangeText={onChangeKeyword} placeholder={SEARCH_PLACEHOLDER} size="lg" />
          {statRow}
        </Container>
      </View>
    );
  }

  return (
    <View style={styles.hero}>
      <Container style={styles.wideContent}>
        <View style={styles.textColumn}>
          <Text style={styles.eyebrow}>แผนที่ความปลอดภัยสำหรับนักท่องเที่ยว · หาดใหญ่–เมืองสงขลา</Text>
          <Text style={styles.titleWide} accessibilityRole="header">
            รู้ก่อนไป{'\n'}ว่าตรงไหนต้องระวัง
          </Text>
          <Text style={styles.lead}>
            รวมจุดเสี่ยงอุบัติเหตุ จมน้ำ และอาชญากรรม พร้อมคำแนะนำและเบอร์ฉุกเฉิน
            ระดับความเสี่ยงปรับตามเดือนและช่วงเวลาที่คุณจะไป
          </Text>
          <SearchBox value={keyword} onChangeText={onChangeKeyword} placeholder={SEARCH_PLACEHOLDER} size="lg" />
          {statRow}
        </View>

        <View style={styles.mapCard}>
          <AppMap region={DEFAULT_REGION} markers={markers} fitToMarkers onMarkerPress={onMarkerPress} />
          <MapLegend style={styles.legend} />
          <Button title="เปิดแผนที่เต็มจอ" icon="expand" onPress={onOpenMap} style={styles.mapButton} />
        </View>
      </Container>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: COLORS.primary,
  },
  narrowContent: {
    paddingBottom: SPACING.lg,
    gap: SPACING.md,
  },
  titleNarrow: {
    ...TEXT.h1,
    color: COLORS.white,
    marginTop: SPACING.xs,
  },
  wideContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xl,
    paddingVertical: SPACING.xxl,
  },
  textColumn: {
    flex: 1,
    gap: SPACING.md,
  },
  eyebrow: {
    ...TEXT.smallStrong,
    alignSelf: 'flex-start',
    color: COLORS.accent,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
    overflow: 'hidden',
  },
  titleWide: {
    ...TEXT.display,
    color: COLORS.white,
  },
  lead: {
    ...TEXT.body,
    fontSize: 16,
    lineHeight: 26,
    color: COLORS.onPrimaryMuted,
    maxWidth: 520,
  },
  stats: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  statsWide: {
    gap: SPACING.md,
    marginTop: SPACING.xs,
  },
  stat: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  statValue: {
    ...TEXT.h1,
    lineHeight: 34,
    color: COLORS.white,
  },
  statLabel: {
    ...TEXT.caption,
    color: COLORS.onPrimaryMuted,
  },
  mapCard: {
    width: '44%',
    height: 420,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    backgroundColor: COLORS.page,
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    ...SHADOWS.raised,
  },
  legend: {
    bottom: SPACING.md,
    left: SPACING.md,
  },
  // มุมซ้ายบนว่าง (ปุ่มซูมอยู่ขวาบน คำอธิบายสัญลักษณ์อยู่ซ้ายล่าง)
  mapButton: {
    position: 'absolute',
    top: SPACING.md,
    left: SPACING.md,
    ...SHADOWS.raised,
  },
});
