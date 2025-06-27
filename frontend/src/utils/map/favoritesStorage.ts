// 즐겨찾기 로컬 스토리지 관리 유틸리티

const FAVORITES_KEY = 'healthwise_map_favorites';

export const favoritesStorage = {
  // 즐겨찾기 목록 가져오기
  getFavorites: (): Set<string> => {
    try {
      const stored = localStorage.getItem(FAVORITES_KEY);
      if (stored) {
        const array = JSON.parse(stored);
        return new Set(array);
      }
    } catch (error) {
      console.error('Failed to load favorites:', error);
    }
    return new Set();
  },

  // 즐겨찾기 저장
  saveFavorites: (favorites: Set<string>) => {
    try {
      const array = Array.from(favorites);
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(array));
    } catch (error) {
      console.error('Failed to save favorites:', error);
    }
  },

  // 즐겨찾기 추가
  addFavorite: (placeId: string) => {
    const favorites = favoritesStorage.getFavorites();
    favorites.add(placeId);
    favoritesStorage.saveFavorites(favorites);
    return favorites;
  },

  // 즐겨찾기 제거
  removeFavorite: (placeId: string) => {
    const favorites = favoritesStorage.getFavorites();
    favorites.delete(placeId);
    favoritesStorage.saveFavorites(favorites);
    return favorites;
  },

  // 즐겨찾기 토글
  toggleFavorite: (placeId: string) => {
    const favorites = favoritesStorage.getFavorites();
    if (favorites.has(placeId)) {
      favorites.delete(placeId);
    } else {
      favorites.add(placeId);
    }
    favoritesStorage.saveFavorites(favorites);
    return favorites;
  },

  // 즐겨찾기 전체 삭제
  clearFavorites: () => {
    localStorage.removeItem(FAVORITES_KEY);
  }
};
