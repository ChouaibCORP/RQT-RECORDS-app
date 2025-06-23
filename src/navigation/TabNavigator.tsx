// src/navigation/TabNavigator.tsx

import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Tab, TabKey } from '../types';
import { Colors } from '../constants/colors';

// 🔄 Ordre modifié : Nouvelles en premier, puis Découvrir
const TABS: Tab[] = [
  { key: 'nouvelles', title: 'Nouvelles', icon: 'musical-notes', emoji: '🎵' },
  { key: 'swipe', title: 'Découvrir', icon: 'flash', emoji: '⚡' },
  { key: 'tendances', title: 'Tendances', icon: 'trending-up', emoji: '📈' },
  { key: 'genres', title: 'Genres', icon: 'grid', emoji: '🎭' },
  { key: 'profil', title: 'Profil', icon: 'person', emoji: '👤' },
];

interface TabNavigatorProps {
  activeTab: TabKey;
  onTabPress: (tab: TabKey) => void;
}

export default function TabNavigator({ activeTab, onTabPress }: TabNavigatorProps) {
  return (
    <View style={styles.tabBar}>
      {TABS.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.tab}
            onPress={() => onTabPress(tab.key)}
          >
            <Ionicons
              name={isActive ? tab.icon as any : `${tab.icon}-outline` as any}
              size={24}
              color={isActive ? Colors.primary : Colors.textSecondary}
            />
            <Text style={[
              styles.tabText,
              { color: isActive ? Colors.primary : Colors.textSecondary }
            ]}>
              {tab.title}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceLight,
    paddingBottom: 25,
    paddingTop: 10,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  tabText: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 4,
  },
});