/**
 * หน้าบันทึกจุดเสี่ยง — ระยะ "หลังเดินทาง"
 *
 * ผู้ใช้บันทึกจุดที่เจอเองไว้เตือนตัวเองครั้งหน้า
 * ข้อมูลเก็บในเครื่องเท่านั้น ไม่ส่งขึ้นเซิร์ฟเวอร์
 *
 * จุดที่บันทึกเองจะถูกทำเครื่องหมายว่ายังไม่ยืนยันเสมอ
 * เพื่อไม่ให้ปนกับข้อมูลสถิติที่มีแหล่งอ้างอิง
 */

import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ScreenHeader from '../components/ScreenHeader';
import FilterChips from '../components/FilterChips';
import { showMessage, confirmAction } from '../components/dialogs';
import { useSavedPoints } from '../hooks/useSavedPoints';
import { useUserLocation } from '../hooks/useUserLocation';
import { HAZARD_TYPES } from '../constants/config';
import { COLORS, SPACING, FONT_SIZES, RADIUS } from '../constants/theme';

export default function SavePointScreen() {
  const [name, setName] = useState('');
  const [selectedTypes, setSelectedTypes] = useState([HAZARD_TYPES[1].id]); // ค่าเริ่มต้น: อุบัติเหตุรถ
  const [description, setDescription] = useState('');
  const [coordinate, setCoordinate] = useState(null);

  const { savedPoints, addPoint, removePoint } = useSavedPoints();
  const { fetchCurrentLocation, isLoading } = useUserLocation();

  async function handleGetLocation() {
    const result = await fetchCurrentLocation();
    if (result) {
      setCoordinate({ lat: result.lat, lng: result.lng });
    } else {
      showMessage('ดึงพิกัดไม่สำเร็จ', 'กรุณาตรวจสอบว่าเปิดสิทธิ์การเข้าถึงตำแหน่งแล้ว');
    }
  }

  async function handleSave() {
    // ตรวจข้อมูลที่จำเป็นก่อนบันทึก
    if (!name.trim()) {
      showMessage('กรอกข้อมูลไม่ครบ', 'กรุณากรอกชื่อจุด');
      return;
    }
    if (!coordinate) {
      showMessage('กรอกข้อมูลไม่ครบ', 'กรุณากดปุ่มดึงพิกัดปัจจุบันก่อนบันทึก');
      return;
    }

    await addPoint({
      name: name.trim(),
      type: selectedTypes[0],
      description: description.trim(),
      coordinate,
    });

    // ล้างฟอร์มให้พร้อมบันทึกจุดถัดไป
    setName('');
    setDescription('');
    setCoordinate(null);

    showMessage('บันทึกแล้ว', 'จุดนี้ถูกเก็บไว้ในเครื่องของคุณ');
  }

  function handleDelete(point) {
    confirmAction({
      title: 'ลบจุดนี้?',
      message: point.name,
      confirmLabel: 'ลบ',
      onConfirm: () => removePoint(point.id),
    });
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScreenHeader title="บันทึกจุดเสี่ยง" />

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.heading}>บันทึกจุดเสี่ยงที่คุณพบ</Text>
        <Text style={styles.subheading}>
          ช่วยกันบันทึกจุดที่คุณเห็นว่าอันตราย เพื่อเตือนตัวเองในครั้งหน้า
        </Text>

        <Text style={styles.label}>ชื่อจุด *</Text>
        <TextInput
          style={styles.input}
          placeholder="เช่น โค้งหน้าปั๊มน้ำมัน"
          placeholderTextColor={COLORS.textMuted}
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.label}>ประเภทอันตราย *</Text>
        <FilterChips selectedIds={selectedTypes} onChange={setSelectedTypes} singleSelect />

        <Text style={styles.label}>รายละเอียด</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="เช่น โค้งหักศอก มองไม่เห็นรถสวน"
          placeholderTextColor={COLORS.textMuted}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
        />

        <Text style={styles.label}>พิกัด *</Text>
        <Pressable style={styles.outlineButton} onPress={handleGetLocation} disabled={isLoading}>
          <Text style={styles.outlineButtonText}>
            {isLoading ? 'กำลังดึงพิกัด...' : 'ดึงพิกัดปัจจุบัน'}
          </Text>
        </Pressable>
        {coordinate && (
          <Text style={styles.coordinateText}>
            {coordinate.lat.toFixed(6)}, {coordinate.lng.toFixed(6)}
          </Text>
        )}

        <Pressable style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>บันทึก</Text>
        </Pressable>

        {savedPoints.length > 0 && (
          <View style={styles.savedSection}>
            <Text style={styles.heading}>จุดที่บันทึกไว้ ({savedPoints.length})</Text>
            {savedPoints.map((point) => (
              <View key={point.id} style={styles.savedRow}>
                <Text style={styles.savedName} numberOfLines={1}>
                  {point.name}
                </Text>
                <Pressable onPress={() => handleDelete(point)} hitSlop={8}>
                  <Text style={styles.deleteText}>ลบ</Text>
                </Pressable>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  heading: {
    fontSize: FONT_SIZES.title,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  subheading: {
    fontSize: FONT_SIZES.body,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
    marginBottom: SPACING.md,
    lineHeight: 22,
  },
  label: {
    fontSize: FONT_SIZES.body,
    color: COLORS.text,
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    fontSize: FONT_SIZES.body,
    color: COLORS.text,
  },
  textArea: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  outlineButton: {
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
  },
  outlineButtonText: {
    fontSize: FONT_SIZES.body,
    color: COLORS.primary,
    fontWeight: '600',
  },
  coordinateText: {
    fontSize: FONT_SIZES.body,
    color: COLORS.text,
    marginTop: SPACING.sm,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  saveButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.subtitle,
    fontWeight: 'bold',
  },
  savedSection: {
    marginTop: SPACING.xl,
  },
  savedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: SPACING.sm,
  },
  savedName: {
    flex: 1,
    fontSize: FONT_SIZES.body,
    color: COLORS.text,
  },
  deleteText: {
    fontSize: FONT_SIZES.body,
    color: COLORS.danger,
  },
});
