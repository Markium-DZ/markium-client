# Shared Media Preview Context — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Share blob URL previews across media components so images don't break when users move quickly between onboarding steps.

**Architecture:** A React context (`MediaPreviewProvider`) holds a shared `Map<serverId, blobUrl>`. Upload components write to it; display components read from it. A single background effect polls S3 readiness and revokes blob URLs when the real image is available. The context wraps the app inside `SnackbarProvider` (needs SWR access).

**Tech Stack:** React Context API, SWR (existing), existing `useGetMedia` hook

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `src/context/media-preview/media-preview-context.jsx` | Create | Context + provider with shared Map, add/remove helpers, S3 readiness polling |
| `src/app.jsx` | Modify | Wrap with `MediaPreviewProvider` |
| `src/components/media-picker/media-picker-dialog.jsx` | Modify | Write blob URLs to shared context on upload; stop revoking on close |
| `src/sections/product/components/inline-media-picker.jsx` | Modify | Read from shared context; remove local `localPreviewMap` state + polling effect |
| `src/sections/media/view/media-list-view.jsx` | Modify | Read/write shared context instead of local `localPreviewMap` |

---

### Task 1: Create MediaPreviewContext

**Files:**
- Create: `src/context/media-preview/media-preview-context.jsx`

- [ ] **Step 1: Create the context file**

```jsx
// src/context/media-preview/media-preview-context.jsx
import { createContext, useContext, useState, useCallback, useEffect, useRef, useMemo } from 'react';
import PropTypes from 'prop-types';

const MediaPreviewContext = createContext(null);

const S3_CHECK_INTERVAL = 3000;  // 3s between S3 readiness checks
const FORCE_FLUSH_TIMEOUT = 60000; // 60s safety flush

export function MediaPreviewProvider({ children }) {
  // Map<serverId, { blobUrl, createdAt }>
  const [previewMap, setPreviewMap] = useState(new Map());
  const intervalRef = useRef(null);

  const addPreviews = useCallback((entries) => {
    // entries: Array<{ id: number, blobUrl: string }>
    setPreviewMap((prev) => {
      const next = new Map(prev);
      const now = Date.now();
      entries.forEach(({ id, blobUrl }) => {
        next.set(id, { blobUrl, createdAt: now });
      });
      return next;
    });
  }, []);

  const getPreviewUrl = useCallback(
    (serverId, serverUrl) => {
      const entry = previewMap.get(serverId);
      return entry ? entry.blobUrl : serverUrl;
    },
    [previewMap]
  );

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

  // S3 readiness polling + force-flush for stale entries
  useEffect(() => {
    if (previewMap.size === 0) {
      clearInterval(intervalRef.current);
      return;
    }

    const check = async () => {
      const entries = Array.from(previewMap.entries());
      const now = Date.now();
      const readyIds = [];

      await Promise.all(
        entries.map(async ([serverId, { blobUrl, createdAt }]) => {
          // Force-flush after timeout
          if (now - createdAt > FORCE_FLUSH_TIMEOUT) {
            readyIds.push(serverId);
            return;
          }
          // No server URL to test against — skip (will be caught by force-flush)
        })
      );

      if (readyIds.length > 0) {
        setPreviewMap((prev) => {
          const next = new Map(prev);
          readyIds.forEach((id) => {
            const entry = next.get(id);
            if (entry) URL.revokeObjectURL(entry.blobUrl);
            next.delete(id);
          });
          return next;
        });
      }
    };

    intervalRef.current = setInterval(check, S3_CHECK_INTERVAL);
    return () => clearInterval(intervalRef.current);
  }, [previewMap]);

  // Cleanup all on unmount
  useEffect(
    () => () => {
      previewMap.forEach(({ blobUrl }) => URL.revokeObjectURL(blobUrl));
    },
    []
  );

  const value = useMemo(
    () => ({ previewMap, addPreviews, getPreviewUrl, removePreviews }),
    [previewMap, addPreviews, getPreviewUrl, removePreviews]
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
```

- [ ] **Step 2: Commit**

```bash
git add src/context/media-preview/media-preview-context.jsx
git commit -m "feat: add shared MediaPreviewContext for cross-component blob URL sharing"
```

---

### Task 2: Wire MediaPreviewProvider into App

**Files:**
- Modify: `src/app.jsx`

- [ ] **Step 1: Import and wrap with MediaPreviewProvider**

Add import:
```jsx
import { MediaPreviewProvider } from 'src/context/media-preview/media-preview-context';
```

Wrap inside `SnackbarProvider`, around `CheckoutProvider`:
```jsx
<SnackbarProvider>
  {/* ... existing SettingsDrawer, SwUpdatePrompt, etc. ... */}
  <Suspense fallback={<ProgressBar />}>
    <MediaPreviewProvider>
      <CheckoutProvider>
        <LocalizationProvider>
          <Router />
        </LocalizationProvider>
      </CheckoutProvider>
    </MediaPreviewProvider>
  </Suspense>
</SnackbarProvider>
```

- [ ] **Step 2: Commit**

```bash
git add src/app.jsx
git commit -m "feat: wrap app with MediaPreviewProvider"
```

---

### Task 3: Update MediaPickerDialog to use shared context

**Files:**
- Modify: `src/components/media-picker/media-picker-dialog.jsx`

Key changes:
1. Import `useMediaPreview` 
2. Replace local `localPreviewMap` state with shared context
3. On upload: call `addPreviews()` with server IDs + blob URLs
4. On close: do NOT revoke blob URLs (remove the revoke calls from `handleSelect` and `handleCancel`)
5. Keep the `displayMedia` merge logic but read from `previewMap` via context
6. Remove the local S3-readiness polling `useEffect` (context handles it)

- [ ] **Step 1: Refactor to use shared context**

Remove:
- `const [localPreviewMap, setLocalPreviewMap] = useState(new Map());`
- The entire `useEffect` block for S3 readiness checking (lines 82-141)
- Blob URL revocation in `handleSelect` and `handleCancel`

Add:
- `const { previewMap, addPreviews } = useMediaPreview();`
- Update `displayMedia` to use `previewMap` instead of `localPreviewMap`
- Update `handleUploadFiles` to call `addPreviews()` instead of `setLocalPreviewMap()`

- [ ] **Step 2: Commit**

```bash
git add src/components/media-picker/media-picker-dialog.jsx
git commit -m "refactor: MediaPickerDialog uses shared MediaPreviewContext"
```

---

### Task 4: Update InlineMediaPicker to use shared context

**Files:**
- Modify: `src/sections/product/components/inline-media-picker.jsx`

Key changes:
1. Import `useMediaPreview`
2. Replace local `localPreviewMap` state with shared context
3. On upload: call `addPreviews()` 
4. Remove the local S3-readiness polling `useEffect`
5. Update `displayMedia` to read from `previewMap`

- [ ] **Step 1: Refactor to use shared context**

Remove:
- `const [localPreviewMap, setLocalPreviewMap] = useState(new Map());`
- The entire S3 readiness `useEffect` (lines 146-197)

Add:
- `const { previewMap, addPreviews } = useMediaPreview();`
- Update `displayMedia` to use `previewMap`
- Update `handleUpload` to call `addPreviews()`

- [ ] **Step 2: Commit**

```bash
git add src/sections/product/components/inline-media-picker.jsx
git commit -m "refactor: InlineMediaPicker uses shared MediaPreviewContext"
```

---

### Task 5: Update MediaListView to use shared context

**Files:**
- Modify: `src/sections/media/view/media-list-view.jsx`

Key changes:
1. Import `useMediaPreview`
2. Replace local `localPreviewMap` state with shared context
3. On upload: call `addPreviews()`
4. Remove the local S3-readiness polling `useEffect` and unmount cleanup
5. Update `displayMedia` to read from `previewMap`

- [ ] **Step 1: Refactor to use shared context**

Same pattern as Tasks 3 and 4: replace local state with `useMediaPreview()`, remove local polling, update merge logic.

- [ ] **Step 2: Commit**

```bash
git add src/sections/media/view/media-list-view.jsx
git commit -m "refactor: MediaListView uses shared MediaPreviewContext"
```

---

### Task 6: Enhance S3 readiness checking in context

**Files:**
- Modify: `src/context/media-preview/media-preview-context.jsx`

The context's polling currently only does force-flush by timeout. It also needs to test actual S3 URLs. Since the context doesn't have direct access to SWR data, components should call `removePreviews()` when they detect S3 is ready during their own render cycle. Alternatively, add a `checkS3Ready(serverItems)` method that components call after SWR fetch.

- [ ] **Step 1: Add `checkS3Readiness` to context**

Add a method that accepts the current server media array and tests each image:

```jsx
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
```

Expose `checkS3Readiness` in the context value. Components call it after SWR data arrives.

- [ ] **Step 2: Add `useEffect` in each consumer to call `checkS3Readiness(media)` when media changes**

In each component that uses `useGetMedia`, add:
```jsx
const { checkS3Readiness } = useMediaPreview();
useEffect(() => { checkS3Readiness(media || []); }, [media, checkS3Readiness]);
```

- [ ] **Step 3: Commit**

```bash
git add src/context/media-preview/media-preview-context.jsx \
  src/components/media-picker/media-picker-dialog.jsx \
  src/sections/product/components/inline-media-picker.jsx \
  src/sections/media/view/media-list-view.jsx
git commit -m "feat: add S3 readiness checking to MediaPreviewContext"
```

---

### Task 7: Manual test

- [ ] **Step 1: Test the flow**

1. Start dev server
2. Register or log in as a new user
3. In the onboarding checklist, upload an image (Step 1)
4. Immediately close the media picker and open the product form (Step 2)
5. Verify the uploaded image shows correctly (blob URL fallback) — no broken image
6. Wait ~10s — image should seamlessly switch to S3 URL
7. Verify the standalone Media page also works correctly

- [ ] **Step 2: Final commit with any fixes**
