/**
 * โครงสร้างการนำทางของทั้งแอป
 *
 *   Stack (ชั้นนอก)
 *   ├── MainTabs — แถบเมนู 4 ปุ่มด้านล่าง
 *   │   ├── หน้าแรก
 *   │   ├── แผนที่
 *   │   ├── เส้นทาง
 *   │   └── บันทึก
 *   ├── RiskDetail — เปิดทับขึ้นมา มีปุ่มย้อนกลับ
 *   └── TripMode   — เปิดทับขึ้นมา มีปุ่มย้อนกลับ
 *
 * ออกแบบให้ผู้ใช้ไปถึงข้อมูลที่ต้องการภายในการกดไม่เกิน 2 ครั้งจากหน้าแรก
 */

import React from 'react';
import { Text } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import HomeScreen from '../screens/HomeScreen';
import MapScreen from '../screens/MapScreen';
import RoutePlannerScreen from '../screens/RoutePlannerScreen';
import SavePointScreen from '../screens/SavePointScreen';
import RiskDetailScreen from '../screens/RiskDetailScreen';
import TripModeScreen from '../screens/TripModeScreen';

import { COLORS } from '../constants/theme';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

/** ใช้ emoji เป็นไอคอน เพราะไม่ต้องพึ่งไลบรารีเพิ่ม และแสดงผลได้ทั้งมือถือและเว็บ */
function makeTabIcon(emoji) {
  return function TabIcon() {
    return <Text style={{ fontSize: 22 }}>{emoji}</Text>;
  };
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: 'หน้าแรก', tabBarIcon: makeTabIcon('🏠') }}
      />
      <Tab.Screen
        name="Map"
        component={MapScreen}
        options={{ title: 'แผนที่', tabBarIcon: makeTabIcon('🗺️') }}
      />
      <Tab.Screen
        name="RoutePlanner"
        component={RoutePlannerScreen}
        options={{ title: 'เส้นทาง', tabBarIcon: makeTabIcon('🛣️') }}
      />
      <Tab.Screen
        name="SavePoint"
        component={SavePointScreen}
        options={{ title: 'บันทึก', tabBarIcon: makeTabIcon('✏️') }}
      />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.primary },
        headerTintColor: COLORS.white,
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
      <Stack.Screen
        name="RiskDetail"
        component={RiskDetailScreen}
        options={{ title: 'รายละเอียดจุดเสี่ยง' }}
      />
      <Stack.Screen
        name="TripMode"
        component={TripModeScreen}
        options={{ title: 'โหมดเดินทาง' }}
      />
    </Stack.Navigator>
  );
}
