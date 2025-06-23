// src/screens/AlbumDetailScreen.tsx

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Dimensions,
  Platform,
  Alert,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { Album, Track } from '../types';
import { SpotifyService } from '../services/spotify.service';
import { formatReleaseDate } from '../utils/date.utils';

const { width: screenWidth } = Dimensions.get('window');

interface AlbumDetailScreenProps {
  album: Album;
  isLiked: boolean;
  onToggleLike: (albumId: string) => void;
  onBack: () => void;
}

export default function AlbumDetailScreen({
  album,
  isLiked,
  onToggleLike,
  onBack,
}: AlbumDetailScreenProps) {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 🆕 États pour les nouvelles fonctionnalités
  const [showInfo, setShowInfo] = useState(false);
  const [userRating, setUserRating] = useState<'like' | 'dislike' | null>(null);

  useEffect(() => {
    loadTracks();
  }, [album.id]);

  const loadTracks = async () => {
    try {
      const albumTracks = await SpotifyService.getAlbumTracks(album.id);
      setTracks(albumTracks);
    } catch (error) {
      console.error('Erreur chargement pistes:', error);
      Alert.alert('Erreur', 'Impossible de charger les pistes');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // 🆕 Calculer la durée totale de l'album
  const getTotalDuration = () => {
    const totalMs = tracks.reduce((total, track) => total + track.duration, 0);
    const totalMinutes = Math.floor(totalMs / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return hours > 0 ? `${hours}h ${minutes}min` : `${minutes} min`;
  };

  // 🆕 Gestion du système de notation
  const handleRating = (rating: 'like' | 'dislike') => {
    setUserRating(prev => prev === rating ? null : rating);
    // Ici vous pouvez sauvegarder le rating dans votre système de stockage
    console.log(`Rating pour ${album.title}:`, rating);
  };

  // 🆕 Redirection vers YouTube pour l'album entier
  const openYouTube = async () => {
    if (!album.youtubeUrl) return;
    
    try {
      const supported = await Linking.canOpenURL(album.youtubeUrl);
      if (supported) {
        await Linking.openURL(album.youtubeUrl);
      } else {
        Alert.alert('YouTube', 'Impossible d\'ouvrir YouTube');
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'ouvrir le lien');
    }
  };

  // 🆕 Redirection vers Spotify pour une piste spécifique
  const openTrackInSpotify = async (track: Track) => {
    try {
      // Essayer l'app Spotify d'abord
      const spotifyApp = `spotify:track:${track.id}`;
      const canOpen = await Linking.canOpenURL(spotifyApp);
      
      if (canOpen) {
        await Linking.openURL(spotifyApp);
        console.log('🎵 Ouverture track dans l\'app Spotify');
      } else {
        await Linking.openURL(track.spotifyUrl || `https://open.spotify.com/track/${track.id}`);
        console.log('🌐 Ouverture track Spotify dans le navigateur');
      }
    } catch (error) {
      console.error('❌ Erreur ouverture track Spotify:', error);
      Alert.alert('Erreur', 'Impossible d\'ouvrir cette piste dans Spotify');
    }
  };

  // 🆕 Redirection vers YouTube pour une piste spécifique
  const openTrackInYouTube = async (track: Track) => {
    try {
      if (track.youtubeSearchUrl) {
        await Linking.openURL(track.youtubeSearchUrl);
        console.log('🎥 Recherche YouTube pour:', track.name);
      } else {
        // Fallback si pas d'URL générée
        const searchQuery = encodeURIComponent(`${track.name} ${track.artists.join(' ')}`);
        const youtubeUrl = `https://www.youtube.com/results?search_query=${searchQuery}`;
        await Linking.openURL(youtubeUrl);
      }
    } catch (error) {
      console.error('❌ Erreur ouverture track YouTube:', error);
      Alert.alert('Erreur', 'Impossible d\'ouvrir cette piste dans YouTube');
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Détails de l'album</Text>
        <TouchableOpacity 
          onPress={() => onToggleLike(album.id)} 
          style={styles.likeButton}
        >
          <Ionicons 
            name={isLiked ? "heart" : "heart-outline"} 
            size={24} 
            color={isLiked ? Colors.heart : Colors.text} 
          />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Album Info */}
        <View style={styles.albumInfo}>
          <Image source={{ uri: album.coverUrl }} style={styles.albumCover} />
          <Text style={styles.albumTitle}>{album.title}</Text>
          <Text style={styles.albumArtist}>{album.artist.join(', ')}</Text>
          <View style={styles.albumMeta}>
            <Text style={styles.albumDate}>{formatReleaseDate(album.releaseDate)}</Text>
          </View>
        </View>

        {/* 🆕 Section Informations sur l'album */}
        <View style={styles.infoSection}>
          <TouchableOpacity 
            style={styles.infoToggle}
            onPress={() => setShowInfo(!showInfo)}
          >
            <Text style={styles.infoToggleText}>Informations sur l'album</Text>
            <Ionicons 
              name={showInfo ? "chevron-up" : "chevron-down"} 
              size={20} 
              color={Colors.text} 
            />
          </TouchableOpacity>

          {showInfo && (
            <View style={styles.infoDetails}>
              <View style={styles.infoRow}>
                <Ionicons name="calendar-outline" size={16} color={Colors.textSecondary} />
                <Text style={styles.infoLabel}>Sortie :</Text>
                <Text style={styles.infoValue}>
                  {new Date(album.releaseDate).toLocaleDateString('fr-FR')}
                </Text>
              </View>
              
              <View style={styles.infoRow}>
                <Ionicons name="musical-notes-outline" size={16} color={Colors.textSecondary} />
                <Text style={styles.infoLabel}>Morceaux :</Text>
                <Text style={styles.infoValue}>{tracks.length} titres</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Ionicons name="time-outline" size={16} color={Colors.textSecondary} />
                <Text style={styles.infoLabel}>Durée :</Text>
                <Text style={styles.infoValue}>{getTotalDuration()}</Text>
              </View>
              
              {album.youtubeUrl && (
                <TouchableOpacity style={styles.youtubeButton} onPress={openYouTube}>
                  <Ionicons name="logo-youtube" size={20} color="#FF0000" />
                  <Text style={styles.youtubeButtonText}>Écouter sur YouTube</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* 🆕 Système de notation */}
        <View style={styles.ratingSection}>
          <Text style={styles.ratingTitle}>Votre avis sur cet album ?</Text>
          <View style={styles.ratingButtons}>
            <TouchableOpacity
              style={[
                styles.ratingButton,
                userRating === 'like' && styles.ratingButtonActive
              ]}
              onPress={() => handleRating('like')}
            >
              <Text style={styles.ratingEmoji}>👍🏾</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.ratingButton,
                userRating === 'dislike' && styles.ratingButtonActive
              ]}
              onPress={() => handleRating('dislike')}
            >
              <Text style={styles.ratingEmoji}>👎🏾</Text>
            </TouchableOpacity>
          </View>
          
          {userRating && (
            <Text style={styles.ratingFeedback}>
              {userRating === 'like' ? '✨ Vous aimez cet album !' : '😕 Vous n\'aimez pas cet album'}
            </Text>
          )}
        </View>

        {/* Tracks List */}
        <View style={styles.tracksSection}>
          <Text style={styles.sectionTitle}>
            Morceaux ({tracks.length})
          </Text>
          
          {loading ? (
            <ActivityIndicator size="small" color={Colors.primary} style={styles.loader} />
          ) : (
            tracks.map((track) => (
              <View key={track.id} style={styles.trackItemContainer}>
                {/* Track principale */}
                <View style={styles.trackItem}>
                  <View style={styles.trackNumber}>
                    <Text style={styles.trackNumberText}>{track.trackNumber}</Text>
                  </View>
                  <View style={styles.trackInfo}>
                    <View style={styles.trackTitleRow}>
                      <Text style={styles.trackName} numberOfLines={1}>{track.name}</Text>
                      {track.explicit && (
                        <View style={styles.explicitBadge}>
                          <Text style={styles.explicitText}>E</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.trackArtists} numberOfLines={1}>
                      {track.artists.join(', ')}
                    </Text>
                  </View>
                  <View style={styles.trackRight}>
                    <Text style={styles.trackDuration}>
                      {formatDuration(track.duration)}
                    </Text>
                  </View>
                </View>
                
                {/* 🆕 Boutons de redirection pour chaque track */}
                <View style={styles.trackActions}>
                  <TouchableOpacity 
                    style={styles.trackActionButton}
                    onPress={() => openTrackInSpotify(track)}
                  >
                    <Ionicons name="musical-notes" size={16} color="#1DB954" />
                    <Text style={styles.trackActionText}>Spotify</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.trackActionButton}
                    onPress={() => openTrackInYouTube(track)}
                  >
                    <Ionicons name="logo-youtube" size={16} color="#FF0000" />
                    <Text style={styles.trackActionText}>YouTube</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 16,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceLight,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
    textAlign: 'center',
  },
  likeButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  albumInfo: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: Colors.surface,
  },
  albumCover: {
    width: screenWidth * 0.6,
    height: screenWidth * 0.6,
    borderRadius: 12,
    marginBottom: 20,
  },
  albumTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  albumArtist: {
    fontSize: 18,
    fontWeight: '500',
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 12,
  },
  albumMeta: {
    alignItems: 'center',
    marginBottom: 20,
  },
  albumDate: {
    fontSize: 14,
    color: Colors.primary,
  },
  
  // 🆕 Styles pour la section d'informations
  infoSection: {
    margin: 16,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    overflow: 'hidden',
  },
  infoToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: Colors.surfaceLight,
  },
  infoToggleText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  infoDetails: {
    padding: 16,
    backgroundColor: Colors.surface,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginLeft: 8,
    marginRight: 8,
  },
  infoValue: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
  },
  youtubeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceLight,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  youtubeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginLeft: 8,
  },

  // 🆕 Styles pour le système de notation
  ratingSection: {
    margin: 16,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  ratingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  ratingButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 32,
    marginBottom: 12,
  },
  ratingButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ scale: 1 }],
  },
  ratingButtonActive: {
    backgroundColor: Colors.primary,
    transform: [{ scale: 1.1 }],
    shadowColor: Colors.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  ratingEmoji: {
    fontSize: 24,
  },
  ratingFeedback: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },

  trackItemContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    marginBottom: 8,
    overflow: 'hidden',
  },
  trackItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  tracksSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 16,
  },
  loader: {
    marginTop: 20,
  },
  trackNumber: {
    width: 30,
    alignItems: 'center',
  },
  trackNumberText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  trackInfo: {
    flex: 1,
    marginHorizontal: 12,
  },
  trackTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trackName: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
    flex: 1,
  },
  explicitBadge: {
    backgroundColor: Colors.textSecondary,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
    marginLeft: 8,
  },
  explicitText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.background,
  },
  trackArtists: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  trackRight: {
    alignItems: 'flex-end',
  },
  trackDuration: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  // 🆕 Styles pour les boutons de redirection
  trackActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.surfaceLight,
    gap: 12,
  },
  trackActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Colors.surface,
  },
  trackActionText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.text,
    marginLeft: 6,
  },
});