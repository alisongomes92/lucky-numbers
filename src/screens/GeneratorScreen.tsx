import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, StatusBar, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import { EventBus, EVENTS, OpenGeneratorPayload } from '../utils/eventBus';

import { COLORS, FONTS, SPACING, RADIUS } from '../theme/tokens';
import { LOTTERIES, Lottery } from '../data/lotteries';
import { generateNumbers, GeneratedResult } from '../utils/generator';
import { saveEntry } from '../storage/database';
import NumberBall from '../components/NumberBall';

interface GeneratorScreenProps {
  lotteryId: string;
  onBack: () => void;
  /** Optional seed from StatsScreen shortcuts */
  seedPayload?: OpenGeneratorPayload;
}

const GENERATE_DELAY_PER_BALL = 80; // ms

export default function GeneratorScreen({ lotteryId, onBack, seedPayload }: GeneratorScreenProps) {
  const lottery = LOTTERIES.find(l => l.id === lotteryId)!;

  const [result, setResult] = useState<GeneratedResult | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [savedCount, setSavedCount] = useState(0);
  const [lastSaved, setLastSaved] = useState(false);
  const [quantity, setQuantity] = useState(1); // how many games to generate
  const [games, setGames] = useState<GeneratedResult[]>([]);

  const animKey = useRef(0);

  // Pre-populate games from stats seed (Quentes / Frios / Atrasados shortcut)
  useEffect(() => {
    if (seedPayload?.seedNumbers && seedPayload.seedNumbers.length > 0) {
      animKey.current += 1;
      const seeded: GeneratedResult = {
        numbers: seedPayload.seedNumbers,
        extraNumbers: undefined,
        extraLabels: undefined,
      };
      setGames([seeded]);
      setResult(seeded);
      setLastSaved(false);
    }
  }, [seedPayload]);

  const handleGenerate = useCallback(async () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setLastSaved(false);

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    animKey.current += 1;

    // Generate all games
    const newGames: GeneratedResult[] = [];
    for (let i = 0; i < quantity; i++) {
      newGames.push(generateNumbers(lottery));
    }
    setGames(newGames);
    setResult(newGames[0]);

    // Total animation time
    const totalDelay = lottery.pickCount * GENERATE_DELAY_PER_BALL + 400;
    setTimeout(async () => {
      setIsAnimating(false);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, totalDelay);
  }, [isAnimating, lottery, quantity]);

  const handleSave = useCallback(async () => {
    if (!games.length) return;
    try {
      for (const g of games) {
        await saveEntry(lottery.id, lottery.name, g, false);
      }
      setSavedCount(c => c + games.length);
      setLastSaved(true);
      // Notify the History tab to reload
      EventBus.emit(EVENTS.ENTRY_SAVED);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      console.error('Save error:', e);
      Alert.alert('Erro ao salvar', `Não foi possível salvar: ${e}`);
    }
  }, [games, lottery]);

  const handleCopy = useCallback(async () => {
    if (!games.length) return;
    const lines = games.map((g, i) => {
      const nums = g.numbers.map(n => n.toString().padStart(2, '0')).join(' - ');
      let line = `Jogo ${i + 1}: ${nums}`;
      if (g.extraLabels) line += ` | ${g.extraLabels.join(', ')}`;
      else if (g.extraNumbers) line += ` | Trevos: ${g.extraNumbers.join(' - ')}`;
      return line;
    });
    await Clipboard.setStringAsync(`🍀 ${lottery.name}\n\n${lines.join('\n')}`);
    Alert.alert('Copiado!', 'Números copiados para a área de transferência.');
  }, [games, lottery]);

  const currentKey = animKey.current;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.topTitle}>{lottery.name}</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Hero */}
        <LinearGradient
          colors={lottery.gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <Text style={styles.heroEmoji}>{lottery.icon}</Text>
          <Text style={styles.heroTitle}>{lottery.fullName}</Text>
          <Text style={styles.heroDesc}>{lottery.description}</Text>
        </LinearGradient>

        {/* Seed hint banner */}
        {seedPayload?.hint && (
          <View style={styles.hintBanner}>
            <Text style={styles.hintText}>{seedPayload.hint}</Text>
          </View>
        )}

        {/* Quantity selector */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Quantidade de jogos</Text>
          <View style={styles.qtyRow}>
            {[1, 2, 3, 5, 8].map(q => (
              <TouchableOpacity
                key={q}
                style={[styles.qtyBtn, quantity === q && styles.qtyBtnActive]}
                onPress={() => setQuantity(q)}
              >
                <Text style={[styles.qtyText, quantity === q && styles.qtyTextActive]}>{q}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Generate button */}
        <TouchableOpacity
          style={[styles.generateBtn, isAnimating && styles.generateBtnDisabled]}
          onPress={handleGenerate}
          activeOpacity={0.85}
          disabled={isAnimating}
        >
          <LinearGradient
            colors={isAnimating ? ['#333', '#444'] : [COLORS.gold, COLORS.goldDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.generateGrad}
          >
            <Text style={styles.generateIcon}>{isAnimating ? '⏳' : '🎲'}</Text>
            <Text style={styles.generateText}>
              {isAnimating ? 'Gerando...' : `Gerar ${quantity > 1 ? `${quantity} Jogos` : 'Números'}`}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Games display */}
        {games.length > 0 && (
          <View style={styles.gamesSection}>
            {games.map((game, gameIndex) => (
              <View key={`${currentKey}-${gameIndex}`} style={styles.gameCard}>
                {games.length > 1 && (
                  <Text style={styles.gameLabel}>Jogo {gameIndex + 1}</Text>
                )}

                {/* Main numbers */}
                <View style={styles.ballsContainer}>
                  {game.numbers.map((num, i) => (
                    <NumberBall
                      key={`${currentKey}-${gameIndex}-${i}`}
                      number={num}
                      color={lottery.color}
                      animated
                      delay={gameIndex * 100 + i * GENERATE_DELAY_PER_BALL}
                      revealed
                    />
                  ))}
                </View>

                {/* Extra pick */}
                {game.extraLabels && (
                  <View style={styles.extraSection}>
                    <Text style={styles.extraLabel}>{lottery.extraPick?.label}:</Text>
                    <View style={[styles.extraBadge, { backgroundColor: COLORS.gold + '22' }]}>
                      <Text style={styles.extraValue}>{game.extraLabels.join(' • ')}</Text>
                    </View>
                  </View>
                )}
                {game.extraNumbers && !game.extraLabels && (
                  <View style={styles.extraSection}>
                    <Text style={styles.extraLabel}>{lottery.extraPick?.label}:</Text>
                    <View style={styles.ballsContainer}>
                      {game.extraNumbers.map((num, i) => (
                        <NumberBall
                          key={`extra-${currentKey}-${gameIndex}-${i}`}
                          number={num}
                          color={COLORS.gold}
                          size={36}
                          animated
                          delay={gameIndex * 100 + lottery.pickCount * GENERATE_DELAY_PER_BALL + i * 100}
                          revealed
                        />
                      ))}
                    </View>
                  </View>
                )}
              </View>
            ))}

            {/* Action buttons */}
            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={[styles.actionBtn, lastSaved && styles.actionBtnSaved]}
                onPress={handleSave}
              >
                <Text style={styles.actionIcon}>{lastSaved ? '✅' : '💾'}</Text>
                <Text style={styles.actionText}>{lastSaved ? 'Salvo!' : 'Salvar'}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionBtn} onPress={handleCopy}>
                <Text style={styles.actionIcon}>📋</Text>
                <Text style={styles.actionText}>Copiar</Text>
              </TouchableOpacity>
            </View>

            {savedCount > 0 && (
              <Text style={styles.savedInfo}>
                {savedCount} jogo{savedCount > 1 ? 's' : ''} salvo{savedCount > 1 ? 's' : ''} no histórico
              </Text>
            )}
          </View>
        )}

        {/* Empty state */}
        {games.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🎱</Text>
            <Text style={styles.emptyText}>
              Pressione o botão acima{'\n'}para gerar seus números da sorte!
            </Text>
          </View>
        )}

        {/* Tips */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>💡 Dica de aposta</Text>
          <Text style={styles.tipsText}>
            Gere múltiplos jogos para aumentar suas chances. Cada combinação é única e completamente aleatória.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: {
    width: 44, height: 44,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.full,
  },
  backIcon: { color: COLORS.gold, fontSize: 28, lineHeight: 30 },
  topTitle: { color: COLORS.textPrimary, fontFamily: FONTS.bold, fontSize: 18 },
  scrollContent: { paddingBottom: 50 },

  hero: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    marginBottom: SPACING.lg,
  },
  heroEmoji: { fontSize: 52, marginBottom: SPACING.sm },
  heroTitle: { color: '#FFF', fontFamily: FONTS.extraBold, fontSize: 24 },
  heroDesc: { color: 'rgba(255,255,255,0.8)', fontFamily: FONTS.regular, fontSize: 14, marginTop: 4 },

  section: { paddingHorizontal: SPACING.md, marginBottom: SPACING.md },
  sectionLabel: { color: COLORS.textSecondary, fontFamily: FONTS.medium, fontSize: 13, marginBottom: SPACING.sm },

  qtyRow: { flexDirection: 'row', gap: SPACING.sm },
  qtyBtn: {
    flex: 1, paddingVertical: 10,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.bgCard,
    alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.border,
  },
  qtyBtnActive: { backgroundColor: COLORS.gold + '22', borderColor: COLORS.gold },
  qtyText: { color: COLORS.textSecondary, fontFamily: FONTS.bold, fontSize: 15 },
  qtyTextActive: { color: COLORS.gold },

  generateBtn: { marginHorizontal: SPACING.md, borderRadius: RADIUS.xl, overflow: 'hidden', marginBottom: SPACING.lg },
  generateBtnDisabled: { opacity: 0.7 },
  generateGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18, gap: 10 },
  generateIcon: { fontSize: 22 },
  generateText: { color: COLORS.bg, fontFamily: FONTS.extraBold, fontSize: 18 },

  gamesSection: { paddingHorizontal: SPACING.md },
  gameCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1, borderColor: COLORS.border,
  },
  gameLabel: { color: COLORS.gold, fontFamily: FONTS.semiBold, fontSize: 13, marginBottom: SPACING.sm },
  ballsContainer: { flexDirection: 'row', flexWrap: 'wrap' },

  extraSection: { marginTop: SPACING.sm, flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  extraLabel: { color: COLORS.textSecondary, fontFamily: FONTS.medium, fontSize: 13 },
  extraBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.gold + '44' },
  extraValue: { color: COLORS.gold, fontFamily: FONTS.bold, fontSize: 14 },

  actionsRow: { flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.sm },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.bgCardAlt, borderRadius: RADIUS.md,
    paddingVertical: 12, gap: 8, borderWidth: 1, borderColor: COLORS.border,
  },
  actionBtnSaved: { borderColor: COLORS.success + '66', backgroundColor: COLORS.success + '11' },
  actionIcon: { fontSize: 18 },
  actionText: { color: COLORS.textPrimary, fontFamily: FONTS.semiBold, fontSize: 14 },
  savedInfo: { color: COLORS.textMuted, fontFamily: FONTS.regular, fontSize: 12, textAlign: 'center', marginBottom: SPACING.md },

  emptyState: { alignItems: 'center', paddingVertical: SPACING.xxl, paddingHorizontal: SPACING.lg },
  emptyIcon: { fontSize: 64, marginBottom: SPACING.md },
  emptyText: { color: COLORS.textSecondary, fontFamily: FONTS.regular, fontSize: 15, textAlign: 'center', lineHeight: 24 },

  tipsCard: {
    marginHorizontal: SPACING.md, marginTop: SPACING.md,
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg,
    padding: SPACING.md, borderWidth: 1, borderColor: COLORS.gold + '22',
  },
  tipsTitle: { color: COLORS.gold, fontFamily: FONTS.semiBold, fontSize: 14, marginBottom: 6 },
  tipsText: { color: COLORS.textSecondary, fontFamily: FONTS.regular, fontSize: 13, lineHeight: 20 },

  hintBanner: {
    marginHorizontal: SPACING.md, marginBottom: SPACING.md,
    backgroundColor: COLORS.gold + '18',
    borderRadius: RADIUS.md, padding: SPACING.sm,
    borderWidth: 1, borderColor: COLORS.gold + '44',
    alignItems: 'center',
  },
  hintText: { color: COLORS.gold, fontFamily: FONTS.semiBold, fontSize: 13 },
});
