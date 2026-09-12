/**
 * หน้าแรก — ระยะ "ก่อนเดินทาง"
 *
 * ผู้ใช้ยังอยู่บ้าน กำลังวางแผน จึงเน้นให้เห็นภาพรวมเร็วที่สุด:
 *   1. ส่วนหัว: ช่องค้นหา (ได้ทั้งสถานที่และจุดเสี่ยง) ตัวเลขสรุป และแผนที่ย่อ (จอกว้าง)
 *   2. แถบสรุปว่าเดือนนี้ต้องระวังอะไรเป็นพิเศษ และแถบเตือนคลื่นแรง
 *   3. รายการโปรด (แสดงเมื่อผู้ใช้กดดาวไว้)
 *   4. การ์ดสถานที่ยอดนิยม (เอกสารบทที่ 4)
 *   5. การ์ดจุดที่ควรระวังมากที่สุดตอนนี้
 *   6. ส่วนท้าย: ข้อความปฏิเสธความรับผิดชอบ (เอกสารข้อ 7.4) และที่มาของข้อมูล
 *
 * จอกว้างเรียงการ์ดเป็นตาราง มือถือเรียงลงมา (การ์ดสถานที่เลื่อนแนวนอน)
 */

import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useIsFocused } from '@react-navigation/native';
import HomeHero from '../components/HomeHero';
import Container from '../components/Container';
import SectionHeader from '../components/SectionHeader';
import Grid from '../components/Grid';
import Card from '../components/Card';
import Icon from '../components/Icon';
import Button from '../components/Button';
import RiskPointCard from '../components/RiskPointCard';
import PlaceCard from '../components/PlaceCard';
import SiteFooter from '../components/SiteFooter';
import { useRiskPoints } from '../hooks/useRiskPoints';
import { usePlaces } from '../hooks/usePlaces';
import { useFavorites } from '../hooks/useFavorites';
import { useLiveConditions } from '../hooks/useLiveConditions';
import { useLayout } from '../hooks/useLayout';
import { summarizeSeason } from '../utils/season';
import { pickFavoritePoints } from '../utils/favorites';
import { classifyWaves } from '../utils/conditions';
import { pointToMarker } from '../utils/mapMarkers';
import { CONDITIONS, CONDITIONS_DISCLAIMER } from '../constants/config';
import { COLORS, TEXT, SPACING, RADIUS } from '../constants/theme';

/** การ์ดสถานที่บนมือถือกว้างเท่านี้ ให้เห็นใบถัดไปโผล่มานิดหนึ่ง รู้ว่าเลื่อนได้ */
const PLACE_CARD_WIDTH_NARROW = 280;
/** จอกว้างแสดงสถานที่ก่อน 2 แถว (4 คอลัมน์) ที่เหลือกดดูเพิ่ม ไม่ให้หน้ายาวเกินไป */
const PLACES_SHOWN_FIRST = 8;

export default function HomeScreen({ navigation }) {
  const [keyword, setKeyword] = useState('');
  const [showAllPlaces, setShowAllPlaces] = useState(false);
  const { isWide } = useLayout();
  const isFocused = useIsFocused();
  const { allPoints, topRiskPoints, searchPoints } = useRiskPoints();
  const { places, searchPlaces } = usePlaces();
  const { favoriteIds } = useFavorites();

  // คลื่นแถบหาดสมิหลา–ชลาทัศน์ แสดงแถบเตือนเฉพาะตอนคลื่นแรง (เอกสารออกแบบระยะที่ 2 ข้อ D3)
  const beach = useLiveConditions(CONDITIONS.BEACH_COORDINATE, { waves: true });
  const beachLevel = beach.waves ? classifyWaves(beach.waves.heightM) : null;
  const isBeachRough = beachLevel !== null && (beachLevel.id === 'rough' || beachLevel.id === 'danger');

  // หัวข้อและเนื้อความของแถบฤดูกาลมาจากข้อมูลชุดเดียวกัน (utils/season.js) จึงไม่ขัดกัน
  const season = summarizeSeason(allPoints, new Date().getMonth() + 1);
  const hasSeasonPeak = season.pointsInPeak.length > 0;
  const favoritePoints = pickFavoritePoints(favoriteIds, allPoints);

  const isSearching = keyword.trim().length > 0;
  const placeResults = searchPlaces(keyword);
  const pointResults = searchPoints(keyword);

  // useMemo: แผนที่ย่อซูมให้เห็นทุกหมุดเมื่อหมุดเปลี่ยน ถ้าสร้างอาเรย์ใหม่ทุกครั้งที่พิมพ์ค้นหา แผนที่จะซูมกลับตลอด
  const heroMarkers = useMemo(() => (isWide ? allPoints.map(pointToMarker) : []), [allPoints, isWide]);

  const stats = [
    { value: allPoints.length, label: 'จุดเสี่ยงในระบบ' },
    { value: allPoints.filter((point) => point.verified === true).length, label: 'จุดจากสถิติทางการ' },
    { value: places.length, label: 'สถานที่ยอดนิยม' },
  ];

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

  function renderPointCards(points) {
    return points.map((point) => (
      <RiskPointCard key={point.id} point={point} onPress={() => openDetail(point.id)} />
    ));
  }

  /** การ์ดจุดเสี่ยง: จอกว้างเป็นตาราง มือถือเรียงลงมา */
  function renderPointList(points) {
    if (isWide) {
      return (
        <Grid minItemWidth={340} maxColumns={3}>
          {renderPointCards(points)}
        </Grid>
      );
    }
    return <View style={styles.stack}>{renderPointCards(points)}</View>;
  }

  return (
    <View style={styles.screen}>
      {/* ส่วนหัวสีกรมท่าชิดขอบบนจอมือถือ ตัวอักษรแถบสถานะต้องเป็นสีขาว */}
      {isFocused && !isWide && <StatusBar style="light" />}

      <ScrollView keyboardShouldPersistTaps="handled">
        <HomeHero
          keyword={keyword}
          onChangeKeyword={setKeyword}
          stats={stats}
          markers={heroMarkers}
          onOpenMap={() => navigation.navigate('Map')}
          onMarkerPress={openDetail}
        />

        <Container style={styles.body}>
          {isSearching ? (
            <View style={styles.section}>
              <SectionHeader
                title={`ผลการค้นหา "${keyword.trim()}"`}
                subtitle={`สถานที่ ${placeResults.length} แห่ง · จุดเสี่ยง ${pointResults.length} จุด`}
              />

              {placeResults.length === 0 && pointResults.length === 0 && (
                <Card style={styles.emptyCard}>
                  <Icon name="search-outline" size={28} color={COLORS.textMuted} />
                  <Text style={styles.emptyText}>
                    ไม่พบสถานที่หรือจุดเสี่ยงที่ตรงกับคำค้นหา ลองพิมพ์ชื่ออำเภอ เช่น หาดใหญ่
                  </Text>
                </Card>
              )}

              {placeResults.length > 0 && (
                <View style={styles.subsection}>
                  <Text style={styles.subsectionTitle}>สถานที่</Text>
                  <Grid minItemWidth={260} maxColumns={4}>
                    {placeResults.map((place) => renderPlaceCard(place))}
                  </Grid>
                </View>
              )}

              {pointResults.length > 0 && (
                <View style={styles.subsection}>
                  <Text style={styles.subsectionTitle}>จุดเสี่ยง</Text>
                  {renderPointList(pointResults)}
                </View>
              )}
            </View>
          ) : (
            <>
              <View style={[styles.alerts, isWide && styles.alertsWide]}>
                {isBeachRough && (
                  <View style={[styles.alertCard, styles.waveAlert]}>
                    <Icon name="water" size={22} color={COLORS.dangerDark} />
                    <View style={styles.alertText}>
                      <Text style={[styles.alertTitle, styles.waveTitle]}>
                        คลื่นแถบหาดสมิหลา–ชลาทัศน์ตอนนี้ประมาณ {beach.waves.heightM.toFixed(1)} ม. · {beachLevel.label}
                      </Text>
                      <Text style={styles.alertBody}>
                        {beachLevel.advice} · {CONDITIONS_DISCLAIMER}
                      </Text>
                    </View>
                  </View>
                )}

                {/* แถบสรุปความเสี่ยงประจำเดือน ปรับข้อความตามข้อมูลจริง */}
                <View style={[styles.alertCard, hasSeasonPeak ? styles.seasonPeak : styles.seasonCalm]}>
                  <Icon name="calendar-outline" size={22} color={hasSeasonPeak ? COLORS.caution : COLORS.primary} />
                  <View style={styles.alertText}>
                    <Text style={styles.alertTitle}>{season.title}</Text>
                    <Text style={styles.alertBody}>{season.body}</Text>
                  </View>
                </View>
              </View>

              {favoritePoints.length > 0 && (
                <View style={styles.section}>
                  <SectionHeader title="รายการโปรด" icon="star" subtitle="จุดที่คุณกดดาวไว้ในหน้ารายละเอียด" />
                  {renderPointList(favoritePoints)}
                </View>
              )}

              <View style={styles.section}>
                <SectionHeader
                  title="สถานที่ยอดนิยม"
                  subtitle="จำนวนจุดเสี่ยงในรัศมี 2 กม. รอบสถานที่ท่องเที่ยว"
                />
                {isWide ? (
                  <>
                    <Grid minItemWidth={260} maxColumns={4}>
                      {(showAllPlaces ? places : places.slice(0, PLACES_SHOWN_FIRST)).map((place) =>
                        renderPlaceCard(place)
                      )}
                    </Grid>
                    {places.length > PLACES_SHOWN_FIRST && (
                      <Button
                        variant="secondary"
                        icon={showAllPlaces ? 'chevron-up' : 'chevron-down'}
                        title={showAllPlaces ? 'แสดงน้อยลง' : `ดูสถานที่ทั้งหมด (${places.length})`}
                        onPress={() => setShowAllPlaces(!showAllPlaces)}
                        style={styles.showAllButton}
                      />
                    )}
                  </>
                ) : (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.placeRow}
                    style={styles.placeScroller}
                  >
                    {places.map((place) => renderPlaceCard(place, styles.placeCardNarrow))}
                  </ScrollView>
                )}
              </View>

              <View style={styles.section}>
                <SectionHeader
                  title="จุดที่ควรระวังมากที่สุดตอนนี้"
                  subtitle="เรียงตามคะแนนความเสี่ยง ณ เดือนและช่วงเวลาปัจจุบัน"
                  actionLabel="ดูทั้งหมดบนแผนที่"
                  onAction={() => navigation.navigate('Map')}
                />
                {renderPointList(topRiskPoints)}
              </View>
            </>
          )}
        </Container>

        <SiteFooter />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.page,
  },
  body: {
    paddingTop: SPACING.lg,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  subsection: {
    marginBottom: SPACING.lg,
    gap: 12,
  },
  subsectionTitle: {
    ...TEXT.h3,
    color: COLORS.textSecondary,
  },
  stack: {
    gap: 12,
  },
  alerts: {
    gap: 12,
    marginBottom: SPACING.xl,
  },
  alertsWide: {
    flexDirection: 'row',
  },
  alertCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
  },
  seasonPeak: {
    backgroundColor: COLORS.warningBackground,
    borderColor: COLORS.warningBorder,
  },
  seasonCalm: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
  },
  waveAlert: {
    backgroundColor: COLORS.dangerSoft,
    borderColor: '#F5B7B7',
  },
  alertText: {
    flex: 1,
    gap: 2,
  },
  alertTitle: {
    ...TEXT.bodyStrong,
    color: COLORS.text,
  },
  waveTitle: {
    color: COLORS.dangerDark,
  },
  alertBody: {
    ...TEXT.small,
    color: COLORS.textSecondary,
  },
  placeScroller: {
    // ให้การ์ดเลื่อนชิดขอบจอ ไม่ถูกตัดที่ขอบเนื้อหา
    marginHorizontal: -SPACING.md,
  },
  placeRow: {
    gap: 12,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xs,
  },
  placeCardNarrow: {
    width: PLACE_CARD_WIDTH_NARROW,
  },
  showAllButton: {
    alignSelf: 'center',
    marginTop: SPACING.md,
  },
  emptyCard: {
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.xl,
  },
  emptyText: {
    ...TEXT.body,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
});
