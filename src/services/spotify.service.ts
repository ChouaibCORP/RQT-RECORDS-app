// src/services/spotify.service.ts

import { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET } from '../constants/api';
import { Album } from '../types';

export class SpotifyService {
  private static accessToken: string | null = null;
  private static tokenExpiry: number = 0;

  static async getAccessToken(): Promise<string> {
    const now = Date.now();
    
    // Utiliser le token existant s'il est encore valide
    if (this.accessToken && now < this.tokenExpiry) {
      return this.accessToken!;
    }

    // Sinon, obtenir un nouveau token
    const credentials = btoa(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`);
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${credentials}`,
      },
      body: 'grant_type=client_credentials'
    });
    
    const data = await response.json();
    console.log('🔑 Spotify auth response:', JSON.stringify(data));
    if (!data.access_token) {
      throw new Error(`Auth failed: ${JSON.stringify(data)}`);
    }
    this.accessToken = data.access_token;
    this.tokenExpiry = now + (data.expires_in * 1000) - 60000;

    return this.accessToken!;
  }

  static async getNewReleases(country: string = 'FR', limit: number = 50): Promise<Album[]> {
    try {
      const token = await this.getAccessToken();
      
      const response = await fetch(
        `https://api.spotify.com/v1/search?q=tag:new&type=album&limit=${limit}&market=${country}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        }
      );

      const text = await response.text();
      console.log('📦 Search response status:', response.status, text.slice(0, 300));
      const data = JSON.parse(text);

      if (data.albums && data.albums.items) {
        return data.albums.items.map((album: any) => {
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
            releaseDate: album.release_date,
            coverUrl,
            spotifyUrl: album.external_urls.spotify,
            genre: [],
            country: album.available_markets || [],
            isLiked: false,
          };
        });
      }
      
      return [];
    } catch (error) {
      console.error('❌ Erreur chargement albums:', error);
      throw new Error('Impossible de charger les albums. Vérifiez votre connexion.');
    }
  }
}
