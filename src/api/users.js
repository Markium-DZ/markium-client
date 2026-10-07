import { useMemo } from 'react';
import useSWR, { mutate } from 'swr';

import axios, { fetcher, endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------

const options = {
    revalidateIfStale: true,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
};

export function useUsers() {
    const { data, isLoading, error, isValidating, mutate } = useSWR(
        endpoints.users.users,
        fetcher,
        options
    );

    const memoizedValue = useMemo(
        () => ({
            users: data?.data || [],
            usersLoading: isLoading,
            usersError: error,
            usersValidating: isValidating,
            usersEmpty: !isLoading && !data?.data?.length,
            mutate,
        }),
        [data, error, isLoading, isValidating]
    );

    return memoizedValue;
}

export function useRoles() {
    const { data, isLoading, error, isValidating, mutate } = useSWR(
        endpoints.users.roles,
        fetcher,
        options
    );

    const memoizedValue = useMemo(
        () => ({
            roles: data?.data || [],
            rolesLoading: isLoading,
            rolesError: error,
            rolesValidating: isValidating,
            rolesEmpty: !isLoading && !data?.data?.length,
            mutate,
        }),
        [data, error, isLoading, isValidating]
    );

    return memoizedValue;
}

export function useShowUser(id) {
    const { data, isLoading, error, isValidating, mutate } = useSWR(
        endpoints.users.users + "/" + id,
        fetcher,
        options
    );

    const memoizedValue = useMemo(
        () => ({
            user: data?.data || {},
            userLoading: isLoading,
            userError: error,
            userValidating: isValidating,
            userEmpty: !isLoading && !data?.data?.length,
            mutate,
        }),
        [data, error, isLoading, isValidating]
    );

    return memoizedValue;
}
export function useShowRole(id) {
    const { data, isLoading, error, isValidating, mutate } = useSWR(
        endpoints.users.roles + "/" + id,
        fetcher,
        options
    );

    const memoizedValue = useMemo(
        () => ({
            role: data?.data || {},
            roleLoading: isLoading,
            roleError: error,
            roleValidating: isValidating,
            roleEmpty: !isLoading && !data?.data?.length,
            mutate,
        }),
        [data, error, isLoading, isValidating]
    );

    return memoizedValue;
}


export async function createRole(body) {
    const URL = endpoints.users?.roles;
    return await axios.post(URL, body);
}

export async function deleteRole(id, body) {
    const URL = endpoints.users?.deleteRole(id);
    return await axios.delete(URL, body);
}
export async function deleteEmptyRole(id) {
    const URL = endpoints.users?.roles+"/"+id;

    return await axios.delete(URL);
}


export async function createUser(body) {
    const URL = endpoints.users.root;
    return await axios.post(URL, body);
}
export async function deleteUser(id) {
    const URL = endpoints.users.users + "/" + id;
    return await axios.delete(URL);
}

export async function banUser(id) {
    const URL = endpoints.users.banUser(id);
    return await axios.post(URL);
}
export async function activateUser(id) {
    const URL = endpoints.users.activateUser(id);
    return await axios.post(URL);
}

export async function updateUser(id, body) {
    const URL = endpoints.users.users + "/" + id;
    return await axios.put(URL, body);
}

export async function changeUserPassword(body) {
    const URL = endpoints.auth.changePassword;
    return await axios.post(URL, body);
}
export async function changeUserPasswordByAdmin(body) {
    const URL = endpoints.auth.changePasswordByAdmin;
    return await axios.post(URL, body);
}


export function usePermissions() {
    const { data, isLoading, error, isValidating, mutate } = useSWR(
        endpoints.users.permissions,
        fetcher,
        options
    );

    const memoizedValue = useMemo(
        () => ({
            permissions: data?.data || [],
            permissionsLoading: isLoading,
            permissionsError: error,
            permissionsValidating: isValidating,
            permissionsEmpty: !isLoading && !data?.data?.length,
            mutate,
        }),
        [data, error, isLoading, isValidating]
    );

    return memoizedValue;
}

export function useUserPermissions() {
    const { data, isLoading, error, isValidating, mutate } = useSWR(
        endpoints.users.user_permissions,
        fetcher,
        options
    );

    const memoizedValue = useMemo(
        () => ({
            permissions: data?.data?.permissions || [],
            permissionsLoading: isLoading,
            permissionsError: error,
            permissionsValidating: isValidating,
            permissionsEmpty: !isLoading && !data?.data?.length,
            mutate,
        }),
        [data, error, isLoading, isValidating]
    );

    return memoizedValue;
}

export async function editRole(id, body) {
    const URL = endpoints.users.roles + '/' + id;

    return await axios.put(URL, body);
}


