/**
 * จุดเริ่มต้นของแอป AntacinnHelp
 *
 * แอปพลิเคชันแผนที่เตือนจุดเสี่ยงสำหรับนักท่องเที่ยว
 * พื้นที่อำเภอหาดใหญ่และอำเภอเมืองสงขลา
 *
 * รายวิชา 344-312 Mobile Application Development ภาคการศึกษาที่ 1/2569
 *
 * ไฟล์นี้ทำแค่ 5 อย่าง คือครอบ SafeArea, ครอบตัวดักข้อผิดพลาด (ErrorBoundary),
 * ครอบข้อมูลกลาง (AppDataProvider), ครอบ NavigationContainer และเรียก RootNavigator
 * ตรรกะทั้งหมดอยู่ในโฟลเดอร์ screens, hooks และ utils
 */

import React, { useEffect } from 'react';
import { View, Platform, StyleSheet, useWindowDimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import RootNavigator from './navigation/RootNavigator';
import ErrorBoundary from './components/ErrorBoundary';
import OfflineBanner from './components/OfflineBanner';
import { AppDataProvider } from './hooks/AppDataProvider';
import { COLORS } from './constants/theme';

/** ความกว้างสูงสุดของแอปบนเว็บ ประมาณมือถือจอใหญ่ */
const MAX_WEB_APP_WIDTH = 560;

export default function App() {
  const { width } = useWindowDimensions();
  // บนคอมพิวเตอร์ แสดงแอปเป็นคอลัมน์ขนาดมือถือตรงกลางจอ แทนการยืดการ์ดเต็มจอกว้าง
  const isWideWebScreen = Platform.OS === 'web' && width > MAX_WEB_APP_WIDTH;

  // เว็บที่ build แล้ว: ลงทะเบียน service worker ให้เปิดแอปได้แม้ไม่มีอินเทอร์เน็ต
  // (ไฟล์ sw.js สร้างโดย scripts/build-sw.mjs ตอนพัฒนาไม่มีไฟล์นี้ และไม่ควรเก็บโค้ดที่กำลังแก้ไว้)
  useEffect(() => {
    if (Platform.OS !== 'web' || __DEV__ || typeof navigator === 'undefined' || !navigator.serviceWorker) return;
    navigator.serviceWorker.register('sw.js').catch(() => {
      // ลงทะเบียนไม่ได้ (เช่น เปิดผ่าน http ธรรมดา) แอปยังใช้ได้ตามปกติ แค่ไม่มีโหมดออฟไลน์
    });
  }, []);

  return (
    <SafeAreaProvider>
      <View style={styles.page}>
        <View style={[styles.app, isWideWebScreen && styles.webColumn]}>
          <OfflineBanner />
          {/* หน้าจอไหนพังระหว่างวาด แสดงหน้าขอโทษพร้อมปุ่มลองใหม่และเบอร์ฉุกเฉิน แทนจอขาว */}
          <ErrorBoundary>
            {/* ข้อมูลกลางต้องครอบ NavigationContainer เพื่อให้ทุกหน้าจอเห็นข้อมูลชุดเดียวกัน */}
            <AppDataProvider>
              <NavigationContainer>
                <StatusBar style="light" />
                <RootNavigator />
              </NavigationContainer>
            </AppDataProvider>
          </ErrorBoundary>
        </View>
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  app: {
    flex: 1,
    width: '100%',
    backgroundColor: COLORS.background,
  },
  webColumn: {
    maxWidth: MAX_WEB_APP_WIDTH,
    alignSelf: 'center',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
});
