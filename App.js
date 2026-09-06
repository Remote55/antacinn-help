/**
 * จุดเริ่มต้นของแอป AntacinnHelp
 *
 * แอปพลิเคชันแผนที่เตือนจุดเสี่ยงสำหรับนักท่องเที่ยว
 * พื้นที่อำเภอหาดใหญ่และอำเภอเมืองสงขลา
 *
 * รายวิชา 344-312 Mobile Application Development ภาคการศึกษาที่ 1/2569
 *
 * ไฟล์นี้ทำแค่ 3 อย่าง คือครอบ SafeArea, ครอบ NavigationContainer และเรียก RootNavigator
 * ตรรกะทั้งหมดอยู่ในโฟลเดอร์ screens, hooks และ utils
 */

import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import RootNavigator from './navigation/RootNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="light" />
        <RootNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
