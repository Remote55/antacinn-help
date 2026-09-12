/**
 * หน้าบันทึกจุดเสี่ยง — ระยะ "หลังเดินทาง"
 *
 * ผู้ใช้บันทึกจุดที่เจอเองไว้เตือนตัวเองครั้งหน้า
 * ข้อมูลเก็บในเครื่องเท่านั้น ไม่ส่งขึ้นเซิร์ฟเวอร์
 *
 * จุดที่บันทึกเองจะถูกทำเครื่องหมายว่ายังไม่ยืนยันเสมอ
 * เพื่อไม่ให้ปนกับข้อมูลสถิติที่มีแหล่งอ้างอิง
 *
 * จอกว้าง: ฟอร์มทางซ้าย รายการที่บันทึกไว้ทางขวา   มือถือ: เรียงลงมา
 */

import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ScreenHeader from '../components/ScreenHeader';
import FilterChips from '../components/FilterChips';
import Container from '../components/Container';
import Card from '../components/Card';
import Button from '../components/Button';
import TextField from '../components/TextField';
import Icon from '../components/Icon';
import { showMessage, confirmAction } from '../components/dialogs';
import { useSavedPoints } from '../hooks/useSavedPoints';
import { useUserLocation } from '../hooks/useUserLocation';
import { useLayout } from '../hooks/useLayout';
import { hazardFor } from '../utils/hazards';
import { HAZARD_TYPES } from '../constants/config';
import { COLORS, TEXT, SPACING, RADIUS } from '../constants/theme';

export default function SavePointScreen({ navigation }) {
  const { isWide } = useLayout();
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

  const formCard = (
    <Card style={styles.formCard}>
      <TextField label="ชื่อจุด" required placeholder="เช่น โค้งหน้าปั๊มน้ำมัน" value={name} onChangeText={setName} />

      <View style={styles.field}>
        <Text style={styles.label}>
          ประเภทอันตราย <Text style={styles.required}>*</Text>
        </Text>
        <FilterChips selectedIds={selectedTypes} onChange={setSelectedTypes} singleSelect wrap />
      </View>

      <TextField
        label="รายละเอียด"
        placeholder="เช่น โค้งหักศอก มองไม่เห็นรถสวน"
        value={description}
        onChangeText={setDescription}
        multiline
      />

      <View style={styles.field}>
        <Text style={styles.label}>
          พิกัด <Text style={styles.required}>*</Text>
        </Text>
        <View style={styles.coordinateRow}>
          <Button
            variant="secondary"
            icon="locate"
            title={isLoading ? 'กำลังดึงพิกัด...' : 'ดึงพิกัดปัจจุบัน'}
            onPress={handleGetLocation}
            disabled={isLoading}
          />
          {coordinate && (
            <View style={styles.coordinateValue}>
              <Icon name="checkmark-circle" size={18} color={COLORS.primary} />
              <Text style={styles.coordinateText}>
                {coordinate.lat.toFixed(6)}, {coordinate.lng.toFixed(6)}
              </Text>
            </View>
          )}
        </View>
      </View>

      <Button title="บันทึกจุดเสี่ยง" icon="save-outline" size="lg" onPress={handleSave} />

      <View style={styles.privacyNote}>
        <Icon name="lock-closed-outline" size={16} color={COLORS.textMuted} />
        <Text style={styles.privacyText}>
          เก็บในเครื่องนี้เท่านั้น ไม่ส่งขึ้นอินเทอร์เน็ต และแสดงป้าย "ยังไม่ยืนยัน" เสมอ เพราะไม่ใช่สถิติทางการ
        </Text>
      </View>
    </Card>
  );

  const savedCard = (
    <Card style={styles.savedCard}>
      <Text style={styles.cardTitle}>จุดที่บันทึกไว้ ({savedPoints.length})</Text>
      {savedPoints.length === 0 ? (
        <View style={styles.emptyBox}>
          <Icon name="bookmark-outline" size={28} color={COLORS.textMuted} />
          <Text style={styles.emptyText}>ยังไม่มีจุดที่บันทึก จุดที่บันทึกจะขึ้นบนแผนที่ทันที</Text>
        </View>
      ) : (
        savedPoints.map((point) => (
          <View key={point.id} style={styles.savedRow}>
            <View style={styles.savedIcon}>
              <Icon name={hazardFor(point.type).icon} size={18} color={COLORS.primary} />
            </View>
            <Pressable
              style={styles.savedText}
              onPress={() => navigation.navigate('RiskDetail', { pointId: point.id })}
              accessibilityRole="link"
            >
              <Text style={styles.savedName} numberOfLines={1}>
                {point.name}
              </Text>
              <Text style={styles.savedMeta}>{hazardFor(point.type).label}</Text>
            </Pressable>
            <Pressable
              onPress={() => handleDelete(point)}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={`ลบ ${point.name}`}
              style={({ hovered }) => [styles.deleteButton, hovered && styles.deleteButtonHovered]}
            >
              <Icon name="trash-outline" size={18} color={COLORS.dangerDark} />
              <Text style={styles.deleteText}>ลบ</Text>
            </Pressable>
          </View>
        ))
      )}
    </Card>
  );

  const subtitle = 'ช่วยกันบันทึกจุดที่คุณเห็นว่าอันตราย เพื่อเตือนตัวเองในครั้งหน้า';

  if (isWide) {
    return (
      <View style={styles.screen}>
        <ScrollView>
          <Container style={styles.wideContent}>
            <ScreenHeader title="บันทึกจุดเสี่ยง" subtitle={subtitle} icon="add-circle-outline" />
            <View style={styles.columns}>
              <View style={styles.formColumn}>{formCard}</View>
              <View style={styles.listColumn}>{savedCard}</View>
            </View>
          </Container>
        </ScrollView>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScreenHeader title="บันทึกจุดเสี่ยง" subtitle={subtitle} />
      <ScrollView contentContainerStyle={styles.narrowContent} keyboardShouldPersistTaps="handled">
        {formCard}
        {savedCard}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.page,
  },
  wideContent: {
    paddingBottom: SPACING.xl,
  },
  columns: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.lg,
  },
  formColumn: {
    flex: 3,
  },
  listColumn: {
    flex: 2,
  },
  narrowContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
    gap: 12,
  },
  formCard: {
    padding: SPACING.lg,
    gap: SPACING.lg,
  },
  field: {
    gap: SPACING.sm,
  },
  label: {
    ...TEXT.smallStrong,
    color: COLORS.text,
  },
  required: {
    color: COLORS.danger,
  },
  coordinateRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 12,
  },
  coordinateValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  coordinateText: {
    ...TEXT.bodyStrong,
    color: COLORS.text,
  },
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
  },
  privacyText: {
    flex: 1,
    ...TEXT.small,
    color: COLORS.textMuted,
  },
  savedCard: {
    gap: SPACING.sm,
  },
  cardTitle: {
    ...TEXT.h3,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  emptyBox: {
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.lg,
  },
  emptyText: {
    ...TEXT.small,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  savedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
  },
  savedIcon: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  savedText: {
    flex: 1,
    cursor: 'pointer',
  },
  savedName: {
    ...TEXT.bodyStrong,
    color: COLORS.text,
  },
  savedMeta: {
    ...TEXT.small,
    color: COLORS.textMuted,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
    cursor: 'pointer',
  },
  deleteButtonHovered: {
    backgroundColor: COLORS.dangerSoft,
  },
  deleteText: {
    ...TEXT.smallStrong,
    color: COLORS.dangerDark,
  },
});
