import { createContext, useContext, useState, useCallback, useEffect, useRef, useMemo } from 'react';
import PropTypes from 'prop-types';

// ----------------------------------------------------------------------

const MediaPreviewContext = createContext(null);

const FORCE_FLUSH_TIMEOUT = 60000; // 60s safety flush
const FLUSH_CHECK_INTERVAL = 5000; // Check for stale entries every 5s

// ----------------------------------------------------------------------

export function MediaPreviewProvider({ children }) {
  // Map<serverId, { blobUrl, createdAt }>
  const [previewMap, setPreviewMap] = useState(new Map());
  const intervalRef = useRef(null);

  // Add blob URL previews for newly uploaded media
  const addPreviews = useCallback((entries) => {
    // entries: Array<{ id: number|string, blobUrl: string }>
    setPreviewMap((prev) => {
      const next = new Map(prev);
      const now = Date.now();
      entries.forEach(({ id, blobUrl }) => {
        next.set(id, { blobUrl, createdAt: now });
      });
      return next;
    });
  }, []);

  // Get the display URL: blob preview if available, otherwise the server URL
  const getPreviewUrl = useCallback(
    (serverId, serverUrl) => {
      const entry = previewMap.get(serverId);
      return entry ? entry.blobUrl : serverUrl;
    },
    [previewMap]
  );

  // Remove specific previews (revokes blob URLs)
  const removePreviews = useCallback((ids) => {
    setPreviewMap((prev) => {
      const next = new Map(prev);
      ids.forEach((id) => {
        const entry = next.get(id);
        if (entry) {
          URL.revokeObjectURL(entry.blobUrl);
          next.delete(id);
        }
      });
      return next;
    });
  }, []);

  // Check S3 readiness: test if server images are loadable, remove previews for ready ones
  const checkS3Readiness = useCallback(
    async (serverItems) => {
      if (previewMap.size === 0) return;

      const entries = Array.from(previewMap.entries());
      const readyIds = [];

      await Promise.all(
        entries.map(async ([serverId]) => {
          const serverItem = serverItems.find((m) => m.id === serverId);
          if (!serverItem) return;

          const ready = await new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve(true);
            img.onerror = () => resolve(false);
            img.src = serverItem.full_url;
          });

          if (ready) readyIds.push(serverId);
        })
      );

      if (readyIds.length > 0) removePreviews(readyIds);
    },
    [previewMap, removePreviews]
  );

  // Force-flush stale entries to prevent memory leaks
  useEffect(() => {
    if (previewMap.size === 0) {
      clearInterval(intervalRef.current);
      return undefined;
    }

    const flush = () => {
      const now = Date.now();
      const staleIds = [];
      previewMap.forEach(({ createdAt }, id) => {
        if (now - createdAt > FORCE_FLUSH_TIMEOUT) staleIds.push(id);
      });
      if (staleIds.length > 0) removePreviews(staleIds);
    };

    intervalRef.current = setInterval(flush, FLUSH_CHECK_INTERVAL);
    return () => clearInterval(intervalRef.current);
  }, [previewMap, removePreviews]);

  // Cleanup all on unmount
  useEffect(
    () => () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      previewMap.forEach(({ blobUrl }) => URL.revokeObjectURL(blobUrl));
    },
    [] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const value = useMemo(
    () => ({ previewMap, addPreviews, getPreviewUrl, removePreviews, checkS3Readiness }),
    [previewMap, addPreviews, getPreviewUrl, removePreviews, checkS3Readiness]
  );

  return (
    <MediaPreviewContext.Provider value={value}>
      {children}
    </MediaPreviewContext.Provider>
  );
}

MediaPreviewProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export function useMediaPreview() {
  const context = useContext(MediaPreviewContext);
  if (!context) {
    throw new Error('useMediaPreview must be used within MediaPreviewProvider');
  }
  return context;
}

export default MediaPreviewContext;
