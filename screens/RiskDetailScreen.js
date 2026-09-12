/**
 * หน้ารายละเอียดจุดเสี่ยง — ระยะ "ถึงปลายทาง"
 *
 * ผู้ใช้อยู่หน้างานจริงแล้ว ต้องการรู้ว่า "ต้องทำตัวยังไงเมื่ออยู่ตรงนั้น"
 * จึงเน้นข้อเสนอแนะเชิงปฏิบัติ และปุ่มโทรฉุกเฉินที่กดได้ทันที
 *
 * จอกว้าง: การ์ดหัวเรื่อง แล้วแบ่งสองคอลัมน์ (สถิติ ช่วงเวลา คำแนะนำ | โทรฉุกเฉิน สภาพตอนนี้ แหล่งอ้างอิง)
 * มือถือ: การ์ดเรียงลงมา
 */

import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import RiskBadge from '../components/RiskBadge';
import VerificationBadge from '../components/VerificationBadge';
import Disclaimer from '../components/Disclaimer';
import EmergencyButton from '../components/EmergencyButton';
import ConditionsCard from '../components/ConditionsCard';
import Container from '../components/Container';
import BackLink from '../components/BackLink';
import Card from '../components/Card';
import Button from '../components/Button';
import Icon from '../components/Icon';
import { useRiskPoints } from '../hooks/useRiskPoints';
import { useFavorites } from '../hooks/useFavorites';
import { useLiveConditions } from '../hooks/useLiveConditions';
import { useLayout } from '../hooks/useLayout';
import { summarizeIncidents, describeHours } from '../utils/format';
import { conditionsNeededFor } from '../utils/conditions';
import { hazardFor } from '../utils/hazards';
import { SEVERITY_LABELS } from '../constants/config';
import { COLORS, TEXT, SPACING, RADIUS } from '../constants/theme';

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

/** หัวข้อของการ์ดแต่ละใบ */
function CardTitle({ icon, title }) {
  return (
    <View style={styles.cardTitleRow}>
      <Icon name={icon} size={20} color={COLORS.primary} />
      <Text style={styles.cardTitle}>{title}</Text>
    </View>
  );
}

export default function RiskDetailScreen({ route }) {
  const { isWide } = useLayout();
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
      <View style={styles.screen}>
        <Container style={styles.content}>
          {isWide && <BackLink />}
          <Card style={styles.notFoundCard}>
            <Icon name="help-circle-outline" size={32} color={COLORS.textMuted} />
            <Text style={styles.notFound}>ไม่พบข้อมูลจุดเสี่ยงนี้</Text>
          </Card>
        </Container>
      </View>
    );
  }

  const hazard = hazardFor(point.type);
  const favorite = isFavorite(point.id);

  const headerCard = (
    <Card style={styles.headerCard}>
      <View style={styles.headerTop}>
        <View style={[styles.hazardTile, { backgroundColor: point.riskLevel.color }]}>
          <Icon name={hazard.icon} size={28} color={point.riskLevel.textColor} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.name} accessibilityRole="header">
            {point.name}
          </Text>
          <Text style={styles.meta}>
            {point.district} · {hazard.label}
          </Text>
        </View>
      </View>

      <View style={styles.badgeRow}>
        <RiskBadge riskLevel={point.riskLevel} score={point.riskScore} hasStatistics={point.hasStatistics} size="large" />
        <VerificationBadge verified={point.verified} />
      </View>

      {/* รายการโปรด (เอกสารตาราง 6.1) กดซ้ำเพื่อเอาออก */}
      <Button
        variant={favorite ? 'primary' : 'secondary'}
        icon={favorite ? 'star' : 'star-outline'}
        title={favorite ? 'อยู่ในรายการโปรดแล้ว' : 'บันทึกเป็นรายการโปรด'}
        accessibilityLabel={favorite ? 'เอาออกจากรายการโปรด' : 'บันทึกเป็นรายการโปรด'}
        onPress={() => toggleFavorite(point.id)}
        style={styles.favoriteButton}
      />

      {/* บอกก่อนที่ผู้ใช้จะอ่านสถิติ ว่าข้อมูลจุดนี้เชื่อถือได้แค่ไหน */}
      <Disclaimer variant={point.verified ? 'verified' : 'unverified'} />
    </Card>
  );

  const statsCard = (
    <Card style={styles.card}>
      <CardTitle icon="stats-chart-outline" title="สถิติย้อนหลัง" />
      <Text style={styles.summary}>{summarizeIncidents(point.incidents)}</Text>
      {point.incidents.length > 0 && (
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHead]}>
            <Text style={[styles.tableYear, styles.tableHeadText]}>ปี</Text>
            <Text style={[styles.tableSeverity, styles.tableHeadText]}>ความรุนแรง</Text>
            <Text style={[styles.tableCount, styles.tableHeadText]}>จำนวน</Text>
          </View>
          {point.incidents.map((incident, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={styles.tableYear}>พ.ศ. {incident.year}</Text>
              <Text style={styles.tableSeverity}>{SEVERITY_LABELS[incident.severity]}</Text>
              <Text style={styles.tableCount}>{incident.count}</Text>
            </View>
          ))}
        </View>
      )}
    </Card>
  );

  const peakCard = (
    <Card style={styles.card}>
      <CardTitle icon="time-outline" title="ช่วงที่ต้องระวังเป็นพิเศษ" />
      <View style={styles.infoRow}>
        <Icon name="calendar-outline" size={18} color={COLORS.textMuted} />
        <Text style={styles.infoLabel}>เดือน</Text>
        <Text style={styles.infoValue}>{describeMonths(point.peakMonths)}</Text>
      </View>
      <View style={styles.infoRow}>
        <Icon name="alarm-outline" size={18} color={COLORS.textMuted} />
        <Text style={styles.infoLabel}>ช่วงเวลา</Text>
        <Text style={styles.infoValue}>{describeHours(point.peakHours)}</Text>
      </View>
    </Card>
  );

  const adviceCard = (
    <Card style={styles.card}>
      <CardTitle icon="checkmark-done-outline" title="สิ่งที่ควรทำ" />
      {point.advice && point.advice.length > 0 ? (
        point.advice.map((line, index) => (
          <View key={index} style={styles.adviceRow}>
            <Icon name="checkmark-circle" size={18} color={COLORS.primary} style={styles.adviceIcon} />
            <Text style={styles.adviceText}>{line}</Text>
          </View>
        ))
      ) : (
        <Text style={styles.emptyText}>ยังไม่มีคำแนะนำสำหรับจุดนี้</Text>
      )}
    </Card>
  );

  const emergencyCard = (
    <Card style={styles.card}>
      <CardTitle icon="call-outline" title="ติดต่อฉุกเฉิน" />
      {point.emergency.map((contact, index) => (
        <EmergencyButton key={index} label={contact.label} tel={contact.tel} />
      ))}
    </Card>
  );

  const conditionsCard = (
    <ConditionsCard waves={conditions.waves} rain={conditions.rain} isLoading={conditions.isLoading} />
  );

  const sourceCard = (
    <Card style={styles.card}>
      <CardTitle icon="document-text-outline" title="แหล่งอ้างอิง" />
      <Text style={styles.sourceText}>{point.source}</Text>
    </Card>
  );

  return (
    <View style={styles.screen}>
      <ScrollView>
        <Container style={styles.content}>
          {isWide && <BackLink />}
          {headerCard}

          {isWide ? (
            <View style={styles.columns}>
              <View style={styles.mainColumn}>
                {statsCard}
                {peakCard}
                {adviceCard}
              </View>
              <View style={styles.sideColumn}>
                {emergencyCard}
                {conditionsCard}
                {sourceCard}
              </View>
            </View>
          ) : (
            <>
              {conditionsCard}
              {adviceCard}
              {emergencyCard}
              {statsCard}
              {peakCard}
              {sourceCard}
            </>
          )}

          <Disclaimer />
        </Container>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.page,
  },
  content: {
    paddingVertical: SPACING.lg,
    gap: 12,
  },
  headerCard: {
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.md,
  },
  hazardTile: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  name: {
    ...TEXT.h1,
    color: COLORS.text,
  },
  meta: {
    ...TEXT.body,
    color: COLORS.textMuted,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  favoriteButton: {
    alignSelf: 'flex-start',
  },
  columns: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  mainColumn: {
    flex: 3,
    gap: 12,
  },
  sideColumn: {
    flex: 2,
    gap: 12,
  },
  card: {
    gap: 12,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  cardTitle: {
    ...TEXT.h3,
    color: COLORS.text,
  },
  summary: {
    ...TEXT.bodyStrong,
    color: COLORS.text,
  },
  table: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  },
  tableHead: {
    backgroundColor: COLORS.page,
  },
  tableHeadText: {
    ...TEXT.caption,
    color: COLORS.textMuted,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  tableYear: {
    flex: 1,
    ...TEXT.body,
    color: COLORS.textSecondary,
  },
  tableSeverity: {
    flex: 2,
    ...TEXT.body,
    color: COLORS.text,
  },
  tableCount: {
    minWidth: 48,
    textAlign: 'right',
    ...TEXT.bodyStrong,
    color: COLORS.text,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  infoLabel: {
    width: 70,
    ...TEXT.body,
    color: COLORS.textMuted,
  },
  infoValue: {
    flex: 1,
    ...TEXT.bodyStrong,
    color: COLORS.text,
  },
  adviceRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
  },
  adviceIcon: {
    marginTop: 3,
  },
  adviceText: {
    flex: 1,
    ...TEXT.body,
    color: COLORS.text,
  },
  sourceText: {
    ...TEXT.small,
    color: COLORS.textSecondary,
  },
  emptyText: {
    ...TEXT.body,
    color: COLORS.textMuted,
  },
  notFoundCard: {
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.xl,
  },
  notFound: {
    ...TEXT.h3,
    color: COLORS.textMuted,
  },
});
