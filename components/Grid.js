/**
 * เรียงการ์ดเป็นตาราง จำนวนคอลัมน์ปรับตามความกว้างที่มีจริง
 *
 * วัดความกว้างของตัวเองด้วย onLayout แทนการเดาจากความกว้างจอ
 * เพราะบนเว็บแถบเลื่อนกินพื้นที่ไป 15 px ถ้าเดาจากจอ การ์ดใบสุดท้ายของแถวจะล้นไปขึ้นแถวใหม่
 * สูตรจำนวนคอลัมน์และความกว้างการ์ดอยู่ใน utils/layout.js (มีเทสต์)
 *
 * @param minItemWidth การ์ดแคบสุดได้เท่านี้ ถ้าแคบกว่านี้ลดจำนวนคอลัมน์
 * @param maxColumns   คอลัมน์มากสุด
 *
 * การ์ดในแถวเดียวกันสูงเท่ากันเสมอ (ใส่ flex: 1 ให้การ์ดแต่ละใบ ต้องรับ prop style)
 * ชื่อยาวสองบรรทัดจึงไม่ทำให้ปุ่มของการ์ดข้าง ๆ อยู่คนละระดับ
 */

import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { gridColumns, gridItemWidth } from '../utils/layout';
import { SPACING } from '../constants/theme';

export default function Grid({ children, minItemWidth = 280, maxColumns = 3, gap = SPACING.md, style }) {
  const [width, setWidth] = useState(0);
  const columns = gridColumns(width, minItemWidth, maxColumns, gap);
  // ปัดลงกันเศษทศนิยมที่ทำให้ผลรวมเกินความกว้างไปนิดเดียวแล้วการ์ดตกแถว
  const itemWidth = Math.floor(gridItemWidth(width, columns, gap));

  return (
    <View style={[styles.grid, { gap }, style]} onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
      {width > 0 &&
        React.Children.toArray(children).map((child) => (
          <View key={child.key} style={{ width: itemWidth }}>
            {React.cloneElement(child, { style: [child.props.style, styles.fillCell] })}
          </View>
        ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  fillCell: {
    flex: 1,
  },
});
