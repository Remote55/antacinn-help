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
      showsUserLocation={Boolean(userLocation)}
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
});
