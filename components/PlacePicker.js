/**
 * รายการสถานที่ให้เลือกเป็นต้นทางหรือปลายทาง พร้อมช่องค้นหา
 *
 * ไม่ค้นหาที่อยู่อิสระทางอินเทอร์เน็ต (geocoding) ตามเอกสารออกแบบระยะที่ 2 ข้อ 7
 * เพราะนโยบายของ Nominatim ไม่ให้แอปเรียกใช้หนัก และแอปต้องใช้งานออฟไลน์ได้
 * จึงเลือกจากรายการสถานที่ที่คัดและตรวจพิกัดไว้แล้วใน data/places.json
 */

import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import Icon from './Icon';
import SearchBox from './SearchBox';
import { searchPlaces } from '../utils/places';
import { MY_LOCATION_NAME } from '../utils/routeRequest';
import { DISTANCE } from '../constants/config';
import { COLORS, TEXT, SPACING, RADIUS } from '../constants/theme';

const RADIUS_LABEL = `${DISTANCE.PLACE_RISK_RADIUS / 1000} กม.`;

function PlaceRow({ leading, name, meta, onPress }) {
  return (
    <Pressable
      style={({ hovered, pressed }) => [styles.row, (hovered || pressed) && styles.rowHovered]}
      onPress={onPress}
      accessibilityRole="button"
    >
      <View style={styles.leading}>{leading}</View>
      <View style={styles.rowText}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.meta}>{meta}</Text>
      </View>
      <Icon name="chevron-forward" size={16} color={COLORS.textMuted} />
    </Pressable>
  );
}

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
        <Pressable onPress={onCancel} hitSlop={8} accessibilityRole="button" style={styles.cancel}>
          <Text style={styles.cancelText}>ยกเลิก</Text>
        </Pressable>
      </View>

      <SearchBox value={query} onChangeText={setQuery} placeholder="พิมพ์ชื่อสถานที่ เช่น สมิหลา" autoFocus />

      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.list}>
        {showMyLocation && !isSearching && (
          <PlaceRow
            leading={<Icon name="locate" size={20} color={COLORS.userLocation} />}
            name={MY_LOCATION_NAME}
            meta="ใช้ตำแหน่งจาก GPS ของเครื่อง"
            onPress={onSelectMyLocation}
          />
        )}

        {results.map((place) => (
          <PlaceRow
            key={place.id}
            leading={<Text style={styles.emoji}>{place.emoji}</Text>}
            name={place.name}
            meta={`อ.${place.district} · จุดเสี่ยงรอบ ${RADIUS_LABEL} ${place.risk.count} จุด`}
            onPress={() => onSelectPlace(place)}
          />
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
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    ...TEXT.h2,
    color: COLORS.text,
  },
  cancel: {
    cursor: 'pointer',
  },
  cancelText: {
    ...TEXT.bodyStrong,
    color: COLORS.primary,
  },
  list: {
    paddingBottom: SPACING.xl,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.md,
    cursor: 'pointer',
  },
  rowHovered: {
    backgroundColor: COLORS.page,
  },
  leading: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.page,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 20,
    lineHeight: 26,
  },
  rowText: {
    flex: 1,
  },
  name: {
    ...TEXT.bodyStrong,
    color: COLORS.text,
  },
  meta: {
    ...TEXT.small,
    color: COLORS.textMuted,
  },
  emptyText: {
    ...TEXT.body,
    color: COLORS.textMuted,
    paddingVertical: SPACING.md,
  },
});
