/**
 * หน้าแรก — ระยะ "ก่อนเดินทาง"
 *
 * ผู้ใช้ยังอยู่บ้าน กำลังวางแผน จึงเน้นให้เห็นภาพรวมเร็วที่สุด:
 *   1. ช่องค้นหาสถานที่
 *   2. แถบสรุปว่าเดือนนี้ต้องระวังอะไรเป็นพิเศษ
 *   3. การ์ดจุดที่ควรระวังมากที่สุดตอนนี้
 */

import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ScreenHeader from '../components/ScreenHeader';
import RiskPointCard from '../components/RiskPointCard';
import Disclaimer from '../components/Disclaimer';
import { useRiskPoints } from '../hooks/useRiskPoints';
import { COLORS, SPACING, FONT_SIZES, RADIUS } from '../constants/theme';

/** ชื่อเดือนภาษาไทย ใช้แสดงในแถบสรุป (index 0 = มกราคม) */
const THAI_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
];

export default function HomeScreen({ navigation }) {
  const [keyword, setKeyword] = useState('');
  const { allPoints, topRiskPoints, searchPoints } = useRiskPoints();

  const currentMonth = new Date().getMonth() + 1; // 1-12
  const monthName = THAI_MONTHS[currentMonth - 1];

  // นับว่ามีกี่จุดที่เดือนนี้เป็นเดือนเสี่ยงสูง
  const pointsPeakingThisMonth = allPoints.filter((point) =>
    (point.peakMonths || []).includes(currentMonth)
  );

  const searchResults = searchPoints(keyword);
  const isSearching = keyword.trim().length > 0;

  function openDetail(pointId) {
    navigation.navigate('RiskDetail', { pointId });
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
            <Text style={styles.sectionTitle}>ผลการค้นหา ({searchResults.length})</Text>
            {searchResults.length === 0 ? (
              <Text style={styles.emptyText}>
                ไม่พบสถานที่ที่ตรงกับคำค้นหา ลองพิมพ์ชื่ออำเภอ เช่น หาดใหญ่
              </Text>
            ) : (
              searchResults.map((point) => (
                <RiskPointCard
                  key={point.id}
                  point={point}
                  onPress={() => openDetail(point.id)}
                />
              ))
            )}
          </View>
        ) : (
          <>
            {/* แถบสรุปความเสี่ยงประจำเดือน ปรับข้อความตามข้อมูลจริง */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>ช่วง{monthName}นี้ต้องระวังเป็นพิเศษ</Text>
              <Text style={styles.seasonText}>
                {pointsPeakingThisMonth.length > 0
                  ? `มี ${pointsPeakingThisMonth.length} จุดที่อยู่ในช่วงเสี่ยงสูงของปี ควรเพิ่มความระมัดระวัง`
                  : 'เดือนนี้ไม่มีจุดใดที่อยู่ในช่วงเสี่ยงสูงเป็นพิเศษ แต่ยังควรระวังตามปกติ'}
              </Text>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>จุดที่ควรระวังมากที่สุดตอนนี้</Text>
                <Pressable onPress={() => navigation.navigate('Map')}>
                  <Text style={styles.link}>ดูแผนที่ทั้งหมด</Text>
                </Pressable>
              </View>

              {topRiskPoints.map((point) => (
                <RiskPointCard
                  key={point.id}
                  point={point}
                  onPress={() => openDetail(point.id)}
                />
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
  link: {
    fontSize: FONT_SIZES.body,
    color: COLORS.primary,
  },
  emptyText: {
    fontSize: FONT_SIZES.body,
    color: COLORS.textMuted,
  },
});
