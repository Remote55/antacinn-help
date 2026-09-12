/**
 * จุดเริ่มต้นของแอป AntacinnHelp
 *
 * แอปพลิเคชันแผนที่เตือนจุดเสี่ยงสำหรับนักท่องเที่ยว
 * พื้นที่อำเภอหาดใหญ่และอำเภอเมืองสงขลา
 *
 * รายวิชา 344-312 Mobile Application Development ภาคการศึกษาที่ 1/2569
 *
 * ไฟล์นี้ทำแค่ประกอบชิ้นใหญ่เข้าด้วยกัน:
 *   โหลดฟอนต์และไอคอน → ครอบ SafeArea → ตัวดักข้อผิดพลาด (ErrorBoundary) → ข้อมูลกลาง (AppDataProvider)
 *   → NavigationContainer → แถบเมนูบน (เฉพาะจอกว้าง) + RootNavigator
 * ตรรกะทั้งหมดอยู่ในโฟลเดอร์ screens, hooks และ utils
 */

import React, { useEffect, useState } from 'react';
import { View, Platform, StyleSheet, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import Ionicons from '@expo/vector-icons/Ionicons';
// import ทีละน้ำหนัก ถ้า import จากชื่อแพ็กเกจเฉย ๆ จะติดฟอนต์ทั้ง 7 น้ำหนัก (ไฟล์ละ ~110 KB) มาในเว็บ
import { IBMPlexSansThai_400Regular } from '@expo-google-fonts/ibm-plex-sans-thai/400Regular';
import { IBMPlexSansThai_600SemiBold } from '@expo-google-fonts/ibm-plex-sans-thai/600SemiBold';
import { IBMPlexSansThai_700Bold } from '@expo-google-fonts/ibm-plex-sans-thai/700Bold';

import RootNavigator from './navigation/RootNavigator';
import TopNavBar from './components/TopNavBar';
import ErrorBoundary from './components/ErrorBoundary';
import OfflineBanner from './components/OfflineBanner';
import { AppDataProvider } from './hooks/AppDataProvider';
import { useLayout } from './hooks/useLayout';
import { COLORS, FONTS } from './constants/theme';

const navigationRef = createNavigationContainerRef();

/** ชื่อแท็บของเบราว์เซอร์ เช่น "แผนที่ · AntacinnHelp" */
const DOCUMENT_TITLE = {
  formatter: (options, route) => `${(options && options.title) || (route && route.name) || 'หน้าแรก'} · AntacinnHelp`,
};

export default function App() {
  const { isWide } = useLayout();
  const [currentRoute, setCurrentRoute] = useState('Home');
  const [fontsLoaded, fontError] = useFonts({
    [FONTS.regular]: IBMPlexSansThai_400Regular,
    [FONTS.semibold]: IBMPlexSansThai_600SemiBold,
    [FONTS.bold]: IBMPlexSansThai_700Bold,
    ...Ionicons.font,
  });

  // เว็บที่ build แล้ว: ลงทะเบียน service worker ให้เปิดแอปได้แม้ไม่มีอินเทอร์เน็ต
  // (ไฟล์ sw.js สร้างโดย scripts/build-sw.mjs ตอนพัฒนาไม่มีไฟล์นี้ และไม่ควรเก็บโค้ดที่กำลังแก้ไว้)
  useEffect(() => {
    if (Platform.OS !== 'web' || __DEV__ || typeof navigator === 'undefined' || !navigator.serviceWorker) return;
    navigator.serviceWorker.register('sw.js').catch(() => {
      // ลงทะเบียนไม่ได้ (เช่น เปิดผ่าน http ธรรมดา) แอปยังใช้ได้ตามปกติ แค่ไม่มีโหมดออฟไลน์
    });
  }, []);

  /** จำหน้าที่เปิดอยู่ ให้แถบเมนูบนไฮไลต์ถูกเมนู */
  function updateCurrentRoute() {
    const route = navigationRef.getCurrentRoute();
    if (route) setCurrentRoute(route.name);
  }

  /** กดเมนูบนแถบบน: ไปหน้าหลักนั้น ปิดหน้ารายละเอียดที่เปิดทับอยู่ด้วย */
  function openMainScreen(name) {
    if (!navigationRef.isReady()) return;
    // React Navigation 7: navigate ไปหน้าที่อยู่ในสแต็กแล้วต้องใส่ pop: true
    // ไม่อย่างนั้นจะซ้อน MainTabs ชุดใหม่ขึ้นมาทับ แทนที่จะย้อนกลับไปชุดเดิม
    navigationRef.navigate('MainTabs', { screen: name }, { pop: true });
  }

  // ระหว่างรอฟอนต์ แสดงพื้นกรมท่า (สีเดียวกับหน้าจอเปิดแอป) ไม่ให้ตัวหนังสือกระพริบเปลี่ยนฟอนต์
  // ถ้าโหลดฟอนต์ไม่ได้ (fontError) ก็ไปต่อด้วยฟอนต์ของเครื่อง ดีกว่าค้างอยู่หน้านี้
  if (!fontsLoaded && !fontError) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator color={COLORS.white} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <View style={styles.app}>
        <OfflineBanner />
        {/* หน้าจอไหนพังระหว่างวาด แสดงหน้าขอโทษพร้อมปุ่มลองใหม่และเบอร์ฉุกเฉิน แทนจอขาว */}
        <ErrorBoundary>
          {/* ข้อมูลกลางต้องครอบ NavigationContainer เพื่อให้ทุกหน้าจอเห็นข้อมูลชุดเดียวกัน */}
          <AppDataProvider>
            <NavigationContainer
              ref={navigationRef}
              onReady={updateCurrentRoute}
              onStateChange={updateCurrentRoute}
              documentTitle={DOCUMENT_TITLE}
            >
              <StatusBar style="dark" />
              {isWide && <TopNavBar activeRoute={currentRoute} onNavigate={openMainScreen} />}
              <RootNavigator />
            </NavigationContainer>
          </AppDataProvider>
        </ErrorBoundary>
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  app: {
    flex: 1,
    backgroundColor: COLORS.page,
  },
});
