/**
 * หน้าวางแผนเส้นทาง — ระยะ "ก่อนเดินทาง"
 *
 * ผู้ใช้เลือกต้นทางกับปลายทาง แล้วเห็นล่วงหน้าว่าจะเจอจุดเสี่ยงอะไรบ้างระหว่างทาง
 * เรียงตามลำดับที่จะขับผ่านจริง ไม่ใช่เรียงตามความใกล้เส้นทาง
 *
 * เลือกได้สองแบบ (เอกสารตาราง 3.1 และบทที่ 4 "เลือกต้นทางปลายทาง"):
 *   - เส้นทางแนะนำ: กดชิปเดียวได้ทั้งต้นทางและปลายทาง
 *   - เลือกเอง: ต้นทางเป็น "ตำแหน่งของฉัน" หรือสถานที่ใดก็ได้ ปลายทางเป็นสถานที่ใดก็ได้
 *
 * เปิดมาจากปุ่ม "นำทางไปที่นี่" ในหน้าแรกได้ด้วย (ส่ง destinationPlaceId มาทาง params)
 */

import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppMap from '../components/AppMap';
import RiskPointCard from '../components/RiskPointCard';
import RiskBadge from '../components/RiskBadge';
import RouteEndpoints from '../components/RouteEndpoints';
import PlacePicker from '../components/PlacePicker';
import presetRoutes from '../data/presetRoutes.json';
import { useRiskPoints } from '../hooks/useRiskPoints';
import { usePlaces } from '../hooks/usePlaces';
import { useUserLocation } from '../hooks/useUserLocation';
import { getRouteWithFallback } from '../utils/routing';
import { buildRouteRequest, placeToEndpoint, myLocationToEndpoint } from '../utils/routeRequest';
import { findRiskPointsAlongRoute, calculateRouteRiskScore } from '../utils/routeAnalysis';
import { getRiskLevel } from '../utils/riskScore';
import { isInServiceArea } from '../utils/geo';
import { formatDistance, formatDuration } from '../utils/format';
import { DISTANCE, DEFAULT_REGION } from '../constants/config';
import { COLORS, SPACING, FONT_SIZES, RADIUS } from '../constants/theme';

/** บอกผู้ใช้ตรง ๆ เมื่อเส้นทางไม่ได้มาจากอินเทอร์เน็ต จะได้ไม่เข้าใจผิดว่าเป็นเส้นทางจริง */
const ROUTE_SOURCE_NOTES = {
  offline: '⚠️ เชื่อมต่ออินเทอร์เน็ตไม่ได้ กำลังแสดงเส้นทางโดยประมาณที่เก็บไว้ในเครื่อง',
  straight:
    '⚠️ เชื่อมต่ออินเทอร์เน็ตไม่ได้ และเส้นทางนี้ไม่มีข้อมูลสำรองในเครื่อง ' +
    'กำลังแสดงเส้นตรงระหว่างต้นทางกับปลายทาง ซึ่งไม่ใช่ถนนจริง จุดเสี่ยงที่แสดงเป็นเพียงค่าประมาณ',
};

/** จัดกล้องให้เห็นทั้งต้นทางและปลายทาง */
function regionFor(origin, destination) {
  if (!origin || !destination) return DEFAULT_REGION;
  return {
    latitude: (origin.lat + destination.lat) / 2,
    longitude: (origin.lng + destination.lng) / 2,
    latitudeDelta: Math.abs(origin.lat - destination.lat) * 2 + 0.05,
    longitudeDelta: Math.abs(origin.lng - destination.lng) * 2 + 0.05,
  };
}

export default function RoutePlannerScreen({ navigation, route }) {
  const [origin, setOrigin] = useState(presetRoutes[0].origin);
  const [destination, setDestination] = useState(presetRoutes[0].destination);
  const [pickerTarget, setPickerTarget] = useState(null); // 'origin' | 'destination' | null
  const [isLocating, setIsLocating] = useState(false);
  const [locationNote, setLocationNote] = useState(null);
  const [routeResult, setRouteResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const { allPoints } = useRiskPoints();
  const { places, findPlaceById } = usePlaces();
  const { fetchCurrentLocation } = useUserLocation();

  // ต้นทางหรือปลายทางเปลี่ยน = คำขอเส้นทางใหม่
  // ถ้าตรงกับเส้นทางแนะนำ คำขอจะมีเส้นทางสำรองออฟไลน์ติดมาด้วย (utils/routeRequest.js)
  const { request: routeRequest, problem: routeProblem } = useMemo(
    () => buildRouteRequest(origin, destination, presetRoutes),
    [origin, destination]
  );

  // ดึงเส้นทางใหม่ทุกครั้งที่คำขอเปลี่ยน
  useEffect(() => {
    if (!routeRequest) {
      setRouteResult(null);
      setIsLoading(false);
      return undefined;
    }

    let isCancelled = false;
    setIsLoading(true);
    getRouteWithFallback(routeRequest).then((result) => {
      // ผู้ใช้เปลี่ยนต้นทางปลายทางระหว่างรอ ผลของคำขอเก่าต้องไม่มาทับของใหม่
      if (!isCancelled) {
        setRouteResult(result);
        setIsLoading(false);
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [routeRequest]);

  /** ใช้ตำแหน่งปัจจุบันเป็นต้นทาง ถ้าหาไม่ได้หรืออยู่นอกพื้นที่ บอกผู้ใช้และคงต้นทางเดิมไว้ */
  async function pickMyLocationAsOrigin() {
    setPickerTarget(null);
    setLocationNote(null);
    setIsLocating(true);
    const coordinate = await fetchCurrentLocation();
    setIsLocating(false);

    if (!coordinate) {
      setLocationNote(
        'หาตำแหน่งปัจจุบันไม่ได้ (ไม่ได้รับอนุญาต หรือสัญญาณ GPS ไม่พอ) ' +
          'จึงยังใช้ต้นทางเดิม แตะช่องต้นทางเพื่อเลือกสถานที่แทน'
      );
      return;
    }
    if (!isInServiceArea(coordinate)) {
      setLocationNote(
        'ตำแหน่งของคุณอยู่นอกพื้นที่หาดใหญ่–สงขลาที่แอปมีข้อมูล ' +
          'จึงยังใช้ต้นทางเดิม แตะช่องต้นทางเพื่อเลือกสถานที่แทน'
      );
      return;
    }
    setOrigin(myLocationToEndpoint(coordinate));
  }

  function selectPlace(place) {
    const endpoint = placeToEndpoint(place);
    if (pickerTarget === 'origin') setOrigin(endpoint);
    else setDestination(endpoint);
    setPickerTarget(null);
  }

  function selectPreset(preset) {
    setOrigin(preset.origin);
    setDestination(preset.destination);
    setLocationNote(null);
  }

  function swapEndpoints() {
    setOrigin(destination);
    setDestination(origin);
  }

  // เปิดมาจากปุ่ม "นำทางไปที่นี่" ในหน้าแรก: ปลายทางเป็นสถานที่นั้น ต้นทางเป็นตำแหน่งปัจจุบัน
  // requestId เปลี่ยนทุกครั้งที่กด จึงกดสถานที่เดิมซ้ำได้
  const params = (route && route.params) || {};
  useEffect(() => {
    if (!params.requestId) return;
    const place = findPlaceById(params.destinationPlaceId);
    if (!place) return;

    setPickerTarget(null);
    setDestination(placeToEndpoint(place));
    pickMyLocationAsOrigin();
    // ตั้งใจให้ทำงานเฉพาะตอนมีคำขอใหม่จากหน้าแรก ไม่ใช่ทุกครั้งที่ข้อมูลเปลี่ยน
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.requestId]);

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

  /** ส่งเส้นทางไปให้โหมดเดินทาง เพื่อให้รู้ว่าผู้ใช้อยู่ตรงไหนของเส้นทาง */
  function startTrip(mode) {
    if (!routeResult || !routeRequest) return;
    navigation.navigate('TripMode', {
      mode,
      routeCoordinates: routeResult.coordinates,
      routeLabel: routeRequest.label,
    });
  }

  const canStart = Boolean(routeResult) && !isLoading;

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <RouteEndpoints
        origin={origin}
        destination={destination}
        activeTarget={pickerTarget}
        isLocating={isLocating}
        onPressOrigin={() => setPickerTarget('origin')}
        onPressDestination={() => setPickerTarget('destination')}
        onSwap={swapEndpoints}
      />
      {locationNote && <Text style={styles.locationNote}>{locationNote}</Text>}

      {pickerTarget ? (
        <PlacePicker
          title={pickerTarget === 'origin' ? 'เลือกต้นทาง' : 'เลือกปลายทาง'}
          places={places}
          showMyLocation={pickerTarget === 'origin'}
          onSelectPlace={selectPlace}
          onSelectMyLocation={pickMyLocationAsOrigin}
          onCancel={() => setPickerTarget(null)}
        />
      ) : (
        <>
          {/* เส้นทางแนะนำ: ทางลัดที่มีเส้นทางสำรองออฟไลน์ */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipRow}
          >
            <Text style={styles.chipHint}>แนะนำ</Text>
            {presetRoutes.map((preset) => {
              const isSelected = Boolean(routeRequest) && routeRequest.id === preset.id;
              return (
                <Pressable
                  key={preset.id}
                  style={[styles.chip, isSelected && styles.chipSelected]}
                  onPress={() => selectPreset(preset)}
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
              region={regionFor(origin, destination)}
              markers={markers}
              polyline={routeResult ? routeResult.coordinates : null}
            />
          </View>

          <ScrollView contentContainerStyle={styles.list}>
            {routeProblem ? (
              <Text style={styles.problemText}>{routeProblem}</Text>
            ) : isLoading || !routeResult ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator color={COLORS.primary} />
                <Text style={styles.loadingText}>กำลังหาเส้นทาง...</Text>
              </View>
            ) : (
              <>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryText}>พบจุดเสี่ยง {pointsOnRoute.length} จุดบนเส้นทางนี้</Text>
                  {routeResult.distanceM !== null && (
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

                {ROUTE_SOURCE_NOTES[routeResult.source] && (
                  <Text style={styles.offlineNote}>{ROUTE_SOURCE_NOTES[routeResult.source]}</Text>
                )}

                {pointsOnRoute.map((item) => (
                  <RiskPointCard
                    key={item.point.id}
                    point={item.point}
                    distanceLabel={formatDistance(item.distanceAlongRouteM)}
                    onPress={() => navigation.navigate('RiskDetail', { pointId: item.point.id })}
                  />
                ))}

                <View style={styles.startRow}>
                  {/* โหมดจำลอง: สาธิตการเตือนได้โดยไม่ต้องขับรถจริง (แก้ปัญหาในเอกสารบทที่ 7.3) */}
                  <Pressable
                    style={[styles.startButton, !canStart && styles.startButtonDisabled]}
                    disabled={!canStart}
                    onPress={() => startTrip('simulate')}
                  >
                    <Text style={styles.startButtonText}>▶ จำลองการเดินทาง</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.startButton, styles.gpsButton, !canStart && styles.startButtonDisabled]}
                    disabled={!canStart}
                    onPress={() => startTrip('gps')}
                  >
                    <Text style={styles.startButtonText}>📍 เริ่มจริงด้วย GPS</Text>
                  </Pressable>
                </View>
              </>
            )}
          </ScrollView>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  locationNote: {
    fontSize: FONT_SIZES.small,
    color: COLORS.danger,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
  },
  chipRow: {
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  chipHint: {
    fontSize: FONT_SIZES.small,
    color: COLORS.textMuted,
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
  problemText: {
    fontSize: FONT_SIZES.body,
    color: COLORS.textMuted,
    textAlign: 'center',
    paddingVertical: SPACING.xl,
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
  startRow: {
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  startButton: {
    backgroundColor: COLORS.primary,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  gpsButton: {
    backgroundColor: COLORS.primaryDark,
  },
  startButtonDisabled: {
    opacity: 0.5,
  },
  startButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.subtitle,
    fontWeight: 'bold',
  },
});
