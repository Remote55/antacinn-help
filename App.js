/**
 * จุดเริ่มต้นของแอป AntacinnHelp
 *
 * แอปพลิเคชันแผนที่เตือนจุดเสี่ยงสำหรับนักท่องเที่ยว
 * พื้นที่อำเภอหาดใหญ่และอำเภอเมืองสงขลา
 *
 * รายวิชา 344-312 Mobile Application Development ภาคการศึกษาที่ 1/2569
 *
 * ไฟล์นี้ทำแค่ 4 อย่าง คือครอบ SafeArea, ครอบข้อมูลกลาง (AppDataProvider),
 * ครอบ NavigationContainer และเรียก RootNavigator
 * ตรรกะทั้งหมดอยู่ในโฟลเดอร์ screens, hooks และ utils
 */

import React from 'react';
import { View, Platform, StyleSheet, useWindowDimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import RootNavigator from './navigation/RootNavigator';
import { AppDataProvider } from './hooks/AppDataProvider';
import { COLORS } from './constants/theme';

/** ความกว้างสูงสุดของแอปบนเว็บ ประมาณมือถือจอใหญ่ */
const MAX_WEB_APP_WIDTH = 560;

export default function App() {
  const { width } = useWindowDimensions();
  // บนคอมพิวเตอร์ แสดงแอปเป็นคอลัมน์ขนาดมือถือตรงกลางจอ แทนการยืดการ์ดเต็มจอกว้าง
  const isWideWebScreen = Platform.OS === 'web' && width > MAX_WEB_APP_WIDTH;

  return (
    <SafeAreaProvider>
      {/* ข้อมูลกลางต้องครอบ NavigationContainer เพื่อให้ทุกหน้าจอเห็นข้อมูลชุดเดียวกัน */}
      <AppDataProvider>
        <View style={styles.page}>
          <View style={[styles.app, isWideWebScreen && styles.webColumn]}>
            <NavigationContainer>
              <StatusBar style="light" />
              <RootNavigator />
            </NavigationContainer>
          </View>
        </View>
      </AppDataProvider>
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
