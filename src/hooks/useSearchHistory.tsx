import { useState, useEffect } from 'react';

const SEARCH_HISTORY_KEY = 'houseme_search_history';
const MAX_HISTORY = 10;

export interface SearchHistoryItem {
  id: string;
  query: string;
  filters: {
    priceRange?: string;
    type?: string;
    location?: string;
  };
  timestamp: number;
}

export const useSearchHistory = () => {
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>(() => {
    const stored = localStorage.getItem(SEARCH_HISTORY_KEY);
    return stored ? JSON.parse(stored) : [];
  });

  useEffect(() => {
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(searchHistory));
  }, [searchHistory]);

  const addToHistory = (query: string, filters: SearchHistoryItem['filters']) => {
    const newItem: SearchHistoryItem = {
      id: Date.now().toString(),
      query,
      filters,
      timestamp: Date.now(),
    };

    setSearchHistory((prev) => {
      const filtered = prev.filter(
        (item) => !(item.query === query && JSON.stringify(item.filters) === JSON.stringify(filters))
      );
      return [newItem, ...filtered].slice(0, MAX_HISTORY);
    });
  };

  const clearHistory = () => {
    setSearchHistory([]);
  };

  return { searchHistory, addToHistory, clearHistory };
};
