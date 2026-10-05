import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, FlatList, StyleSheet,
  SafeAreaView, StatusBar, TouchableOpacity, Alert, ActivityIndicator,
  Modal,
} from 'react-native';

import { COLORS, FONTS, SPACING, RADIUS } from '../theme/tokens';
import { LOTTERIES } from '../data/lotteries';
import {
  getFavorites, getHistory, SavedEntry,
  toggleFavorite, deleteEntry,
} from '../storage/database';
import EntryCard from '../components/EntryCard';
import CheckResultScreen from './CheckResultScreen';
import { EventBus, EVENTS } from '../utils/eventBus';

interface SavedScreenProps {
  mode: 'favorites' | 'history';
}

export default function SavedScreen({ mode }: SavedScreenProps) {
  const [entries, setEntries] = useState<SavedEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkEntry, setCheckEntry] = useState<SavedEntry | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = mode === 'favorites' ? await getFavorites() : await getHistory();
      setEntries(data);
    } catch (e) {
      console.warn('SavedScreen load error:', e);
    } finally {
      setLoading(false);
    }
  }, [mode]);

  // Initial load
  useEffect(() => {
    load();
  }, [load]);

  // Re-load whenever a new entry is saved from GeneratorScreen
  useEffect(() => {
    EventBus.on(EVENTS.ENTRY_SAVED, load);
    return () => EventBus.off(EVENTS.ENTRY_SAVED, load);
  }, [load]);

  const handleToggleFavorite = async (id: number, current: boolean) => {
    try {
      await toggleFavorite(id, !current);
      setEntries(prev =>
        prev
          .map(e => e.id === id ? { ...e, isFavorite: !current } : e)
          .filter(e => mode === 'history' || e.isFavorite)
      );
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível atualizar o favorito.');
    }
  };

  const handleDelete = (id: number) => {
    Alert.alert(
      'Excluir combinação',
      'Tem certeza que deseja excluir este jogo?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir', style: 'destructive',
          onPress: async () => {
            try {
              await deleteEntry(id);
              setEntries(prev => prev.filter(e => e.id !== id));
            } catch {
              Alert.alert('Erro', 'Não foi possível excluir.');
            }
          },
        },
      ]
    );
  };

  const title = mode === 'favorites' ? '⭐ Favoritos' : '🕐 Histórico';
  const emptyMsg = mode === 'favorites'
    ? 'Nenhum favorito ainda.\nGere números e marque como favorito!'
    : 'Nenhum jogo gerado ainda.\nVolte à tela inicial e gere seus números!';

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.headerRight}>
          {entries.length > 0 && (
            <Text style={styles.count}>{entries.length} jogo{entries.length > 1 ? 's' : ''}</Text>
          )}
          <TouchableOpacity style={styles.refreshBtn} onPress={load}>
            <Text style={styles.refreshIcon}>↻</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator color={COLORS.gold} size="large" />
        </View>
      ) : entries.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>{mode === 'favorites' ? '⭐' : '📜'}</Text>
          <Text style={styles.emptyText}>{emptyMsg}</Text>
        </View>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item }) => (
            <EntryCard
              entry={item}
              lottery={LOTTERIES.find(l => l.id === item.lotteryId)}
              onToggleFavorite={handleToggleFavorite}
              onDelete={handleDelete}
              onCheckResult={setCheckEntry}
            />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Check Result Modal */}
      <Modal
        visible={checkEntry !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setCheckEntry(null)}
      >
        {checkEntry && (
          <CheckResultScreen
            entry={checkEntry}
            onClose={() => setCheckEntry(null)}
          />
        )}
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.md,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { color: COLORS.textPrimary, fontFamily: FONTS.bold, fontSize: 22 },
  count: {
    color: COLORS.textMuted, fontFamily: FONTS.regular, fontSize: 13,
    backgroundColor: COLORS.bgCard, paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  refreshBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: COLORS.bgCard, borderWidth: 1, borderColor: COLORS.border,
    justifyContent: 'center', alignItems: 'center',
  },
  refreshIcon: { color: COLORS.gold, fontSize: 18, fontWeight: 'bold' },
  loadingState: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { paddingTop: SPACING.md, paddingBottom: 40 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING.xl },
  emptyIcon: { fontSize: 64, marginBottom: SPACING.md },
  emptyText: {
    color: COLORS.textSecondary, fontFamily: FONTS.regular,
    fontSize: 15, textAlign: 'center', lineHeight: 24,
  },
});
