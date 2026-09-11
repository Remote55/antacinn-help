/**
 * การ์ด "สภาพตอนนี้" ในหน้ารายละเอียดจุดเสี่ยง (คลื่นสำหรับชายหาด ฝนสำหรับน้ำตก)
 *
 * ไม่มีข้อมูล (ออฟไลน์หรือบริการล่ม) ไม่แสดงการ์ดเลย ไม่แสดงค่าเก่าหรือค่าเดา
 * ไม่ใช้สีเขียวกับทะเลสงบหรือไม่มีฝน เพราะสีเขียวสื่อว่าปลอดภัย แต่จุดนี้ยังเป็นจุดเสี่ยงอยู่
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { classifyWaves, classifyRain } from '../utils/conditions';
import { formatDistance } from '../utils/format';
import { CONDITIONS_DISCLAIMER } from '../constants/config';
import { COLORS, SPACING, FONT_SIZES, RADIUS } from '../constants/theme';

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

export default function ConditionsCard({ waves, rain, isLoading }) {
  if (isLoading) {
    return (
      <View style={styles.card}>
        <Text style={styles.meta}>กำลังดูสภาพตอนนี้...</Text>
      </View>
    );
  }

  const waveLevel = waves ? classifyWaves(waves.heightM) : null;
  const rainLevel = rain ? classifyRain(rain.mmPerHour) : null;
  if (!waveLevel && !rainLevel) return null;

  const time = (waves && waves.time) || (rain && rain.time) || '';

  return (
    <View style={styles.card}>
      <Text style={styles.title}>สภาพตอนนี้</Text>

      {waveLevel && (
        <View style={styles.row}>
          <Text style={[styles.value, { color: LEVEL_COLORS[waveLevel.id] }]}>
            🌊 คลื่นสูงประมาณ {waves.heightM.toFixed(1)} ม. · {waveLevel.label}
          </Text>
          <Text style={styles.advice}>{waveLevel.advice}</Text>
          {waves.gridDistanceM > FAR_GRID_M && (
            <Text style={styles.meta}>
              ค่าจากแบบจำลองทะเลนอกชายฝั่ง ห่างจุดนี้ประมาณ {formatDistance(waves.gridDistanceM)}
            </Text>
          )}
        </View>
      )}

      {rainLevel && (
        <View style={styles.row}>
          <Text style={[styles.value, { color: LEVEL_COLORS[rainLevel.id] }]}>
            🌧️ ฝน {rain.mmPerHour} มม./ชม. · {rainLevel.label}
          </Text>
          {rainLevel.advice && <Text style={styles.advice}>{rainLevel.advice}</Text>}
        </View>
      )}

      <Text style={styles.meta}>
        {CONDITIONS_DISCLAIMER} · ที่มา Open-Meteo{time ? ` เวลา ${time.slice(11, 16)} น.` : ''}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginVertical: SPACING.sm,
    gap: SPACING.sm,
    backgroundColor: COLORS.surface,
  },
  title: {
    fontSize: FONT_SIZES.subtitle,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  row: {
    gap: SPACING.xs,
  },
  value: {
    fontSize: FONT_SIZES.body,
    fontWeight: '600',
  },
  advice: {
    fontSize: FONT_SIZES.body,
    color: COLORS.text,
  },
  meta: {
    fontSize: FONT_SIZES.small,
    color: COLORS.textMuted,
    lineHeight: 18,
  },
});
