/**
 * หน้าแรก — ระยะ "ก่อนเดินทาง"
 *
 * ผู้ใช้ยังอยู่บ้าน กำลังวางแผน จึงเน้นให้เห็นภาพรวมเร็วที่สุด:
 *   1. ช่องค้นหา (ได้ทั้งสถานที่และจุดเสี่ยง)
 *   2. แถบสรุปว่าเดือนนี้ต้องระวังอะไรเป็นพิเศษ
 *   3. รายการโปรด (แสดงเมื่อผู้ใช้กดดาวไว้)
 *   4. การ์ดสถานที่ยอดนิยม (เอกสารบทที่ 4)
 *   5. การ์ดจุดที่ควรระวังมากที่สุดตอนนี้
 */

import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ScreenHeader from '../components/ScreenHeader';
import RiskPointCard from '../components/RiskPointCard';
import PlaceCard from '../components/PlaceCard';
import Disclaimer from '../components/Disclaimer';
import { useRiskPoints } from '../hooks/useRiskPoints';
import { usePlaces } from '../hooks/usePlaces';
import { useFavorites } from '../hooks/useFavorites';
import { summarizeSeason } from '../utils/season';
import { pickFavoritePoints } from '../utils/favorites';
import { COLORS, SPACING, FONT_SIZES, RADIUS } from '../constants/theme';

export default function HomeScreen({ navigation }) {
  const [keyword, setKeyword] = useState('');
  const { allPoints, topRiskPoints, searchPoints } = useRiskPoints();
  const { places, searchPlaces } = usePlaces();
  const { favoriteIds } = useFavorites();

  // หัวข้อและเนื้อความของแถบฤดูกาลมาจากข้อมูลชุดเดียวกัน (utils/season.js) จึงไม่ขัดกัน
  const season = summarizeSeason(allPoints, new Date().getMonth() + 1);
  const favoritePoints = pickFavoritePoints(favoriteIds, allPoints);

  const isSearching = keyword.trim().length > 0;
  const placeResults = searchPlaces(keyword);
  const pointResults = searchPoints(keyword);

  function openDetail(pointId) {
    navigation.navigate('RiskDetail', { pointId });
  }

  // requestId เปลี่ยนทุกครั้งที่กด ปลายทางจึงรู้ว่าเป็นคำขอใหม่ แม้กดสถานที่เดิมซ้ำ
  function showPlaceOnMap(place) {
    navigation.navigate('Map', { focusPlaceId: place.id, requestId: Date.now() });
  }

  function navigateToPlace(place) {
    navigation.navigate('RoutePlanner', { destinationPlaceId: place.id, requestId: Date.now() });
  }

  function renderPlaceCard(place, style) {
    return (
      <PlaceCard
        key={place.id}
        place={place}
        style={style}
        onShowMap={() => showPlaceOnMap(place)}
        onNavigate={() => navigateToPlace(place)}
      />
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScreenHeader title="AntacinnHelp" subtitle="รู้ก่อนไป ว่าตรงไหนต้องระวัง" />

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <TextInput
          style={styles.searchBox}
          placeholder="ค้นหาสถานที่ เช่น หาดสมิหลา"
          placeholderTextColor={COLORS.textMuted}
          value={keyword}
          onChangeText={setKeyword}
        />

        {isSearching ? (
          <View style={styles.section}>
            {placeResults.length === 0 && pointResults.length === 0 && (
              <Text style={styles.emptyText}>
                ไม่พบสถานที่หรือจุดเสี่ยงที่ตรงกับคำค้นหา ลองพิมพ์ชื่ออำเภอ เช่น หาดใหญ่
              </Text>
            )}

            {placeResults.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>สถานที่ ({placeResults.length})</Text>
                {placeResults.map((place) => renderPlaceCard(place))}
              </>
            )}

            {pointResults.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>จุดเสี่ยง ({pointResults.length})</Text>
                {pointResults.map((point) => (
                  <RiskPointCard key={point.id} point={point} onPress={() => openDetail(point.id)} />
                ))}
              </>
            )}
          </View>
        ) : (
          <>
            {/* แถบสรุปความเสี่ยงประจำเดือน ปรับข้อความตามข้อมูลจริง */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{season.title}</Text>
              <Text style={styles.seasonText}>{season.body}</Text>
            </View>

            {favoritePoints.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>⭐ รายการโปรด</Text>
                {favoritePoints.map((point) => (
                  <RiskPointCard key={point.id} point={point} onPress={() => openDetail(point.id)} />
                ))}
              </View>
            )}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>สถานที่ยอดนิยม</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.placeRow}
              >
                {places.map((place) => renderPlaceCard(place, styles.placeCardInRow))}
              </ScrollView>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>จุดที่ควรระวังมากที่สุดตอนนี้</Text>
                <Pressable onPress={() => navigation.navigate('Map')}>
                  <Text style={styles.link}>ดูแผนที่ทั้งหมด</Text>
                </Pressable>
              </View>

              {topRiskPoints.map((point) => (
                <RiskPointCard key={point.id} point={point} onPress={() => openDetail(point.id)} />
              ))}
            </View>
          </>
        )}

        <Disclaimer />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  searchBox: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    fontSize: FONT_SIZES.body,
    color: COLORS.text,
    backgroundColor: COLORS.background,
    marginBottom: SPACING.md,
  },
  section: {
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.title,
    fontWeight: 'bold',
    color: COLORS.text,
    flex: 1,
  },
  seasonText: {
    fontSize: FONT_SIZES.body,
    color: COLORS.textMuted,
    lineHeight: 22,
  },
  placeRow: {
    gap: SPACING.sm,
    paddingRight: SPACING.md,
  },
  placeCardInRow: {
    width: 260,
    marginBottom: 0,
  },
  link: {
    fontSize: FONT_SIZES.body,
    color: COLORS.primary,
    // ห้ามลิงก์หดตัว ให้หัวข้อทางซ้ายเป็นฝ่ายขึ้นบรรทัดใหม่แทน
    flexShrink: 0,
  },
  emptyText: {
    fontSize: FONT_SIZES.body,
    color: COLORS.textMuted,
  },
});
