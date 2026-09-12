/**
 * การ์ดสถานที่ยอดนิยม (เอกสารบทที่ 4)
 *
 * บอกว่ารอบสถานที่นี้มีจุดเสี่ยงกี่จุด และจุดที่อันตรายที่สุดอยู่ระดับไหน
 * ถ้าไม่มีจุดเสี่ยงในระบบ บอกว่า "ยังไม่มีข้อมูล" ไม่บอกว่าปลอดภัย
 * (เหตุผลเดียวกับที่ห้ามใช้สีเขียว: ไม่มีข้อมูล ไม่ได้แปลว่าปลอดภัย)
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Card from './Card';
import Button from './Button';
import RiskBadge from './RiskBadge';
import { DISTANCE } from '../constants/config';
import { COLORS, TEXT, SPACING, RADIUS } from '../constants/theme';

const RADIUS_LABEL = `${DISTANCE.PLACE_RISK_RADIUS / 1000} กม.`;

/**
 * @param place สถานที่จาก usePlaces (มี risk แล้ว)
 * @param onShowMap กด "ดูบนแผนที่"
 * @param onNavigate กด "นำทาง"
 * @param style ใช้กำหนดความกว้าง (แถวเลื่อนแนวนอนบนมือถือ หรือช่องในตารางบนจอกว้าง)
 */
export default function PlaceCard({ place, onShowMap, onNavigate, style }) {
  const { count, highest } = place.risk;

  return (
    <Card style={[styles.card, style]}>
      <View style={styles.header}>
        <View style={styles.emojiTile}>
          <Text style={styles.emoji}>{place.emoji}</Text>
        </View>
        <View style={styles.titleBox}>
          <Text style={styles.name} numberOfLines={2}>
            {place.name}
          </Text>
          <Text style={styles.district}>อ.{place.district}</Text>
        </View>
      </View>

      <View style={styles.riskBox}>
        {count > 0 ? (
          <>
            <Text style={styles.riskText}>
              จุดเสี่ยงในรัศมี {RADIUS_LABEL} <Text style={styles.riskCount}>{count} จุด</Text>
            </Text>
            <View style={styles.highestRow}>
              <Text style={styles.highestLabel}>สูงสุด</Text>
              <RiskBadge riskLevel={highest.riskLevel} score={highest.riskScore} hasStatistics={highest.hasStatistics} />
            </View>
          </>
        ) : (
          <Text style={styles.noDataText}>ยังไม่มีข้อมูลจุดเสี่ยงในรัศมี {RADIUS_LABEL}</Text>
        )}
      </View>

      <View style={styles.buttonRow}>
        <Button variant="secondary" size="sm" icon="map-outline" title="ดูบนแผนที่" onPress={onShowMap} style={styles.button} />
        <Button variant="primary" size="sm" icon="navigate" title="นำทาง" onPress={onNavigate} style={styles.button} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  emojiTile: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.page,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 22,
    lineHeight: 28,
  },
  titleBox: {
    flex: 1,
  },
  name: {
    ...TEXT.h3,
    fontSize: 16,
    color: COLORS.text,
  },
  district: {
    ...TEXT.small,
    color: COLORS.textMuted,
  },
  riskBox: {
    // จองความสูงเท่ากันทุกใบ ปุ่มจึงอยู่แนวเดียวกันเมื่อเรียงเป็นตาราง
    minHeight: 50,
    gap: 4,
  },
  riskText: {
    ...TEXT.small,
    color: COLORS.textSecondary,
  },
  riskCount: {
    ...TEXT.smallStrong,
    color: COLORS.text,
  },
  highestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  highestLabel: {
    ...TEXT.small,
    color: COLORS.textMuted,
  },
  noDataText: {
    ...TEXT.small,
    color: COLORS.textMuted,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    // การ์ดยืดสูงเท่าใบอื่นในแถว (components/Grid.js) ปุ่มจึงชิดล่างเสมอ
    marginTop: 'auto',
  },
  button: {
    flex: 1,
  },
});
