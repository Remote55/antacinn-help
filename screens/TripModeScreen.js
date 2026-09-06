/**
 * โหมดเดินทาง — ระยะ "ระหว่างการเดินทาง"
 *
 * ระบบติดตาม GPS แล้วเตือนอัตโนมัติเมื่อเข้าใกล้จุดเสี่ยงในระยะ 500 เมตร
 *
 * ข้อจำกัดที่ต้องบอกผู้ใช้: ต้องเปิดแอปค้างไว้
 * เพราะ Expo Go ไม่รองรับการติดตามตำแหน่งแบบเบื้องหลัง
 */

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppMap from '../components/AppMap';
import { useRiskPoints } from '../hooks/useRiskPoints';
import { useUserLocation } from '../hooks/useUserLocation';
import { evaluateTripAlerts } from '../utils/tripAlerts';
import { formatDistance } from '../utils/format';
import { DISTANCE, DEFAULT_REGION } from '../constants/config';
import { COLORS, SPACING, FONT_SIZES, RADIUS } from '../constants/theme';

const ALERT_CONFIG = {
  triggerM: DISTANCE.ALERT_TRIGGER,
  resetM: DISTANCE.ALERT_RESET,
  boundingBoxM: DISTANCE.BOUNDING_BOX_FILTER,
};

export default function TripModeScreen({ navigation }) {
  const { allPoints } = useRiskPoints();
  const { location, errorMessage } = useUserLocation({ watch: true });

  // การ์ดเตือนที่กำลังแสดงอยู่ตอนนี้ (แสดงทีละใบ ไม่ให้ผู้ใช้สับสน)
  const [currentAlert, setCurrentAlert] = useState(null);
  // จุดที่อยู่ในระยะเฝ้าระวัง ใช้แสดง "กำลังเฝ้าระวัง N จุด"
  const [nearbyPoints, setNearbyPoints] = useState([]);
  // ประวัติการเตือนในทริปนี้ แสดงเป็นรายการด้านล่าง
  const [alertHistory, setAlertHistory] = useState([]);

  // เก็บ id ที่เตือนไปแล้วไว้ใน ref ไม่ใช่ state
  // เพราะถ้าใช้ state จะทำให้ effect วนซ้ำไม่รู้จบ (state เปลี่ยน -> effect ทำงาน -> state เปลี่ยน)
  const alertedIdsRef = useRef(new Set());

  // ทุกครั้งที่ GPS อัปเดต ให้ประเมินใหม่ว่าควรเตือนอะไร
  useEffect(() => {
    if (!location) return;

    const result = evaluateTripAlerts(location, allPoints, alertedIdsRef.current, ALERT_CONFIG);

    alertedIdsRef.current = result.alertedIds;
    setNearbyPoints(result.nearbyPoints);

    if (result.newAlerts.length > 0) {
      // ถ้ามีหลายจุดพร้อมกัน ให้แสดงจุดที่ใกล้ที่สุดก่อน
      const closest = result.newAlerts.reduce((a, b) => (a.distanceM <= b.distanceM ? a : b));
      setCurrentAlert(closest);
      setAlertHistory((history) => [closest, ...history]);
    }
  }, [location, allPoints]);

  const markers = nearbyPoints.map((item) => ({
    id: item.point.id,
    lat: item.point.coordinate.lat,
    lng: item.point.coordinate.lng,
    color: item.point.riskLevel.color,
    label: item.point.name,
  }));

  const region = location
    ? { latitude: location.lat, longitude: location.lng, latitudeDelta: 0.02, longitudeDelta: 0.02 }
    : DEFAULT_REGION;

  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      <View style={styles.statusBar}>
        <Text style={styles.statusText}>กำลังเฝ้าระวัง {nearbyPoints.length} จุด</Text>
      </View>

      {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}

      {!location && !errorMessage && (
        <Text style={styles.waitingText}>กำลังรอสัญญาณ GPS...</Text>
      )}

      {/* การ์ดเตือน ตัวใหญ่พิเศษ เพราะผู้ใช้กำลังขับรถ */}
      {currentAlert && (
        <Pressable
          style={[styles.alertCard, { backgroundColor: currentAlert.point.riskLevel.color }]}
          onPress={() =>
            navigation.navigate('RiskDetail', { pointId: currentAlert.point.id })
          }
        >
          <View style={styles.alertHeader}>
            <Text style={styles.alertTitle}>⚠️ ระวัง!</Text>
            <Text style={styles.alertDistance}>อีก {formatDistance(currentAlert.distanceM)}</Text>
            <Pressable onPress={() => setCurrentAlert(null)} hitSlop={12}>
              <Text style={styles.alertClose}>✕</Text>
            </Pressable>
          </View>
          <Text style={styles.alertName}>{currentAlert.point.name}</Text>
          <Text style={styles.alertMeta}>
            {currentAlert.point.riskLevel.label} · {currentAlert.point.riskScore}
          </Text>
          <Text style={styles.alertHint}>แตะเพื่อดูรายละเอียด</Text>
        </Pressable>
      )}

      <View style={styles.mapContainer}>
        <AppMap region={region} markers={markers} userLocation={location} />
      </View>

      <ScrollView contentContainerStyle={styles.history}>
        <Text style={styles.historyTitle}>แจ้งเตือนไปแล้ว</Text>
        {alertHistory.length === 0 ? (
          <Text style={styles.emptyText}>ยังไม่มีการแจ้งเตือนในทริปนี้</Text>
        ) : (
          alertHistory.map((alert, index) => (
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
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
  },
  statusText: {
    fontSize: FONT_SIZES.subtitle,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  errorText: {
    fontSize: FONT_SIZES.body,
    color: COLORS.danger,
    padding: SPACING.md,
  },
  waitingText: {
    fontSize: FONT_SIZES.body,
    color: COLORS.textMuted,
    padding: SPACING.md,
  },
  alertCard: {
    margin: SPACING.md,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    gap: SPACING.xs,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  alertTitle: {
    color: COLORS.white,
    fontSize: FONT_SIZES.subtitle,
    fontWeight: 'bold',
  },
  alertDistance: {
    color: COLORS.white,
    fontSize: FONT_SIZES.alert,
    fontWeight: 'bold',
  },
  alertClose: {
    color: COLORS.white,
    fontSize: FONT_SIZES.title,
  },
  alertName: {
    color: COLORS.white,
    fontSize: FONT_SIZES.title,
    fontWeight: '600',
  },
  alertMeta: {
    color: COLORS.white,
    fontSize: FONT_SIZES.body,
    opacity: 0.9,
  },
  alertHint: {
    color: COLORS.white,
    fontSize: FONT_SIZES.small,
    opacity: 0.8,
  },
  mapContainer: {
    flex: 1,
    minHeight: 200,
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
