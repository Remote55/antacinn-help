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
 * จอกว้าง: แผงซ้ายมีช่องต้นทาง/ปลายทาง สรุปเส้นทาง ปุ่มเริ่ม และรายการจุด แผนที่ใหญ่ทางขวา
 * มือถือ: เรียงลงมา แผนที่สูง 240
 *
 * เปิดมาจากปุ่ม "นำทาง" ในหน้าแรกได้ด้วย (ส่ง destinationPlaceId มาทาง params)
 */

import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppMap from '../components/AppMap';
import RiskPointCard from '../components/RiskPointCard';
import RiskBadge from '../components/RiskBadge';
import RouteEndpoints from '../components/RouteEndpoints';
import PlacePicker from '../components/PlacePicker';
import Card from '../components/Card';
import Chip from '../components/Chip';
import Button from '../components/Button';
import Icon from '../components/Icon';
import presetRoutes from '../data/presetRoutes.json';
import { useRiskPoints } from '../hooks/useRiskPoints';
import { usePlaces } from '../hooks/usePlaces';
import { useUserLocation } from '../hooks/useUserLocation';
import { useLayout } from '../hooks/useLayout';
import { getRouteWithFallback } from '../utils/routing';
import { buildRouteRequest, placeToEndpoint, myLocationToEndpoint } from '../utils/routeRequest';
import { findRiskPointsAlongRoute, calculateRouteRiskScore } from '../utils/routeAnalysis';
import { getRiskLevel } from '../utils/riskScore';
import { isInServiceArea } from '../utils/geo';
import { formatDistance, formatDuration } from '../utils/format';
import { pointToMarker } from '../utils/mapMarkers';
import { DISTANCE, DEFAULT_REGION } from '../constants/config';
import { COLORS, TEXT, SPACING, RADIUS, LAYOUT } from '../constants/theme';

/** บอกผู้ใช้ตรง ๆ เมื่อเส้นทางไม่ได้มาจากอินเทอร์เน็ต จะได้ไม่เข้าใจผิดว่าเป็นเส้นทางจริง */
const ROUTE_SOURCE_NOTES = {
  offline: 'เชื่อมต่ออินเทอร์เน็ตไม่ได้ กำลังแสดงเส้นทางโดยประมาณที่เก็บไว้ในเครื่อง',
  straight:
    'เชื่อมต่ออินเทอร์เน็ตไม่ได้ และเส้นทางนี้ไม่มีข้อมูลสำรองในเครื่อง ' +
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

function SummaryStat({ label, value }) {
  return (
    <View style={styles.summaryStat}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

export default function RoutePlannerScreen({ navigation, route }) {
  const { isWide } = useLayout();
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
    if (pickerTarget === 'origin') {
      setOrigin(endpoint);
      // ผู้ใช้เลือกสถานที่เป็นต้นทางแล้ว ข้อความ "หาตำแหน่งไม่ได้" ก่อนหน้านี้ไม่เกี่ยวแล้ว
      setLocationNote(null);
    } else {
      setDestination(endpoint);
    }
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

  // เปิดมาจากปุ่ม "นำทาง" ในหน้าแรก: ปลายทางเป็นสถานที่นั้น ต้นทางเป็นตำแหน่งปัจจุบัน
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

  const markers = pointsOnRoute.map((item) => pointToMarker(item.point));

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

  const endpoints = (
    <View style={styles.endpointsBox}>
      <RouteEndpoints
        origin={origin}
        destination={destination}
        activeTarget={pickerTarget}
        isLocating={isLocating}
        onPressOrigin={() => setPickerTarget('origin')}
        onPressDestination={() => setPickerTarget('destination')}
        onSwap={swapEndpoints}
      />
      {locationNote && (
        <View style={styles.locationNote}>
          <Icon name="alert-circle-outline" size={16} color={COLORS.dangerDark} />
          <Text style={styles.locationNoteText}>{locationNote}</Text>
        </View>
      )}
    </View>
  );

  const picker = (
    <View style={styles.pickerBox}>
      <PlacePicker
        title={pickerTarget === 'origin' ? 'เลือกต้นทาง' : 'เลือกปลายทาง'}
        places={places}
        showMyLocation={pickerTarget === 'origin'}
        onSelectPlace={selectPlace}
        onSelectMyLocation={pickMyLocationAsOrigin}
        onCancel={() => setPickerTarget(null)}
      />
    </View>
  );

  const presets = (
    <View style={styles.presetBox}>
      <Text style={styles.presetHint}>เส้นทางแนะนำ</Text>
      <ScrollView
        horizontal={!isWide}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={isWide ? styles.presetWrap : styles.presetRow}
      >
        {presetRoutes.map((preset) => (
          <Chip
            key={preset.id}
            label={preset.label}
            selected={Boolean(routeRequest) && routeRequest.id === preset.id}
            onPress={() => selectPreset(preset)}
          />
        ))}
      </ScrollView>
    </View>
  );

  const mapView = (
    <AppMap
      region={regionFor(origin, destination)}
      markers={markers}
      polyline={routeResult ? routeResult.coordinates : null}
      fitToPolyline
      onMarkerPress={(pointId) => navigation.navigate('RiskDetail', { pointId })}
    />
  );

  let details;
  if (routeProblem) {
    details = (
      <Card style={styles.stateCard}>
        <Icon name="information-circle-outline" size={24} color={COLORS.textMuted} />
        <Text style={styles.stateText}>{routeProblem}</Text>
      </Card>
    );
  } else if (isLoading || !routeResult) {
    details = (
      <Card style={styles.stateCard}>
        <ActivityIndicator color={COLORS.primary} />
        <Text style={styles.stateText}>กำลังหาเส้นทาง...</Text>
      </Card>
    );
  } else {
    details = (
      <>
        {/* สรุปเส้นทาง และคะแนนความปลอดภัยรวมของทั้งเส้นทาง */}
        <Card style={styles.summaryCard}>
          <View style={styles.summaryStats}>
            {routeResult.distanceM !== null && (
              <SummaryStat label="ระยะทาง" value={formatDistance(routeResult.distanceM)} />
            )}
            {routeResult.distanceM !== null && (
              <SummaryStat label="เวลาขับโดยประมาณ" value={formatDuration(routeResult.durationS)} />
            )}
            <SummaryStat label="จุดเสี่ยงบนเส้นทาง" value={`${pointsOnRoute.length} จุด`} />
          </View>
          <View style={styles.scoreRow}>
            <Text style={styles.scoreLabel}>คะแนนความเสี่ยงรวมของเส้นทาง</Text>
            <RiskBadge
              riskLevel={routeRiskLevel}
              score={routeRiskScore}
              hasStatistics={pointsOnRoute.some((item) => item.point.hasStatistics)}
            />
          </View>
          {ROUTE_SOURCE_NOTES[routeResult.source] && (
            <View style={styles.sourceNote}>
              <Icon name="cloud-offline-outline" size={16} color={COLORS.caution} />
              <Text style={styles.sourceNoteText}>{ROUTE_SOURCE_NOTES[routeResult.source]}</Text>
            </View>
          )}
        </Card>

        <View style={styles.startRow}>
          {/* โหมดจำลอง: สาธิตการเตือนได้โดยไม่ต้องขับรถจริง (แก้ปัญหาในเอกสารบทที่ 7.3) */}
          <Button
            title="จำลองการเดินทาง"
            icon="play"
            size="lg"
            disabled={!canStart}
            onPress={() => startTrip('simulate')}
            style={styles.startButton}
          />
          <Button
            title="เริ่มจริงด้วย GPS"
            icon="navigate"
            size="lg"
            variant="secondary"
            disabled={!canStart}
            onPress={() => startTrip('gps')}
            style={styles.startButton}
          />
        </View>

        {pointsOnRoute.length > 0 && (
          <Text style={styles.listTitle}>จุดเสี่ยงตามลำดับที่จะผ่าน</Text>
        )}
        {pointsOnRoute.map((item) => (
          <RiskPointCard
            key={item.point.id}
            point={item.point}
            distanceLabel={formatDistance(item.distanceAlongRouteM)}
            onPress={() => navigation.navigate('RiskDetail', { pointId: item.point.id })}
          />
        ))}
      </>
    );
  }

  if (isWide) {
    return (
      <View style={styles.wideScreen}>
        <View style={styles.sidePanel}>
          <View style={styles.panelHeader}>
            <Text style={styles.panelTitle} accessibilityRole="header">
              วางแผนเส้นทาง
            </Text>
            <Text style={styles.panelSubtitle}>เห็นจุดเสี่ยงระหว่างทางก่อนออกเดินทาง เรียงตามลำดับที่จะขับผ่าน</Text>
            {endpoints}
          </View>
          {pickerTarget ? (
            picker
          ) : (
            <ScrollView contentContainerStyle={styles.panelContent}>
              {presets}
              {details}
            </ScrollView>
          )}
        </View>
        <View style={styles.mapArea}>{mapView}</View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.topBar}>
        {endpoints}
        {!pickerTarget && presets}
      </View>

      {pickerTarget ? (
        picker
      ) : (
        <>
          <View style={styles.mapNarrow}>{mapView}</View>
          <ScrollView contentContainerStyle={styles.narrowContent}>{details}</ScrollView>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.page,
  },
  wideScreen: {
    flex: 1,
    flexDirection: 'row',
  },
  sidePanel: {
    width: LAYOUT.SIDE_PANEL_WIDTH + 20,
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
  panelContent: {
    padding: SPACING.lg,
    paddingTop: SPACING.md,
    gap: 12,
  },
  mapArea: {
    flex: 1,
  },
  topBar: {
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingTop: 12,
    paddingHorizontal: SPACING.md,
    gap: 12,
  },
  endpointsBox: {
    gap: SPACING.sm,
  },
  locationNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    padding: 10,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.dangerSoft,
  },
  locationNoteText: {
    flex: 1,
    ...TEXT.small,
    color: COLORS.dangerDark,
  },
  pickerBox: {
    flex: 1,
    padding: SPACING.md,
    backgroundColor: COLORS.card,
  },
  presetBox: {
    gap: SPACING.sm,
  },
  presetHint: {
    ...TEXT.caption,
    color: COLORS.textMuted,
  },
  presetRow: {
    gap: SPACING.sm,
    paddingBottom: 12,
  },
  presetWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  mapNarrow: {
    height: 240,
  },
  narrowContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
    gap: 12,
  },
  stateCard: {
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.xl,
  },
  stateText: {
    ...TEXT.body,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  summaryCard: {
    gap: 12,
  },
  summaryStats: {
    flexDirection: 'row',
    gap: 12,
  },
  summaryStat: {
    flex: 1,
  },
  summaryLabel: {
    ...TEXT.caption,
    color: COLORS.textMuted,
  },
  summaryValue: {
    ...TEXT.h2,
    color: COLORS.text,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
  },
  scoreLabel: {
    flex: 1,
    ...TEXT.small,
    color: COLORS.textSecondary,
  },
  sourceNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    padding: 10,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.warningBackground,
  },
  sourceNoteText: {
    flex: 1,
    ...TEXT.small,
    color: COLORS.text,
  },
  // ปุ่มเต็มความกว้างซ้อนกัน ข้อความยาวจึงไม่ถูกตัดเหมือนตอนวางเคียงกันในแผงแคบ
  startRow: {
    gap: SPACING.sm,
  },
  startButton: {
    alignSelf: 'stretch',
  },
  listTitle: {
    ...TEXT.h3,
    color: COLORS.text,
    marginTop: SPACING.sm,
  },
});
