/**
 * ปุ่มโทรฉุกเฉิน กดแล้วเปิดแอปโทรศัพท์พร้อมเบอร์ที่กรอกไว้
 *
 * ใช้ Linking ของ React Native ซึ่งทำงานได้ทั้งบนมือถือและเว็บ
 */

import React from 'react';
import { Text, Pressable, Linking, Alert, StyleSheet } from 'react-native';
import { COLORS, SPACING, FONT_SIZES, RADIUS } from '../constants/theme';

export default function EmergencyButton({ label, tel }) {
  async function handlePress() {
    const url = 'tel:' + tel;
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert('โทรออกไม่ได้', 'กรุณาโทรที่หมายเลข ' + tel + ' ด้วยตนเอง');
      }
    } catch (error) {
      Alert.alert('โทรออกไม่ได้', 'กรุณาโทรที่หมายเลข ' + tel + ' ด้วยตนเอง');
    }
  }

  return (
    <Pressable
      style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
      onPress={handlePress}
    >
      <Text style={styles.text}>
        📞 โทร {tel} · {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: COLORS.danger,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    marginVertical: SPACING.sm,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  text: {
    color: COLORS.white,
    fontSize: FONT_SIZES.subtitle,
    fontWeight: 'bold',
  },
});
