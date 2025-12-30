import useSWR from 'swr';
import { useMemo } from 'react';
import axios, { fetcher, endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------

const options = {
  revalidateIfStale: true,
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
};

/**
 * Hook to fetch media with pagination
 * @param {number} page - Current page number
 * @param {number} perPage - Number of items per page
 * @returns {object} Media data and loading states
 */
export function useGetMedia(page = 1, perPage = 20) {
  const params = new URLSearchParams({ page, per_page: perPage });
  const url = `${endpoints.media.root}?${params.toString()}`;

  const { data, isLoading, error, isValidating, mutate } = useSWR(
    url,
    fetcher,
    options
  );

  const memoizedValue = useMemo(
    () => ({
      media: data?.data || [],
      mediaLoading: isLoading,
      mediaError: error,
      mediaValidating: isValidating,
      mediaEmpty: !isLoading && !data?.data?.length,
      totalPages: data?.meta?.last_page || 1,
      currentPage: data?.meta?.current_page || page,
      total: data?.meta?.total || 0,
      mutate,
    }),
    [data, error, isLoading, isValidating, page]
  );

  return memoizedValue;
}

/**
 * Upload multiple media files
 * @param {FileList|File[]} files - Files to upload
 * @returns {Promise} Upload response
 */
export async function uploadMedia(files) {
  const URL = endpoints.media.root;

  const formData = new FormData();

  // Handle both FileList and array of Files
  const fileArray = Array.from(files);
  fileArray.forEach((file) => {
    formData.append('files[]', file);
  });

  return await axios.post(URL, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}

/**
 * Delete a media file
 * @param {number} mediaId - Media ID to delete
 * @returns {Promise} Delete response
 */
export async function deleteMedia(mediaId) {
  const URL = `${endpoints.media.root}/${mediaId}`;
  return await axios.delete(URL);
}

/**
 * Update media alt text
 * @param {number} mediaId - Media ID to update
 * @param {string} altText - New alt text
 * @returns {Promise} Update response
 */
export async function updateMediaAltText(mediaId, altText) {
  const URL = `${endpoints.media.root}/${mediaId}`;
  return await axios.patch(URL, { alt_text: altText });
}
