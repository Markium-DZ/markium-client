import useSWR from 'swr';
import { useMemo } from 'react';

import axios, { fetcher, endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------

const layoutOptions = {
  revalidateIfStale: true,
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
};

// ----------------------------------------------------------------------

export function useGetLayout(page = 'home') {
  const { data, isLoading, error, mutate } = useSWR(
    endpoints.layouts.page(page),
    fetcher,
    layoutOptions
  );

  return useMemo(
    () => ({
      sections: data?.data?.sections || [],
      version: data?.data?.version ?? 0,
      layoutLoading: isLoading,
      layoutError: error,
      mutate,
    }),
    [data, isLoading, error, mutate]
  );
}

// ----------------------------------------------------------------------

export function useGetSectionsCatalog() {
  const { data, isLoading, error } = useSWR(endpoints.layouts.catalog, fetcher, layoutOptions);

  return useMemo(() => {
    const types = data?.data?.types || [];
    return {
      // Map<type, settings[]> for quick lookup by the editor.
      catalog: types.reduce((acc, entry) => {
        acc[entry.type] = entry.settings || [];
        return acc;
      }, {}),
      // Ordered list of type strings (for the "add section" menu).
      catalogTypes: types.map((entry) => entry.type),
      // Per-type editor flags: static (pinned, no remove/disable) + page allow-list.
      catalogMeta: types.reduce((acc, entry) => {
        acc[entry.type] = { static: !!entry.static, pages: entry.pages || null };
        return acc;
      }, {}),
      catalogLoading: isLoading,
      catalogError: error,
    };
  }, [data, isLoading, error]);
}

// ----------------------------------------------------------------------

export async function patchHomeSection(sectionId, patch) {
  const res = await axios.patch(endpoints.layouts.homeSection(sectionId), patch);
  return res.data?.data;
}

// Replace a whole page layout (add/remove/reorder). Sends expected_version so
// a concurrent edit (another tab / MCP agent) returns 409 instead of clobbering.
export async function replaceLayout(page, sections, expectedVersion) {
  const res = await axios.put(endpoints.layouts.page(page), {
    expected_version: expectedVersion,
    sections,
  });
  return res.data?.data;
}
