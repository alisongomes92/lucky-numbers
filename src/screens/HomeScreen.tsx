import React from 'react';
import {
  View, Text, ScrollView, StyleSheet, SafeAreaView, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS, SPACING } from '../theme/tokens';
import { LOTTERIES } from '../data/lotteries';
import LotteryCard from '../components/LotteryCard';

interface HomeScreenProps {
  onSelectLottery: (id: string) => void;
}

export default function HomeScreen({ onSelectLottery }: HomeScreenProps) {
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <LinearGradient
            colors={['#1A1A2E', COLORS.bg]}
            style={styles.headerGrad}
          >
            <Text style={styles.emoji}>🍀</Text>
            <Text style={styles.title}>Números da Sorte</Text>
            <Text style={styles.subtitle}>
              Gere combinações aleatórias para as{'\n'}principais loterias do Brasil
            </Text>
          </LinearGradient>
        </View>

        {/* Gold divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>✦ Escolha sua Loteria ✦</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Lottery cards */}
        {LOTTERIES.map(lottery => (
          <LotteryCard
            key={lottery.id}
            lottery={lottery}
            onPress={() => onSelectLottery(lottery.id)}
          />
        ))}

        {/* Footer tip */}
        <View style={styles.tip}>
          <Text style={styles.tipIcon}>💡</Text>
          <Text style={styles.tipText}>
            Nossas combinações usam algoritmo de aleatoriedade criptográfica para máxima imparcialidade.
          </Text>
        </View>

        <Text style={styles.disclaimer}>
          Este aplicativo não garante prêmios. Jogue com responsabilidade. Maiores de 18 anos.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingBottom: 40,
  },
  header: {
    marginBottom: SPACING.lg,
  },
  headerGrad: {
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.xl,
    alignItems: 'center',
  },
  emoji: {
    fontSize: 56,
    marginBottom: SPACING.sm,
  },
  title: {
    color: COLORS.gold,
    fontFamily: FONTS.extraBold,
    fontSize: 28,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontFamily: FONTS.regular,
    fontSize: 14,
    textAlign: 'center',
    marginTop: SPACING.sm,
    lineHeight: 22,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.gold + '44',
  },
  dividerText: {
    color: COLORS.gold,
    fontFamily: FONTS.medium,
    fontSize: 12,
    marginHorizontal: SPACING.sm,
  },
  tip: {
    flexDirection: 'row',
    backgroundColor: COLORS.bgCard,
    borderRadius: 12,
    padding: SPACING.md,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.gold + '33',
    alignItems: 'flex-start',
    gap: SPACING.sm,
  },
  tipIcon: {
    fontSize: 18,
  },
  tipText: {
    color: COLORS.textSecondary,
    fontFamily: FONTS.regular,
    fontSize: 13,
    flex: 1,
    lineHeight: 20,
  },
  disclaimer: {
    color: COLORS.textMuted,
    fontFamily: FONTS.regular,
    fontSize: 11,
    textAlign: 'center',
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
    lineHeight: 18,
  },
});
