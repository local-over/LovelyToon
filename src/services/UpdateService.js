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

      if (latestVersion && latestVersion !== currentVersion) {
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
      return null;
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
