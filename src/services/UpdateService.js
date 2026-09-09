import { Linking, Alert } from 'react-native';
import appJson from '../../app.json';

export const UpdateService = {
  checkForUpdates: async () => {
    try {
      const response = await fetch('https://api.github.com/repos/local-over/LovelyToon/releases/latest');
      if (!response.ok) return null;
      
      const data = await response.json();
      const latestVersion = data.tag_name?.replace('v', '');
      const currentVersion = appJson.expo.version;

      const compareVersions = (v1, v2) => {
        const parts1 = v1.split('.').map(Number);
        const parts2 = v2.split('.').map(Number);
        for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
          const p1 = parts1[i] || 0;
          const p2 = parts2[i] || 0;
          if (p1 > p2) return 1;
          if (p1 < p2) return -1;
        }
        return 0;
      };

      if (latestVersion && compareVersions(latestVersion, currentVersion) > 0) {
        return {
          hasUpdate: true,
          version: latestVersion,
          url: data.html_url,
          assets: data.assets,
        };
      }
      return { hasUpdate: false };
    } catch (error) {
      console.error('Error checking for updates', error);
      return { hasUpdate: false };
    }
  },

  showUpdateAlert: (updateInfo) => {
    if (!updateInfo || !updateInfo.hasUpdate) return;
    
    Alert.alert(
      "A new version is ready! 💕",
      `Version ${updateInfo.version} is available. Do you want to download it?`,
      [
        { text: "Later", style: "cancel" },
        { 
          text: "Update", 
          onPress: () => {
            const apkAsset = updateInfo.assets?.find(a => a.name.endsWith('.apk'));
            if (apkAsset && apkAsset.browser_download_url) {
              Linking.openURL(apkAsset.browser_download_url);
            } else if (updateInfo.url) {
              Linking.openURL(updateInfo.url);
            }
          }
        }
      ]
    );
  }
};
