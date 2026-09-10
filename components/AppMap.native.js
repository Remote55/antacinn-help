/**
 * แผนที่สำหรับมือถือ (Android / iOS) ใช้ react-native-maps
 *
 * ไฟล์นี้จะถูกใช้อัตโนมัติเมื่อรันบน Expo Go
 * เวลารันบนเว็บ Metro จะข้ามไฟล์นี้ไปใช้ AppMap.web.js แทน
 *
 * props (ต้องเหมือนกันทั้งสองไฟล์ ห้ามแก้ไฟล์เดียว):
 *   region, markers, polyline, fitToPolyline, userLocation, highlight, onMarkerPress, style
 *   fitToPolyline = true ซูมให้เห็นเส้นทางทั้งเส้นทุกครั้งที่เส้นทางเปลี่ยน (ใช้ในหน้าวางแผนเส้นทาง)
 *   highlight = { lat, lng, label } หมุดสถานที่ที่ผู้ใช้เลือกดู แสดงชื่อค้างไว้
 */

import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from 'react-native-maps';
import { COLORS } from '../constants/theme';

/** เว้นขอบรอบเส้นทางตอนซูมให้เห็นทั้งเส้น หน่วยเป็นจุดบนจอ */
const FIT_PADDING = { top: 40, right: 40, bottom: 40, left: 40 };

export default function AppMap({
  region,
  markers = [],
  polyline = null,
  fitToPolyline = false,
  userLocation = null,
  highlight = null,
  onMarkerPress,
  style,
}) {
  const mapRef = useRef(null);
  // สั่งซูมก่อนแผนที่พร้อมจะไม่มีผล (โดยเฉพาะ Android) จึงรอ onMapReady ก่อน
  const [isMapReady, setIsMapReady] = useState(false);

  // ระดับซูมจาก region เป็นค่าประมาณ เส้นทางยาวอาจล้นกรอบแผนที่ จึงซูมตามเส้นทางจริง
  useEffect(() => {
    if (!fitToPolyline || !isMapReady || !mapRef.current || !polyline || polyline.length < 2) return;
    mapRef.current.fitToCoordinates(
      polyline.map((c) => ({ latitude: c.lat, longitude: c.lng })),
      { edgePadding: FIT_PADDING, animated: true }
    );
  }, [fitToPolyline, isMapReady, polyline]);

  return (
    <MapView
      ref={mapRef}
      style={[styles.map, style]}
      provider={PROVIDER_DEFAULT}
      region={region}
      onMapReady={() => setIsMapReady(true)}
      showsMyLocationButton={false}
      toolbarEnabled={false}
    >
      {/* วาดเส้นทางก่อนหมุด เพื่อให้หมุดอยู่ทับด้านบนเส้น */}
      {polyline && polyline.length > 1 && (
        <Polyline
          coordinates={polyline.map((c) => ({ latitude: c.lat, longitude: c.lng }))}
          strokeColor={COLORS.primary}
          strokeWidth={4}
        />
      )}

      {markers.map((marker) => (
        <Marker
          key={marker.id}
          coordinate={{ latitude: marker.lat, longitude: marker.lng }}
          title={marker.label}
          onPress={() => onMarkerPress && onMarkerPress(marker.id)}
        >
          {/* วาดหมุดเอง แทนหมุดมาตรฐาน เพื่อให้สีตรงกับฝั่งเว็บเป๊ะ ๆ */}
          <View style={[styles.pin, { backgroundColor: marker.color }]} />
        </Marker>
      ))}

      {/* หมุดสถานที่ที่ผู้ใช้เลือกดู กดแล้วขึ้นชื่อสถานที่ */}
      {highlight && (
        <Marker
          coordinate={{ latitude: highlight.lat, longitude: highlight.lng }}
          anchor={{ x: 0.5, y: 0.5 }}
          title={highlight.label}
          zIndex={900}
        >
          <View style={styles.highlight} />
        </Marker>
      )}

      {/*
        วาดจุดตำแหน่งผู้ใช้เอง ไม่ใช้ showsUserLocation ของ MapView
        เพราะ showsUserLocation แสดงตำแหน่ง GPS จริงของเครื่องเสมอ
        ในโหมดจำลองการเดินทาง จุดบนแผนที่จะค้างอยู่ที่ห้องเรียนแทนที่จะวิ่งตามเส้นทาง
      */}
      {userLocation && (
        <Marker
          coordinate={{ latitude: userLocation.lat, longitude: userLocation.lng }}
          anchor={{ x: 0.5, y: 0.5 }}
          title="ตำแหน่งของคุณ"
          zIndex={1000}
        >
          <View style={styles.userDot} />
        </Marker>
      )}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
  pin: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  highlight: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 5,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.white,
  },
  userDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 3,
    borderColor: COLORS.white,
    backgroundColor: COLORS.userLocation,
  },
});
