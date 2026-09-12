/**
 * โครงสร้างการนำทางของทั้งแอป
 *
 *   Stack (ชั้นนอก)
 *   ├── MainTabs — 4 หน้าหลัก
 *   │   ├── หน้าแรก
 *   │   ├── แผนที่
 *   │   ├── เส้นทาง
 *   │   └── บันทึก
 *   ├── RiskDetail — เปิดทับขึ้นมา มีปุ่มย้อนกลับ
 *   └── TripMode   — เปิดทับขึ้นมา มีปุ่มย้อนกลับ
 *
 * มือถือ: แถบแท็บด้านล่าง และแถบหัวสีขาวบนหน้าที่เปิดทับ
 * จอกว้าง: ซ่อนทั้งสองอย่าง เพราะมีแถบเมนูบน (components/TopNavBar.js) และปุ่มย้อนกลับในหน้าแทน
 *
 * ออกแบบให้ผู้ใช้ไปถึงข้อมูลที่ต้องการภายในการกดไม่เกิน 2 ครั้งจากหน้าแรก
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import HomeScreen from '../screens/HomeScreen';
import MapScreen from '../screens/MapScreen';
import RoutePlannerScreen from '../screens/RoutePlannerScreen';
import SavePointScreen from '../screens/SavePointScreen';
import RiskDetailScreen from '../screens/RiskDetailScreen';
import TripModeScreen from '../screens/TripModeScreen';
import Icon from '../components/Icon';
import { useLayout } from '../hooks/useLayout';

import { COLORS, FONTS } from '../constants/theme';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

/** ไอคอนของแต่ละแท็บ [ตอนไม่ได้เลือก, ตอนเลือกอยู่] */
const TAB_ICONS = {
  Home: ['home-outline', 'home'],
  Map: ['map-outline', 'map'],
  RoutePlanner: ['navigate-outline', 'navigate'],
  SavePoint: ['add-circle-outline', 'add-circle'],
};

function MainTabs() {
  const { isWide } = useLayout();
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarLabelStyle: { fontFamily: FONTS.semibold, fontSize: 11, lineHeight: 16 },
        // ฟอนต์ไทยสูงกว่าฟอนต์อังกฤษ ความสูงตั้งต้นของแถบแท็บจะตัดสระล่างของชื่อแท็บ จึงกำหนดความสูงเอง
        // (บวกขอบล่างของ iPhone ที่มีแถบโฮม ไม่อย่างนั้นแท็บจะไปอยู่ใต้แถบโฮม)
        tabBarStyle: isWide
          ? { display: 'none' }
          : {
              backgroundColor: COLORS.card,
              borderTopColor: COLORS.border,
              // ข้างในต้องสูงพอ: ขอบปุ่ม 10 + ไอคอน 28 + ชื่อแท็บ 16
              height: 68 + insets.bottom,
              paddingTop: 4,
              paddingBottom: 6 + insets.bottom,
            },
        tabBarIcon: ({ color, focused }) => (
          <Icon name={TAB_ICONS[route.name][focused ? 1 : 0]} size={23} color={color} />
        ),
        sceneStyle: { backgroundColor: COLORS.page },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'หน้าแรก' }} />
      <Tab.Screen name="Map" component={MapScreen} options={{ title: 'แผนที่' }} />
      <Tab.Screen name="RoutePlanner" component={RoutePlannerScreen} options={{ title: 'เส้นทาง' }} />
      <Tab.Screen name="SavePoint" component={SavePointScreen} options={{ title: 'บันทึก' }} />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  const { isWide } = useLayout();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: !isWide,
        headerStyle: { backgroundColor: COLORS.card },
        headerTintColor: COLORS.primary,
        headerTitleStyle: { fontFamily: FONTS.semibold, fontSize: 17, color: COLORS.text },
        headerBackTitle: 'กลับ',
        contentStyle: { backgroundColor: COLORS.page },
      }}
    >
      <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false, title: 'หน้าแรก' }} />
      <Stack.Screen name="RiskDetail" component={RiskDetailScreen} options={{ title: 'รายละเอียดจุดเสี่ยง' }} />
      <Stack.Screen name="TripMode" component={TripModeScreen} options={{ title: 'โหมดเดินทาง' }} />
    </Stack.Navigator>
  );
}
