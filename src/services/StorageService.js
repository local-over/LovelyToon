import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  PAIRING_CODE: '@pairing_code',
  HISTORY: '@history',
  SETTINGS: '@settings',
};

export const StorageService = {
  getPairingCode: async () => {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.PAIRING_CODE);
    } catch (e) {
      console.error('Error getting pairing code', e);
      return null;
    }
  },
  setPairingCode: async (code) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.PAIRING_CODE, code);
    } catch (e) {
      console.error('Error saving pairing code', e);
    }
  },
  getNickname: async () => {
    try {
      return await AsyncStorage.getItem('@nickname');
    } catch (e) {
      return null;
    }
  },
  setNickname: async (name) => {
    try {
      await AsyncStorage.setItem('@nickname', name);
    } catch (e) {
      console.error(e);
    }
  },
  getHistory: async () => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.HISTORY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Error getting history', e);
      return [];
    }
  },
  addHistoryItem: async (item) => {
    try {
      const history = await StorageService.getHistory();
      // Keep last 50 items
      const newHistory = [item, ...history].slice(0, 50);
      await AsyncStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(newHistory));
    } catch (e) {
      console.error('Error saving history', e);
    }
  },
  getSettings: async () => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
      return data ? JSON.parse(data) : {};
    } catch (e) {
      console.error('Error getting settings', e);
      return {};
    }
  },
  setSettings: async (settings) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.error('Error saving settings', e);
    }
  },
  getDeviceId: async () => {
    try {
      let deviceId = await AsyncStorage.getItem('@device_id');
      if (!deviceId) {
        deviceId = 'device_' + Math.random().toString(36).substr(2, 9);
        await AsyncStorage.setItem('@device_id', deviceId);
      }
      return deviceId;
    } catch (e) {
      return 'fallback_device_id';
    }
  }
};
