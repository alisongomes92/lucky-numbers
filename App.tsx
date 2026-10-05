import React, { useState, useEffect, useRef } from 'react';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
} from '@expo-google-fonts/inter';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';

import { COLORS } from './src/theme/tokens';
import HomeScreen from './src/screens/HomeScreen';
import GeneratorScreen from './src/screens/GeneratorScreen';
import SavedScreen from './src/screens/SavedScreen';
import StatsScreen from './src/screens/StatsScreen';
import { EventBus, EVENTS, OpenGeneratorPayload } from './src/utils/eventBus';

const Tab = createBottomTabNavigator();

// ─── HomeTab ─────────────────────────────────────────────────────────────────
// Manages Home ↔ Generator navigation, including shortcuts from StatsScreen.

interface HomeTabProps {
  // Injected by react-navigation
  navigation: any;
}

function HomeTab({ navigation }: HomeTabProps) {
  const [selectedLotteryId, setSelectedLotteryId] = useState<string | null>(null);
  const [seedPayload, setSeedPayload]             = useState<OpenGeneratorPayload | null>(null);

  // Listen for cross-screen "open generator" events (from StatsScreen shortcuts)
  useEffect(() => {
    const handler = (payload?: OpenGeneratorPayload) => {
      if (!payload) return;
      setSeedPayload(payload);
      setSelectedLotteryId(payload.lotteryId);
      // Switch to the Início tab so the generator is visible
      navigation.navigate('Início');
    };

    EventBus.on<OpenGeneratorPayload>(EVENTS.OPEN_GENERATOR, handler);
    return () => EventBus.off(EVENTS.OPEN_GENERATOR, handler);
  }, [navigation]);

  const handleBack = () => {
    setSelectedLotteryId(null);
    setSeedPayload(null);
  };

  if (selectedLotteryId) {
    return (
      <GeneratorScreen
        lotteryId={selectedLotteryId}
        onBack={handleBack}
        seedPayload={seedPayload ?? undefined}
      />
    );
  }
  return <HomeScreen onSelectLottery={id => { setSeedPayload(null); setSelectedLotteryId(id); }} />;
}

function FavoritesTab() {
  return <SavedScreen mode="favorites" />;
}

function HistoryTab() {
  return <SavedScreen mode="history" />;
}

// ─── Root App ─────────────────────────────────────────────────────────────────

export default function App() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });

  if (!fontsLoaded) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={COLORS.gold} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: COLORS.bgCard,
            borderTopColor: COLORS.border,
            borderTopWidth: 1,
            height: 62,
            paddingBottom: 8,
            paddingTop: 4,
          },
          tabBarActiveTintColor: COLORS.gold,
          tabBarInactiveTintColor: COLORS.textMuted,
          tabBarLabelStyle: {
            fontFamily: 'Inter_500Medium',
            fontSize: 11,
          },
        }}
      >
        <Tab.Screen
          name="Início"
          component={HomeTab}
          options={{
            tabBarIcon: ({ color }) => <Text style={{ fontSize: 22, color }}>🍀</Text>,
          }}
        />
        <Tab.Screen
          name="Estatísticas"
          component={StatsScreen}
          options={{
            tabBarIcon: ({ color }) => <Text style={{ fontSize: 22, color }}>📊</Text>,
          }}
        />
        <Tab.Screen
          name="Favoritos"
          component={FavoritesTab}
          options={{
            tabBarIcon: ({ color }) => <Text style={{ fontSize: 22, color }}>⭐</Text>,
          }}
        />
        <Tab.Screen
          name="Histórico"
          component={HistoryTab}
          options={{
            tabBarIcon: ({ color }) => <Text style={{ fontSize: 22, color }}>🕐</Text>,
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: COLORS.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
