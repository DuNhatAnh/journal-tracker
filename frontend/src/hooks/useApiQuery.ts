import { useState, useEffect } from "react";
import { api } from "../lib/api";

interface CacheEntry {
  data: any;
  timestamp: number;
}

const MAX_CACHE_SIZE = 50;
const DEFAULT_TTL = 10 * 60 * 1000; // 10 minutes default TTL
const DEFAULT_STALE_TIME = 30 * 1000; // 30 seconds default stale time (deduplication window)

class ApiCacheMap extends Map<string, CacheEntry> {
  set(key: string, value: any): this {
    const entry: CacheEntry = (value && typeof value === 'object' && 'timestamp' in value && 'data' in value)
      ? value
      : { data: value, timestamp: Date.now() };
    
    super.set(key, entry);

    // Sync with localStorage if it was persisted
    const persistKey = `api_cache:${key}`;
    try {
      if (localStorage.getItem(persistKey) !== null) {
        localStorage.setItem(persistKey, JSON.stringify(entry));
      }
    } catch (err) {
      console.error("Error syncing cache to localStorage:", err);
    }

    return this;
  }
}

// In-memory RAM cache for API responses (ApiCacheMap preserves order for LRU)
export const queryCache = new ApiCacheMap();

// Clear localStorage api cache on fresh page load (F5 / App initialization)
try {
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith("api_cache:")) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(key => localStorage.removeItem(key));
} catch (err) {
  console.error("Error clearing localStorage cache on app initialization:", err);
}

interface UseApiQueryOptions {
  enabled?: boolean;
  ttl?: number;        // Custom TTL in milliseconds
  staleTime?: number;  // Custom stale time in milliseconds (data younger than this won't trigger background refetch)
  persist?: boolean;   // Persist to LocalStorage for persistence across page refreshes
}

export function useApiQuery<T>(url: string, options?: UseApiQueryOptions) {
  const ttl = options?.ttl ?? DEFAULT_TTL;
  const staleTime = options?.staleTime ?? DEFAULT_STALE_TIME;
  const persist = options?.persist ?? false;
  const persistKey = `api_cache:${url}`;

  // Helper to check expiration
  const isExpired = (timestamp: number, customTtl: number) => {
    return Date.now() - timestamp > customTtl;
  };

  const getInitialData = (): T | null => {
    // 1. RAM Cache lookup
    if (queryCache.has(url)) {
      const entry = queryCache.get(url)!;
      if (!isExpired(entry.timestamp, ttl)) {
        // Refresh position for LRU
        queryCache.delete(url);
        queryCache.set(url, entry);
        return entry.data as T;
      } else {
        queryCache.delete(url);
      }
    }

    // 2. LocalStorage lookup (if persist enabled)
    if (persist) {
      try {
        const localData = localStorage.getItem(persistKey);
        if (localData) {
          const entry: CacheEntry = JSON.parse(localData);
          if (!isExpired(entry.timestamp, ttl)) {
            // Populate RAM cache
            queryCache.set(url, entry);
            return entry.data as T;
          } else {
            localStorage.removeItem(persistKey);
          }
        }
      } catch (err) {
        console.error("Error reading cache from localStorage:", err);
      }
    }

    return null;
  };

  const [data, setData] = useState<T | null>(getInitialData);
  const [loading, setLoading] = useState<boolean>(!data);
  const [error, setError] = useState<Error | null>(null);
  const [trigger, setTrigger] = useState(0);

  const [prevUrl, setPrevUrl] = useState(url);
  if (url !== prevUrl) {
    setPrevUrl(url);
    const initial = getInitialData();
    setData(initial);
    setLoading(!initial);
    setError(null);
  }

  useEffect(() => {
    if (options?.enabled === false) return;

    // Check if we have valid, fresh cached data within the staleTime window
    if (queryCache.has(url)) {
      const entry = queryCache.get(url)!;
      const age = Date.now() - entry.timestamp;
      if (age < staleTime && !isExpired(entry.timestamp, ttl)) {
        // Data is fresh (and not expired), skip background network refetch
        return;
      }
    }

    let isMounted = true;

    api.get<T>(url)
      .then((res) => {
        if (isMounted) {
          setData(res);
          setLoading(false);

          const newEntry: CacheEntry = {
            data: res,
            timestamp: Date.now(),
          };

          // Update RAM Cache & LRU order
          if (queryCache.has(url)) {
            queryCache.delete(url);
          }
          queryCache.set(url, newEntry);

          // LRU Eviction
          if (queryCache.size > MAX_CACHE_SIZE) {
            const oldestKey = queryCache.keys().next().value;
            if (oldestKey !== undefined) {
              queryCache.delete(oldestKey);
            }
          }

          // Persist to LocalStorage
          if (persist) {
            try {
              localStorage.setItem(persistKey, JSON.stringify(newEntry));
            } catch (err) {
              console.error("Error writing cache to localStorage:", err);
            }
          }
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error(String(err)));
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [url, options?.enabled, trigger, persist, persistKey, ttl, staleTime]);

  const refetch = () => {
    // Evict from cache to force immediate network request
    queryCache.delete(url);
    if (persist) {
      try {
        localStorage.removeItem(persistKey);
      } catch (err) {
        console.error("Error evicting from localStorage during refetch:", err);
      }
    }
    setLoading(true);
    setTrigger(prev => prev + 1);
  };

  // We expose a custom setter that wraps input if it's not already wrapped
  const setWrappedData = (newData: T | ((prev: T | null) => T | null)) => {
    setData((prev) => {
      const resolved = typeof newData === "function" 
        ? (newData as Function)(prev) 
        : newData;
      
      // Update cache in sync
      if (resolved !== null) {
        queryCache.set(url, resolved);
      } else {
        queryCache.delete(url);
        if (persist) {
          localStorage.removeItem(persistKey);
        }
      }
      return resolved;
    });
  };

  return { data, loading, error, setData: setWrappedData, refetch };
}
