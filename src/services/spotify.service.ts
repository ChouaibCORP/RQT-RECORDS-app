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

  /**
   * Récupère les genres des artistes depuis l'API Spotify
   */
  static async getArtistGenres(artistIds: string[]): Promise<string[]> {
    try {
      const token = await this.getAccessToken();
      const uniqueArtistIds = [...new Set(artistIds)].slice(0, 50); // Limite API Spotify
      
      if (uniqueArtistIds.length === 0) return [];
      
      const response = await fetch(
        `https://api.spotify.com/v1/artists?ids=${uniqueArtistIds.join(',')}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        }
      );
      
      if (!response.ok) {
        console.warn('Impossible de récupérer les genres des artistes');
        return [];
      }
      
      const data = await response.json();
      const allGenres = new Set<string>();
      
      if (data.artists) {
        data.artists.forEach((artist: any) => {
          if (artist && artist.genres) {
            artist.genres.forEach((genre: string) => {
              // Utiliser les genres Spotify tels quels, juste avec une meilleure capitalisation
              const formattedGenre = this.formatSpotifyGenre(genre);
              if (formattedGenre) {
                allGenres.add(formattedGenre);
              }
            });
          }
        });
      }
      
      return Array.from(allGenres);
    } catch (error) {
      console.warn('Erreur récupération genres artistes:', error);
      return [];
    }
  }

  /**
   * Formate les genres Spotify avec une capitalisation correcte (sans changer les noms)
   */
  static formatSpotifyGenre(spotifyGenre: string): string {
    // Garder les genres Spotify tels quels, juste améliorer la capitalisation
    return spotifyGenre
      .split(' ')
      .map(word => {
        // Garder les mots courts en minuscules (and, of, the, etc.)
        if (['and', 'of', 'the', 'in', 'to', 'for', 'with', 'by'].includes(word.toLowerCase())) {
          return word.toLowerCase();
        }
        // Capitaliser la première lettre
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join(' ');
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
            genre: [], // Sera rempli après récupération des genres
            country: album.available_markets || [],
            isLiked: false,
          };
        });

        // 🎵 Récupérer les genres des artistes en batch
        console.log('🎵 Récupération des genres des artistes...');
        const allArtistIds = albums.flatMap(album => album.artistId || []);
        const uniqueArtistIds = [...new Set(allArtistIds)];
        
        // Récupérer les genres par batch de 50 (limite API Spotify)
        const artistGenresMap = new Map<string, string[]>();
        
        for (let i = 0; i < uniqueArtistIds.length; i += 50) {
          const batch = uniqueArtistIds.slice(i, i + 50);
          try {
            const batchGenres = await this.getArtistGenres(batch);
            const token = await this.getAccessToken();
            
            const artistResponse = await fetch(
              `https://api.spotify.com/v1/artists?ids=${batch.join(',')}`,
              {
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
                }
              }
            );
            
            if (artistResponse.ok) {
              const artistData = await artistResponse.json();
              if (artistData.artists) {
                artistData.artists.forEach((artist: any) => {
                  if (artist && artist.genres) {
                    const formattedGenres = artist.genres
                      .map((g: string) => this.formatSpotifyGenre(g))
                      .filter((g: string) => g !== null && g !== '');
                    artistGenresMap.set(artist.id, formattedGenres);
                  }
                });
              }
            }
          } catch (error) {
            console.warn('Erreur récupération batch genres:', error);
          }
        }
        
        // Assigner les genres aux albums
        albums.forEach(album => {
          const albumGenres = new Set<string>();
          
          // Récupérer les genres de tous les artistes de l'album
          if (album.artistId) {
            album.artistId.forEach(artistId => {
              const artistGenres = artistGenresMap.get(artistId) || [];
              artistGenres.forEach(genre => albumGenres.add(genre));
            });
          }
          
          // Garder les genres trouvés ou un tableau vide si aucun
          album.genre = Array.from(albumGenres).slice(0, 3); // Limiter à 3 genres max
        });

        console.log(`✅ Genres assignés pour ${albums.length} albums`);

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