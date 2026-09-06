/**
 * หน้าแผนที่ — เห็นภาพรวมว่าบริเวณไหนควรระวัง
 *
 * หมุดจะเปลี่ยนสีตามคะแนนความเสี่ยง ณ เวลาปัจจุบัน
 * เช่น จุดที่อันตรายเฉพาะกลางคืน จะเป็นสีเหลืองตอนกลางวัน แต่แดงตอนกลางคืน
 */

import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppMap from '../components/AppMap';
import FilterChips from '../components/FilterChips';
import { useRiskPoints } from '../hooks/useRiskPoints';
import { useUserLocation } from '../hooks/useUserLocation';
import { DEFAULT_REGION } from '../constants/config';
import { COLORS, SPACING, FONT_SIZES, RADIUS } from '../constants/theme';

export default function MapScreen({ navigation }) {
  const [typeFilter, setTypeFilter] = useState([]);
  const [region, setRegion] = useState(DEFAULT_REGION);

  const { filteredPoints } = useRiskPoints({ typeFilter });
  const { location, fetchCurrentLocation } = useUserLocation();

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
          onMarkerPress={(pointId) => navigation.navigate('RiskDetail', { pointId })}
        />

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
