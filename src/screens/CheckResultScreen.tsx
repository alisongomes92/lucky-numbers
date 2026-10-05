/**
 * CheckResultScreen — Verifica se um jogo salvo acertou em um concurso específico.
 * Busca o resultado diretamente na API pública da Caixa e compara com os números do jogo.
 */
import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, StatusBar,
  TouchableOpacity, TextInput, ActivityIndicator,
  ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS, SPACING, RADIUS } from '../theme/tokens';
import { SavedEntry } from '../storage/database';
import { Lottery, LOTTERIES } from '../data/lotteries';
import { fetchContest, fetchLatestContest, CaixaResult } from '../services/lotteryApi';
import NumberBall from '../components/NumberBall';

interface CheckResultScreenProps {
  entry: SavedEntry;
  onClose: () => void;
}

type CheckPhase = 'idle' | 'loading' | 'done' | 'error';

interface CheckResult {
  caixaResult: CaixaResult;
  hits: number[];          // numbers from entry that matched
  misses: number[];        // numbers from entry that didn't match
  winningNumbers: number[];
  contestNumber: number;
  date: string;
}

export default function CheckResultScreen({ entry, onClose }: CheckResultScreenProps) {
  const lottery = LOTTERIES.find(l => l.id === entry.lotteryId) as Lottery;
  const color = lottery?.color ?? COLORS.gold;

  const [contestInput, setContestInput] = useState('');
  const [phase, setPhase] = useState<CheckPhase>('idle');
  const [result, setResult] = useState<CheckResult | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleCheck = useCallback(async () => {
    setPhase('loading');
    setResult(null);
    setErrorMsg('');

    try {
      let caixaResult: CaixaResult | null;

      if (contestInput.trim() === '' || contestInput.trim().toLowerCase() === 'último') {
        // fetch latest
        caixaResult = await fetchLatestContest(entry.lotteryId);
      } else {
        const num = parseInt(contestInput.trim(), 10);
        if (isNaN(num) || num <= 0) {
          setErrorMsg('Número de concurso inválido.');
          setPhase('error');
          return;
        }
        caixaResult = await fetchContest(entry.lotteryId, num);
      }

      if (!caixaResult) {
        setErrorMsg('Concurso não encontrado. Verifique o número e tente novamente.');
        setPhase('error');
        return;
      }

      const winningNumbers = caixaResult.listaDezenas.map(Number);
      const entryNumbers = entry.numbers;
      const hits = entryNumbers.filter(n => winningNumbers.includes(n));
      const misses = entryNumbers.filter(n => !winningNumbers.includes(n));

      setResult({
        caixaResult,
        hits,
        misses,
        winningNumbers,
        contestNumber: caixaResult.numero,
        date: caixaResult.dataApuracao,
      });
      setPhase('done');
    } catch (e) {
      setErrorMsg('Erro ao consultar resultado. Verifique sua conexão e tente novamente.');
      setPhase('error');
    }
  }, [contestInput, entry]);

  const hitCount = result?.hits.length ?? 0;
  const pickCount = lottery?.pickCount ?? entry.numbers.length;

  // Prize tier label based on hitCount vs lottery
  function getPrizeTier(hits: number, lotteryId: string): { label: string; color: string; emoji: string } {
    if (lotteryId === 'mega-sena') {
      if (hits === 6) return { label: 'SENA — Prêmio Máximo! 🏆', color: '#00C851', emoji: '🏆' };
      if (hits === 5) return { label: 'QUINA — Segundo prêmio!', color: '#4ECDC4', emoji: '🥈' };
      if (hits === 4) return { label: 'QUADRA — Terceiro prêmio!', color: '#FF9500', emoji: '🥉' };
    }
    if (lotteryId === 'lotofacil') {
      if (hits === 15) return { label: '15 acertos — Primeiro prêmio! 🏆', color: '#00C851', emoji: '🏆' };
      if (hits === 14) return { label: '14 acertos — Segundo prêmio!', color: '#4ECDC4', emoji: '🥈' };
      if (hits === 13) return { label: '13 acertos — Terceiro prêmio!', color: '#FF9500', emoji: '🥉' };
      if (hits === 12) return { label: '12 acertos — Prêmio!', color: '#FFD700', emoji: '🎉' };
      if (hits === 11) return { label: '11 acertos — Prêmio!', color: '#FFD700', emoji: '🎉' };
    }
    if (lotteryId === 'quina') {
      if (hits === 5) return { label: 'QUINA — Prêmio máximo! 🏆', color: '#00C851', emoji: '🏆' };
      if (hits === 4) return { label: 'QUADRA — Segundo prêmio!', color: '#4ECDC4', emoji: '🥈' };
      if (hits === 3) return { label: 'TERNO — Terceiro prêmio!', color: '#FF9500', emoji: '🥉' };
    }
    // Generic
    if (hits >= Math.ceil(pickCount * 0.85)) return { label: `${hits} acertos — Possível prêmio!`, color: '#00C851', emoji: '🏆' };
    if (hits >= Math.ceil(pickCount * 0.70)) return { label: `${hits} acertos — Boa pontuação!`, color: '#4ECDC4', emoji: '🥈' };
    if (hits >= Math.ceil(pickCount * 0.55)) return { label: `${hits} acertos`, color: '#FF9500', emoji: '🎯' };
    return { label: `${hits} acertos`, color: COLORS.textMuted, emoji: '😔' };
  }

  const tier = result ? getPrizeTier(hitCount, entry.lotteryId) : null;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

      {/* Header */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
          <Text style={styles.closeIcon}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.topTitle}>Conferir Resultado</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {/* My game card */}
          <View style={styles.myGameCard}>
            <View style={[styles.lotteryBadge, { backgroundColor: color + '22', borderColor: color + '44' }]}>
              <Text style={[styles.lotteryBadgeText, { color }]}>
                {lottery?.icon} {entry.lotteryName}
              </Text>
            </View>
            <Text style={styles.myGameLabel}>Meu jogo</Text>
            <View style={styles.ballsRow}>
              {entry.numbers.map((n, i) => (
                <NumberBall key={i} number={n} color={color} size={40} />
              ))}
            </View>
            {entry.extraLabels && (
              <Text style={styles.extraText}>🍀 {entry.extraLabels.join(', ')}</Text>
            )}
          </View>

          {/* Contest input */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Número do concurso</Text>
            <Text style={styles.inputHint}>Deixe em branco para verificar o último concurso</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                placeholder="Ex: 2800 (ou vazio para o último)"
                placeholderTextColor={COLORS.textMuted}
                value={contestInput}
                onChangeText={setContestInput}
                keyboardType="number-pad"
                returnKeyType="done"
                onSubmitEditing={handleCheck}
                editable={phase !== 'loading'}
              />
              <TouchableOpacity
                style={[styles.checkBtn, phase === 'loading' && styles.checkBtnDisabled]}
                onPress={handleCheck}
                disabled={phase === 'loading'}
              >
                <LinearGradient
                  colors={phase === 'loading' ? ['#333', '#444'] : [COLORS.gold, COLORS.goldDark]}
                  style={styles.checkGrad}
                >
                  {phase === 'loading'
                    ? <ActivityIndicator color={COLORS.bg} size="small" />
                    : <Text style={styles.checkBtnText}>Verificar</Text>
                  }
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>

          {/* Error state */}
          {phase === 'error' && (
            <View style={styles.errorCard}>
              <Text style={styles.errorText}>❌ {errorMsg}</Text>
            </View>
          )}

          {/* Result */}
          {phase === 'done' && result && tier && (
            <>
              {/* Prize tier banner */}
              <LinearGradient
                colors={[tier.color + '33', tier.color + '11']}
                style={[styles.tierBanner, { borderColor: tier.color + '55' }]}
              >
                <Text style={styles.tierEmoji}>{tier.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.tierLabel, { color: tier.color }]}>{tier.label}</Text>
                  <Text style={styles.tierSub}>
                    Concurso {result.contestNumber} · {result.date}
                  </Text>
                </View>
                <View style={[styles.hitBadge, { backgroundColor: tier.color + '22', borderColor: tier.color }]}>
                  <Text style={[styles.hitNumber, { color: tier.color }]}>{hitCount}</Text>
                  <Text style={[styles.hitOf, { color: tier.color }]}>/{pickCount}</Text>
                </View>
              </LinearGradient>

              {/* Winning numbers */}
              <View style={styles.resultCard}>
                <Text style={styles.resultCardTitle}>🎱 Números Sorteados</Text>
                <View style={styles.ballsRow}>
                  {result.winningNumbers.map((n, i) => {
                    const isHit = result.hits.includes(n) || entry.numbers.includes(n);
                    return (
                      <View key={i} style={styles.winBallWrap}>
                        <NumberBall
                          number={n}
                          color={entry.numbers.includes(n) ? tier.color : COLORS.textMuted}
                          size={40}
                        />
                        {entry.numbers.includes(n) && (
                          <Text style={[styles.hitMark, { color: tier.color }]}>✓</Text>
                        )}
                      </View>
                    );
                  })}
                </View>

                {/* My numbers comparison */}
                <View style={styles.divider} />
                <Text style={styles.resultCardTitle}>Meu jogo — acertos destacados</Text>
                <View style={styles.ballsRow}>
                  {entry.numbers.map((n, i) => {
                    const isHit = result.hits.includes(n);
                    return (
                      <View key={i} style={styles.winBallWrap}>
                        <NumberBall
                          number={n}
                          color={isHit ? tier.color : COLORS.border}
                          size={40}
                        />
                        {isHit && (
                          <Text style={[styles.hitMark, { color: tier.color }]}>✓</Text>
                        )}
                      </View>
                    );
                  })}
                </View>

                {/* Summary row */}
                <View style={styles.summaryRow}>
                  <SummaryPill label="Acertos" value={result.hits.length.toString()} color={tier.color} />
                  <SummaryPill label="Erros" value={result.misses.length.toString()} color={COLORS.textMuted} />
                  <SummaryPill label="Concurso" value={`#${result.contestNumber}`} color={COLORS.gold} />
                </View>

                {/* Acumulado */}
                {result.caixaResult.acumulado && (
                  <View style={styles.acumuladoBanner}>
                    <Text style={styles.acumuladoText}>
                      🔄 Concurso acumulado!
                      {result.caixaResult.valorEstimadoProximoConcurso
                        ? `  Próximo prêmio estimado: R$ ${(result.caixaResult.valorEstimadoProximoConcurso / 1_000_000).toFixed(1)}M`
                        : ''
                      }
                    </Text>
                  </View>
                )}
              </View>

              {/* Check another */}
              <TouchableOpacity
                style={styles.tryAgainBtn}
                onPress={() => { setPhase('idle'); setResult(null); setContestInput(''); }}
              >
                <Text style={styles.tryAgainText}>🔄 Verificar outro concurso</Text>
              </TouchableOpacity>
            </>
          )}

          {/* Idle hint */}
          {phase === 'idle' && (
            <View style={styles.idleHint}>
              <Text style={styles.idleIcon}>🔍</Text>
              <Text style={styles.idleText}>
                Digite o número do concurso que deseja conferir, ou deixe em branco para verificar o último sorteio realizado.
              </Text>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function SummaryPill({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={[pillStyles.pill, { borderColor: color + '44' }]}>
      <Text style={[pillStyles.value, { color }]}>{value}</Text>
      <Text style={pillStyles.label}>{label}</Text>
    </View>
  );
}

const pillStyles = StyleSheet.create({
  pill: {
    flex: 1, alignItems: 'center', paddingVertical: SPACING.sm,
    backgroundColor: COLORS.bgCardAlt, borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  value: { fontFamily: FONTS.bold, fontSize: 20 },
  label: { color: COLORS.textMuted, fontFamily: FONTS.regular, fontSize: 11, marginTop: 2 },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },

  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  closeBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: COLORS.bgCard, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.border,
  },
  closeIcon: { color: COLORS.textSecondary, fontSize: 16, fontFamily: FONTS.semiBold },
  topTitle: { color: COLORS.textPrimary, fontFamily: FONTS.bold, fontSize: 17 },

  scroll: { paddingBottom: 48 },

  myGameCard: {
    marginHorizontal: SPACING.md, marginTop: SPACING.md,
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg,
    padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border,
  },
  lotteryBadge: {
    alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: RADIUS.full, borderWidth: 1, marginBottom: SPACING.sm,
  },
  lotteryBadgeText: { fontFamily: FONTS.semiBold, fontSize: 13 },
  myGameLabel: { color: COLORS.textMuted, fontFamily: FONTS.regular, fontSize: 12, marginBottom: SPACING.sm },
  ballsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  extraText: { color: COLORS.gold, fontFamily: FONTS.semiBold, fontSize: 13, marginTop: SPACING.sm },

  inputSection: { marginHorizontal: SPACING.md, marginTop: SPACING.lg },
  inputLabel: { color: COLORS.textPrimary, fontFamily: FONTS.semiBold, fontSize: 15, marginBottom: 4 },
  inputHint: { color: COLORS.textMuted, fontFamily: FONTS.regular, fontSize: 12, marginBottom: SPACING.sm },
  inputRow: { flexDirection: 'row', gap: SPACING.sm },
  input: {
    flex: 1, backgroundColor: COLORS.bgCard, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.border,
    paddingHorizontal: SPACING.md, paddingVertical: 14,
    color: COLORS.textPrimary, fontFamily: FONTS.regular, fontSize: 15,
  },
  checkBtn: { borderRadius: RADIUS.md, overflow: 'hidden' },
  checkBtnDisabled: { opacity: 0.6 },
  checkGrad: { paddingHorizontal: 20, paddingVertical: 14, alignItems: 'center', justifyContent: 'center', minWidth: 100 },
  checkBtnText: { color: COLORS.bg, fontFamily: FONTS.bold, fontSize: 14 },

  errorCard: {
    marginHorizontal: SPACING.md, marginTop: SPACING.md,
    backgroundColor: COLORS.error + '11', borderRadius: RADIUS.md,
    padding: SPACING.md, borderWidth: 1, borderColor: COLORS.error + '44',
  },
  errorText: { color: COLORS.error, fontFamily: FONTS.regular, fontSize: 14 },

  tierBanner: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: SPACING.md, marginTop: SPACING.lg,
    borderRadius: RADIUS.lg, padding: SPACING.md,
    borderWidth: 1, gap: SPACING.sm,
  },
  tierEmoji: { fontSize: 32 },
  tierLabel: { fontFamily: FONTS.bold, fontSize: 15 },
  tierSub: { color: COLORS.textMuted, fontFamily: FONTS.regular, fontSize: 12, marginTop: 2 },
  hitBadge: {
    flexDirection: 'row', alignItems: 'baseline',
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: RADIUS.md, borderWidth: 1,
  },
  hitNumber: { fontFamily: FONTS.extraBold, fontSize: 28 },
  hitOf: { fontFamily: FONTS.bold, fontSize: 14 },

  resultCard: {
    marginHorizontal: SPACING.md, marginTop: SPACING.md,
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg,
    padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border,
  },
  resultCardTitle: { color: COLORS.textSecondary, fontFamily: FONTS.semiBold, fontSize: 13, marginBottom: SPACING.sm },
  winBallWrap: { alignItems: 'center' },
  hitMark: { fontFamily: FONTS.bold, fontSize: 11, marginTop: 1 },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: SPACING.md },

  summaryRow: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.md },

  acumuladoBanner: {
    marginTop: SPACING.md, backgroundColor: COLORS.gold + '11',
    borderRadius: RADIUS.md, padding: SPACING.sm,
    borderWidth: 1, borderColor: COLORS.gold + '33',
  },
  acumuladoText: { color: COLORS.gold, fontFamily: FONTS.semiBold, fontSize: 13, textAlign: 'center' },

  tryAgainBtn: {
    marginHorizontal: SPACING.md, marginTop: SPACING.md,
    padding: SPACING.md, alignItems: 'center',
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.border,
  },
  tryAgainText: { color: COLORS.textSecondary, fontFamily: FONTS.semiBold, fontSize: 14 },

  idleHint: {
    marginHorizontal: SPACING.md, marginTop: SPACING.xl,
    alignItems: 'center', padding: SPACING.xl,
  },
  idleIcon: { fontSize: 52, marginBottom: SPACING.md },
  idleText: {
    color: COLORS.textSecondary, fontFamily: FONTS.regular,
    fontSize: 14, textAlign: 'center', lineHeight: 22,
  },
});
