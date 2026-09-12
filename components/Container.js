/**
 * กรอบเนื้อหาตรงกลางจอ กว้างไม่เกิน 1200 px และเว้นขอบซ้ายขวาตามขนาดจอ
 * บนจอใหญ่เนื้อหาไม่ยืดสุดขอบ อ่านง่ายเหมือนเว็บทั่วไป บนมือถือเต็มความกว้างเว้นขอบ 16 px
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useLayout } from '../hooks/useLayout';
import { LAYOUT } from '../constants/theme';

export default function Container({ children, style }) {
  const { padding } = useLayout();
  return <View style={[styles.container, { paddingHorizontal: padding }, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: LAYOUT.CONTENT_MAX_WIDTH,
    alignSelf: 'center',
  },
});
