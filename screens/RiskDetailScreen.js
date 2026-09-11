/**
 * หน้ารายละเอียดจุดเสี่ยง — ระยะ "ถึงปลายทาง"
 *
 * ผู้ใช้อยู่หน้างานจริงแล้ว ต้องการรู้ว่า "ต้องทำตัวยังไงเมื่ออยู่ตรงนั้น"
 * จึงเน้นข้อเสนอแนะเชิงปฏิบัติ และปุ่มโทรฉุกเฉินที่กดได้ทันที
 */

import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import RiskBadge from '../components/RiskBadge';
import VerificationBadge from '../components/VerificationBadge';
import Disclaimer from '../components/Disclaimer';
import EmergencyButton from '../components/EmergencyButton';
import ConditionsCard from '../components/ConditionsCard';
import { useRiskPoints } from '../hooks/useRiskPoints';
import { useFavorites } from '../hooks/useFavorites';
import { useLiveConditions } from '../hooks/useLiveConditions';
import { summarizeIncidents, describeHours } from '../utils/format';
import { conditionsNeededFor } from '../utils/conditions';
import { SEVERITY_LABELS, HAZARD_TYPES } from '../constants/config';
import { COLORS, SPACING, FONT_SIZES, RADIUS } from '../constants/theme';

const THAI_MONTHS_SHORT = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.',
];

/** แปลงรายการเดือนเป็นข้อความอ่านง่าย */
function describeMonths(peakMonths) {
  if (!peakMonths || peakMonths.length === 0) return 'ยังไม่ระบุ';
  if (peakMonths.length === 12) return 'ตลอดทั้งปี';
  return peakMonths.map((m) => THAI_MONTHS_SHORT[m - 1]).join(' · ');
}

export default function RiskDetailScreen({ route }) {
  const { pointId } = route.params;
  const { findPointById } = useRiskPoints();
  const { isFavorite, toggleFavorite } = useFavorites();
  const point = findPointById(pointId);
  // ชายหาดดูคลื่น น้ำตกดูฝน จุดอื่นไม่ดึงอะไร (utils/conditions.js)
  // เรียกก่อน return ตอนหาจุดไม่เจอ เพราะ React ห้ามเรียก hook แบบมีเงื่อนไข
  const conditions = useLiveConditions(point ? point.coordinate : null, conditionsNeededFor(point));

  // กันกรณีหาจุดไม่เจอ เช่น ผู้ใช้ลบจุดที่บันทึกเองไปแล้วแต่ยังเปิดหน้านี้ค้างอยู่
  if (!point) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.content}>
          <Text style={styles.notFound}>ไม่พบข้อมูลจุดเสี่ยงนี้</Text>
        </View>
      </SafeAreaView>
    );
  }

  const hazard = HAZARD_TYPES.find((h) => h.id === point.type) || { icon: '📍', label: 'ไม่ระบุ' };
  const favorite = isFavorite(point.id);

  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.name}>
          {hazard.icon} {point.name}
        </Text>
        <Text style={styles.meta}>
          {point.district} · {hazard.label}
        </Text>

        <View style={styles.badgeRow}>
          <RiskBadge
            riskLevel={point.riskLevel}
            score={point.riskScore}
            hasStatistics={point.hasStatistics}
            size="large"
          />
          <VerificationBadge verified={point.verified} />
        </View>

        {/* รายการโปรด (เอกสารตาราง 6.1) กดซ้ำเพื่อเอาออก */}
        <Pressable
          style={[styles.favoriteButton, favorite && styles.favoriteButtonActive]}
          onPress={() => toggleFavorite(point.id)}
          accessibilityRole="button"
          accessibilityLabel={favorite ? 'เอาออกจากรายการโปรด' : 'บันทึกเป็นรายการโปรด'}
        >
          <Text style={[styles.favoriteText, favorite && styles.favoriteTextActive]}>
            {favorite ? '★ อยู่ในรายการโปรดแล้ว' : '☆ บันทึกเป็นรายการโปรด'}
          </Text>
        </Pressable>

        {/* บอกก่อนที่ผู้ใช้จะอ่านสถิติ ว่าข้อมูลจุดนี้เชื่อถือได้แค่ไหน */}
        <Disclaimer variant={point.verified ? 'verified' : 'unverified'} />

        <ConditionsCard waves={conditions.waves} rain={conditions.rain} isLoading={conditions.isLoading} />

        <Text style={styles.sectionTitle}>สถิติย้อนหลัง</Text>
        <Text style={styles.summary}>{summarizeIncidents(point.incidents)}</Text>

        {point.incidents.length > 0 && (
          <View style={styles.table}>
            {point.incidents.map((incident, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={styles.tableYear}>พ.ศ. {incident.year}</Text>
                <Text style={styles.tableSeverity}>{SEVERITY_LABELS[incident.severity]}</Text>
                <Text style={styles.tableCount}>{incident.count}</Text>
              </View>
            ))}
          </View>
        )}

        <Text style={styles.sectionTitle}>ช่วงที่ต้องระวังเป็นพิเศษ</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>เดือน</Text>
          <Text style={styles.infoValue}>{describeMonths(point.peakMonths)}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>ช่วงเวลา</Text>
          <Text style={styles.infoValue}>{describeHours(point.peakHours)}</Text>
        </View>

        <Text style={styles.sectionTitle}>สิ่งที่ควรทำ</Text>
        {point.advice && point.advice.length > 0 ? (
          point.advice.map((line, index) => (
            <Text key={index} style={styles.adviceItem}>
              • {line}
            </Text>
          ))
        ) : (
          <Text style={styles.emptyText}>ยังไม่มีคำแนะนำสำหรับจุดนี้</Text>
        )}

        <Text style={styles.sectionTitle}>แหล่งอ้างอิง</Text>
        <Text style={styles.sourceText}>{point.source}</Text>

        <Text style={styles.sectionTitle}>ติดต่อฉุกเฉิน</Text>
        {point.emergency.map((contact, index) => (
          <EmergencyButton key={index} label={contact.label} tel={contact.tel} />
        ))}

        <Disclaimer />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  name: {
    fontSize: FONT_SIZES.heading,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  meta: {
    fontSize: FONT_SIZES.body,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: SPACING.sm,
    marginVertical: SPACING.md,
  },
  favoriteButton: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: RADIUS.pill,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  favoriteButtonActive: {
    backgroundColor: COLORS.primary,
  },
  favoriteText: {
    fontSize: FONT_SIZES.body,
    color: COLORS.primary,
    fontWeight: '600',
  },
  favoriteTextActive: {
    color: COLORS.white,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.title,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  summary: {
    fontSize: FONT_SIZES.body,
    color: COLORS.text,
  },
  table: {
    marginTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tableYear: {
    flex: 1,
    fontSize: FONT_SIZES.body,
    color: COLORS.textMuted,
  },
  tableSeverity: {
    flex: 2,
    fontSize: FONT_SIZES.body,
    color: COLORS.text,
  },
  tableCount: {
    fontSize: FONT_SIZES.body,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  infoRow: {
    flexDirection: 'row',
    paddingVertical: SPACING.xs,
  },
  infoLabel: {
    width: 90,
    fontSize: FONT_SIZES.body,
    color: COLORS.textMuted,
  },
  infoValue: {
    flex: 1,
    fontSize: FONT_SIZES.body,
    color: COLORS.text,
  },
  adviceItem: {
    fontSize: FONT_SIZES.body,
    color: COLORS.text,
    lineHeight: 24,
    marginBottom: SPACING.xs,
  },
  sourceText: {
    fontSize: FONT_SIZES.small,
    color: COLORS.textMuted,
    lineHeight: 20,
  },
  emptyText: {
    fontSize: FONT_SIZES.body,
    color: COLORS.textMuted,
  },
  notFound: {
    fontSize: FONT_SIZES.subtitle,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: SPACING.xl,
  },
});
