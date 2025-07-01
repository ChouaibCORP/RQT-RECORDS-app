// src/screens/NewReleasesScreen.tsx

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  RefreshControl, 
  TouchableOpacity, 
  Image, 
  Dimensions,
  FlatList,
  SectionList
} from 'react-native';
import { PanGestureHandler, PanGestureHandlerGestureEvent, PanGestureHandlerStateChangeEvent, State } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { Album } from '../types';
import { Colors } from '../constants/colors';

const { width, height } = Dimensions.get('window');
const ALBUM_SIZE = width * 0.42;
const ALBUM_SPACING = 16;

interface NewReleasesScreenProps {
  albums: Album[];
  likedAlbums: string[];
  onToggleLike: (albumId: string) => void;
  onRefresh: () => void;
  refreshing: boolean;
  onAlbumPress?: (album: Album) => void;
}

interface WeekSection {
  title: string;
  weekLabel: string;
  data: Album[];
  weekStart: Date;
  weekEnd: Date;
}

export default function NewReleasesScreen({
  albums,
  likedAlbums,
  onToggleLike,
  onRefresh,
  refreshing,
  onAlbumPress,
}: NewReleasesScreenProps) {
  const [selectedGenre, setSelectedGenre] = useState('Tous');
  const [showGenrePicker, setShowGenrePicker] = useState(false);
  
  // Vidéo bannière states
  const [isMuted, setIsMuted] = useState(true);
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(true);
  const [isVideoLoading, setIsVideoLoading] = useState(true);
  const videoRef = useRef<Video>(null);

  // Extraire les genres uniques
  const allGenres = useMemo(() => {
    const genreSet = new Set<string>();
    albums.forEach(album => {
      if (album.genre && album.genre.length > 0) {
        album.genre.forEach(genre => genreSet.add(genre));
      }
    });
    return ['Tous', ...Array.from(genreSet).sort()];
  }, [albums]);

  // Fonction pour obtenir le début de la semaine (lundi)
  const getWeekStart = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  };

  // Fonction pour obtenir la fin de la semaine (dimanche)
  const getWeekEnd = (weekStart: Date) => {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    return weekEnd;
  };

  // Fonction pour formater la semaine
  const formatWeekLabel = (weekStart: Date, weekEnd: Date) => {
    const startDay = weekStart.getDate();
    const endDay = weekEnd.getDate();
    const month = weekStart.toLocaleDateString('fr', { month: 'long' });
    
    return `${startDay} - ${endDay} ${month}`;
  };

  // Vidéos pour les artistes vedettes
  const getVideoUrlForAlbum = (album: Album) => {
    if (album.artist.some(artist => artist.toLowerCase().includes('karol g'))) {
      return 'https://res.cloudinary.com/dr0atsnqy/video/upload/v1750757556/bas1u40hcbqnupfdnhfc.mp4';
    }
    if (album.artist.some(artist => artist.toLowerCase().includes('hamza'))) {
      return 'https://res.cloudinary.com/dr0atsnqy/video/upload/v1750757556/t9w0qqc7ns7pzof2j3s3.mp4';
    }
    if (album.artist.some(artist => artist.toLowerCase().includes('olamide'))) {
      return 'https://res.cloudinary.com/dr0atsnqy/video/upload/v1750759860/yzmz1towfxglua2ogipj.mp4'; 
    }
    return null;
  };

  const isFeaturedArtist = (album: Album) => {
    return album.artist.some(artist =>
      artist.toLowerCase().includes('hamza') ||
      artist.toLowerCase().includes('karol g') ||
      artist.toLowerCase().includes('olamide')
    );
  };

  // Albums vedettes pour la bannière
  const featuredAlbums = albums
    .filter(isFeaturedArtist)
    .slice(0, 3)
    .map(album => {
      const videoUrl = getVideoUrlForAlbum(album);
      return videoUrl ? { ...album, videoUrl } : null;
    })
    .filter((album): album is Album & { videoUrl: string } => album !== null);

  // Générer les sections par semaine avec filtrage par genre
  const weekSections = useMemo(() => {
    const today = new Date();
    const currentWeekStart = getWeekStart(today);
    const sections: WeekSection[] = [];

    // Créer 4 sections pour les 4 dernières semaines (de la plus récente à la plus ancienne)
    for (let i = 0; i < 4; i++) {
      const weekStart = new Date(currentWeekStart);
      weekStart.setDate(currentWeekStart.getDate() - (i * 7));
      const weekEnd = getWeekEnd(weekStart);
      
      const weekAlbums = albums.filter(album => {
        const releaseDate = new Date(album.releaseDate);
        const isInWeek = releaseDate >= weekStart && releaseDate <= weekEnd;
        
        if (!isInWeek) return false;
        
        if (selectedGenre === 'Tous') {
          return true;
        }
        
        return album.genre && album.genre.includes(selectedGenre);
      });

      // Trier les albums par date de sortie décroissante (plus récent en premier)
      weekAlbums.sort((a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime());

      const weekTitle = i === 0 ? 'Cette semaine' : 
                       i === 1 ? 'Semaine dernière' : 
                       `Il y a ${i} semaines`;

      sections.push({
        title: weekTitle,
        weekLabel: formatWeekLabel(weekStart, weekEnd),
        data: weekAlbums,
        weekStart,
        weekEnd
      });
    }

    return sections.filter(section => section.data.length > 0);
  }, [albums, selectedGenre]);

  // Formater les artistes
  const formatArtists = (artists: string[]) => {
    if (artists.length === 1) return artists[0];
    return artists[0];
  };

  // Gestion du swipe pour la bannière
  const handleSwipeStateChange = (event: PanGestureHandlerStateChangeEvent) => {
    if (event.nativeEvent.state === State.END) {
      const { translationX, velocityX } = event.nativeEvent;
      const SWIPE_THRESHOLD = 50;
      const VELOCITY_THRESHOLD = 500;
      
      if (translationX > SWIPE_THRESHOLD || velocityX > VELOCITY_THRESHOLD) {
        goToPreviousAd();
      } else if (translationX < -SWIPE_THRESHOLD || velocityX < -VELOCITY_THRESHOLD) {
        goToNextAd();
      }
    }
  };

  const goToNextAd = () => {
    setCurrentAdIndex((prev) => (prev + 1) % featuredAlbums.length);
    setIsVideoPlaying(true);
    setIsVideoLoading(true);
  };

  const goToPreviousAd = () => {
    setCurrentAdIndex((prev) => (prev - 1 + featuredAlbums.length) % featuredAlbums.length);
    setIsVideoPlaying(true);
    setIsVideoLoading(true);
  };

  // Render d'un album individuel
  const renderAlbum = ({ item }: { item: Album }) => {
    const isLiked = likedAlbums.includes(item.id);
    
    return (
      <TouchableOpacity 
        style={styles.albumCard} 
        onPress={() => onAlbumPress?.(item)}
        activeOpacity={0.7}
      >
        <View style={styles.albumCoverContainer}>
          <Image source={{ uri: item.coverUrl }} style={styles.albumCover} />
          <TouchableOpacity 
            style={styles.likeButton} 
            onPress={() => onToggleLike(item.id)}
          >
            <Ionicons 
              name={isLiked ? "heart" : "heart-outline"} 
              size={20} 
              color={isLiked ? "#FF6B6B" : "#fff"} 
            />
          </TouchableOpacity>
        </View>
        <Text style={styles.albumTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.albumArtist} numberOfLines={1}>{formatArtists(item.artist)}</Text>
      </TouchableOpacity>
    );
  };

  // Render de la bannière vidéo
  const renderVideoBanner = () => {
    if (!featuredAlbums || featuredAlbums.length === 0) return null;
    const currentAlbum = featuredAlbums[currentAdIndex];
    if (!currentAlbum || !currentAlbum.videoUrl) return null;

    return (
      <PanGestureHandler onHandlerStateChange={handleSwipeStateChange}>
        <View style={styles.videoBanner}>
          <Video
            ref={videoRef}
            source={{ uri: currentAlbum.videoUrl }}
            style={styles.video}
            resizeMode={ResizeMode.COVER}
            shouldPlay={isVideoPlaying}
            isLooping={true}
            isMuted={isMuted}
            useNativeControls={false}
            onLoad={() => setIsVideoLoading(false)}
            onLoadStart={() => setIsVideoLoading(true)}
          />
          <View style={styles.videoOverlay} />
          
          <View style={styles.videoContent}>
            <View style={styles.videoHeader}>
              <View style={styles.featuredBadge}>
                <Text style={styles.featuredText}>À LA UNE</Text>
              </View>
              <View style={styles.videoControls}>
                <TouchableOpacity
                  style={styles.controlButton}
                  onPress={() => setIsVideoPlaying(!isVideoPlaying)}
                >
                  <Ionicons
                    name={isVideoPlaying ? "pause" : "play"}
                    size={16}
                    color="#fff"
                  />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.controlButton} 
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

            <View style={styles.videoInfo}>
              <Text style={styles.videoTitle}>{currentAlbum.title}</Text>
              <Text style={styles.videoArtist}>{formatArtists(currentAlbum.artist)}</Text>
              <TouchableOpacity 
                style={styles.listenButton} 
                onPress={() => onAlbumPress?.(currentAlbum)}
              >
                <Text style={styles.listenButtonText}>Écouter</Text>
              </TouchableOpacity>
            </View>
          </View>

          {featuredAlbums.length > 1 && (
            <View style={styles.pagination}>
              {featuredAlbums.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.paginationDot,
                    index === currentAdIndex && styles.paginationDotActive
                  ]}
                />
              ))}
            </View>
          )}
        </View>
      </PanGestureHandler>
    );
  };

  // Render d'une section de semaine
  const renderWeekSection = ({ section }: { section: WeekSection }) => {
    return (
      <View style={styles.weekSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <Text style={styles.sectionSubtitle}>{section.weekLabel}</Text>
        </View>
        <FlatList
          data={section.data}
          renderItem={renderAlbum}
          keyExtractor={(album) => album.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.albumsList}
          snapToInterval={ALBUM_SIZE + ALBUM_SPACING}
          decelerationRate="fast"
        />
      </View>
    );
  };

  // Render du sélecteur de genre
  const renderGenrePicker = () => {
    if (!showGenrePicker) return null;

    return (
      <View style={styles.pickerOverlay}>
        <TouchableOpacity 
          style={styles.pickerBackdrop} 
          onPress={() => setShowGenrePicker(false)}
        />
        <View style={styles.pickerContainer}>
          <View style={styles.pickerHeader}>
            <Text style={styles.pickerTitle}>Genres</Text>
            <TouchableOpacity onPress={() => setShowGenrePicker(false)}>
              <Ionicons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.pickerList}>
            {allGenres.map((genre, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.pickerItem,
                  selectedGenre === genre && styles.pickerItemSelected
                ]}
                onPress={() => {
                  setSelectedGenre(genre);
                  setShowGenrePicker(false);
                }}
              >
                <Text style={[
                  styles.pickerItemText,
                  selectedGenre === genre && styles.pickerItemTextSelected
                ]}>
                  {genre}
                </Text>
                {selectedGenre === genre && (
                  <Ionicons name="checkmark" size={20} color={Colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}> sorties</Text>
        <TouchableOpacity 
          style={styles.genreButton}
          onPress={() => setShowGenrePicker(true)}
        >
          <Text style={styles.genreButtonText}>{selectedGenre}</Text>
          <Ionicons name="chevron-down" size={16} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <SectionList
        sections={weekSections}
        renderItem={() => null}
        renderSectionHeader={renderWeekSection}
        keyExtractor={(item, index) => `section-${index}`}
        stickySectionHeadersEnabled={false}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={renderVideoBanner()}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            tintColor={Colors.primary} 
          />
        }
        contentContainerStyle={styles.scrollContent}
      />

      {renderGenrePicker()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: 'bold',
    color: Colors.text,
  },
  genreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  genreButtonText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  // Bannière vidéo
  videoBanner: {
    height: 400,
    marginHorizontal: 20,
    marginBottom: 30,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
  },
  video: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  videoOverlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  videoContent: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 20,
  },
  videoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  featuredBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  featuredText: {
    color: '#000',
    fontSize: 12,
    fontWeight: 'bold',
  },
  videoControls: {
    flexDirection: 'row',
    gap: 12,
  },
  controlButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoInfo: {
    alignItems: 'center',
  },
  videoTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  videoArtist: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 20,
  },
  listenButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
  },
  listenButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  pagination: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  paginationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  paginationDotActive: {
    backgroundColor: '#fff',
    width: 20,
  },
  // Sections des semaines
  weekSection: {
    marginBottom: 40,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  albumsList: {
    paddingHorizontal: 20,
  },
  // Cards d'albums
  albumCard: {
    width: ALBUM_SIZE,
    marginRight: ALBUM_SPACING,
  },
  albumCoverContainer: {
    width: ALBUM_SIZE,
    height: ALBUM_SIZE,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 12,
    backgroundColor: '#1a1a1a',
  },
  albumCover: {
    width: '100%',
    height: '100%',
  },
  likeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  albumTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  albumArtist: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  // Genre picker
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
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '50%',
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
    maxHeight: 300,
  },
  pickerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  pickerItemSelected: {
    backgroundColor: '#222',
  },
  pickerItemText: {
    color: Colors.text,
    fontSize: 16,
  },
  pickerItemTextSelected: {
    color: Colors.primary,
    fontWeight: '600',
  },
});