import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONTS } from '../theme/tokens';

interface FrequencyBarProps {
  number: number;
  count: number;
  maxCount: number;
  totalContests: number;
  color: string;
  isHot?: boolean;
  isCold?: boolean;
  isOverdue?: boolean;
}

export default function FrequencyBar({
  number,
  count,
  maxCount,
  totalContests,
  color,
  isHot,
  isCold,
  isOverdue,
}: FrequencyBarProps) {
  const pct = maxCount > 0 ? count / maxCount : 0;
  const freqPct = totalContests > 0 ? ((count / totalContests) * 100).toFixed(1) : '0.0';

  const tag = isHot ? '🔥' : isCold ? '🧊' : isOverdue ? '⏳' : null;

  return (
    <View style={styles.row}>
      {/* Number label */}
      <View style={[styles.numBox, { borderColor: color + '66' }]}>
        <Text style={[styles.numText, { color }]}>{number.toString().padStart(2, '0')}</Text>
      </View>

      {/* Bar */}
      <View style={styles.barTrack}>
        <View
          style={[
            styles.barFill,
            {
              width: `${Math.max(pct * 100, 2)}%` as any,
              backgroundColor: isHot ? '#FF6B35' : isCold ? '#4ECDC4' : isOverdue ? COLORS.gold : color,
            },
          ]}
        />
      </View>

      {/* Stats */}
      <View style={styles.statsCol}>
        <Text style={styles.countText}>{count}×</Text>
        <Text style={styles.pctText}>{freqPct}%</Text>
      </View>

      {/* Tag */}
      {tag && <Text style={styles.tag}>{tag}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
    height: 28,
  },
  numBox: {
    width: 36,
    height: 24,
    borderRadius: 6,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    backgroundColor: COLORS.bgCardAlt,
  },
  numText: {
    fontFamily: FONTS.bold,
    fontSize: 12,
  },
  barTrack: {
    flex: 1,
    height: 14,
    backgroundColor: COLORS.border,
    borderRadius: 7,
    overflow: 'hidden',
    marginRight: 8,
  },
  barFill: {
    height: '100%',
    borderRadius: 7,
    opacity: 0.85,
  },
  statsCol: {
    width: 52,
    alignItems: 'flex-end',
  },
  countText: {
    color: COLORS.textPrimary,
    fontFamily: FONTS.semiBold,
    fontSize: 11,
    lineHeight: 13,
  },
  pctText: {
    color: COLORS.textMuted,
    fontFamily: FONTS.regular,
    fontSize: 10,
    lineHeight: 12,
  },
  tag: {
    width: 20,
    textAlign: 'center',
    fontSize: 13,
    marginLeft: 4,
  },
});
