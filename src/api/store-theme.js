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

export function useGetHomeLayout() {
  const { data, isLoading, error, mutate } = useSWR(
    endpoints.layouts.home,
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

// Replace the whole home layout (add/remove/reorder). Sends expected_version so
// a concurrent edit (another tab / MCP agent) returns 409 instead of clobbering.
export async function replaceHomeLayout(sections, expectedVersion) {
  const res = await axios.put(endpoints.layouts.home, {
    expected_version: expectedVersion,
    sections,
  });
  return res.data?.data;
}
