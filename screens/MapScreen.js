/**
 * หน้าแผนที่ — เห็นภาพรวมว่าบริเวณไหนควรระวัง
 *
 * หมุดจะเปลี่ยนสีตามคะแนนความเสี่ยง ณ เวลาปัจจุบัน
 * เช่น จุดที่อันตรายเฉพาะกลางคืน จะเป็นสีเหลืองตอนกลางวัน แต่แดงตอนกลางคืน
 *
 * จอกว้าง: แผงซ้ายมีตัวกรองและรายการจุดเรียงตามความเสี่ยง กดแล้วแผนที่เลื่อนไปที่จุดนั้น
 *          แผนที่ใช้พื้นที่ที่เหลือทั้งหมด (แบบเว็บแผนที่ทั่วไป)
 * มือถือ: แผนที่เต็มจอ ตัวกรองอยู่ด้านบน
 *
 * เปิดมาจากปุ่ม "ดูบนแผนที่" ของการ์ดสถานที่ได้ด้วย (ส่ง focusPlaceId มาทาง params)
 * แผนที่จะเลื่อนไปที่สถานที่นั้น ซูมให้เห็นจุดเสี่ยงในรัศมี 2 กม. และปักหมุดชื่อสถานที่ไว้
 */

import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppMap from '../components/AppMap';
import FilterChips from '../components/FilterChips';
import MapLegend from '../components/MapLegend';
import PointListItem from '../components/PointListItem';
import Icon from '../components/Icon';
import { useRiskPoints } from '../hooks/useRiskPoints';
import { usePlaces } from '../hooks/usePlaces';
import { useUserLocation } from '../hooks/useUserLocation';
import { useLayout } from '../hooks/useLayout';
import { pointToMarker } from '../utils/mapMarkers';
import { DEFAULT_REGION } from '../constants/config';
import { COLORS, TEXT, SPACING, RADIUS, SHADOWS, LAYOUT } from '../constants/theme';

/** ซูมตอนเปิดดูสถานที่ ประมาณ 5.5 กม. พอเห็นจุดเสี่ยงรอบสถานที่ในรัศมี 2 กม. */
const PLACE_FOCUS_DELTA = 0.05;
/** ซูมตอนเลือกจุดจากรายการ ประมาณ 2 กม. เห็นถนนรอบจุด */
const POINT_FOCUS_DELTA = 0.02;

export default function MapScreen({ navigation, route }) {
  const { isWide } = useLayout();
  const [typeFilter, setTypeFilter] = useState([]);
  const [region, setRegion] = useState(DEFAULT_REGION);
  const [highlight, setHighlight] = useState(null);
  const [selectedPointId, setSelectedPointId] = useState(null);

  const { filteredPoints } = useRiskPoints({ typeFilter });
  const { findPlaceById } = usePlaces();
  const { location, fetchCurrentLocation } = useUserLocation();

  // เปิดมาจากการ์ดสถานที่ในหน้าแรก requestId เปลี่ยนทุกครั้งที่กด จึงกดสถานที่เดิมซ้ำได้
  const params = (route && route.params) || {};
  useEffect(() => {
    if (!params.requestId) return;
    const place = findPlaceById(params.focusPlaceId);
    if (!place) return;

    setSelectedPointId(null);
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

  const markers = filteredPoints.map(pointToMarker);
  const officialCount = filteredPoints.filter((point) => point.verified === true).length;
  const pointsByRisk = useMemo(
    () => [...filteredPoints].sort((a, b) => b.riskScore - a.riskScore),
    [filteredPoints]
  );

  function openDetail(pointId) {
    navigation.navigate('RiskDetail', { pointId });
  }

  /** เลือกจุดจากรายการ: เลื่อนแผนที่ไปที่จุด และปักป้ายชื่อไว้ */
  function focusPoint(point) {
    setSelectedPointId(point.id);
    setHighlight({ lat: point.coordinate.lat, lng: point.coordinate.lng, label: point.name });
    setRegion({
      latitude: point.coordinate.lat,
      longitude: point.coordinate.lng,
      latitudeDelta: POINT_FOCUS_DELTA,
      longitudeDelta: POINT_FOCUS_DELTA,
    });
  }

  function clearHighlight() {
    setHighlight(null);
    setSelectedPointId(null);
  }

  /** ปุ่มกลับมาที่ตำแหน่งตัวเอง */
  async function goToMyLocation() {
    const coordinate = await fetchCurrentLocation();
    if (coordinate) {
      setRegion({
        latitude: coordinate.lat,
        longitude: coordinate.lng,
        latitudeDelta: POINT_FOCUS_DELTA,
        longitudeDelta: POINT_FOCUS_DELTA,
      });
    }
  }

  const countText = `แสดง ${filteredPoints.length} จุด · ข้อมูลทางการ ${officialCount} จุด`;

  const mapArea = (
    <View style={styles.mapArea}>
      <AppMap
        region={region}
        markers={markers}
        userLocation={location}
        highlight={highlight}
        onMarkerPress={openDetail}
      />

      {highlight && (
        <View style={styles.highlightChip}>
          <Icon name="location" size={18} color={COLORS.primary} />
          <Text style={styles.highlightText} numberOfLines={1}>
            {highlight.label}
          </Text>
          <Pressable onPress={clearHighlight} hitSlop={8} accessibilityRole="button" accessibilityLabel="ซ่อนหมุดที่เลือก">
            <Icon name="close" size={20} color={COLORS.textMuted} />
          </Pressable>
        </View>
      )}

      <MapLegend />

      <Pressable
        style={({ hovered }) => [styles.locateButton, hovered && styles.locateButtonHovered]}
        onPress={goToMyLocation}
        accessibilityRole="button"
        accessibilityLabel="ไปที่ตำแหน่งของฉัน"
      >
        <Icon name="locate" size={22} color={COLORS.primary} />
      </Pressable>
    </View>
  );

  if (isWide) {
    return (
      <View style={styles.wideScreen}>
        <View style={styles.sidePanel}>
          <View style={styles.panelHeader}>
            <Text style={styles.panelTitle} accessibilityRole="header">
              แผนที่จุดเสี่ยง
            </Text>
            <Text style={styles.panelSubtitle}>{countText} · เรียงจากเสี่ยงมากไปน้อย ณ ตอนนี้</Text>
            <FilterChips selectedIds={typeFilter} onChange={setTypeFilter} wrap />
          </View>

          <ScrollView contentContainerStyle={styles.panelList}>
            {pointsByRisk.map((point) => (
              <PointListItem
                key={point.id}
                point={point}
                isSelected={point.id === selectedPointId}
                onSelect={() => focusPoint(point)}
                onOpenDetail={() => openDetail(point.id)}
              />
            ))}
            {pointsByRisk.length === 0 && (
              <Text style={styles.emptyText}>ไม่มีจุดเสี่ยงประเภทที่เลือก ลองเลือกประเภทอื่น</Text>
            )}
          </ScrollView>
        </View>

        {mapArea}
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.filterBar}>
        <FilterChips selectedIds={typeFilter} onChange={setTypeFilter} />
        <Text style={styles.countText}>{countText}</Text>
      </View>
      {mapArea}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.card,
  },
  wideScreen: {
    flex: 1,
    flexDirection: 'row',
  },
  sidePanel: {
    width: LAYOUT.SIDE_PANEL_WIDTH,
    backgroundColor: COLORS.card,
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
  },
  panelHeader: {
    padding: SPACING.lg,
    paddingBottom: SPACING.md,
    gap: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  panelTitle: {
    ...TEXT.h1,
    color: COLORS.text,
  },
  panelSubtitle: {
    ...TEXT.small,
    color: COLORS.textMuted,
    marginBottom: SPACING.xs,
  },
  panelList: {
    padding: 12,
    gap: SPACING.xs,
  },
  emptyText: {
    ...TEXT.body,
    color: COLORS.textMuted,
    padding: SPACING.md,
  },
  filterBar: {
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  countText: {
    ...TEXT.small,
    color: COLORS.textMuted,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  mapArea: {
    flex: 1,
  },
  highlightChip: {
    position: 'absolute',
    top: SPACING.md,
    left: SPACING.md,
    right: SPACING.md,
    maxWidth: 420,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.pill,
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    ...SHADOWS.raised,
  },
  highlightText: {
    flex: 1,
    ...TEXT.bodyStrong,
    color: COLORS.text,
  },
  locateButton: {
    position: 'absolute',
    right: SPACING.md,
    bottom: SPACING.lg,
    width: 48,
    height: 48,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    ...SHADOWS.raised,
  },
  locateButtonHovered: {
    backgroundColor: COLORS.primarySoft,
  },
});
