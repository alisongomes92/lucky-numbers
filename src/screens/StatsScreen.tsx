import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, SafeAreaView,
  StatusBar, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { COLORS, FONTS, SPACING, RADIUS } from '../theme/tokens';
import { LOTTERIES, Lottery } from '../data/lotteries';
import { syncLottery, SyncStatus, PERIOD_OPTIONS, PeriodYears } from '../services/syncService';
import { getStatsDb, computeStats, LotteryStats, getContestCount } from '../storage/statsDatabase';
import NumberBall from '../components/NumberBall';
import FrequencyBar from '../components/FrequencyBar';
import { EventBus, EVENTS, OpenGeneratorPayload } from '../utils/eventBus';

// ─── Types of statistical analyses shown in the app ─────────────────
const STAT_TYPES = [
  {
    icon: '🔥',
    title: 'Frequência Absoluta',
    desc: 'Conta quantas vezes cada número foi sorteado no período selecionado. É a base de todas as análises.',
  },
  {
    icon: '📊',
    title: 'Frequência Relativa',
    desc: 'Percentual de sorteios em que o número apareceu: f = n / N, onde n = aparições e N = total de sorteios.',
  },
  {
    icon: '🧊',
    title: 'Números Frios',
    desc: 'Números com menor frequência relativa. Alguns jogadores apostam neles por acreditar que "estão na hora de sair".',
  },
  {
    icon: '⏳',
    title: 'Atraso (Streak)',
    desc: 'Quantos sorteios consecutivos um número está ausente. Número com maior atraso = "mais atrasado".',
  },
  {
    icon: '📐',
    title: 'Intervalo Médio',
    desc: 'Média de sorteios entre duas aparições consecutivas do mesmo número. Indica o ritmo histórico de repetição.',
  },
  {
    icon: '🎯',
    title: 'Desvio da Esperança',
    desc: 'Diferença entre a frequência observada e a frequência esperada teoricamente (p = k/n). Mede o "desvio da aleatoriedade".',
  },
];

// ─── Mathematical formulas relevant to lotteries ────────────────────
const MATH_FORMULAS = [
  {
    icon: '∁',
    title: 'Combinatória — C(n,k)',
    formula: 'C(n,k) = n! ÷ [ k! × (n-k)! ]',
    desc: 'Calcula o número total de combinações possíveis. Para a Mega-Sena: C(60,6) = 50.063.860 jogos distintos.',
  },
  {
    icon: 'P',
    title: 'Probabilidade Clássica',
    formula: 'P(A) = casos favoráveis ÷ casos totais',
    desc: 'A chance de um evento ocorrer. Para acertar 6 na Mega-Sena: P = 1 ÷ 50.063.860 ≈ 0,000002%.',
  },
  {
    icon: 'B',
    title: 'Distribuição Binomial',
    formula: 'P(X=k) = C(n,k) × pᵏ × (1-p)ⁿ⁻ᵏ',
    desc: 'Probabilidade de acertar exatamente k números em n tentativas, onde p é a chance por sorteio. Útil para calcular odds de acertar 4, 5 ou 6 números.',
  },
  {
    icon: 'E',
    title: 'Esperança Matemática (Valor Esperado)',
    formula: 'E(X) = n × p',
    desc: 'Número médio esperado de acertos por jogo. Para a Mega-Sena com 6 dezenas e p=6/60: E(X) = 6 × (6/60) = 0,6 acertos por jogo.',
  },
  {
    icon: 'σ',
    title: 'Desvio Padrão Binomial',
    formula: 'σ = √[ n × p × (1-p) ]',
    desc: 'Mede a variação esperada em torno da média de acertos. Indica o quanto os resultados podem oscilar em relação à média.',
  },
  {
    icon: 'f',
    title: 'Frequência Relativa Esperada',
    formula: 'f_esperada = (k ÷ N_total) × n_sorteios',
    desc: 'Quantas vezes um número deveria aparecer se os sorteios fossem perfeitamente uniformes. k = bolas por sorteio, N = universo de números.',
  },
  {
    icon: 'LGN',
    title: 'Lei dos Grandes Números',
    formula: 'lim(n→∞) f_relativa = P(A)',
    desc: 'Com infinitos sorteios, a frequência relativa de cada número converge para a probabilidade teórica. Quanto mais sorteios analisados, mais confiável a estatística.',
  },
];

type ViewMode = 'hot' | 'cold' | 'overdue' | 'all';

export default function StatsScreen() {
  const [selectedId, setSelectedId]       = useState<string>('mega-sena');
  const [period, setPeriod]               = useState<PeriodYears>(5);
  const [syncStatus, setSyncStatus]       = useState<SyncStatus>({ phase: 'idle' });
  const [stats, setStats]                 = useState<LotteryStats | null>(null);
  const [viewMode, setViewMode]           = useState<ViewMode>('hot');
  const [contestCount, setContestCount]   = useState(0);
  const [showAllBars, setShowAllBars]     = useState(false);
  const [showFormulas, setShowFormulas]   = useState(false);
  const [showStatTypes, setShowStatTypes] = useState(false);

  const lottery = LOTTERIES.find(l => l.id === selectedId)!;

  const loadStats = useCallback(async (id: string) => {
    const db = await getStatsDb();
    const cnt = await getContestCount(db, id);
    setContestCount(cnt);
    const l = LOTTERIES.find(l => l.id === id)!;
    const s = await computeStats(db, id, l.pickCount, l.minNumber, l.maxNumber);
    setStats(s);
  }, []);

  const handleSync = useCallback(async (id: string, p: PeriodYears) => {
    await syncLottery(id, p, setSyncStatus);
    await loadStats(id);
  }, [loadStats]);

  useEffect(() => {
    setSyncStatus({ phase: 'idle' });
    setStats(null);
    setShowAllBars(false);
    loadStats(selectedId).then(() => {
      getStatsDb().then(db =>
        getContestCount(db, selectedId).then(cnt => {
          if (cnt < 10) handleSync(selectedId, period);
        })
      );
    });
  }, [selectedId]);

  const isSyncing = syncStatus.phase === 'syncing' || syncStatus.phase === 'checking';

  // ── Shortcut: open Generator with a pre-seeded set of numbers ──
  const handleOpenGenerator = useCallback((numbers: number[], hint: string) => {
    const payload: OpenGeneratorPayload = {
      lotteryId: selectedId,
      seedNumbers: numbers.slice(0, lottery.pickCount),
      hint,
    };
    EventBus.emit<OpenGeneratorPayload>(EVENTS.OPEN_GENERATOR, payload);
  }, [selectedId, lottery]);

  // Sorted number list based on view mode
  const displayedStats = (() => {
    if (!stats) return [];
    const s = [...stats.numberStats];
    if (viewMode === 'hot')    return s.sort((a, b) => b.count - a.count);
    if (viewMode === 'cold')   return s.sort((a, b) => a.count - b.count);
    if (viewMode === 'overdue')return s.sort((a, b) => b.streak - a.streak);
    return s.sort((a, b) => a.number - b.number);
  })();

  const shownBars = showAllBars ? displayedStats : displayedStats.slice(0, 20);
  const maxCount  = stats ? Math.max(...stats.numberStats.map(s => s.count)) : 1;
  const hotSet    = new Set(stats?.hottestNumbers ?? []);
  const coldSet   = new Set(stats?.coldestNumbers ?? []);
  const overdueSet= new Set(stats?.overdueNumbers ?? []);

  // Expected frequency for the selected lottery
  const expectedFreq = lottery
    ? ((lottery.pickCount / (lottery.maxNumber - lottery.minNumber + 1)) * 100).toFixed(2)
    : '0';

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* ── Header ── */}
        <LinearGradient colors={['#1A1A2E', COLORS.bg]} style={styles.header}>
          <Text style={styles.headerTitle}>📊 Estatísticas</Text>
          <Text style={styles.headerSub}>Análise histórica por período e loteria</Text>
        </LinearGradient>

        {/* ── Lottery selector ── */}
        <ScrollView
          horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow} style={styles.chipWrap}
        >
          {LOTTERIES.map(l => (
            <TouchableOpacity
              key={l.id}
              style={[styles.chip, selectedId === l.id && { backgroundColor: l.color, borderColor: l.color }]}
              onPress={() => setSelectedId(l.id)}
            >
              <Text style={styles.chipIcon}>{l.icon}</Text>
              <Text style={[styles.chipText, selectedId === l.id && styles.chipTextActive]}>{l.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── Period selector ── */}
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionLabel}>⏱ Período de análise</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.periodRow}>
            {PERIOD_OPTIONS.map(opt => (
              <TouchableOpacity
                key={opt.value}
                style={[styles.periodBtn, period === opt.value && styles.periodBtnActive]}
                onPress={() => setPeriod(opt.value)}
              >
                <Text style={[styles.periodText, period === opt.value && styles.periodTextActive]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* ── Sync card ── */}
        <View style={styles.syncCard}>
          <View style={styles.syncLeft}>
            <Text style={styles.syncTitle}>{lottery.name}</Text>
            <Text style={styles.syncSub}>
              {contestCount > 0
                ? `${contestCount} sorteios em cache`
                : 'Sem dados locais'}
              {stats && ` · ${stats.firstContest}–${stats.lastContest}`}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.syncBtn, isSyncing && styles.syncBtnDisabled]}
            onPress={() => handleSync(selectedId, period)}
            disabled={isSyncing}
          >
            {isSyncing
              ? <ActivityIndicator color={COLORS.bg} size="small" />
              : <Text style={styles.syncBtnText}>🔄 Buscar</Text>
            }
          </TouchableOpacity>
        </View>

        {/* ── Progress ── */}
        {syncStatus.phase === 'checking' && (
          <InfoBanner text="🔍 Verificando último concurso na Caixa..." />
        )}
        {syncStatus.phase === 'syncing' && (
          <View style={styles.progressCard}>
            <View style={styles.progressBarTrack}>
              <View style={[
                styles.progressBarFill,
                { width: `${Math.round((syncStatus.fetched / Math.max(syncStatus.total, 1)) * 100)}%` as any },
              ]} />
            </View>
            <Text style={styles.progressText}>
              ⬇ Baixando histórico: {syncStatus.fetched} / {syncStatus.total} sorteios (
              {Math.round((syncStatus.fetched / Math.max(syncStatus.total, 1)) * 100)}%)
            </Text>
          </View>
        )}
        {syncStatus.phase === 'done' && (
          <InfoBanner
            text={syncStatus.contestsFetched > 0
              ? `✅ ${syncStatus.contestsFetched} novos sorteios sincronizados!`
              : '✅ Dados já atualizados.'}
            success
          />
        )}
        {syncStatus.phase === 'error' && (
          <InfoBanner text={`❌ ${syncStatus.message}`} error />
        )}

        {/* ── Empty state ── */}
        {!stats && !isSyncing && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📡</Text>
            <Text style={styles.emptyTitle}>Nenhum dado carregado</Text>
            <Text style={styles.emptyText}>
              Selecione o período desejado e clique em "Buscar" para baixar o histórico da {lottery.name}.
              {'\n\n'}
              A primeira sincronização pode levar alguns minutos.
            </Text>
          </View>
        )}

        {/* ══════════ STATS CONTENT ══════════ */}
        {stats && (
          <>
            {/* Summary */}
            <View style={styles.summaryRow}>
              <SummaryCard icon="🎰" label="Sorteios" value={stats.totalContests.toString()} />
              <SummaryCard icon="🔢" label="Universo" value={`${lottery.minNumber}–${lottery.maxNumber}`} />
              <SummaryCard icon="📈" label="F. esperada" value={`${expectedFreq}%`} />
            </View>

            {/* Hot numbers */}
            <Section title="🔥 Números Quentes" subtitle="Mais sorteados no período selecionado">
              <BallRow numbers={stats.hottestNumbers} color="#FF6B35" stats={stats} />
              <ShortcutButton
                label="🎲 Apostar com os Quentes"
                color="#FF6B35"
                onPress={() => handleOpenGenerator(
                  stats.hottestNumbers,
                  `🔥 Gerado com os ${lottery.pickCount} Mais Quentes — ${lottery.name}`
                )}
              />
            </Section>

            {/* Cold numbers */}
            <Section title="🧊 Números Frios" subtitle="Menos sorteados — frequência abaixo da esperada">
              <BallRow numbers={stats.coldestNumbers} color="#4ECDC4" stats={stats} />
              <ShortcutButton
                label="🎲 Apostar com os Frios"
                color="#4ECDC4"
                onPress={() => handleOpenGenerator(
                  stats.coldestNumbers,
                  `🧊 Gerado com os ${lottery.pickCount} Mais Frios — ${lottery.name}`
                )}
              />
            </Section>

            {/* Overdue numbers */}
            <Section title="⏳ Números Atrasados" subtitle="Sem aparecer há mais sorteios consecutivos">
              <BallRow numbers={stats.overdueNumbers} color={COLORS.gold} stats={stats} showStreak />
              <Text style={styles.noteText}>
                O número abaixo da bola = sorteios consecutivos sem aparecer.
              </Text>
              <ShortcutButton
                label="🎲 Apostar com os Atrasados"
                color={COLORS.gold}
                onPress={() => handleOpenGenerator(
                  stats.overdueNumbers,
                  `⏳ Gerado com os ${lottery.pickCount} Mais Atrasados — ${lottery.name}`
                )}
              />
            </Section>

            {/* Probability card */}
            <ProbabilityCard lottery={lottery} stats={stats} expectedFreq={expectedFreq} />

            {/* ── Types of statistics ── */}
            <TouchableOpacity
              style={styles.collapsibleHeader}
              onPress={() => setShowStatTypes(v => !v)}
            >
              <Text style={styles.collapsibleTitle}>📋 Tipos de Estatística</Text>
              <Text style={styles.collapsibleArrow}>{showStatTypes ? '▲' : '▼'}</Text>
            </TouchableOpacity>
            {showStatTypes && (
              <View style={styles.collapsibleBody}>
                {STAT_TYPES.map((s, i) => (
                  <View key={i} style={styles.statTypeRow}>
                    <Text style={styles.statTypeIcon}>{s.icon}</Text>
                    <View style={styles.statTypeInfo}>
                      <Text style={styles.statTypeName}>{s.title}</Text>
                      <Text style={styles.statTypeDesc}>{s.desc}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* ── Mathematical formulas ── */}
            <TouchableOpacity
              style={styles.collapsibleHeader}
              onPress={() => setShowFormulas(v => !v)}
            >
              <Text style={styles.collapsibleTitle}>📐 Fórmulas Matemáticas</Text>
              <Text style={styles.collapsibleArrow}>{showFormulas ? '▲' : '▼'}</Text>
            </TouchableOpacity>
            {showFormulas && (
              <View style={styles.collapsibleBody}>
                {MATH_FORMULAS.map((f, i) => (
                  <View key={i} style={styles.formulaCard}>
                    <View style={styles.formulaHeader}>
                      <View style={styles.formulaIconBox}>
                        <Text style={styles.formulaIconText}>{f.icon}</Text>
                      </View>
                      <Text style={styles.formulaTitle}>{f.title}</Text>
                    </View>
                    <View style={styles.formulaBox}>
                      <Text style={styles.formulaText}>{f.formula}</Text>
                    </View>
                    <Text style={styles.formulaDesc}>{f.desc}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* ── View mode + bars ── */}
            <View style={styles.modePicker}>
              {([
                ['hot',    '🔥 Quentes'],
                ['cold',   '🧊 Frios'],
                ['overdue','⏳ Atrasados'],
                ['all',    '🔢 Todos'],
              ] as [ViewMode, string][]).map(([mode, label]) => (
                <TouchableOpacity
                  key={mode}
                  style={[styles.modeBtn, viewMode === mode && styles.modeBtnActive]}
                  onPress={() => { setViewMode(mode); setShowAllBars(false); }}
                >
                  <Text style={[styles.modeBtnText, viewMode === mode && styles.modeBtnTextActive]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.barsCard}>
              <Text style={styles.barsTitle}>Frequência por Número</Text>
              <View style={styles.barsLegend}>
                <Text style={styles.legendItem}>🔥 Quente</Text>
                <Text style={styles.legendItem}>🧊 Frio</Text>
                <Text style={styles.legendItem}>⏳ Atrasado</Text>
              </View>
              {shownBars.map(s => (
                <FrequencyBar
                  key={s.number}
                  number={s.number}
                  count={s.count}
                  maxCount={maxCount}
                  totalContests={stats.totalContests}
                  color={lottery.color}
                  isHot={hotSet.has(s.number)}
                  isCold={coldSet.has(s.number)}
                  isOverdue={overdueSet.has(s.number)}
                />
              ))}
              {displayedStats.length > 20 && !showAllBars && (
                <TouchableOpacity style={styles.showMoreBtn} onPress={() => setShowAllBars(true)}>
                  <Text style={styles.showMoreText}>
                    Ver todos os {displayedStats.length} números ↓
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <Text style={styles.disclaimer}>
              ⚠️ Frequência passada não prediz resultados futuros. Cada sorteio é um evento independente. Jogue com responsabilidade. Maiores de 18 anos.
            </Text>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────

function InfoBanner({ text, success, error }: { text: string; success?: boolean; error?: boolean }) {
  const borderColor = error ? COLORS.error + '66' : success ? COLORS.success + '66' : COLORS.border;
  return (
    <View style={[styles.infoBanner, { borderColor }]}>
      <Text style={styles.infoBannerText}>{text}</Text>
    </View>
  );
}

function SummaryCard({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={summaryStyles.card}>
      <Text style={summaryStyles.icon}>{icon}</Text>
      <Text style={summaryStyles.value}>{value}</Text>
      <Text style={summaryStyles.label}>{label}</Text>
    </View>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <View style={sectionStyles.card}>
      <Text style={sectionStyles.title}>{title}</Text>
      <Text style={sectionStyles.subtitle}>{subtitle}</Text>
      {children}
    </View>
  );
}

function BallRow({ numbers, color, stats, showStreak }: {
  numbers: number[];
  color: string;
  stats: LotteryStats;
  showStreak?: boolean;
}) {
  return (
    <View style={styles.ballsRow}>
      {numbers.map((n, i) => {
        const st = stats.numberStats.find(s => s.number === n);
        return (
          <View key={n} style={styles.ballWrap}>
            <NumberBall number={n} color={color} size={42} />
            {showStreak
              ? <Text style={[styles.ballLabel, { color }]}>{st?.streak ?? 0}×</Text>
              : <Text style={styles.ballLabel}>#{i + 1}</Text>
            }
          </View>
        );
      })}
    </View>
  );
}

function ShortcutButton({ label, color, onPress }: { label: string; color: string; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={[styles.shortcutBtn, { borderColor: color + '55' }]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <LinearGradient
        colors={[color + '22', color + '10']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.shortcutGrad}
      >
        <Text style={[styles.shortcutText, { color }]}>{label}</Text>
        <Text style={[styles.shortcutArrow, { color }]}>›</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

function ProbabilityCard({ lottery, stats, expectedFreq }: {
  lottery: Lottery;
  stats: LotteryStats;
  expectedFreq: string;
}) {
  const oddsMap: Record<string, string> = {
    'mega-sena':      '1 em 50.063.860',
    'lotofacil':      '1 em 3.268.760',
    'quina':          '1 em 24.040.016',
    'lotomania':      '1 em 11.372.635',
    'dupla-sena':     '1 em 15.890.700',
    'dia-de-sorte':   '1 em 26.536.275',
    'mais-milionaria':'1 em 1.089.296.760',
  };

  const total = lottery.maxNumber - lottery.minNumber + 1;
  const pick  = lottery.pickCount;
  const expectedCount = Math.round((stats.totalContests * pick) / total);

  const hotStat  = stats.numberStats.find(s => s.number === stats.hottestNumbers[0]);
  const coldStat = stats.numberStats.find(s => s.number === stats.coldestNumbers[0]);

  return (
    <View style={probStyles.card}>
      <Text style={probStyles.title}>🎯 Análise de Probabilidade</Text>

      <Row label="Odds de ganhar o prêmio máximo" value={oddsMap[lottery.id] ?? 'N/D'} />
      <Row label="Números por sorteio" value={`${pick} de ${total} disponíveis`} />
      <Row label="Frequência teórica esperada" value={`${expectedFreq}% por sorteio`} />
      <Row label="Aparições esperadas no período" value={`≈ ${expectedCount}×`} />

      <View style={probStyles.divider} />
      <Row label="Nº mais frequente" value={`${String(hotStat?.number ?? '—').padStart(2,'0')} · ${hotStat?.count ?? 0}× (${((hotStat?.frequency ?? 0)*100).toFixed(1)}%)`} />
      <Row label="Nº menos frequente" value={`${String(coldStat?.number ?? '—').padStart(2,'0')} · ${coldStat?.count ?? 0}× (${((coldStat?.frequency ?? 0)*100).toFixed(1)}%)`} />

      <View style={probStyles.divider} />
      <View style={probStyles.infoBox}>
        <Text style={probStyles.infoTitle}>📌 Interpretação</Text>
        <Text style={probStyles.infoText}>
          Em {stats.totalContests} sorteios, cada número deveria sair em média{' '}
          <Text style={probStyles.highlight}>{expectedCount} vezes</Text> ({expectedFreq}%).{'\n\n'}
          Números acima desse valor são "quentes" (mais frequentes que o esperado). Números abaixo são "frios". Ambos são normais em amostras finitas — pela{' '}
          <Text style={probStyles.highlight}>Lei dos Grandes Números</Text>, tudo converge com o tempo.
        </Text>
      </View>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={probStyles.row}>
      <Text style={probStyles.rowLabel}>{label}</Text>
      <Text style={probStyles.rowValue}>{value}</Text>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: COLORS.bg },
  scroll: { paddingBottom: 48 },

  header: { padding: SPACING.lg, paddingTop: SPACING.xl, alignItems: 'center' },
  headerTitle: { color: COLORS.gold, fontFamily: FONTS.extraBold, fontSize: 24 },
  headerSub:   { color: COLORS.textSecondary, fontFamily: FONTS.regular, fontSize: 13, marginTop: 4 },

  chipWrap: { marginBottom: SPACING.md },
  chipRow:  { paddingHorizontal: SPACING.md, gap: 8, paddingVertical: 4 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: RADIUS.full, borderWidth: 1,
    borderColor: COLORS.border, backgroundColor: COLORS.bgCard,
  },
  chipIcon:       { fontSize: 16 },
  chipText:       { color: COLORS.textSecondary, fontFamily: FONTS.medium, fontSize: 13 },
  chipTextActive: { color: '#FFF', fontFamily: FONTS.bold },

  sectionBlock: { paddingHorizontal: SPACING.md, marginBottom: SPACING.md },
  sectionLabel: { color: COLORS.textSecondary, fontFamily: FONTS.medium, fontSize: 13, marginBottom: 8 },

  periodRow: { gap: 8 },
  periodBtn: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: RADIUS.full,
    backgroundColor: COLORS.bgCard, borderWidth: 1, borderColor: COLORS.border,
  },
  periodBtnActive: { backgroundColor: COLORS.gold, borderColor: COLORS.gold },
  periodText:      { color: COLORS.textSecondary, fontFamily: FONTS.medium, fontSize: 13 },
  periodTextActive:{ color: COLORS.bg, fontFamily: FONTS.bold },

  syncCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginHorizontal: SPACING.md, marginBottom: SPACING.sm,
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg,
    padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border,
  },
  syncLeft:  {},
  syncTitle: { color: COLORS.textPrimary, fontFamily: FONTS.bold, fontSize: 15 },
  syncSub:   { color: COLORS.textMuted, fontFamily: FONTS.regular, fontSize: 12, marginTop: 2 },
  syncBtn: {
    backgroundColor: COLORS.gold, paddingHorizontal: 16, paddingVertical: 9,
    borderRadius: RADIUS.md, minWidth: 100, alignItems: 'center',
  },
  syncBtnDisabled: { backgroundColor: COLORS.textMuted },
  syncBtnText:     { color: COLORS.bg, fontFamily: FONTS.bold, fontSize: 13 },

  infoBanner: {
    marginHorizontal: SPACING.md, marginBottom: SPACING.sm,
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.md,
    padding: SPACING.md, borderWidth: 1,
  },
  infoBannerText: { color: COLORS.textSecondary, fontFamily: FONTS.regular, fontSize: 13 },

  progressCard: {
    marginHorizontal: SPACING.md, marginBottom: SPACING.sm,
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.md,
    padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border,
  },
  progressBarTrack: {
    height: 8, backgroundColor: COLORS.border, borderRadius: 4,
    overflow: 'hidden', marginBottom: SPACING.sm,
  },
  progressBarFill: { height: '100%', backgroundColor: COLORS.gold, borderRadius: 4 },
  progressText: { color: COLORS.textSecondary, fontFamily: FONTS.regular, fontSize: 13 },

  emptyState: { alignItems: 'center', padding: SPACING.xl * 1.5 },
  emptyIcon:  { fontSize: 56, marginBottom: SPACING.md },
  emptyTitle: { color: COLORS.textPrimary, fontFamily: FONTS.bold, fontSize: 18, marginBottom: 8 },
  emptyText:  { color: COLORS.textSecondary, fontFamily: FONTS.regular, fontSize: 14, textAlign: 'center', lineHeight: 22 },

  summaryRow: {
    flexDirection: 'row', gap: SPACING.sm,
    marginHorizontal: SPACING.md, marginBottom: SPACING.md,
  },

  ballsRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: SPACING.sm, gap: 4 },
  ballWrap: { alignItems: 'center' },
  ballLabel:{ color: COLORS.textMuted, fontFamily: FONTS.medium, fontSize: 11, marginTop: 2 },
  noteText: { color: COLORS.textMuted, fontFamily: FONTS.regular, fontSize: 11, marginTop: SPACING.sm, lineHeight: 16 },

  shortcutBtn: {
    marginTop: SPACING.md, borderRadius: RADIUS.md,
    overflow: 'hidden', borderWidth: 1,
  },
  shortcutGrad: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 10, paddingHorizontal: SPACING.md,
  },
  shortcutText: { fontFamily: FONTS.semiBold, fontSize: 13 },
  shortcutArrow: { fontFamily: FONTS.bold, fontSize: 20 },

  // Collapsible sections
  collapsibleHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginHorizontal: SPACING.md, marginBottom: 2,
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg,
    padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border,
    marginTop: SPACING.sm,
  },
  collapsibleTitle: { color: COLORS.textPrimary, fontFamily: FONTS.bold, fontSize: 15 },
  collapsibleArrow: { color: COLORS.gold, fontFamily: FONTS.bold, fontSize: 14 },
  collapsibleBody: {
    marginHorizontal: SPACING.md, marginBottom: SPACING.md,
    backgroundColor: COLORS.bgCardAlt, borderRadius: RADIUS.lg,
    padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border,
    borderTopLeftRadius: 0, borderTopRightRadius: 0,
  },

  // Stat types
  statTypeRow: { flexDirection: 'row', marginBottom: SPACING.md, gap: SPACING.sm, alignItems: 'flex-start' },
  statTypeIcon: { fontSize: 24, width: 32, textAlign: 'center' },
  statTypeInfo: { flex: 1 },
  statTypeName: { color: COLORS.textPrimary, fontFamily: FONTS.semiBold, fontSize: 14 },
  statTypeDesc: { color: COLORS.textSecondary, fontFamily: FONTS.regular, fontSize: 13, marginTop: 2, lineHeight: 19 },

  // Formula cards
  formulaCard: {
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.md,
    padding: SPACING.md, marginBottom: SPACING.sm,
    borderWidth: 1, borderColor: COLORS.gold + '22',
  },
  formulaHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.sm },
  formulaIconBox: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: COLORS.gold + '22', justifyContent: 'center', alignItems: 'center',
  },
  formulaIconText: { color: COLORS.gold, fontFamily: FONTS.bold, fontSize: 14 },
  formulaTitle:   { color: COLORS.textPrimary, fontFamily: FONTS.semiBold, fontSize: 14, flex: 1 },
  formulaBox: {
    backgroundColor: COLORS.bg, borderRadius: RADIUS.sm,
    padding: SPACING.sm, marginBottom: SPACING.sm,
    borderWidth: 1, borderColor: COLORS.border,
  },
  formulaText: { color: COLORS.gold, fontFamily: FONTS.bold, fontSize: 14, letterSpacing: 0.3, textAlign: 'center' },
  formulaDesc: { color: COLORS.textSecondary, fontFamily: FONTS.regular, fontSize: 13, lineHeight: 19 },

  // Mode picker + bars
  modePicker: {
    flexDirection: 'row', marginHorizontal: SPACING.md,
    marginTop: SPACING.md, marginBottom: SPACING.sm, gap: 6,
  },
  modeBtn: {
    flex: 1, paddingVertical: 8, borderRadius: RADIUS.md,
    backgroundColor: COLORS.bgCard, alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.border,
  },
  modeBtnActive:     { backgroundColor: COLORS.gold + '22', borderColor: COLORS.gold },
  modeBtnText:       { color: COLORS.textMuted, fontFamily: FONTS.medium, fontSize: 11 },
  modeBtnTextActive: { color: COLORS.gold, fontFamily: FONTS.bold },

  barsCard: {
    marginHorizontal: SPACING.md, backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg, padding: SPACING.md,
    borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.md,
  },
  barsTitle:  { color: COLORS.textPrimary, fontFamily: FONTS.bold, fontSize: 15, marginBottom: 4 },
  barsLegend: { flexDirection: 'row', gap: 12, marginBottom: SPACING.md },
  legendItem: { color: COLORS.textMuted, fontFamily: FONTS.regular, fontSize: 11 },
  showMoreBtn: {
    marginTop: SPACING.sm, paddingVertical: 10, alignItems: 'center',
    borderTopWidth: 1, borderTopColor: COLORS.border,
  },
  showMoreText: { color: COLORS.gold, fontFamily: FONTS.medium, fontSize: 13 },

  disclaimer: {
    color: COLORS.textMuted, fontFamily: FONTS.regular, fontSize: 11,
    textAlign: 'center', marginHorizontal: SPACING.lg,
    lineHeight: 17, marginTop: SPACING.sm,
  },
});

const summaryStyles = StyleSheet.create({
  card: {
    flex: 1, backgroundColor: COLORS.bgCard, borderRadius: RADIUS.md,
    padding: SPACING.sm, alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.border,
  },
  icon:  { fontSize: 20, marginBottom: 4 },
  value: { color: COLORS.gold, fontFamily: FONTS.bold, fontSize: 13, textAlign: 'center' },
  label: { color: COLORS.textMuted, fontFamily: FONTS.regular, fontSize: 11 },
});

const sectionStyles = StyleSheet.create({
  card: {
    marginHorizontal: SPACING.md, marginBottom: SPACING.md,
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg,
    padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border,
  },
  title:    { color: COLORS.textPrimary, fontFamily: FONTS.bold, fontSize: 16 },
  subtitle: { color: COLORS.textMuted, fontFamily: FONTS.regular, fontSize: 12, marginTop: 2 },
});

const probStyles = StyleSheet.create({
  card: {
    marginHorizontal: SPACING.md, marginBottom: SPACING.md,
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg,
    padding: SPACING.md, borderWidth: 1, borderColor: COLORS.gold + '33',
  },
  title:    { color: COLORS.gold, fontFamily: FONTS.bold, fontSize: 16, marginBottom: SPACING.sm },
  row:      { marginBottom: 8 },
  rowLabel: { color: COLORS.textSecondary, fontFamily: FONTS.regular, fontSize: 12 },
  rowValue: { color: COLORS.textPrimary, fontFamily: FONTS.semiBold, fontSize: 14, marginTop: 1 },
  divider:  { height: 1, backgroundColor: COLORS.border, marginVertical: SPACING.sm },
  infoBox: {
    backgroundColor: COLORS.bgCardAlt, borderRadius: RADIUS.md,
    padding: SPACING.sm, marginTop: SPACING.sm,
  },
  infoTitle: { color: COLORS.textPrimary, fontFamily: FONTS.semiBold, fontSize: 13, marginBottom: 4 },
  infoText:  { color: COLORS.textSecondary, fontFamily: FONTS.regular, fontSize: 13, lineHeight: 20 },
  highlight: { color: COLORS.gold, fontFamily: FONTS.bold },
});
