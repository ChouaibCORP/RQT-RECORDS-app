// src/screens/TendancesScreen.tsx

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, TouchableOpacity, Image, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Album } from '../types';
import { Colors } from '../constants/colors';

const { width } = Dimensions.get('window');

interface TendancesScreenProps {
  albums: Album[];
  likedAlbums: string[];
  onToggleLike: (albumId: string) => void;
  onRefresh: () => void;
  refreshing: boolean;
  onAlbumPress?: (album: Album) => void;
}

interface TrendingAlbum extends Album {
  popularity: number;
  position: number;
  previousPosition?: number;
  change: 'up' | 'down' | 'new' | 'same';
  changeAmount?: number;
}

export default function TendancesScreen({
  albums,
  likedAlbums,
  onToggleLike,
  onRefresh,
  refreshing,
  onAlbumPress,
}: TendancesScreenProps) {
  const [selectedGenre, setSelectedGenre] = useState('Tous les genres');
  const [selectedCountry, setSelectedCountry] = useState('Tous les pays');
  const [selectedPeriod, setSelectedPeriod] = useState('Cette semaine');
  const [showGenrePicker, setShowGenrePicker] = useState(false);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [showPeriodPicker, setShowPeriodPicker] = useState(false);

  // Simuler des données de popularité (en attendant l'API Spotify)
  const generateTrendingData = (albums: Album[]): TrendingAlbum[] => {
    return albums
      .map((album, index) => {
        // Simuler une popularité basée sur des facteurs fictifs
        const basePopularity = Math.random() * 100;
        const artistBonus = album.artist.some(artist => 
          ['Drake', 'Taylor Swift', 'Bad Bunny', 'The Weeknd', 'Ariana Grande'].includes(artist)
        ) ? 20 : 0;
        
        const popularity = Math.min(100, basePopularity + artistBonus);
        const position = index + 1;
        const previousPosition = Math.max(1, position + Math.floor(Math.random() * 10) - 5);
        
        let change: 'up' | 'down' | 'new' | 'same' = 'same';
        let changeAmount = 0;
        
        if (previousPosition > position) {
          change = 'up';
          changeAmount = previousPosition - position;
        } else if (previousPosition < position) {
          change = 'down';
          changeAmount = position - previousPosition;
        } else if (Math.random() > 0.7) {
          change = 'new';
        }

        return {
          ...album,
          popularity: Math.round(popularity),
          position,
          previousPosition,
          change,
          changeAmount
        };
      })
      .sort((a, b) => b.popularity - a.popularity)
      .map((album, index) => ({ ...album, position: index + 1 }));
  };

  // Extraire tous les genres et pays uniques
  const allGenres = useMemo(() => {
    const genreSet = new Set<string>();
    albums.forEach(album => {
      if (album.genre && album.genre.length > 0) {
        album.genre.forEach(genre => genreSet.add(genre));
      }
    });
    return ['Tous les genres', ...Array.from(genreSet).sort()];
  }, [albums]);

  const allCountries = useMemo(() => {
    const countrySet = new Set<string>();
    albums.forEach(album => {
      if (album.country && album.country.length > 0) {
        album.country.forEach(country => countrySet.add(country));
      }
    });
    return ['Tous les pays', 'FR', 'US', 'GB', 'CA', 'DE', 'ES', 'IT', ...Array.from(countrySet).sort()];
  }, [albums]);

  const periods = ['Cette semaine', 'Ce mois', 'Cette année', 'Tout temps'];

  // Filtrer les albums selon les critères sélectionnés
  const filteredAlbums = useMemo(() => {
    let filtered = albums;

    // Filtre par genre
    if (selectedGenre !== 'Tous les genres') {
      filtered = filtered.filter(album => 
        album.genre && album.genre.includes(selectedGenre)
      );
    }

    // Filtre par pays (simulé basé sur les marchés disponibles)
    if (selectedCountry !== 'Tous les pays') {
      filtered = filtered.filter(album => 
        !album.country || album.country.length === 0 || album.country.includes(selectedCountry)
      );
    }

    // Filtre par période (simulé - en réalité viendrait de l'API)
    // Pour cette démo, on garde tous les albums quelque soit la période

    return generateTrendingData(filtered).slice(0, 50); // Top 50
  }, [albums, selectedGenre, selectedCountry, selectedPeriod]);

  const formatArtists = (artists: string[]) => {
    if (artists.length === 1) return artists[0];
    if (artists.length === 2) return artists.join(' & ');
    return `${artists[0]} & ${artists.length - 1} autres`;
  };

  const getChangeIcon = (change: string) => {
    switch (change) {
      case 'up': return 'trending-up';
      case 'down': return 'trending-down';
      case 'new': return 'star';
      default: return 'remove';
    }
  };

  const getChangeColor = (change: string) => {
    switch (change) {
      case 'up': return '#4CAF50';
      case 'down': return '#F44336';
      case 'new': return '#FF9800';
      default: return Colors.textSecondary;
    }
  };

  const renderFilterPicker = (
    show: boolean,
    setShow: (show: boolean) => void,
    title: string,
    options: string[],
    selected: string,
    setSelected: (value: string) => void
  ) => {
    if (!show) return null;

    return (
      <View style={styles.pickerOverlay}>
        <TouchableOpacity 
          style={styles.pickerBackdrop} 
          onPress={() => setShow(false)}
        />
        <View style={styles.pickerContainer}>
          <View style={styles.pickerHeader}>
            <Text style={styles.pickerTitle}>{title}</Text>
            <TouchableOpacity onPress={() => setShow(false)}>
              <Ionicons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.pickerList}>
            {options.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.pickerItem,
                  selected === option && styles.pickerItemSelected
                ]}
                onPress={() => {
                  setSelected(option);
                  setShow(false);
                }}
              >
                <Text style={[
                  styles.pickerItemText,
                  selected === option && styles.pickerItemTextSelected
                ]}>
                  {option}
                </Text>
                {selected === option && (
                  <Ionicons name="checkmark" size={20} color={Colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    );
  };

  const renderTrendingAlbum = (album: TrendingAlbum, index: number) => {
    const isLiked = likedAlbums.includes(album.id);
    
    return (
      <TouchableOpacity
        key={album.id}
        style={styles.trendingItem}
        onPress={() => onAlbumPress?.(album)}
        activeOpacity={0.8}
      >
        {/* Numéro de classement */}
        <View style={styles.rankContainer}>
          <Text style={[
            styles.rankNumber,
            index < 3 && styles.topThreeRank
          ]}>
            {album.position}
          </Text>
        </View>

        {/* Pochette d'album */}
        <View style={styles.albumCoverContainer}>
          <Image source={{ uri: album.coverUrl }} style={styles.albumCover} />
          <TouchableOpacity style={styles.playButton}>
            <Ionicons name="play" size={16} color="#000" />
          </TouchableOpacity>
        </View>

        {/* Informations de l'album */}
        <View style={styles.albumInfo}>
          <Text style={styles.albumTitle} numberOfLines={1}>{album.title}</Text>
          <Text style={styles.artistName} numberOfLines={1}>{formatArtists(album.artist)}</Text>
          {album.genre && album.genre.length > 0 && (
            <View style={styles.genreContainer}>
              <Text style={styles.genreText}>{album.genre[0]}</Text>
            </View>
          )}
        </View>

        {/* Indicateur de changement */}
        <View style={styles.changeContainer}>
          <View style={[styles.changeIndicator, { backgroundColor: getChangeColor(album.change) }]}>
            <Ionicons 
              name={getChangeIcon(album.change)} 
              size={12} 
              color="#fff" 
            />
            {album.changeAmount && album.changeAmount > 0 && (
              <Text style={styles.changeAmount}>{album.changeAmount}</Text>
            )}
          </View>
          <Text style={styles.popularityText}>{album.popularity}%</Text>
        </View>

        {/* Bouton like */}
        <TouchableOpacity 
          style={styles.likeButton}
          onPress={() => onToggleLike(album.id)}
        >
          <Ionicons 
            name={isLiked ? "heart" : "heart-outline"} 
            size={20} 
            color={isLiked ? "#FF6B6B" : Colors.textSecondary} 
          />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>🔥 TENDANCES</Text>
            <Text style={styles.headerSubtitle}>Les albums les plus populaires</Text>
          </View>
        </View>

        {/* Filtres */}
        <View style={styles.filtersContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
            <TouchableOpacity 
              style={styles.filterChip}
              onPress={() => setShowPeriodPicker(true)}
            >
              <Text style={styles.filterChipText}>{selectedPeriod}</Text>
              <Ionicons name="chevron-down" size={16} color={Colors.text} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.filterChip}
              onPress={() => setShowGenrePicker(true)}
            >
              <Text style={styles.filterChipText}>{selectedGenre}</Text>
              <Ionicons name="chevron-down" size={16} color={Colors.text} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.filterChip}
              onPress={() => setShowCountryPicker(true)}
            >
              <Text style={styles.filterChipText}>{selectedCountry}</Text>
              <Ionicons name="chevron-down" size={16} color={Colors.text} />
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Liste des tendances */}
        <View style={styles.trendingList}>
          {filteredAlbums.map((album, index) => renderTrendingAlbum(album, index))}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {filteredAlbums.length > 0 
              ? `Top ${filteredAlbums.length} des albums tendances`
              : 'Aucun album trouvé pour ces critères'
            }
          </Text>
        </View>
      </ScrollView>

      {/* Modals de sélection */}
      {renderFilterPicker(
        showPeriodPicker,
        setShowPeriodPicker,
        'Choisir une période',
        periods,
        selectedPeriod,
        setSelectedPeriod
      )}
      
      {renderFilterPicker(
        showGenrePicker,
        setShowGenrePicker,
        'Choisir un genre',
        allGenres,
        selectedGenre,
        setSelectedGenre
      )}
      
      {renderFilterPicker(
        showCountryPicker,
        setShowCountryPicker,
        'Choisir un pays',
        allCountries,
        selectedCountry,
        setSelectedCountry
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  filtersContainer: {
    paddingBottom: 20,
  },
  filtersScroll: {
    paddingHorizontal: 20,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  filterChipText: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '500',
    marginRight: 8,
  },
  trendingList: {
    paddingHorizontal: 20,
  },
  trendingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#222',
  },
  rankContainer: {
    width: 32,
    alignItems: 'center',
    marginRight: 12,
  },
  rankNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.textSecondary,
  },
  topThreeRank: {
    color: Colors.primary,
    fontSize: 20,
  },
  albumCoverContainer: {
    position: 'relative',
    marginRight: 12,
  },
  albumCover: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#222',
  },
  playButton: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  albumInfo: {
    flex: 1,
    marginRight: 12,
  },
  albumTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  artistName: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  genreContainer: {
    alignSelf: 'flex-start',
  },
  genreText: {
    fontSize: 11,
    color: Colors.primary,
    backgroundColor: 'rgba(103, 80, 164, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    overflow: 'hidden',
  },
  changeContainer: {
    alignItems: 'center',
    marginRight: 12,
  },
  changeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 4,
    marginBottom: 4,
  },
  changeAmount: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 2,
  },
  popularityText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  likeButton: {
    padding: 8,
  },
  footer: {
    padding: 40,
    alignItems: 'center',
  },
  footerText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontStyle: 'italic',
  },
  pickerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  pickerBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  pickerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#111',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  pickerTitle: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  pickerList: {
    maxHeight: 400,
  },
  pickerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  pickerItemSelected: {
    backgroundColor: '#222',
  },
  pickerItemText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '500',
  },
  pickerItemTextSelected: {
    color: Colors.primary,
    fontWeight: '600',
  },
});