import { useState, useEffect } from 'react';

const FAVORITES_KEY = 'houseme_favorites';

export const useFavorites = () => {
  const [favorites, setFavorites] = useState<string[]>(() => {
    const stored = localStorage.getItem(FAVORITES_KEY);
    return stored ? JSON.parse(stored) : [];
  });

  useEffect(() => {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = (houseId: string) => {
    setFavorites((prev) =>
      prev.includes(houseId)
        ? prev.filter((id) => id !== houseId)
        : [...prev, houseId]
    );
  };

  const isFavorite = (houseId: string) => favorites.includes(houseId);

  return { favorites, toggleFavorite, isFavorite };
};
