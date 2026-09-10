/**
 * หน้าวางแผนเส้นทาง — ระยะ "ก่อนเดินทาง"
 *
 * ผู้ใช้เลือกเส้นทาง แล้วเห็นล่วงหน้าว่าจะเจอจุดเสี่ยงอะไรบ้างระหว่างทาง
 * เรียงตามลำดับที่จะขับผ่านจริง ไม่ใช่เรียงตามความใกล้เส้นทาง
 */

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppMap from '../components/AppMap';
import RiskPointCard from '../components/RiskPointCard';
import RiskBadge from '../components/RiskBadge';
import presetRoutes from '../data/presetRoutes.json';
import { useRiskPoints } from '../hooks/useRiskPoints';
import { getRouteWithFallback } from '../utils/routing';
import { findRiskPointsAlongRoute, calculateRouteRiskScore } from '../utils/routeAnalysis';
import { getRiskLevel } from '../utils/riskScore';
import { formatDistance, formatDuration } from '../utils/format';
import { DISTANCE } from '../constants/config';
import { COLORS, SPACING, FONT_SIZES, RADIUS } from '../constants/theme';

export default function RoutePlannerScreen({ navigation }) {
  const [selectedRouteId, setSelectedRouteId] = useState(presetRoutes[0].id);
  const [routeResult, setRouteResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const { allPoints } = useRiskPoints();

  const selectedRoute = presetRoutes.find((r) => r.id === selectedRouteId);

  // ดึงเส้นทางใหม่ทุกครั้งที่ผู้ใช้เลือกเส้นทางอื่น
  useEffect(() => {
    let isCancelled = false;

    async function loadRoute() {
      setIsLoading(true);
      const result = await getRouteWithFallback(selectedRoute);
      if (!isCancelled) {
        setRouteResult(result);
        setIsLoading(false);
      }
    }

    loadRoute();
    return () => {
      isCancelled = true;
    };
  }, [selectedRouteId, selectedRoute]);

  // หาจุดเสี่ยงบนเส้นทาง เรียงตามลำดับที่จะขับผ่าน
  const pointsOnRoute = routeResult
    ? findRiskPointsAlongRoute(routeResult.coordinates, allPoints, DISTANCE.ON_ROUTE_THRESHOLD, {
        destinationRadiusM: DISTANCE.DESTINATION_RADIUS,
      })
    : [];

  // คะแนนความปลอดภัยรวมของเส้นทาง ตามที่เอกสารบทที่ 4 กำหนดให้หน้านี้ต้องแสดง
  const routeRiskScore = calculateRouteRiskScore(pointsOnRoute);
  const routeRiskLevel = getRiskLevel(routeRiskScore);

  const markers = pointsOnRoute.map((item) => ({
    id: item.point.id,
    lat: item.point.coordinate.lat,
    lng: item.point.coordinate.lng,
    color: item.point.riskLevel.color,
    label: item.point.name,
  }));

  // จัดกล้องให้เห็นทั้งเส้นทาง โดยวางกึ่งกลางระหว่างต้นทางกับปลายทาง
  const region = {
    latitude: (selectedRoute.origin.lat + selectedRoute.destination.lat) / 2,
    longitude: (selectedRoute.origin.lng + selectedRoute.destination.lng) / 2,
    latitudeDelta: Math.abs(selectedRoute.origin.lat - selectedRoute.destination.lat) * 2 + 0.05,
    longitudeDelta: Math.abs(selectedRoute.origin.lng - selectedRoute.destination.lng) * 2 + 0.05,
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      {/* ชิปเลือกเส้นทาง */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
      >
        {presetRoutes.map((preset) => {
          const isSelected = preset.id === selectedRouteId;
          return (
            <Pressable
              key={preset.id}
              style={[styles.chip, isSelected && styles.chipSelected]}
              onPress={() => setSelectedRouteId(preset.id)}
            >
              <Text style={[styles.chipLabel, isSelected && styles.chipLabelSelected]}>
                {preset.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.mapContainer}>
        <AppMap
          region={region}
          markers={markers}
          polyline={routeResult ? routeResult.coordinates : null}
        />
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {isLoading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={COLORS.primary} />
            <Text style={styles.loadingText}>กำลังหาเส้นทาง...</Text>
          </View>
        ) : (
          <>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryText}>
                พบจุดเสี่ยง {pointsOnRoute.length} จุดบนเส้นทางนี้
              </Text>
              {routeResult && routeResult.distanceM !== null && (
                <Text style={styles.summaryMeta}>
                  {formatDistance(routeResult.distanceM)} · {formatDuration(routeResult.durationS)}
                </Text>
              )}

              {/* คะแนนความปลอดภัยรวมของทั้งเส้นทาง */}
              <View style={styles.scoreRow}>
                <Text style={styles.scoreLabel}>คะแนนความเสี่ยงรวมของเส้นทาง</Text>
                <RiskBadge riskLevel={routeRiskLevel} score={routeRiskScore} />
              </View>
            </View>

            {/* บอกผู้ใช้ตรง ๆ ว่ากำลังใช้เส้นทางสำรอง จะได้ไม่เข้าใจผิดว่าเป็นเส้นทางจริง */}
            {routeResult && routeResult.source === 'offline' && (
              <Text style={styles.offlineNote}>
                ⚠️ เชื่อมต่ออินเทอร์เน็ตไม่ได้ กำลังแสดงเส้นทางโดยประมาณที่เก็บไว้ในเครื่อง
              </Text>
            )}

            {pointsOnRoute.map((item) => (
              <RiskPointCard
                key={item.point.id}
                point={item.point}
                distanceLabel={formatDistance(item.distanceAlongRouteM)}
                onPress={() => navigation.navigate('RiskDetail', { pointId: item.point.id })}
              />
            ))}

            <Pressable
              style={styles.startButton}
              onPress={() => navigation.navigate('TripMode')}
            >
              <Text style={styles.startButtonText}>เริ่มโหมดเดินทาง</Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  chipRow: {
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  chip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipLabel: {
    fontSize: FONT_SIZES.body,
    color: COLORS.text,
  },
  chipLabelSelected: {
    color: COLORS.white,
    fontWeight: '600',
  },
  mapContainer: {
    height: 240,
  },
  list: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  loadingBox: {
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.xl,
  },
  loadingText: {
    fontSize: FONT_SIZES.body,
    color: COLORS.textMuted,
  },
  summaryRow: {
    marginBottom: SPACING.md,
    gap: SPACING.xs,
  },
  summaryText: {
    fontSize: FONT_SIZES.subtitle,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  summaryMeta: {
    fontSize: FONT_SIZES.body,
    color: COLORS.textMuted,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.sm,
    gap: SPACING.sm,
  },
  scoreLabel: {
    fontSize: FONT_SIZES.body,
    color: COLORS.text,
  },
  offlineNote: {
    fontSize: FONT_SIZES.small,
    color: COLORS.textMuted,
    marginBottom: SPACING.md,
  },
  startButton: {
    backgroundColor: COLORS.primary,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  startButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.subtitle,
    fontWeight: 'bold',
  },
});
