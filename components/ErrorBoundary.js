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
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Card from './Card';
import Icon from './Icon';
import Button from './Button';
import EmergencyButton from './EmergencyButton';
import { DEFAULT_EMERGENCY } from '../constants/config';
import { COLORS, TEXT, SPACING, RADIUS } from '../constants/theme';

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
          <Card style={styles.card}>
            <View style={styles.iconCircle}>
              <Icon name="warning-outline" size={32} color={COLORS.caution} />
            </View>
            <Text style={styles.title}>ขออภัย แอปแสดงหน้านี้ไม่ได้</Text>
            <Text style={styles.body}>กด "ลองใหม่" เพื่อกลับไปหน้าแรก ถ้ายังไม่หาย ให้ปิดแล้วเปิดแอปใหม่</Text>

            <Button title="ลองใหม่" icon="refresh" size="lg" onPress={this.handleRetry} />

            <Text style={styles.body}>ถ้าอยู่ในเหตุฉุกเฉิน โทรได้ทันที</Text>
            <EmergencyButton label={DEFAULT_EMERGENCY.label} tel={DEFAULT_EMERGENCY.tel} />

            <Text style={styles.detail}>รายละเอียดสำหรับผู้พัฒนา: {String((error && error.message) || error)}</Text>
          </Card>
        </ScrollView>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.page,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: SPACING.md,
  },
  card: {
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  iconCircle: {
    alignSelf: 'center',
    width: 64,
    height: 64,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.warningBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...TEXT.h1,
    color: COLORS.text,
    textAlign: 'center',
  },
  body: {
    ...TEXT.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  detail: {
    ...TEXT.small,
    color: COLORS.textMuted,
  },
});
