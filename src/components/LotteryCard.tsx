import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Lottery } from '../data/lotteries';
import { COLORS, FONTS, SPACING, RADIUS } from '../theme/tokens';

interface LotteryCardProps {
  lottery: Lottery;
  onPress: () => void;
}

export default function LotteryCard({ lottery, onPress }: LotteryCardProps) {
  return (
    <TouchableOpacity
      style={styles.wrapper}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <LinearGradient
        colors={lottery.gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        {/* Decorative circle */}
        <View style={[styles.decorCircle, { backgroundColor: 'rgba(255,255,255,0.06)' }]} />
        <View style={[styles.decorCircleSmall, { backgroundColor: 'rgba(255,255,255,0.04)' }]} />

        <View style={styles.iconBox}>
          <Text style={styles.icon}>{lottery.icon}</Text>
        </View>

        <View style={styles.info}>
          <Text style={styles.name}>{lottery.name}</Text>
          <Text style={styles.description}>{lottery.description}</Text>
        </View>

        <View style={styles.priceBox}>
          <Text style={styles.priceLabel}>A partir de</Text>
          <Text style={styles.price}>R$ {lottery.priceMin.toFixed(2).replace('.', ',')}</Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    borderRadius: RADIUS.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 10,
  },
  card: {
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    minHeight: 80,
  },
  decorCircle: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    right: -30,
    top: -30,
  },
  decorCircleSmall: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 35,
    right: 50,
    bottom: -20,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  icon: {
    fontSize: 24,
  },
  info: {
    flex: 1,
  },
  name: {
    color: '#FFFFFF',
    fontFamily: FONTS.bold,
    fontSize: 16,
    marginBottom: 2,
  },
  description: {
    color: 'rgba(255,255,255,0.75)',
    fontFamily: FONTS.regular,
    fontSize: 12,
  },
  priceBox: {
    alignItems: 'flex-end',
  },
  priceLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontFamily: FONTS.regular,
    fontSize: 10,
  },
  price: {
    color: '#FFFFFF',
    fontFamily: FONTS.bold,
    fontSize: 14,
  },
});
