import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  PAIRING_CODE: '@pairing_code',
  USER_ID: '@user_id',
  NICKNAME: '@nickname',
  PARTNER_ID: '@partner_id',
  PARTNER_NAME: '@partner_name',
  HISTORY: '@history',
  SETTINGS: '@settings',
};

export const StorageService = {
  // ── User Identity ──
  getUserId: async () => {
    try {
      let id = await AsyncStorage.getItem(KEYS.USER_ID);
      if (!id) {
        // Generate a permanent 8-char alphanumeric ID
        id = Math.random().toString(36).substr(2, 4) + Math.random().toString(36).substr(2, 4);
        await AsyncStorage.setItem(KEYS.USER_ID, id);
      }
      return id;
    } catch (e) {
      return 'fallback_' + Date.now();
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

  // ── Room ──
  getPairingCode: async () => {
    try {
      return await AsyncStorage.getItem(KEYS.PAIRING_CODE);
    } catch (e) {
      return null;
    }
  },

  setPairingCode: async (code) => {
    try {
      if (code) {
        await AsyncStorage.setItem(KEYS.PAIRING_CODE, code);
      } else {
        await AsyncStorage.removeItem(KEYS.PAIRING_CODE);
      }
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
      await AsyncStorage.multiRemove([KEYS.PAIRING_CODE, KEYS.PARTNER_ID, KEYS.PARTNER_NAME]);
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

  // ── Settings ──
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

  // ── Migration: old deviceId → userId ──
  getDeviceId: async () => {
    return StorageService.getUserId();
  },
};
