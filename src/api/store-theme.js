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

  return useMemo(
    () => ({
      // Map<type, settings[]> for quick lookup by the editor.
      catalog: (data?.data?.types || []).reduce((acc, entry) => {
        acc[entry.type] = entry.settings || [];
        return acc;
      }, {}),
      catalogLoading: isLoading,
      catalogError: error,
    }),
    [data, isLoading, error]
  );
}

// ----------------------------------------------------------------------

export async function patchHomeSection(sectionId, patch) {
  const res = await axios.patch(endpoints.layouts.homeSection(sectionId), patch);
  return res.data?.data;
}
