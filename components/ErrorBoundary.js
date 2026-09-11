/**
 * ตัวดักข้อผิดพลาดของทั้งแอป
 *
 * ถ้าหน้าจอไหนพังระหว่างวาด React จะถอดทั้งแอปออก ผู้ใช้เห็นแค่จอขาว ไม่รู้ว่าต้องทำอะไรต่อ
 * ตัวนี้แสดงข้อความภาษาไทย ปุ่มลองใหม่ และปุ่มโทรฉุกเฉินแทน
 * เพราะผู้ใช้แอปนี้อาจกำลังต้องการความช่วยเหลือพอดีตอนที่แอปพัง
 *
 * ต้องเขียนเป็น class เพราะ React ดักข้อผิดพลาดได้ผ่าน getDerivedStateFromError ของ class เท่านั้น
 * (ยังไม่มี hook ที่ทำแบบนี้ได้) ดักได้เฉพาะข้อผิดพลาดตอนวาดหน้าจอ
 * ข้อผิดพลาดใน onPress หรือ async ต้องจับเองด้วย try/catch เหมือนเดิม
 */

import React from 'react';
import { Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import EmergencyButton from './EmergencyButton';
import { DEFAULT_EMERGENCY } from '../constants/config';
import { COLORS, SPACING, FONT_SIZES, RADIUS } from '../constants/theme';

export default class ErrorBoundary extends React.Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  /** ล้างข้อผิดพลาดแล้ววาดแอปใหม่ทั้งหมด การนำทางเริ่มที่หน้าแรก ข้อมูลอ่านจากเครื่องใหม่ */
  handleRetry = () => {
    this.setState({ error: null });
  };

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <SafeAreaView style={styles.screen}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.icon}>⚠️</Text>
          <Text style={styles.title}>ขออภัย แอปแสดงหน้านี้ไม่ได้</Text>
          <Text style={styles.body}>กด "ลองใหม่" เพื่อกลับไปหน้าแรก ถ้ายังไม่หาย ให้ปิดแล้วเปิดแอปใหม่</Text>

          <Pressable style={styles.retryButton} onPress={this.handleRetry}>
            <Text style={styles.retryText}>ลองใหม่</Text>
          </Pressable>

          <Text style={styles.body}>ถ้าอยู่ในเหตุฉุกเฉิน โทรได้ทันที</Text>
          <EmergencyButton label={DEFAULT_EMERGENCY.label} tel={DEFAULT_EMERGENCY.tel} />

          <Text style={styles.detail}>รายละเอียดสำหรับผู้พัฒนา: {String((error && error.message) || error)}</Text>
        </ScrollView>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  icon: {
    fontSize: 48,
    textAlign: 'center',
  },
  title: {
    fontSize: FONT_SIZES.heading,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
  },
  body: {
    fontSize: FONT_SIZES.body,
    color: COLORS.text,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  retryText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.subtitle,
    fontWeight: 'bold',
  },
  detail: {
    fontSize: FONT_SIZES.small,
    color: COLORS.textMuted,
    marginTop: SPACING.md,
  },
});
