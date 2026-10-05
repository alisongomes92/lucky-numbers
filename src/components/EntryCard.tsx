import React from 'react';
import {
  View, Text, TouchableOpacity, Share,
  StyleSheet, Dimensions, ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS, SPACING, RADIUS } from '../theme/tokens';
import { Lottery } from '../data/lotteries';
import { SavedEntry, toggleFavorite, deleteEntry } from '../storage/database';
import NumberBall from './NumberBall';

interface EntryCardProps {
  entry: SavedEntry;
  lottery: Lottery | undefined;
  onToggleFavorite: (id: number, current: boolean) => void;
  onDelete: (id: number) => void;
  onCheckResult?: (entry: SavedEntry) => void;
}

export default function EntryCard({ entry, lottery, onToggleFavorite, onDelete, onCheckResult }: EntryCardProps) {
  const color = lottery?.color ?? '#555';
  const dateStr = new Date(entry.createdAt).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });

  async function handleShare() {
    const nums = entry.numbers.map(n => n.toString().padStart(2, '0')).join(' - ');
    let text = `🍀 Meus números da sorte — ${entry.lotteryName}\n\n${nums}`;
    if (entry.extraLabels) {
      text += `\n${entry.extraLabels.join(', ')}`;
    } else if (entry.extraNumbers) {
      text += `\nTrevos: ${entry.extraNumbers.join(' - ')}`;
    }
    text += '\n\n🎱 Gerado pelo app Números da Sorte';
    await Share.share({ message: text });
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={[styles.badge, { backgroundColor: color + '33' }]}>
          <Text style={[styles.badgeText, { color }]}>{entry.lotteryName}</Text>
        </View>
        <Text style={styles.date}>{dateStr}</Text>
      </View>

      {/* Numbers */}
      <View style={styles.ballsWrap}>
        {entry.numbers.map((n, i) => (
          <NumberBall key={i} number={n} size={38} color={color} />
        ))}
      </View>

      {/* Extra */}
      {entry.extraLabels && (
        <Text style={styles.extra}>🍀 {entry.extraLabels.join(', ')}</Text>
      )}
      {entry.extraNumbers && !entry.extraLabels && (
        <View style={styles.ballsWrap}>
          {entry.extraNumbers.map((n, i) => (
            <NumberBall key={i} number={n} size={32} color={COLORS.gold} />
          ))}
        </View>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => onToggleFavorite(entry.id, entry.isFavorite)}
        >
          <Text style={styles.actionIcon}>{entry.isFavorite ? '⭐' : '☆'}</Text>
          <Text style={styles.actionLabel}>{entry.isFavorite ? 'Favorito' : 'Favoritar'}</Text>
        </TouchableOpacity>

        {onCheckResult && (
          <TouchableOpacity style={styles.actionBtn} onPress={() => onCheckResult(entry)}>
            <Text style={styles.actionIcon}>🎯</Text>
            <Text style={styles.actionLabel}>Conferir</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.actionBtn} onPress={handleShare}>
          <Text style={styles.actionIcon}>📤</Text>
          <Text style={styles.actionLabel}>Compartilhar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => onDelete(entry.id)}
        >
          <Text style={styles.actionIcon}>🗑️</Text>
          <Text style={styles.actionLabel}>Excluir</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  badgeText: {
    fontFamily: FONTS.semiBold,
    fontSize: 12,
  },
  date: {
    color: COLORS.textMuted,
    fontFamily: FONTS.regular,
    fontSize: 12,
  },
  ballsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginVertical: SPACING.xs,
  },
  extra: {
    color: COLORS.gold,
    fontFamily: FONTS.semiBold,
    fontSize: 14,
    marginTop: SPACING.xs,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  actionBtn: {
    alignItems: 'center',
    padding: SPACING.xs,
  },
  actionIcon: {
    fontSize: 18,
  },
  actionLabel: {
    color: COLORS.textMuted,
    fontFamily: FONTS.regular,
    fontSize: 11,
    marginTop: 2,
  },
});
