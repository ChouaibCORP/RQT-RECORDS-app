// src/services/spotify.service.ts

import { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET } from '../constants/api';
import { Album, Track } from '../types';
import { YouTubeService } from './youtube.service';

export class SpotifyService {
  private static accessToken: string | null = null;
  private static tokenExpiry: number = 0;

  static async getAccessToken(): Promise<string> {
    const now = Date.now();
    
    // Utiliser le token existant s'il est encore valide
    if (this.accessToken && now < this.tokenExpiry) {
      return this.accessToken;
    }

    // Sinon, obtenir un nouveau token
    if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
      throw new Error('Les identifiants Spotify ne sont pas configurés');
    }

    const credentials = btoa(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`);
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${credentials}`,
      },
      body: 'grant_type=client_credentials'
    });
    
    if (!response.ok) {
      throw new Error(`Erreur Spotify API: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.access_token) {
      throw new Error('Token d\'accès non reçu de Spotify');
    }
    
    this.accessToken = data.access_token;
    this.tokenExpiry = now + (data.expires_in * 1000) - 60000; // 1 minute before expiry
    
    return this.accessToken!;
  }

  static async getNewReleases(country: string = 'FR', limit: number = 50): Promise<Album[]> {
    try {
      const token = await this.getAccessToken();
      
      const response = await fetch(
        `https://api.spotify.com/v1/browse/new-releases?limit=${limit}&country=${country}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        }
      );
      
      const data = await response.json();
      
      if (data.albums && data.albums.items) {
        const albums: Album[] = data.albums.items.map((album: any) => {
          // Sélectionner la meilleure qualité d'image disponible
          let coverUrl = '';
          if (album.images && album.images.length > 0) {
            const highResImage = album.images.find((img: any) => img.width >= 640) || album.images[0];
            coverUrl = highResImage?.url || '';
          }
          
          return {
            id: album.id,
            title: album.name,
            artist: album.artists.map((a: any) => a.name),
            artistId: album.artists.map((a: any) => a.id),
            releaseDate: album.release_date,
            coverUrl,
            spotifyUrl: album.external_urls.spotify,
            youtubeUrl: undefined, // Sera ajouté après
            genre: [],
            country: album.available_markets || [],
            isLiked: false,
          };
        });

        // Récupérer les liens YouTube en batch
        console.log('🎥 Recherche des liens YouTube...');
        const albumsForYouTube = albums.slice(0, 20).map(album => ({
          id: album.id,
          title: album.title,
          artist: album.artist.join(' ')
        }));

        const youtubeLinks = await YouTubeService.processAlbumsBatch(albumsForYouTube);

        // Ajouter les liens YouTube aux albums
        albums.forEach(album => {
          const youtubeUrl = youtubeLinks.get(album.id);
          if (youtubeUrl) {
            album.youtubeUrl = youtubeUrl;
          }
        });

        console.log(`✅ ${youtubeLinks.size} liens YouTube ajoutés sur ${albums.length} albums`);
        
        return albums;
      }
      
      return [];
    } catch (error) {
      console.error('❌ Erreur chargement albums:', error);
      throw new Error('Impossible de charger les albums. Vérifiez votre connexion.');
    }
  }

 /**
 * Récupère les pistes d'un album
 */
static async getAlbumTracks(albumId: string): Promise<Track[]> {
  try {
    const token = await this.getAccessToken();
    
    const response = await fetch(
      `https://api.spotify.com/v1/albums/${albumId}/tracks?limit=50`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      }
    );
    
    if (!response.ok) {
      throw new Error('Erreur lors de la récupération des pistes');
    }
    
    const data = await response.json();
    
    if (data.items) {
      return data.items.map((track: any) => {
        // Créer la recherche YouTube optimisée
        const youtubeQuery = encodeURIComponent(
          `${track.name} ${track.artists.map((a: any) => a.name).join(' ')}`
        );
        
        return {
          id: track.id,
          name: track.name,
          trackNumber: track.track_number,
          duration: track.duration_ms,
          previewUrl: track.preview_url,
          artists: track.artists.map((a: any) => a.name),
          explicit: track.explicit || false,
          // 🆕 URLs pour les redirections
          spotifyUrl: track.external_urls?.spotify || `https://open.spotify.com/track/${track.id}`,
          youtubeSearchUrl: `https://www.youtube.com/results?search_query=${youtubeQuery}`,
        };
      });
    }
    
    return [];
  } catch (error) {
    console.error('❌ Erreur chargement pistes:', error);
    throw error;
  }
}
}