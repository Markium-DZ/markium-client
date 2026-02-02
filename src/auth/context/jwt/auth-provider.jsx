'use client';

import PropTypes from 'prop-types';
import { useMemo, useEffect, useReducer, useCallback } from 'react';

import axios, { endpoints } from 'src/utils/axios';
import { identifyClient, resetAnalytics, capture } from 'src/utils/analytics';

import { AuthContext } from './auth-context';
import { setSession, isValidToken, jwtDecode } from './utils';
import { useValues } from 'src/api/utils';
import showError from 'src/utils/show_error';
import { success } from 'src/theme/palette';

// ----------------------------------------------------------------------
/**
 * NOTE:
 * We only build demo at basic level.
 * Customer will need to do some extra handling yourself if you want to extend the logic and other features...
 */
// ----------------------------------------------------------------------

const initialState = {
  user: null,
  loading: true,
};

const reducer = (state, action) => {
  if (action.type === 'INITIAL') {
    return {
      loading: false,
      user: action.payload.user,
    };
  }
  if (action.type === 'LOGIN') {
    return {
      ...state,
      user: action.payload.user,
    };
  }
  if (action.type === 'REGISTER') {
    return {
      ...state,
      user: action.payload.user,
    };
  }
  if (action.type === 'UPDATE_USER') {
    return {
      ...state,
      user: action.payload.user,
    };
  }
  if (action.type === 'LOGOUT') {
    return {
      ...state,
      user: null,
    };
  }
  return state;
};

// ----------------------------------------------------------------------

const STORAGE_KEY = 'accessToken';

export const USER_STORAGE_KEY = 'zaity-user-info';

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const initialize = useCallback(async () => {
    try {
      const token = localStorage.getItem(STORAGE_KEY);
      if (token) {
        setSession(token);

        const getUserInfo = localStorage.getItem(USER_STORAGE_KEY);
        if (getUserInfo !== null) {
          const user = JSON.parse(getUserInfo);
          identifyClient(user);
          dispatch({
            type: 'INITIAL',
            payload: {
              user: {
                ...user,
                token,
              },
            },
          });
        }
      } else {
        dispatch({
          type: 'INITIAL',
          payload: {
            user: null,
          },
        });
      }
    } catch (error) {
      dispatch({
        type: 'INITIAL',
        payload: {
          user: null,
        },
      });
    }
  }, []);

  useEffect(() => {
    initialize();
  }, [initialize]);

  // LOGIN
  const login = useCallback(async (phone, password) => {
    const body = {
      phone,
      password,
    };
    try {
      const response = await axios.post(endpoints.auth.login, body);
      const { token, client } = response.data.data;
      setSession(token);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify({ ...client }));

      identifyClient(client);
      capture('client_logged_in');

      dispatch({
        type: 'LOGIN',
        payload: {
          user: {
            ...client,
            token,
          },
        },
      });
      return {success: true, message: 'Login successful!'}
    } catch (error) {
      console.error('Login failed:', error);
      return {success: false, message: 'Login failed!'}
    }
  }, []);

  // REGISTER
  const register = useCallback(async (name, phone, password, store_name,store_slug) => {
    const formData = new FormData();
    formData.append('name', name);
    formData.append('phone', phone);
    formData.append('password', password);
    formData.append('store_name', store_name);
    formData.append('store_slug', store_slug);
    formData.append('is_phone_verified', true);

    const response = await axios.post(endpoints.auth.register, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    const { token, client } = response.data.data;

    setSession(token);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify({ ...client }));

    identifyClient(client);
    capture('client_signed_up', {
      client_name: client.name,
      store_name: client.store?.name,
    });

    dispatch({
      type: 'REGISTER',
      payload: {
        user: {
          ...client,
          token,
        },
      },
    });
  }, []);

  // LOGOUT
  const logout = useCallback(async () => {
    resetAnalytics();
    setSession(null);
    localStorage.removeItem(USER_STORAGE_KEY);
    dispatch({
      type: 'LOGOUT',
    });
  }, []);

  // UPDATE USER
  const updateUser = useCallback((userData) => {
    // Deep merge for nested objects like store
    const updatedUser = {
      ...state.user,
      ...userData,
      // Handle nested objects properly
      ...(userData.store && state.user?.store && {
        store: {
          ...state.user.store,
          ...userData.store,
        }
      })
    };
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
    dispatch({
      type: 'UPDATE_USER',
      payload: {
        user: updatedUser,
      },
    });
  }, [state.user]);

  // ----------------------------------------------------------------------

  const checkAuthenticated = state.user ? 'authenticated' : 'unauthenticated';

  const status = state.loading ? 'loading' : checkAuthenticated;

  // const {data} = useValues();

  const memoizedValue = useMemo(
    () => ({
      user: state.user,
      method: 'jwt',
      // system_data:data,
      loading: status === 'loading',
      authenticated: status === 'authenticated',
      unauthenticated: status === 'unauthenticated',
      //
      login,
      register,
      logout,
      updateUser,
    }),
    [login, logout, register, updateUser, state.user, status]
  );

  return <AuthContext.Provider value={memoizedValue}>{children}</AuthContext.Provider>;
}

AuthProvider.propTypes = {
  children: PropTypes.node,
};
