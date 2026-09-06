/**
 * แผนที่สำหรับเว็บ ใช้ Leaflet โหลดจาก CDN
 *
 * ทำไมต้องใช้ Leaflet: react-native-maps ทำงานบนเว็บไม่ได้เลย
 * และ Leaflet ใช้แผนที่ OpenStreetMap ซึ่งฟรี ไม่ต้องใช้ API key เหมือน Google Maps
 *
 * เทคนิคสำคัญ: React.createElement('div', ...)
 * react-native-web เรนเดอร์ผ่าน React DOM อยู่แล้ว การเขียน tag เป็นสตริงตัวเล็ก
 * จะได้ DOM element จริง ๆ ออกมา ทำให้ Leaflet เข้ามาควบคุมได้
 * (ทดสอบยืนยันแล้วเมื่อ 2026-09-05 ว่าใช้ได้จริง)
 *
 * ห้ามแก้ props ของไฟล์นี้โดยไม่แก้ AppMap.native.js ให้ตรงกัน
 */

import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING, FONT_SIZES, RADIUS } from '../constants/theme';

const LEAFLET_CSS = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css';
const LEAFLET_JS = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js';
const OSM_TILES = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

/**
 * โหลดไลบรารี Leaflet เข้ามาในหน้าเว็บ
 *
 * เก็บ Promise ไว้ที่ window เพื่อให้โหลดแค่ครั้งเดียว
 * ถึงจะมีแผนที่หลายหน้าจอ ก็ใช้สคริปต์ตัวเดียวกัน ไม่โหลดซ้ำ
 */
function loadLeaflet() {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('ไม่ได้อยู่ในเบราว์เซอร์'));
  }
  if (window.__antacinnLeafletPromise) {
    return window.__antacinnLeafletPromise;
  }

  window.__antacinnLeafletPromise = new Promise((resolve, reject) => {
    const stylesheet = document.createElement('link');
    stylesheet.rel = 'stylesheet';
    stylesheet.href = LEAFLET_CSS;
    document.head.appendChild(stylesheet);

    const script = document.createElement('script');
    script.src = LEAFLET_JS;
    script.onload = () => resolve(window.L);
    script.onerror = () => reject(new Error('โหลดไลบรารีแผนที่จาก CDN ไม่สำเร็จ'));
    document.head.appendChild(script);
  });

  return window.__antacinnLeafletPromise;
}

/** แปลง latitudeDelta ของ react-native-maps เป็นระดับซูมของ Leaflet โดยประมาณ */
function deltaToZoom(latitudeDelta) {
  if (latitudeDelta >= 0.5) return 9;
  if (latitudeDelta >= 0.2) return 11;
  if (latitudeDelta >= 0.05) return 13;
  if (latitudeDelta >= 0.01) return 15;
  return 16;
}

export default function AppMap({
  region,
  markers = [],
  polyline = null,
  userLocation = null,
  onMarkerPress,
  style,
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerLayerRef = useRef(null);
  const polylineRef = useRef(null);
  const userMarkerRef = useRef(null);

  const [loadError, setLoadError] = useState(null);

  // สร้างแผนที่ครั้งเดียวตอน component ถูกสร้าง
  useEffect(() => {
    let isCancelled = false;

    loadLeaflet()
      .then((L) => {
        if (isCancelled || !containerRef.current || mapRef.current) return;

        const map = L.map(containerRef.current).setView(
          [region.latitude, region.longitude],
          deltaToZoom(region.latitudeDelta)
        );

        L.tileLayer(OSM_TILES, {
          maxZoom: 19,
          attribution: '&copy; OpenStreetMap contributors',
        }).addTo(map);

        // ใช้ layerGroup เพื่อล้างหมุดเก่าทั้งชุดได้ในคำสั่งเดียว
        markerLayerRef.current = L.layerGroup().addTo(map);
        mapRef.current = map;
      })
      .catch((error) => {
        if (!isCancelled) setLoadError(error.message);
      });

    return () => {
      isCancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
    // ตั้งใจให้ทำงานครั้งเดียว ส่วนการอัปเดต region อยู่ใน effect ถัดไป
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ย้ายกล้องเมื่อ region เปลี่ยน
  useEffect(() => {
    if (!mapRef.current) return;
    mapRef.current.setView(
      [region.latitude, region.longitude],
      deltaToZoom(region.latitudeDelta)
    );
  }, [region.latitude, region.longitude, region.latitudeDelta]);

  // วาดหมุดใหม่ทุกครั้งที่รายการหมุดเปลี่ยน
  useEffect(() => {
    const L = typeof window !== 'undefined' ? window.L : null;
    if (!L || !mapRef.current || !markerLayerRef.current) return;

    markerLayerRef.current.clearLayers();

    markers.forEach((marker) => {
      L.circleMarker([marker.lat, marker.lng], {
        radius: 9,
        color: COLORS.white,
        weight: 2,
        fillColor: marker.color,
        fillOpacity: 1,
      })
        .bindTooltip(marker.label || '')
        .on('click', () => onMarkerPress && onMarkerPress(marker.id))
        .addTo(markerLayerRef.current);
    });
  }, [markers, onMarkerPress]);

  // วาดเส้นทางใหม่เมื่อเส้นทางเปลี่ยน
  useEffect(() => {
    const L = typeof window !== 'undefined' ? window.L : null;
    if (!L || !mapRef.current) return;

    if (polylineRef.current) {
      polylineRef.current.remove();
      polylineRef.current = null;
    }

    if (polyline && polyline.length > 1) {
      polylineRef.current = L.polyline(
        polyline.map((c) => [c.lat, c.lng]),
        { color: COLORS.primary, weight: 4 }
      ).addTo(mapRef.current);
    }
  }, [polyline]);

  // จุดสีฟ้าแสดงตำแหน่งผู้ใช้
  useEffect(() => {
    const L = typeof window !== 'undefined' ? window.L : null;
    if (!L || !mapRef.current) return;

    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }

    if (userLocation) {
      userMarkerRef.current = L.circleMarker([userLocation.lat, userLocation.lng], {
        radius: 7,
        color: COLORS.white,
        weight: 3,
        fillColor: '#1E88E5',
        fillOpacity: 1,
      }).addTo(mapRef.current);
    }
  }, [userLocation]);

  // ถ้าโหลด Leaflet ไม่ได้ (เช่น CDN ถูกบล็อก) ต้องบอกผู้ใช้ ไม่ใช่แสดงกล่องว่างเปล่า
  if (loadError) {
    return (
      <View style={[styles.fallback, style]}>
        <Text style={styles.fallbackTitle}>แสดงแผนที่ไม่ได้</Text>
        <Text style={styles.fallbackText}>{loadError}</Text>
        <Text style={styles.fallbackText}>
          ลองเปิดบนมือถือผ่านแอป Expo Go แทน หรือตรวจสอบการเชื่อมต่ออินเทอร์เน็ต
        </Text>
      </View>
    );
  }

  // นี่คือหัวใจ: สร้าง div จริงในหน้าเว็บ ให้ Leaflet เข้ามาควบคุม
  return (
    <View style={[styles.wrapper, style]}>
      {React.createElement('div', {
        ref: containerRef,
        style: { width: '100%', height: '100%' },
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    overflow: 'hidden',
  },
  fallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
    gap: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
  },
  fallbackTitle: {
    fontSize: FONT_SIZES.subtitle,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  fallbackText: {
    fontSize: FONT_SIZES.small,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
});
