/**
 * โหมดเดินทาง — ระยะ "ระหว่างการเดินทาง"
 *
 * ติดตามตำแหน่งแล้วเตือนอัตโนมัติเมื่อเข้าใกล้จุดเสี่ยงในระยะ 500 เมตร
 * เตือนทั้งภาพ เสียงพูดภาษาไทย และการสั่น ให้ผู้ใช้รับทราบได้โดยไม่ต้องมองจอ
 * (เอกสารวัตถุประสงค์ข้อ 4 และบทที่ 3)
 *
 * ตำแหน่งมาได้สองแหล่ง ตรรกะการเตือนไม่รู้และไม่สนว่ามาจากไหน:
 *   mode 'gps'      ตำแหน่งจริงจาก GPS
 *   mode 'simulate' ตำแหน่งเสมือนที่วิ่งตามเส้นทาง (สำหรับนำเสนอและทดสอบ)
 *
 * ถ้าเริ่มจากหน้าวางแผนเส้นทาง จะรู้ด้วยว่าผู้ใช้อยู่ตรงไหนของเส้นทาง
 * และบอก "จุดเสี่ยงถัดไป อีกกี่กิโลเมตรตามเส้นทาง" (เอกสารบทที่ 5.2)
 *
 * ข้อจำกัด: ต้องเปิดแอปค้างไว้ เพราะ Expo Go ไม่รองรับการติดตามตำแหน่งแบบเบื้องหลัง
 * หน้าจอนี้จึงสั่งไม่ให้จอดับเองตลอดเวลาที่เปิดอยู่ (useScreenAwake)
 */

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppMap from '../components/AppMap';
import TripAlertCard from '../components/TripAlertCard';
import NextRiskPanel from '../components/NextRiskPanel';
import SimulationControls from '../components/SimulationControls';
import { useRiskPoints } from '../hooks/useRiskPoints';
import { useUserLocation } from '../hooks/useUserLocation';
import { useSimulatedLocation } from '../hooks/useSimulatedLocation';
import { useTripAlerts } from '../hooks/useTripAlerts';
import { useVoiceAlerts } from '../hooks/useVoiceAlerts';
import { useScreenAwake } from '../hooks/useScreenAwake';
import { findRiskPointsAlongRoute } from '../utils/routeAnalysis';
import { describeRouteStatus } from '../utils/routeProgress';
import { buildAlertMessage, buildHeadsUpMessage } from '../utils/alertMessage';
import { haversineMeters } from '../utils/geo';
import { pointToMarker } from '../utils/mapMarkers';
import { formatDistance } from '../utils/format';
import { DISTANCE, DEFAULT_REGION } from '../constants/config';
import { COLORS, SPACING, FONT_SIZES, RADIUS } from '../constants/theme';

/** เลื่อนกล้องตามผู้ใช้เมื่อขยับห่างกลางจอเกินระยะนี้ ไม่เลื่อนทุกจังหวะให้แผนที่กระตุก */
const RECENTER_DISTANCE_M = 150;

export default function TripModeScreen({ navigation, route }) {
  const params = (route && route.params) || {};
  const mode = params.mode === 'simulate' ? 'simulate' : 'gps';
  const routeCoordinates = params.routeCoordinates || null;
  const routeLabel = params.routeLabel || null;

  const { allPoints } = useRiskPoints();

  // เรียก hook ทั้งสองแบบเสมอ (กฎของ React ห้ามเรียก hook แบบมีเงื่อนไข) แต่เปิดใช้แค่แบบเดียว
  const gps = useUserLocation({ watch: mode === 'gps' });
  const simulation = useSimulatedLocation({ routeCoordinates, enabled: mode === 'simulate' });
  const location = mode === 'simulate' ? simulation.location : gps.location;

  const voice = useVoiceAlerts();
  const { announce } = voice;
  const { canKeepAwake } = useScreenAwake();
  const [currentAlert, setCurrentAlert] = useState(null);

  // เตือนเมื่อเข้าใกล้จุดเสี่ยง: ภาพ + เสียงพูด (แทรกได้) + สั่น
  const handleNewAlert = useCallback(
    (alert) => {
      setCurrentAlert(alert);
      announce(buildAlertMessage(alert.point, alert.distanceM), { interrupt: true });
    },
    [announce]
  );

  const trip = useTripAlerts({ location, points: allPoints, onNewAlert: handleNewAlert });

  // จุดเสี่ยงบนเส้นทาง คำนวณด้วยกฎเดียวกับหน้าวางแผนเส้นทาง
  const pointsOnRoute = useMemo(() => {
    if (!routeCoordinates) return [];
    return findRiskPointsAlongRoute(routeCoordinates, allPoints, DISTANCE.ON_ROUTE_THRESHOLD, {
      destinationRadiusM: DISTANCE.DESTINATION_RADIUS,
    });
  }, [routeCoordinates, allPoints]);

  const routeStatus = useMemo(() => {
    if (!routeCoordinates || !location) return null;
    return describeRouteStatus(routeCoordinates, pointsOnRoute, location, DISTANCE.ON_ROUTE_THRESHOLD);
  }, [routeCoordinates, pointsOnRoute, location]);

  // บอกล่วงหน้าเมื่อจุดเสี่ยงถัดไปเปลี่ยน (เช่น เพิ่งผ่านจุดหนึ่งไป) พูดครั้งเดียวต่อจุด
  const lastHeadsUpIdRef = useRef(null);
  useEffect(() => {
    if (!routeStatus || routeStatus.kind !== 'next') return;
    if (routeStatus.point.id === lastHeadsUpIdRef.current) return;
    lastHeadsUpIdRef.current = routeStatus.point.id;
    // ถ้าอยู่ในระยะเตือนแล้ว ไม่ต้องบอกล่วงหน้า การเตือนเข้าใกล้จะพูดเอง
    if (routeStatus.remainingM > DISTANCE.ALERT_TRIGGER) {
      announce(buildHeadsUpMessage(routeStatus.point, routeStatus.remainingM));
    }
  }, [routeStatus, announce]);

  // ระยะในการ์ดเตือนคำนวณจากตำแหน่งล่าสุดเสมอ จึงนับถอยหลังจริง
  const liveDistanceM =
    currentAlert && location ? haversineMeters(location, currentAlert.point.coordinate) : null;

  // ผ่านจุดไปไกลเกินระยะล้างสถานะแล้ว ปิดการ์ดเอง ไม่ต้องให้ผู้ใช้ละมือไปกดปิดขณะขับรถ
  useEffect(() => {
    if (liveDistanceM !== null && liveDistanceM > DISTANCE.ALERT_RESET) setCurrentAlert(null);
  }, [liveDistanceM]);

  // เปิดหน้าจอในโหมดจำลองแล้วเริ่มวิ่งเลย ผู้ใช้กดเลือกโหมดจำลองมาแล้ว
  const { play } = simulation;
  useEffect(() => {
    if (mode === 'simulate') play();
  }, [mode, play]);

  function restartSimulation() {
    trip.reset();
    lastHeadsUpIdRef.current = null;
    setCurrentAlert(null);
    simulation.restart();
  }

  // จบทริปแล้วกด "เล่นอีกครั้ง" ต้องล้างประวัติเหมือนกด "เริ่มใหม่" ไม่อย่างนั้นรายการเตือนรอบก่อนจะค้างอยู่
  function playSimulation() {
    if (simulation.isFinished) restartSimulation();
    else simulation.play();
  }

  // กล้องตามผู้ใช้ แต่ขยับเมื่อห่างกลางจอเกิน 150 ม. เท่านั้น
  const [mapCenter, setMapCenter] = useState(null);
  useEffect(() => {
    if (!location) return;
    if (!mapCenter || haversineMeters(mapCenter, location) > RECENTER_DISTANCE_M) {
      setMapCenter({ lat: location.lat, lng: location.lng });
    }
  }, [location, mapCenter]);

  const region = mapCenter
    ? { latitude: mapCenter.lat, longitude: mapCenter.lng, latitudeDelta: 0.02, longitudeDelta: 0.02 }
    : DEFAULT_REGION;

  const markers = trip.nearbyPoints.map((item) => pointToMarker(item.point));

  const errorMessage = mode === 'gps' ? gps.errorMessage : null;

  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      <View style={styles.statusBar}>
        <View style={styles.statusTextBox}>
          <Text style={styles.statusText}>กำลังเฝ้าระวัง {trip.nearbyPoints.length} จุด</Text>
          <Text style={styles.modeText} numberOfLines={1}>
            {mode === 'simulate' ? 'จำลองการเดินทาง' : 'GPS'}
            {routeLabel ? ` · ${routeLabel}` : ''}
          </Text>
        </View>
        <Pressable style={styles.iconButton} onPress={voice.testVoice} accessibilityLabel="ทดสอบเสียงเตือน">
          <Text style={styles.iconButtonText}>ทดสอบเสียง</Text>
        </Pressable>
        <Pressable
          style={styles.iconButton}
          onPress={voice.toggleMute}
          accessibilityLabel={voice.isMuted ? 'เปิดเสียงเตือน' : 'ปิดเสียงเตือน'}
        >
          <Text style={styles.muteText}>{voice.isMuted ? '🔇' : '🔊'}</Text>
        </Pressable>
      </View>

      {voice.hasThaiVoice === false && (
        <Text style={styles.noteText}>เครื่องนี้ไม่มีเสียงภาษาไทย แอปจะเตือนด้วยภาพและการสั่นแทน</Text>
      )}
      {canKeepAwake === false && (
        <Text style={styles.noteText}>
          เครื่องนี้สั่งไม่ให้จอดับเองไม่ได้ ถ้าจอดับการเตือนจะหยุด ควรตั้งเวลาปิดหน้าจอให้นานขึ้นระหว่างเดินทาง
        </Text>
      )}
      {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}
      {/* ใช้ GPS ไม่ได้แต่มีเส้นทางอยู่แล้ว เสนอให้ดูการเตือนแบบจำลองแทน */}
      {errorMessage && routeCoordinates && (
        <Pressable style={styles.fallbackButton} onPress={() => navigation.setParams({ mode: 'simulate' })}>
          <Text style={styles.fallbackButtonText}>▶ ใช้โหมดจำลองการเดินทางแทน</Text>
        </Pressable>
      )}
      {!location && !errorMessage && <Text style={styles.noteText}>กำลังรอสัญญาณ GPS...</Text>}

      {currentAlert && liveDistanceM !== null && (
        <TripAlertCard
          point={currentAlert.point}
          liveDistanceM={liveDistanceM}
          onPress={() => navigation.navigate('RiskDetail', { pointId: currentAlert.point.id })}
          onDismiss={() => setCurrentAlert(null)}
        />
      )}

      <NextRiskPanel status={routeStatus} />

      <View style={styles.mapContainer}>
        <AppMap region={region} markers={markers} polyline={routeCoordinates} userLocation={location} />
      </View>

      {mode === 'simulate' && (
        <SimulationControls
          isPlaying={simulation.isPlaying}
          isFinished={simulation.isFinished}
          speedUp={simulation.speedUp}
          progressM={simulation.progressM}
          totalM={simulation.totalM}
          onPlay={playSimulation}
          onPause={simulation.pause}
          onRestart={restartSimulation}
          onSpeedChange={simulation.setSpeedUp}
        />
      )}

      <ScrollView style={styles.historyBox} contentContainerStyle={styles.history}>
        <Text style={styles.historyTitle}>แจ้งเตือนไปแล้ว</Text>
        {trip.history.length === 0 ? (
          <Text style={styles.emptyText}>ยังไม่มีการแจ้งเตือนในทริปนี้</Text>
        ) : (
          trip.history.map((alert, index) => (
            <View key={`${alert.point.id}-${index}`} style={styles.historyRow}>
              <Text style={styles.historyName} numberOfLines={1}>
                {alert.point.name}
              </Text>
              <Text style={styles.historyDistance}>{formatDistance(alert.distanceM)}</Text>
            </View>
          ))
        )}
      </ScrollView>

      <Pressable style={styles.stopButton} onPress={() => navigation.goBack()}>
        <Text style={styles.stopButtonText}>หยุดโหมดเดินทาง</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
  },
  statusTextBox: {
    flex: 1,
  },
  statusText: {
    fontSize: FONT_SIZES.subtitle,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  modeText: {
    fontSize: FONT_SIZES.small,
    color: COLORS.textMuted,
  },
  iconButton: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  iconButtonText: {
    fontSize: FONT_SIZES.small,
    color: COLORS.text,
  },
  muteText: {
    fontSize: FONT_SIZES.title,
  },
  noteText: {
    fontSize: FONT_SIZES.small,
    color: COLORS.textMuted,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
  },
  errorText: {
    fontSize: FONT_SIZES.body,
    color: COLORS.danger,
    padding: SPACING.md,
  },
  fallbackButton: {
    marginHorizontal: SPACING.md,
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.primary,
    alignItems: 'center',
  },
  fallbackButtonText: {
    fontSize: FONT_SIZES.body,
    color: COLORS.primary,
    fontWeight: '600',
  },
  mapContainer: {
    flex: 1,
    minHeight: 200,
    marginTop: SPACING.sm,
  },
  historyBox: {
    maxHeight: 140,
  },
  history: {
    padding: SPACING.md,
  },
  historyTitle: {
    fontSize: FONT_SIZES.subtitle,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: SPACING.sm,
  },
  historyName: {
    flex: 1,
    fontSize: FONT_SIZES.body,
    color: COLORS.text,
  },
  historyDistance: {
    fontSize: FONT_SIZES.small,
    color: COLORS.textMuted,
  },
  emptyText: {
    fontSize: FONT_SIZES.body,
    color: COLORS.textMuted,
  },
  stopButton: {
    backgroundColor: COLORS.danger,
    margin: SPACING.md,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  stopButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.subtitle,
    fontWeight: 'bold',
  },
});
