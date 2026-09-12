/**
 * การ์ด "สภาพตอนนี้" ในหน้ารายละเอียดจุดเสี่ยง (คลื่นสำหรับชายหาด ฝนสำหรับน้ำตก)
 *
 * ไม่มีข้อมูล (ออฟไลน์หรือบริการล่ม) ไม่แสดงการ์ดเลย ไม่แสดงค่าเก่าหรือค่าเดา
 * ไม่ใช้สีเขียวกับทะเลสงบหรือไม่มีฝน เพราะสีเขียวสื่อว่าปลอดภัย แต่จุดนี้ยังเป็นจุดเสี่ยงอยู่
 */

import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import Card from './Card';
import Icon from './Icon';
import { classifyWaves, classifyRain } from '../utils/conditions';
import { formatDistance } from '../utils/format';
import { CONDITIONS_DISCLAIMER } from '../constants/config';
import { COLORS, TEXT, SPACING, RADIUS } from '../constants/theme';

/** จุดกริดทะเลห่างเกินนี้ บอกผู้ใช้ว่าค่าคลื่นมาจากนอกชายฝั่ง */
const FAR_GRID_M = 3000;

const LEVEL_COLORS = {
  calm: COLORS.text,
  none: COLORS.text,
  light: COLORS.text,
  slight: COLORS.caution,
  moderate: COLORS.caution,
  rough: COLORS.danger,
  danger: COLORS.danger,
  heavy: COLORS.danger,
};

function ConditionRow({ icon, value, color, advice, note }) {
  return (
    <View style={styles.row}>
      <View style={styles.iconTile}>
        <Icon name={icon} size={20} color={COLORS.primary} />
      </View>
      <View style={styles.rowText}>
        <Text style={[styles.value, { color }]}>{value}</Text>
        {advice ? <Text style={styles.advice}>{advice}</Text> : null}
        {note ? <Text style={styles.meta}>{note}</Text> : null}
      </View>
    </View>
  );
}

export default function ConditionsCard({ waves, rain, isLoading }) {
  if (isLoading) {
    return (
      <Card style={styles.loadingCard}>
        <ActivityIndicator color={COLORS.primary} size="small" />
        <Text style={styles.meta}>กำลังดูสภาพตอนนี้...</Text>
      </Card>
    );
  }

  const waveLevel = waves ? classifyWaves(waves.heightM) : null;
  const rainLevel = rain ? classifyRain(rain.mmPerHour) : null;
  if (!waveLevel && !rainLevel) return null;

  const time = (waves && waves.time) || (rain && rain.time) || '';

  return (
    <Card style={styles.card}>
      <Text style={styles.title}>สภาพตอนนี้</Text>

      {waveLevel && (
        <ConditionRow
          icon="water-outline"
          value={`คลื่นสูงประมาณ ${waves.heightM.toFixed(1)} ม. · ${waveLevel.label}`}
          color={LEVEL_COLORS[waveLevel.id]}
          advice={waveLevel.advice}
          note={
            waves.gridDistanceM > FAR_GRID_M
              ? `ค่าจากแบบจำลองทะเลนอกชายฝั่ง ห่างจุดนี้ประมาณ ${formatDistance(waves.gridDistanceM)}`
              : null
          }
        />
      )}

      {rainLevel && (
        <ConditionRow
          icon="rainy-outline"
          value={`ฝน ${rain.mmPerHour} มม./ชม. · ${rainLevel.label}`}
          color={LEVEL_COLORS[rainLevel.id]}
          advice={rainLevel.advice}
        />
      )}

      <Text style={styles.meta}>
        {CONDITIONS_DISCLAIMER} · ที่มา Open-Meteo{time ? ` เวลา ${time.slice(11, 16)} น.` : ''}
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 12,
  },
  loadingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  title: {
    ...TEXT.h3,
    color: COLORS.text,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  iconTile: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  value: {
    ...TEXT.bodyStrong,
  },
  advice: {
    ...TEXT.body,
    color: COLORS.text,
  },
  meta: {
    ...TEXT.small,
    color: COLORS.textMuted,
  },
});
