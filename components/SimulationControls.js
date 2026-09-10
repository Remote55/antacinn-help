/**
 * ปุ่มควบคุมโหมดจำลองการเดินทาง: เล่น/หยุด เริ่มใหม่ เลือกความเร็ว และแถบความคืบหน้า
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { formatDistance } from '../utils/format';
import { SIMULATION } from '../constants/config';
import { COLORS, SPACING, FONT_SIZES, RADIUS } from '../constants/theme';

export default function SimulationControls({
  isPlaying,
  isFinished,
  speedUp,
  progressM,
  totalM,
  onPlay,
  onPause,
  onRestart,
  onSpeedChange,
}) {
  const percent = totalM > 0 ? Math.min(100, (progressM / totalM) * 100) : 0;
  const playLabel = isPlaying ? '⏸ หยุดชั่วคราว' : isFinished ? '▶ เล่นอีกครั้ง' : '▶ เล่นต่อ';

  return (
    <View style={styles.box}>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${percent}%` }]} />
      </View>
      <Text style={styles.progressText}>
        {formatDistance(progressM)} / {formatDistance(totalM)} · จำลองที่ {SIMULATION.SPEED_KMH} กม./ชม.
      </Text>

      <View style={styles.row}>
        <Pressable style={styles.mainButton} onPress={isPlaying ? onPause : onPlay}>
          <Text style={styles.mainButtonText}>{playLabel}</Text>
        </Pressable>
        <Pressable style={styles.secondaryButton} onPress={onRestart}>
          <Text style={styles.secondaryText}>↺ เริ่มใหม่</Text>
        </Pressable>
      </View>

      <View style={styles.row}>
        {SIMULATION.SPEED_UPS.map((value) => {
          const isSelected = value === speedUp;
          return (
            <Pressable
              key={value}
              style={[styles.speedChip, isSelected && styles.speedChipSelected]}
              onPress={() => onSpeedChange(value)}
            >
              <Text style={[styles.speedText, isSelected && styles.speedTextSelected]}>×{value}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    gap: SPACING.sm,
  },
  progressTrack: {
    height: 6,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.border,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
  },
  progressText: {
    fontSize: FONT_SIZES.small,
    color: COLORS.textMuted,
  },
  row: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  mainButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  mainButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.body,
    fontWeight: 'bold',
  },
  secondaryButton: {
    paddingHorizontal: SPACING.md,
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  secondaryText: {
    fontSize: FONT_SIZES.body,
    color: COLORS.text,
  },
  speedChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  speedChipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  speedText: {
    fontSize: FONT_SIZES.body,
    color: COLORS.text,
  },
  speedTextSelected: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
});
