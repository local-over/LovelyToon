import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  PAIRING_CODE: '@pairing_code',
  USER_ID: '@user_id',
  NICKNAME: '@nickname',
  PARTNER_ID: '@partner_id',
  PARTNER_NAME: '@partner_name',
  HISTORY: '@history',
  SETTINGS: '@settings',
  THEME: '@theme',
};

export const StorageService = {
  // ── User Identity ──
  getUserId: async () => {
    try {
      return await AsyncStorage.getItem(KEYS.USER_ID);
    } catch (e) {
      return null;
    }
  },

  setUserId: async (id) => {
    try {
      if (id) await AsyncStorage.setItem(KEYS.USER_ID, id);
      else await AsyncStorage.removeItem(KEYS.USER_ID);
    } catch (e) {
      console.error(e);
    }
  },

  getNickname: async () => {
    try {
      return await AsyncStorage.getItem(KEYS.NICKNAME);
    } catch (e) {
      return null;
    }
  },

  setNickname: async (name) => {
    try {
      await AsyncStorage.setItem(KEYS.NICKNAME, name);
    } catch (e) {
      console.error(e);
    }
  },


  // ── Partner ──
  getPartnerId: async () => {
    try {
      return await AsyncStorage.getItem(KEYS.PARTNER_ID);
    } catch (e) {
      return null;
    }
  },

  setPartnerId: async (id) => {
    try {
      if (id) {
        await AsyncStorage.setItem(KEYS.PARTNER_ID, id);
      } else {
        await AsyncStorage.removeItem(KEYS.PARTNER_ID);
      }
    } catch (e) {
      console.error(e);
    }
  },

  getPartnerName: async () => {
    try {
      return await AsyncStorage.getItem(KEYS.PARTNER_NAME);
    } catch (e) {
      return null;
    }
  },

  setPartnerName: async (name) => {
    try {
      if (name) {
        await AsyncStorage.setItem(KEYS.PARTNER_NAME, name);
      } else {
        await AsyncStorage.removeItem(KEYS.PARTNER_NAME);
      }
    } catch (e) {
      console.error(e);
    }
  },

  // ── Full Reset ──
  clearAllPairing: async () => {
    try {
      await AsyncStorage.multiRemove([KEYS.PARTNER_ID, KEYS.PARTNER_NAME]);
    } catch (e) {
      console.error(e);
    }
  },

  // ── History ──
  getHistory: async () => {
    try {
      const data = await AsyncStorage.getItem(KEYS.HISTORY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  addHistoryItem: async (item) => {
    try {
      const history = await StorageService.getHistory();
      const newHistory = [item, ...history].slice(0, 30);
      await AsyncStorage.setItem(KEYS.HISTORY, JSON.stringify(newHistory));
    } catch (e) {
      console.error(e);
    }
  },

  // ── Settings & Theme ──
  getSettings: async () => {
    try {
      const data = await AsyncStorage.getItem(KEYS.SETTINGS);
      return data ? JSON.parse(data) : {};
    } catch (e) {
      return {};
    }
  },

  setSettings: async (settings) => {
    try {
      await AsyncStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.error(e);
    }
  },

  getTheme: async () => {
    try {
      return await AsyncStorage.getItem(KEYS.THEME);
    } catch (e) {
      return null;
    }
  },

  setTheme: async (themeId) => {
    try {
      if (themeId) {
        await AsyncStorage.setItem(KEYS.THEME, themeId);
      } else {
        await AsyncStorage.removeItem(KEYS.THEME);
      }
    } catch (e) {
      console.error(e);
    }
  },

  // ── Migration: old deviceId → userId ──
  getDeviceId: async () => {
    return StorageService.getUserId();
  },
};
