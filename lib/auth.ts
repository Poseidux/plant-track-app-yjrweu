
/**
 * BetterAuth Client Configuration Template
 * 
 * ⚠️ CURRENTLY DISABLED ⚠️
 * This file is disabled because the required packages (better-auth, @better-auth/expo)
 * are not installed and authentication is not currently used in this app.
 * 
 * To enable authentication in the future:
 * 1. Install required packages: npm install better-auth @better-auth/expo
 * 2. Configure backend URL in app.json under expo.extra.backendUrl
 * 3. Replace placeholders (your-app-scheme, your-app) with actual values
 * 4. Remove the eslint-disable comments below
 * 5. Uncomment the implementation code
 */

/* eslint-disable */
// @ts-nocheck

// Disabled - authentication not currently used in this app
export const authClient = null;
export const storeWebBearerToken = () => {};
export const clearAuthTokens = () => {};

/*
// ORIGINAL IMPLEMENTATION (COMMENTED OUT)
// Uncomment this when ready to enable authentication

import { createAuthClient } from "better-auth/react";
import { expoClient } from "@better-auth/expo/client";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import Constants from "expo-constants";

const API_URL = Constants.expoConfig?.extra?.backendUrl || "";
const BEARER_TOKEN_KEY = "your-app_bearer_token";

const storage = Platform.OS === "web"
  ? {
      getItem: (key: string) => typeof window !== 'undefined' ? localStorage.getItem(key) : null,
      setItem: (key: string, value: string) => typeof window !== 'undefined' && localStorage.setItem(key, value),
      deleteItem: (key: string) => typeof window !== 'undefined' && localStorage.removeItem(key),
    }
  : SecureStore;

let _authClient: ReturnType<typeof createAuthClient> | null = null;

function getAuthClient() {
  if (!_authClient) {
    _authClient = createAuthClient({
      baseURL: API_URL,
      plugins: [
        expoClient({
          scheme: "your-app-scheme",
          storagePrefix: "your-app",
          storage,
        }),
      ],
      ...(Platform.OS === "web" && typeof window !== 'undefined' && {
        fetchOptions: {
          auth: {
            type: "Bearer" as const,
            token: () => localStorage.getItem(BEARER_TOKEN_KEY) || "",
          },
        },
      }),
    });
  }
  return _authClient;
}

export const authClient = new Proxy({} as ReturnType<typeof createAuthClient>, {
  get(target, prop) {
    return getAuthClient()[prop as keyof ReturnType<typeof createAuthClient>];
  }
});

export function storeWebBearerToken(token: string) {
  if (Platform.OS === "web" && typeof window !== 'undefined') {
    localStorage.setItem(BEARER_TOKEN_KEY, token);
  }
}

export function clearAuthTokens() {
  if (Platform.OS === "web" && typeof window !== 'undefined') {
    localStorage.removeItem(BEARER_TOKEN_KEY);
  }
}
*/
