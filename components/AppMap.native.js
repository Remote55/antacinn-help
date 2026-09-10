/**
 * แผนที่สำหรับมือถือ (Android / iOS) ใช้ react-native-maps
 *
 * ไฟล์นี้จะถูกใช้อัตโนมัติเมื่อรันบน Expo Go
 * เวลารันบนเว็บ Metro จะข้ามไฟล์นี้ไปใช้ AppMap.web.js แทน
 *
 * ห้ามแก้ props ของไฟล์นี้โดยไม่แก้ AppMap.web.js ให้ตรงกัน
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from 'react-native-maps';
import { COLORS } from '../constants/theme';

export default function AppMap({
  region,
  markers = [],
  polyline = null,
  userLocation = null,
  onMarkerPress,
  style,
}) {
  return (
    <MapView
      style={[styles.map, style]}
      provider={PROVIDER_DEFAULT}
      region={region}
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
  userDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 3,
    borderColor: COLORS.white,
    backgroundColor: COLORS.userLocation,
  },
});
