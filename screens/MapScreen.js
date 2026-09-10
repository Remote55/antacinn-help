/**
 * หน้าแผนที่ — เห็นภาพรวมว่าบริเวณไหนควรระวัง
 *
 * หมุดจะเปลี่ยนสีตามคะแนนความเสี่ยง ณ เวลาปัจจุบัน
 * เช่น จุดที่อันตรายเฉพาะกลางคืน จะเป็นสีเหลืองตอนกลางวัน แต่แดงตอนกลางคืน
 *
 * เปิดมาจากปุ่ม "ดูบนแผนที่" ของการ์ดสถานที่ได้ด้วย (ส่ง focusPlaceId มาทาง params)
 * แผนที่จะเลื่อนไปที่สถานที่นั้น ซูมให้เห็นจุดเสี่ยงในรัศมี 2 กม. และปักหมุดชื่อสถานที่ไว้
 */

import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppMap from '../components/AppMap';
import FilterChips from '../components/FilterChips';
import { useRiskPoints } from '../hooks/useRiskPoints';
import { usePlaces } from '../hooks/usePlaces';
import { useUserLocation } from '../hooks/useUserLocation';
import { DEFAULT_REGION } from '../constants/config';
import { COLORS, SPACING, FONT_SIZES, RADIUS } from '../constants/theme';

/** ซูมตอนเปิดดูสถานที่ ประมาณ 5.5 กม. พอเห็นจุดเสี่ยงรอบสถานที่ในรัศมี 2 กม. */
const PLACE_FOCUS_DELTA = 0.05;

export default function MapScreen({ navigation, route }) {
  const [typeFilter, setTypeFilter] = useState([]);
  const [region, setRegion] = useState(DEFAULT_REGION);
  const [highlight, setHighlight] = useState(null);

  const { filteredPoints } = useRiskPoints({ typeFilter });
  const { findPlaceById } = usePlaces();
  const { location, fetchCurrentLocation } = useUserLocation();

  // เปิดมาจากการ์ดสถานที่ในหน้าแรก requestId เปลี่ยนทุกครั้งที่กด จึงกดสถานที่เดิมซ้ำได้
  const params = (route && route.params) || {};
  useEffect(() => {
    if (!params.requestId) return;
    const place = findPlaceById(params.focusPlaceId);
    if (!place) return;

    setHighlight({ lat: place.coordinate.lat, lng: place.coordinate.lng, label: place.name });
    setRegion({
      latitude: place.coordinate.lat,
      longitude: place.coordinate.lng,
      latitudeDelta: PLACE_FOCUS_DELTA,
      longitudeDelta: PLACE_FOCUS_DELTA,
    });
    // ตั้งใจให้ทำงานเฉพาะตอนมีคำขอใหม่ ไม่ใช่ทุกครั้งที่ข้อมูลจุดเสี่ยงเปลี่ยน
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.requestId]);

  /** แปลงจุดเสี่ยงให้อยู่ในรูปแบบที่ AppMap ต้องการ */
  const markers = filteredPoints.map((point) => ({
    id: point.id,
    lat: point.coordinate.lat,
    lng: point.coordinate.lng,
    color: point.riskLevel.color,
    label: point.name,
  }));

  /** ปุ่มกลับมาที่ตำแหน่งตัวเอง */
  async function goToMyLocation() {
    const coordinate = await fetchCurrentLocation();
    if (coordinate) {
      setRegion({
        latitude: coordinate.lat,
        longitude: coordinate.lng,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      });
    }
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.filterBar}>
        <FilterChips selectedIds={typeFilter} onChange={setTypeFilter} />
        <Text style={styles.countText}>แสดง {filteredPoints.length} จุด</Text>
      </View>

      <View style={styles.mapContainer}>
        <AppMap
          region={region}
          markers={markers}
          userLocation={location}
          highlight={highlight}
          onMarkerPress={(pointId) => navigation.navigate('RiskDetail', { pointId })}
        />

        {highlight && (
          <View style={styles.highlightChip}>
            <Text style={styles.highlightText} numberOfLines={1}>
              📍 {highlight.label}
            </Text>
            <Pressable onPress={() => setHighlight(null)} hitSlop={8} accessibilityLabel="ซ่อนหมุดสถานที่">
              <Text style={styles.highlightClose}>✕</Text>
            </Pressable>
          </View>
        )}

        <Pressable style={styles.locateButton} onPress={goToMyLocation}>
          <Text style={styles.locateIcon}>📍</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  filterBar: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  countText: {
    fontSize: FONT_SIZES.small,
    color: COLORS.textMuted,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  mapContainer: {
    flex: 1,
  },
  highlightChip: {
    position: 'absolute',
    top: SPACING.sm,
    left: SPACING.md,
    right: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  highlightText: {
    flex: 1,
    fontSize: FONT_SIZES.body,
    fontWeight: '600',
    color: COLORS.text,
  },
  highlightClose: {
    fontSize: FONT_SIZES.subtitle,
    color: COLORS.textMuted,
  },
  locateButton: {
    position: 'absolute',
    right: SPACING.md,
    bottom: SPACING.lg,
    width: 48,
    height: 48,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  locateIcon: {
    fontSize: FONT_SIZES.title,
  },
});
