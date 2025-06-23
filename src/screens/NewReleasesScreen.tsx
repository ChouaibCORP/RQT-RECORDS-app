// src/screens/NewReleasesScreen.tsx
// INSTALLATION REQUISE: npm install expo-av
// Pour utiliser les vidéos : expo install expo-av

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Image,
  Dimensions,
  ImageBackground,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { Album } from '../types';
import { Colors } from '../constants/colors';

const { width } = Dimensions.get('window');

interface NewReleasesScreenProps {
  albums: Album[];
  likedAlbums: string[];
  onToggleLike: (albumId: string) => void;
  onRefresh: () => void;
  refreshing: boolean;
  onAlbumPress?: (album: Album) => void;
}

export default function NewReleasesScreen({
  albums,
  likedAlbums,
  onToggleLike,
  onRefresh,
  refreshing,
  onAlbumPress,
}: NewReleasesScreenProps) {
  const [isMuted, setIsMuted] = useState(true);
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(true);
  const [videoCurrentTime, setVideoCurrentTime] = useState(0);
  const [totalElapsedTime, setTotalElapsedTime] = useState(0);
  const videoRef = useRef<Video>(null);

  // Durée maximale de chaque pub en millisecondes (20 secondes)
  const MAX_VIDEO_DURATION = 20 * 1000;

  const getVideoUrlForAlbum = (album: Album) => {
  // Vidéo spécifique pour Karol G
  if (album.artist.some(artist => artist.toLowerCase().includes('karol g'))) {
    return 'https://drive.google.com/uc?export=download&id=1iIeeTHJwDI6Xxn1ujbbgfKiS01_piOWf';
  }

  // Vidéo spécifique pour Hamza
  if (album.artist.some(artist => artist.toLowerCase().includes('hamza'))) {
    return 'https://drive.google.com/uc?export=download&id=1eQJT4iR9M62P8n6NuZkBXUm05IuMegMA';
  }
    
    // Vidéos de sample pour les autres artistes
    const sampleVideos = [
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    ];
    
    // Hash simple basé sur l'ID de l'album pour avoir une vidéo cohérente
    const index = Math.abs(album.id.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) % sampleVideos.length;
    return sampleVideos[index];
  };

  // Albums mis en avant pour la publicité avec URLs vidéo (APRÈS la définition de la fonction)
  const featuredAlbums = albums.slice(0, 3).map(album => ({
    ...album,
    videoUrl: getVideoUrlForAlbum(album),
  }));

  // Auto-rotation des bannières toutes les 20 secondes (sauf si interaction manuelle)
  useEffect(() => {
    if (featuredAlbums.length > 1) {
      const interval = setInterval(() => {
        // Ne change automatiquement que si on a atteint 20 secondes
        if (totalElapsedTime >= MAX_VIDEO_DURATION) {
          setCurrentAdIndex((prev) => (prev + 1) % featuredAlbums.length);
          setVideoCurrentTime(0);
          setTotalElapsedTime(0);
        }
      }, 20000); // 20 secondes par pub
      return () => clearInterval(interval);
    }
  }, [featuredAlbums.length, totalElapsedTime]);

  // Timer pour compter le temps total écoulé (20 secondes par pub)
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isVideoPlaying && totalElapsedTime < MAX_VIDEO_DURATION) {
      interval = setInterval(() => {
        setTotalElapsedTime(prev => {
          const newTime = prev + 1000;
          // Passer à la pub suivante après 20 secondes (auto-rotation s'en charge)
          if (newTime >= MAX_VIDEO_DURATION) {
            return MAX_VIDEO_DURATION;
          }
          return newTime;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isVideoPlaying, totalElapsedTime]);

  // Fonction pour gérer le statut de lecture de la vidéo
  const handleVideoPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      const currentTimeMs = status.positionMillis || 0;
      setVideoCurrentTime(currentTimeMs);
    }
  };

  // Fonction pour redémarrer la vidéo
  const restartVideo = () => {
    setTotalElapsedTime(0);
    setIsVideoPlaying(true);
    if (videoRef.current) {
      videoRef.current.setPositionAsync(0);
    }
  };

  // Fonctions pour naviguer entre les pubs
  const goToNextAd = () => {
    setCurrentAdIndex((prev) => (prev + 1) % featuredAlbums.length);
    setVideoCurrentTime(0);
    setTotalElapsedTime(0);
    setIsVideoPlaying(true);
  };

  const goToPreviousAd = () => {
    setCurrentAdIndex((prev) => (prev - 1 + featuredAlbums.length) % featuredAlbums.length);
    setVideoCurrentTime(0);
    setTotalElapsedTime(0);
    setIsVideoPlaying(true);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = date.toLocaleDateString('fr', { month: 'short' }).toUpperCase();
    return `${day} ${month}`;
  };

  const formatArtists = (artists: string[]) => {
    if (artists.length === 1) return artists[0];
    if (artists.length === 2) return artists.join(' & ');
    return `${artists[0]} & ${artists.length - 1} autres`;
  };

  // Composant bannière publicitaire avec vidéo (durée limitée à 20s par pub)
  const renderAdvertBanner = () => {
    if (!featuredAlbums || featuredAlbums.length === 0) return null;
    
    const currentAlbum = featuredAlbums[currentAdIndex];
    
    return (
      <View style={styles.advertBanner}>
        {/* Fond vidéo avec limite de 20 secondes par pub */}
        <Video
          ref={videoRef}
          source={{ uri: currentAlbum.videoUrl }}
          style={styles.advertVideo}
          resizeMode={ResizeMode.COVER}
          shouldPlay={isVideoPlaying}
          isLooping={true} // La vidéo se répète automatiquement
          isMuted={isMuted}
          onLoad={() => console.log('Vidéo chargée')}
          onError={(error) => console.log('Erreur vidéo:', error)}
          onPlaybackStatusUpdate={handleVideoPlaybackStatusUpdate}
          progressUpdateIntervalMillis={1000} // Mise à jour chaque seconde
        />
        
        {/* Overlay sombre pour la lisibilité */}
        <View style={styles.advertOverlay} />

        {/* Boutons de navigation gauche/droite */}
        {featuredAlbums.length > 1 && (
          <>
            <TouchableOpacity 
              style={styles.navButtonLeft}
              onPress={goToPreviousAd}
            >
              <Ionicons name="chevron-back" size={24} color="#fff" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.navButtonRight}
              onPress={goToNextAd}
            >
              <Ionicons name="chevron-forward" size={24} color="#fff" />
            </TouchableOpacity>
          </>
        )}
        
        {/* Contenu de la bannière */}
        <View style={styles.advertContent}>
          {/* Contrôles vidéo dans le coin */}
          <View style={styles.advertHeader}>
            <View style={styles.videoControls}>
              <TouchableOpacity 
                style={styles.playPauseButton}
                onPress={() => {
                  if (totalElapsedTime >= MAX_VIDEO_DURATION) {
                    // Redémarrer si on a atteint la limite
                    restartVideo();
                  } else {
                    // Sinon toggle play/pause normal
                    setIsVideoPlaying(!isVideoPlaying);
                  }
                }}
              >
                <Ionicons 
                  name={totalElapsedTime >= MAX_VIDEO_DURATION ? "refresh" : (isVideoPlaying ? "pause" : "play")} 
                  size={16} 
                  color="#fff" 
                />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.muteButton}
                onPress={() => setIsMuted(!isMuted)}
              >
                <Ionicons 
                  name={isMuted ? "volume-mute" : "volume-high"} 
                  size={16} 
                  color="#fff" 
                />
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Spacer pour centrer le contenu */}
          <View style={styles.contentSpacer} />
          
          {/* Informations de l'album */}
          <View style={styles.advertInfo}>
            <Text style={styles.advertTitle} numberOfLines={2}>
              {currentAlbum.title}
            </Text>
            <Text style={styles.advertArtist} numberOfLines={1}>
              {formatArtists(currentAlbum.artist)}
            </Text>
            <Text style={styles.advertSubtitle}>
             Sortie {formatDate(currentAlbum.releaseDate)}
            </Text>
            
            {/* Genres */}
            {currentAlbum.genre && currentAlbum.genre.length > 0 && (
              <View style={styles.videoGenres}>
                {currentAlbum.genre.slice(0, 2).map((genre, index) => (
                  <View key={index} style={styles.videoGenreTag}>
                    <Text style={styles.videoGenreText}>{genre.toUpperCase()}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
          
          {/* Actions principales - bouton compact */}
          <View style={styles.advertActions}>
            <TouchableOpacity 
              style={styles.watchFullButton}
              onPress={() => onAlbumPress?.(currentAlbum)}
            >
              <Ionicons name="play" size={16} color="#000" />
              <Text style={styles.watchFullText}>VOIR</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Badge nouveauté dans le coin */}
        <View style={styles.promoBadge}>
          <Text style={styles.promoText}>NOUVEAUTÉ</Text>
        </View>
        
        {/* Indicateurs de slide - avec navigation tactile */}
        {featuredAlbums.length > 1 && (
          <View style={styles.slideIndicators}>
            {featuredAlbums.map((_, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.slideIndicator,
                  index === currentAdIndex && styles.slideIndicatorActive
                ]}
                onPress={() => {
                  setCurrentAdIndex(index);
                  setVideoCurrentTime(0);
                  setTotalElapsedTime(0);
                  setIsVideoPlaying(true);
                }}
              />
            ))}
          </View>
        )}

        {/* Indicateur de progression de la pub (20 secondes) */}
        <View style={styles.videoProgressContainer}>
          <View 
            style={[
              styles.videoProgressBar, 
              { width: `${(totalElapsedTime / MAX_VIDEO_DURATION) * 100}%` }
            ]} 
          />
        </View>
      </View>
    );
  };

  const renderAlbumCard = (album: Album) => {
    const isLiked = likedAlbums.includes(album.id);
    
    return (
      <TouchableOpacity
        key={album.id}
        style={styles.albumCard}
        onPress={() => onAlbumPress?.(album)}
        activeOpacity={0.9}
      >
        {/* Image de couverture */}
        <View style={styles.coverContainer}>
          <Image source={{ uri: album.coverUrl }} style={styles.coverImage} />
          
          {/* Overlay avec boutons */}
          <View style={styles.overlay}>
            {/* Bouton Play */}
            <TouchableOpacity style={styles.playButton}>
              <Ionicons name="play" size={20} color="#000" />
            </TouchableOpacity>
            
            {/* Bouton Like */}
            <TouchableOpacity 
              style={styles.likeButton}
              onPress={() => onToggleLike(album.id)}
            >
              <Ionicons 
                name={isLiked ? "heart" : "heart-outline"} 
                size={24} 
                color={isLiked ? "#FF6B6B" : "#fff"} 
              />
            </TouchableOpacity>
          </View>
          
          {/* Date en overlay */}
          <View style={styles.dateOverlay}>
            <Text style={styles.dateText}>{formatDate(album.releaseDate)}</Text>
          </View>
        </View>

        {/* Informations de l'album */}
        <View style={styles.albumInfo}>
          {/* Titre principal */}
          <Text style={styles.albumTitle} numberOfLines={2}>
            {album.title}
          </Text>
          
          {/* Artiste */}
          <Text style={styles.artistName} numberOfLines={1}>
            {formatArtists(album.artist)}
          </Text>
          
          {/* Date et action */}
          <View style={styles.metaInfo}>
            <Text style={styles.releaseDate}>
              {formatDate(album.releaseDate)}
            </Text>
            <Text style={styles.newLabel}>NOUVEAU</Text>
          </View>
          
          {/* Tags de genre */}
          {album.genre && album.genre.length > 0 && (
            <View style={styles.genreTags}>
              {album.genre.slice(0, 3).map((genre, index) => (
                <View key={index} style={styles.genreTag}>
                  <Text style={styles.genreText}>{genre.toUpperCase()}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={16} color={Colors.textSecondary} />
            <Text style={styles.locationText}>Lyon</Text>
          </View>
          
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.filterButton}>
              <Ionicons name="options-outline" size={20} color={Colors.text} />
              <Text style={styles.filterText}>Filtres</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.heartButton}>
              <Ionicons name="heart-outline" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Bannière publicitaire avec rotation toutes les 20s */}
        {renderAdvertBanner()}

        {/* Titre de section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.dayText}>AUJOURD'HUI</Text>
          <Text style={styles.sectionTitle}>🎵 NOUVELLES SORTIES</Text>
        </View>

        {/* Liste des albums */}
        <View style={styles.albumsList}>
          {albums.map(renderAlbumCard)}
        </View>

        {/* Indicateur de fin */}
        <View style={styles.endIndicator}>
          <Text style={styles.endText}>
            {albums.length > 0 
              ? `${albums.length} nouveaux albums découverts`
              : 'Aucun nouvel album aujourd\'hui'
            }
          </Text>
        </View>
      </ScrollView>
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
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    color: Colors.textSecondary,
    fontSize: 16,
    marginLeft: 4,
    fontWeight: '500',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  filterText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '500',
  },
  heartButton: {
    padding: 4,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  dayText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 4,
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: 28,
    fontWeight: 'bold',
    letterSpacing: -0.5,
  },
  albumsList: {
    paddingHorizontal: 20,
    gap: 24,
  },
  albumCard: {
    backgroundColor: '#111',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 8,
  },
  coverContainer: {
    position: 'relative',
    height: 200,
    width: '100%',
  },
  coverImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#222',
  },
  overlay: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    gap: 8,
  },
  playButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  likeButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateOverlay: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  dateText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  albumInfo: {
    padding: 16,
  },
  albumTitle: {
    color: Colors.text,
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
    lineHeight: 24,
  },
  artistName: {
    color: Colors.textSecondary,
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  releaseDate: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  newLabel: {
    color: '#FF6B6B',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  genreTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  genreTag: {
    backgroundColor: '#222',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#333',
  },
  genreText: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  endIndicator: {
    padding: 40,
    alignItems: 'center',
  },
  endText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontStyle: 'italic',
  },
  
  // Styles pour la bannière publicitaire avec rotation toutes les 20s
  advertBanner: {
    height: 280,
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  advertVideo: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 20,
  },
  advertOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 20,
  },
  advertContent: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
    zIndex: 2,
  },
  advertHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
  },
  promoBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: 'rgba(255, 107, 107, 0.9)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    zIndex: 3,
  },
  promoText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.8,
  },
  videoControls: {
    flexDirection: 'row',
    gap: 12,
  },
  playPauseButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  contentSpacer: {
    flex: 0.2,
  },
  advertInfo: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
  },
  advertTitle: {
    color: '#fff',
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 6,
    lineHeight: 30,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.9)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  advertArtist: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
    opacity: 0.95,
    textAlign: 'center',
  },
  advertSubtitle: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.85,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 8,
  },
  videoGenres: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  videoGenreTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  videoGenreText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  advertActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  watchFullButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 6,
  },
  watchFullText: {
    color: '#000',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  muteButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  slideIndicators: {
    position: 'absolute',
    bottom: 6,
    left: 24,
    right: 24,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    zIndex: 3,
  },
  slideIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  slideIndicatorActive: {
    backgroundColor: '#fff',
    width: 20,
  },
  // Styles pour les boutons de navigation
  navButtonLeft: {
    position: 'absolute',
    left: 12,
    top: '50%',
    transform: [{ translateY: -20 }],
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  navButtonRight: {
    position: 'absolute',
    right: 12,
    top: '50%',
    transform: [{ translateY: -20 }],
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  // Styles pour l'indicateur de navigation
  navigationIndicator: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 3,
  },
  navigationText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  // Styles pour l'indicateur de progression de la pub (20s)
  videoProgressContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    zIndex: 4,
  },
  videoProgressBar: {
    height: '100%',
    backgroundColor: '#FF6B6B',
    borderRadius: 2,
  },
});