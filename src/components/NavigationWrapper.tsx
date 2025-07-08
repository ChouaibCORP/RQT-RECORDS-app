// src/components/NavigationWrapper.tsx

import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import NewReleasesScreen from '../screens/NewReleasesScreen';
import AlbumDetailScreen from '../screens/AlbumDetailScreen';
import { Album } from '../types';

interface NavigationWrapperProps {
  albums: Album[];
  likedAlbums: string[];
  onToggleLike: (albumId: string) => void;
  onRefresh: () => void;
  refreshing: boolean;
}

export default function NavigationWrapper({
  albums,
  likedAlbums,
  onToggleLike,
  onRefresh,
  refreshing,
}: NavigationWrapperProps) {
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);

  return (
    <View style={styles.container}>
      {/* Écran principal toujours rendu */}
      <NewReleasesScreen
        albums={albums}
        likedAlbums={likedAlbums}
        onToggleLike={onToggleLike}
        onRefresh={onRefresh}
        refreshing={refreshing}
        onAlbumPress={(album) => setSelectedAlbum(album)}
      />

      {/* Écran de détail en overlay */}
      {selectedAlbum && (
        <View style={StyleSheet.absoluteFillObject}>
          <AlbumDetailScreen
            album={selectedAlbum}
            isLiked={likedAlbums.includes(selectedAlbum.id)}
            onToggleLike={onToggleLike}
            onBack={() => setSelectedAlbum(null)}
            backgroundComponent={
              <NewReleasesScreen
                albums={albums}
                likedAlbums={likedAlbums}
                onToggleLike={onToggleLike}
                onRefresh={onRefresh}
                refreshing={refreshing}
                onAlbumPress={() => {}}
              />
            }
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});