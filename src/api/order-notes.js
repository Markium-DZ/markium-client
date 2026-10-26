import useSWR from 'swr';
import { useMemo } from 'react';

import axios, { fetcher, endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------

const notesUrl = (orderId) => `${endpoints.order.root}/${orderId}/notes`;

export function useGetOrderNotes(orderId) {
  const { data, isLoading, error, mutate } = useSWR(orderId ? notesUrl(orderId) : null, fetcher, {
    revalidateOnFocus: false,
  });

  return useMemo(
    () => ({
      notes: data?.data || [],
      notesLoading: isLoading,
      notesError: error,
      mutate,
    }),
    [data, error, isLoading, mutate]
  );
}

export async function createOrderNote(orderId, body) {
  const res = await axios.post(notesUrl(orderId), body);
  return res.data?.data;
}

export async function updateOrderNote(orderId, noteId, body) {
  const res = await axios.patch(`${notesUrl(orderId)}/${noteId}`, body);
  return res.data?.data;
}

export async function deleteOrderNote(orderId, noteId) {
  return axios.delete(`${notesUrl(orderId)}/${noteId}`);
}
