/**
 * รายการสถานที่ให้เลือกเป็นต้นทางหรือปลายทาง พร้อมช่องค้นหา
 *
 * ไม่ค้นหาที่อยู่อิสระทางอินเทอร์เน็ต (geocoding) ตามเอกสารออกแบบระยะที่ 2 ข้อ 7
 * เพราะนโยบายของ Nominatim ไม่ให้แอปเรียกใช้หนัก และแอปต้องใช้งานออฟไลน์ได้
 * จึงเลือกจากรายการสถานที่ที่คัดและตรวจพิกัดไว้แล้วใน data/places.json
 */

import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet } from 'react-native';
import { searchPlaces } from '../utils/places';
import { MY_LOCATION_NAME } from '../utils/routeRequest';
import { DISTANCE } from '../constants/config';
import { COLORS, SPACING, FONT_SIZES, RADIUS } from '../constants/theme';

const RADIUS_LABEL = `${DISTANCE.PLACE_RISK_RADIUS / 1000} กม.`;

/**
 * @param places สถานที่จาก usePlaces
 * @param showMyLocation แสดงตัวเลือก "ตำแหน่งของฉัน" ไว้บนสุด (ใช้กับช่องต้นทาง)
 */
export default function PlacePicker({ title, places, showMyLocation, onSelectPlace, onSelectMyLocation, onCancel }) {
  const [query, setQuery] = useState('');
  const isSearching = query.trim().length > 0;
  const results = isSearching ? searchPlaces(places, query) : places;

  return (
    <View style={styles.box}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{title}</Text>
        <Pressable onPress={onCancel} hitSlop={8} accessibilityRole="button">
          <Text style={styles.cancelText}>ยกเลิก</Text>
        </Pressable>
      </View>

      <TextInput
        style={styles.searchBox}
        placeholder="พิมพ์ชื่อสถานที่ เช่น สมิหลา"
        placeholderTextColor={COLORS.textMuted}
        value={query}
        onChangeText={setQuery}
        autoFocus
      />

      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.list}>
        {showMyLocation && !isSearching && (
          <Pressable style={styles.row} onPress={onSelectMyLocation} accessibilityRole="button">
            <Text style={styles.emoji}>📍</Text>
            <View style={styles.rowText}>
              <Text style={styles.name}>{MY_LOCATION_NAME}</Text>
              <Text style={styles.meta}>ใช้ตำแหน่งจาก GPS ของเครื่อง</Text>
            </View>
          </Pressable>
        )}

        {results.map((place) => (
          <Pressable
            key={place.id}
            style={styles.row}
            onPress={() => onSelectPlace(place)}
            accessibilityRole="button"
          >
            <Text style={styles.emoji}>{place.emoji}</Text>
            <View style={styles.rowText}>
              <Text style={styles.name}>{place.name}</Text>
              <Text style={styles.meta}>
                {place.district} · จุดเสี่ยงรอบ {RADIUS_LABEL} {place.risk.count} จุด
              </Text>
            </View>
          </Pressable>
        ))}

        {isSearching && results.length === 0 && (
          <Text style={styles.emptyText}>
            ไม่พบสถานที่ที่ตรงกับคำค้นหา แอปมีเฉพาะสถานที่ยอดนิยมในหาดใหญ่และเมืองสงขลา
          </Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flex: 1,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: FONT_SIZES.title,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  cancelText: {
    fontSize: FONT_SIZES.body,
    color: COLORS.primary,
  },
  searchBox: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    fontSize: FONT_SIZES.body,
    color: COLORS.text,
  },
  list: {
    paddingBottom: SPACING.xl,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  emoji: {
    fontSize: FONT_SIZES.title,
  },
  rowText: {
    flex: 1,
  },
  name: {
    fontSize: FONT_SIZES.body,
    fontWeight: '600',
    color: COLORS.text,
  },
  meta: {
    fontSize: FONT_SIZES.small,
    color: COLORS.textMuted,
  },
  emptyText: {
    fontSize: FONT_SIZES.body,
    color: COLORS.textMuted,
    paddingVertical: SPACING.md,
  },
});
