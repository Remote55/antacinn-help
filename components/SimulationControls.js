/**
 * ปุ่มควบคุมโหมดจำลองการเดินทาง: เล่น/หยุด เริ่มใหม่ เลือกความเร็ว และแถบความคืบหน้า
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Button from './Button';
import Chip from './Chip';
import { formatDistance } from '../utils/format';
import { SIMULATION } from '../constants/config';
import { COLORS, TEXT, SPACING, RADIUS } from '../constants/theme';

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
  style,
}) {
  const percent = totalM > 0 ? Math.min(100, (progressM / totalM) * 100) : 0;
  const playLabel = isPlaying ? 'หยุดชั่วคราว' : isFinished ? 'เล่นอีกครั้ง' : 'เล่นต่อ';

  return (
    <View style={[styles.box, style]}>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${percent}%` }]} />
      </View>
      <Text style={styles.progressText}>
        {formatDistance(progressM)} / {formatDistance(totalM)} · จำลองที่ {SIMULATION.SPEED_KMH} กม./ชม.
      </Text>

      <View style={styles.row}>
        <Button
          title={playLabel}
          icon={isPlaying ? 'pause' : 'play'}
          onPress={isPlaying ? onPause : onPlay}
          style={styles.mainButton}
        />
        <Button title="เริ่มใหม่" icon="refresh" variant="secondary" onPress={onRestart} />
      </View>

      <View style={styles.speedRow}>
        <Text style={styles.speedLabel}>เร่งเวลา</Text>
        {SIMULATION.SPEED_UPS.map((value) => (
          <Chip key={value} label={`×${value}`} selected={value === speedUp} onPress={() => onSpeedChange(value)} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
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
    ...TEXT.small,
    color: COLORS.textMuted,
  },
  row: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  mainButton: {
    flex: 1,
  },
  speedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  speedLabel: {
    ...TEXT.small,
    color: COLORS.textMuted,
  },
});
