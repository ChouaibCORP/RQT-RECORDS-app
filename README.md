# 🎵 ALBUM - Découvre de la musique avec style

> Une application mobile de découverte musicale avec navigation par swipe, inspirée de Shotgun. Swipe pour découvrir les dernières sorties d'albums !

[![Made with Expo](https://img.shields.io/badge/MADE%20WITH-EXPO-000000.svg?style=for-the-badge&logo=expo)](https://expo.dev/)
[![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactnative.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Spotify](https://img.shields.io/badge/Spotify-1DB954?style=for-the-badge&logo=spotify&logoColor=white)](https://developer.spotify.com/)


---

## ✨ Fonctionnalités

### 🔥 Mode Découverte (Swipe)
- **Swipe droite** → Album suivant
- **Swipe gauche** → Album précédent
- **Swipe vers le haut** → Ajouter aux favoris ❤️
- **Tap** → Ouvrir dans Spotify
- **Animations fluides** style Shotgun/Tinder

### 📊 Statistiques Personnelles
- Total d'albums découverts
- Albums aimés sauvegardés
- Nombre de swipes effectués
- Jours d'utilisation

### 💾 Persistance des Données
- Favoris sauvegardés automatiquement
- Historique de navigation
- Statistiques utilisateur en temps réel
- Données conservées entre les sessions

### 🎨 Interface Premium
- Design sombre style Spotify
- Images haute qualité (640px+)
- Transitions et animations fluides
- Navigation par onglets intuitive

---

## 🚀 Installation

### Prérequis

- **Node.js** 16+ ([Installation](https://nodejs.org/))
- **Expo CLI** (installé automatiquement)
- **Expo Go** sur iOS/Android ([iOS](https://apps.apple.com/app/expo-go/id982107779) | [Android](https://play.google.com/store/apps/details?id=host.exp.exponent))
- **Clés API Spotify** ([Créer un compte développeur](https://developer.spotify.com/dashboard))

### Configuration

1. **Cloner le projet**
```bash
git clone https://github.com/votre-username/album-app.git
cd album-app
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Configurer les variables d'environnement**

Créer un fichier `.env` à la racine :
```env
EXPO_PUBLIC_SPOTIFY_CLIENT_ID=your_spotify_client_id
EXPO_PUBLIC_SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
```

> ⚠️ **Important** : Les variables Expo doivent avoir le préfixe `EXPO_PUBLIC_`

4. **Créer le fichier index.js**

Créer `index.js` à la racine :
```javascript
import 'react-native-gesture-handler';
import { registerRootComponent } from 'expo';
import App from './App';

registerRootComponent(App);
```

5. **Vérifier app.json**

S'assurer que `app.json` contient :
```json
{
  "expo": {
    "name": "ALBUM",
    "entryPoint": "./index.js",
    ...
  }
}
```

---

## 🎮 Lancement

### Mode développement

```bash
# Démarrer le serveur Expo
npx expo start

# Avec tunnel (recommandé pour WSL)
npx expo start --tunnel

# Nettoyer le cache
npx expo start --clear
```

### Scanner le QR code

1. Ouvrir **Expo Go** sur votre téléphone
2. Scanner le QR code affiché dans le terminal
3. L'app se charge automatiquement

---

## 🛠️ Stack Technique

### Frontend
- **React Native** - Framework mobile multiplateforme
- **Expo** - Toolchain et plateforme de développement
- **TypeScript** - Typage statique
- **React Hooks** - Gestion d'état moderne

### Gestes & Animations
- **react-native-gesture-handler** - Gestes tactiles natifs
- **React Native Animated API** - Animations performantes

### Stockage & Persistance
- **@react-native-async-storage/async-storage** - Stockage local clé-valeur

### APIs Externes
- **Spotify Web API** - Données musicales en temps réel
  - Endpoint : `/browse/new-releases`
  - Authentification : Client Credentials Flow

### Navigation
- **React Navigation** (préparé pour extension future)
- Navigation custom par onglets (implémentation actuelle)

---

## 📦 Dépendances Principales

```json
{
  "expo": "^52.0.0",
  "react": "18.3.1",
  "react-native": "0.76.5",
  "react-native-gesture-handler": "~2.20.2",
  "react-native-reanimated": "~3.16.1",
  "@react-native-async-storage/async-storage": "^2.1.0",
  "@expo/vector-icons": "^14.0.4",
  "typescript": "^5.3.0"
}
```

### Installation complète des dépendances
```bash
npx expo install react-native-gesture-handler
npx expo install react-native-reanimated
npx expo install @react-native-async-storage/async-storage
npx expo install @expo/vector-icons
```

---

## 🏗️ Architecture du Projet

```
MVP/
├── App.tsx                    # Point d'entrée principal + logique app
├── index.js                   # Configuration Expo + gesture-handler
├── app.json                   # Configuration Expo
├── .env                       # Variables d'environnement (non versionné)
├── package.json               # Dépendances npm
├── tsconfig.json              # Configuration TypeScript
├── assets/                    # Images et ressources
│   ├── icon.png
│   ├── splash-icon.png
│   └── adaptive-icon.png
└── README.md                  # Cette documentation
```

### Structure du code (App.tsx)

```typescript
// Types & Interfaces
interface Album { ... }
interface UserStats { ... }

// Composant principal
export default function App() {
  // États React
  const [albums, setAlbums] = useState<Album[]>([]);
  const [likedAlbums, setLikedAlbums] = useState<string[]>([]);
  
  // Logique de persistance
  const saveLikedAlbums = async () => { ... }
  const loadLikedAlbums = async () => { ... }
  
  // API Spotify
  const loadNewReleases = async () => { ... }
  
  // Gestion des gestes
  const onGestureEvent = Animated.event(...);
  const handleSwipeRight = () => { ... }
  
  // Rendu UI
  return <GestureHandlerRootView>...</GestureHandlerRootView>
}
```

---

## 🎯 Fonctionnement de l'API Spotify

### Authentification
```typescript
// Client Credentials Flow
const credentials = btoa(`${clientId}:${clientSecret}`);
const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Authorization': `Basic ${credentials}`,
  },
  body: 'grant_type=client_credentials'
});
```

### Récupération des albums
```typescript
// Nouvelles sorties (50 albums max)
const albumsResponse = await fetch(
  'https://api.spotify.com/v1/browse/new-releases?limit=50&country=FR',
  {
    headers: {
      'Authorization': `Bearer ${access_token}`,
      'Content-Type': 'application/json',
    }
  }
);
```

### Optimisation des images
```typescript
// Sélectionner la meilleure qualité (≥640px)
const highResImage = album.images.find(img => img.width >= 640) || album.images[0];
```

---

## 💾 Système de Persistance

### Clés de stockage AsyncStorage

```typescript
const STORAGE_KEYS = {
  LIKED_ALBUMS: '@album_app:liked_albums',
  USER_STATS: '@album_app:user_stats',
  DISCOVERED_ALBUMS: '@album_app:discovered_albums',
  APP_SETTINGS: '@album_app:settings'
};
```

### Sauvegarde automatique

```typescript
// Sauvegarder à chaque modification
useEffect(() => {
  if (dataLoaded && likedAlbums.length >= 0) {
    saveLikedAlbums(likedAlbums);
    updateUserStats({ totalAlbumsLiked: likedAlbums.length });
  }
}, [likedAlbums, dataLoaded]);
```

### Chargement au démarrage

```typescript
const loadAllData = async () => {
  await Promise.all([
    loadLikedAlbums(),
    loadUserStats(),
    loadDiscoveredAlbums()
  ]);
  setDataLoaded(true);
};
```

---

## 🎨 Système de Gestes

### Configuration PanGestureHandler

```typescript
<PanGestureHandler
  onGestureEvent={onGestureEvent}
  onHandlerStateChange={onHandlerStateChange}
  activeOffsetX={[-10, 10]}
  activeOffsetY={[-10, 10]}
>
  <Animated.View style={{ transform: [{ translateX }, { translateY }] }}>
    {/* Carte d'album */}
  </Animated.View>
</PanGestureHandler>
```

### Seuils de détection

```typescript
const SWIPE_THRESHOLD = screenWidth * 0.25;  // 25% de l'écran
const LIKE_THRESHOLD = -80;                   // 80px vers le haut
const VELOCITY_THRESHOLD = 800;               // Vitesse de geste rapide
```

---

## 📊 Statistiques Utilisateur

### Données trackées

```typescript
interface UserStats {
  totalAlbumsDiscovered: number;  // Albums parcourus
  totalAlbumsLiked: number;       // Albums favoris
  favoriteGenres: string[];       // Genres préférés (futur)
  sessionStartDate: string;       // Date de première utilisation
  lastUsedDate: string;           // Dernière ouverture
  totalSwipes: number;            // Total de swipes effectués
}
```

### Mise à jour automatique

```typescript
const updateUserStats = (updates: Partial<UserStats>) => {
  const newStats = {
    ...userStats,
    ...updates,
    lastUsedDate: new Date().toISOString()
  };
  setUserStats(newStats);
  saveUserStats(newStats);
};
```

---

## 🐛 Résolution de Problèmes

### Erreur : "PanGestureHandler must be used as a descendant of GestureHandlerRootView"

**Solution :**
1. Vérifier que `index.js` existe avec `import 'react-native-gesture-handler';`
2. Wrapper l'app dans `<GestureHandlerRootView>`
3. Ajouter `"entryPoint": "./index.js"` dans `app.json`

### Erreur : Variables d'environnement `undefined`

**Solution :**
```bash
# Les variables DOIVENT avoir le préfixe EXPO_PUBLIC_
EXPO_PUBLIC_SPOTIFY_CLIENT_ID=...
EXPO_PUBLIC_SPOTIFY_CLIENT_SECRET=...

# Redémarrer avec cache clear
npx expo start --clear
```

### Images pixelisées

**Solution :**
Le code sélectionne automatiquement les images ≥640px. Si problème persiste :
```typescript
// Forcer la haute résolution
const coverUrl = album.images[0]?.url; // Plus haute résolution disponible
```

### Performance lente

**Solutions :**
```bash
# Nettoyer le cache
npx expo start --clear

# Vérifier les animations
# Utiliser useNativeDriver: true partout

# Optimiser les images
resizeMode="cover"
cache="force-cache"
```

---



### Standards de code
- TypeScript strict
- Prettier pour le formatage
- Commits conventionnels (feat:, fix:, docs:, etc.)

---

## 📝 License

Ce projet est sous licence **MIT** - voir le fichier [LICENSE](LICENSE) pour plus de détails.

---

## 📚 Ressources Utiles

### Documentation officielle
- [Expo Documentation](https://docs.expo.dev/)
- [React Native Docs](https://reactnative.dev/docs/getting-started)
- [Spotify Web API](https://developer.spotify.com/documentation/web-api/)
- [React Native Gesture Handler](https://docs.swmansion.com/react-native-gesture-handler/)

### Tutoriels
- [Expo Getting Started](https://docs.expo.dev/get-started/introduction/)
- [TypeScript React Native](https://reactnative.dev/docs/typescript)
- [AsyncStorage Guide](https://react-native-async-storage.github.io/async-storage/)

### Communauté
- [Expo Discord](https://chat.expo.dev/)
- [React Native Community](https://www.reactnative.dev/community/overview)
- [Stack Overflow - React Native](https://stackoverflow.com/questions/tagged/react-native)

---

## ⚡ Quick Start (TL;DR)

```bash
# Installation
git clone https://github.com/votre-username/album-app.git
cd album-app
npm install

# Configuration
echo "EXPO_PUBLIC_SPOTIFY_CLIENT_ID=your_id" > .env
echo "EXPO_PUBLIC_SPOTIFY_CLIENT_SECRET=your_secret" >> .env

# Lancement
npx expo start --tunnel
```

**Scan le QR code avec Expo Go et profite ! 🎵**

---

<p align="center">
  <strong>Made with ❤️ and 🎵</strong><br>
  Découvre la musique autrement avec ALBUM
</p>
