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
 * จอกว้าง: แผงซ้ายมีสถานะ การเตือน ปุ่มควบคุม และประวัติ แผนที่ใหญ่ทางขวา (เหมาะกับฉายตอนนำเสนอ)
 * มือถือ: เรียงลงมา แผนที่อยู่กลางจอ
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
import BackLink from '../components/BackLink';
import Button from '../components/Button';
import Icon from '../components/Icon';
import { useRiskPoints } from '../hooks/useRiskPoints';
import { useUserLocation } from '../hooks/useUserLocation';
import { useSimulatedLocation } from '../hooks/useSimulatedLocation';
import { useTripAlerts } from '../hooks/useTripAlerts';
import { useVoiceAlerts } from '../hooks/useVoiceAlerts';
import { useScreenAwake } from '../hooks/useScreenAwake';
import { useLayout } from '../hooks/useLayout';
import { findRiskPointsAlongRoute } from '../utils/routeAnalysis';
import { describeRouteStatus } from '../utils/routeProgress';
import { buildAlertMessage, buildHeadsUpMessage } from '../utils/alertMessage';
import { haversineMeters } from '../utils/geo';
import { pointToMarker } from '../utils/mapMarkers';
import { formatDistance } from '../utils/format';
import { DISTANCE, DEFAULT_REGION } from '../constants/config';
import { COLORS, TEXT, SPACING, RADIUS, LAYOUT } from '../constants/theme';

/** เลื่อนกล้องตามผู้ใช้เมื่อขยับห่างกลางจอเกินระยะนี้ ไม่เลื่อนทุกจังหวะให้แผนที่กระตุก */
const RECENTER_DISTANCE_M = 150;

/** ข้อความสั้นใต้แถบสถานะ (สีเทาหรือสีแดงตามความสำคัญ) */
function Note({ icon, text, tone = 'muted' }) {
  const color = tone === 'danger' ? COLORS.dangerDark : COLORS.textMuted;
  return (
    <View style={styles.note}>
      <Icon name={icon} size={16} color={color} />
      <Text style={[styles.noteText, { color }]}>{text}</Text>
    </View>
  );
}

export default function TripModeScreen({ navigation, route }) {
  const { isWide } = useLayout();
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

  const statusBar = (
    <View style={[styles.statusBar, isWide && styles.statusBarWide]}>
      <View style={styles.liveDot} />
      <View style={styles.statusTextBox}>
        <Text style={styles.statusText}>กำลังเฝ้าระวัง {trip.nearbyPoints.length} จุด</Text>
        <Text style={styles.modeText} numberOfLines={1}>
          {mode === 'simulate' ? 'จำลองการเดินทาง' : 'ตำแหน่งจริงจาก GPS'}
          {routeLabel ? ` · ${routeLabel}` : ''}
        </Text>
      </View>
      <Button variant="secondary" size="sm" icon="volume-medium-outline" title="ทดสอบเสียง" onPress={voice.testVoice} />
      <Pressable
        style={({ hovered }) => [styles.iconButton, hovered && styles.iconButtonHovered]}
        onPress={voice.toggleMute}
        accessibilityRole="button"
        accessibilityLabel={voice.isMuted ? 'เปิดเสียงเตือน' : 'ปิดเสียงเตือน'}
      >
        <Icon name={voice.isMuted ? 'volume-mute' : 'volume-high'} size={20} color={COLORS.primary} />
      </Pressable>
    </View>
  );

  const notes = (
    <>
      {voice.hasThaiVoice === false && (
        <Note icon="chatbubble-ellipses-outline" text="เครื่องนี้ไม่มีเสียงภาษาไทย แอปจะเตือนด้วยภาพและการสั่นแทน" />
      )}
      {canKeepAwake === false && (
        <Note
          icon="phone-portrait-outline"
          text="เครื่องนี้สั่งไม่ให้จอดับเองไม่ได้ ถ้าจอดับการเตือนจะหยุด ควรตั้งเวลาปิดหน้าจอให้นานขึ้นระหว่างเดินทาง"
        />
      )}
      {errorMessage && <Note icon="alert-circle-outline" text={errorMessage} tone="danger" />}
      {/* ใช้ GPS ไม่ได้แต่มีเส้นทางอยู่แล้ว เสนอให้ดูการเตือนแบบจำลองแทน */}
      {errorMessage && routeCoordinates && (
        <Button
          variant="secondary"
          icon="play"
          title="ใช้โหมดจำลองการเดินทางแทน"
          onPress={() => navigation.setParams({ mode: 'simulate' })}
        />
      )}
      {!location && !errorMessage && <Note icon="radio-outline" text="กำลังรอสัญญาณ GPS..." />}
    </>
  );

  const alertCard = currentAlert && liveDistanceM !== null && (
    <TripAlertCard
      point={currentAlert.point}
      liveDistanceM={liveDistanceM}
      onPress={() => navigation.navigate('RiskDetail', { pointId: currentAlert.point.id })}
      onDismiss={() => setCurrentAlert(null)}
    />
  );

  const controls = mode === 'simulate' && (
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
  );

  const history = (
    <View style={styles.history}>
      <Text style={styles.historyTitle}>แจ้งเตือนไปแล้ว</Text>
      {trip.history.length === 0 ? (
        <Text style={styles.emptyText}>ยังไม่มีการแจ้งเตือนในทริปนี้</Text>
      ) : (
        trip.history.map((alert, index) => (
          <View key={`${alert.point.id}-${index}`} style={styles.historyRow}>
            <View style={[styles.historyDot, { backgroundColor: alert.point.riskLevel.color }]} />
            <Text style={styles.historyName} numberOfLines={1}>
              {alert.point.name}
            </Text>
            <Text style={styles.historyDistance}>{formatDistance(alert.distanceM)}</Text>
          </View>
        ))
      )}
    </View>
  );

  const stopButton = (
    <Button variant="danger" size="lg" icon="stop-circle-outline" title="หยุดโหมดเดินทาง" onPress={() => navigation.goBack()} />
  );

  const map = <AppMap region={region} markers={markers} polyline={routeCoordinates} userLocation={location} />;

  if (isWide) {
    return (
      <View style={styles.wideScreen}>
        <View style={styles.sidePanel}>
          <ScrollView contentContainerStyle={styles.panelContent}>
            <BackLink label="กลับไปวางแผนเส้นทาง" />
            <Text style={styles.panelTitle} accessibilityRole="header">
              โหมดเดินทาง
            </Text>
            {statusBar}
            {notes}
            {alertCard}
            <NextRiskPanel status={routeStatus} />
            {controls}
            {history}
          </ScrollView>
          <View style={styles.panelFooter}>{stopButton}</View>
        </View>
        <View style={styles.mapArea}>{map}</View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      {statusBar}
      <View style={styles.narrowStack}>
        {notes}
        {alertCard}
        <NextRiskPanel status={routeStatus} />
      </View>

      <View style={styles.mapNarrow}>{map}</View>

      {controls && <View style={styles.controlsNarrow}>{controls}</View>}

      <ScrollView style={styles.historyBox}>{history}</ScrollView>

      <View style={styles.footerNarrow}>{stopButton}</View>
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
  panelContent: {
    padding: SPACING.lg,
    gap: 12,
  },
  panelTitle: {
    ...TEXT.h1,
    color: COLORS.text,
  },
  panelFooter: {
    padding: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
  },
  mapArea: {
    flex: 1,
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.card,
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  statusBarWide: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
  },
  liveDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.userLocation,
    boxShadow: '0 0 0 4px rgba(30, 136, 229, 0.2)',
  },
  statusTextBox: {
    flex: 1,
  },
  statusText: {
    ...TEXT.bodyStrong,
    color: COLORS.text,
  },
  modeText: {
    ...TEXT.small,
    color: COLORS.textMuted,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  iconButtonHovered: {
    backgroundColor: COLORS.primarySoft,
  },
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  noteText: {
    flex: 1,
    ...TEXT.small,
  },
  narrowStack: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    gap: SPACING.sm,
  },
  mapNarrow: {
    flex: 1,
    minHeight: 200,
    marginTop: SPACING.sm,
  },
  controlsNarrow: {
    backgroundColor: COLORS.card,
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  historyBox: {
    maxHeight: 140,
    backgroundColor: COLORS.card,
  },
  history: {
    padding: SPACING.md,
    gap: SPACING.xs,
  },
  historyTitle: {
    ...TEXT.h3,
    color: COLORS.text,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  historyDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  historyName: {
    flex: 1,
    ...TEXT.body,
    color: COLORS.text,
  },
  historyDistance: {
    ...TEXT.small,
    color: COLORS.textMuted,
  },
  emptyText: {
    ...TEXT.body,
    color: COLORS.textMuted,
  },
  footerNarrow: {
    padding: SPACING.md,
    backgroundColor: COLORS.card,
  },
});
