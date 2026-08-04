import { registerRootComponent } from 'expo';
import { AppRegistry } from 'react-native';
import App from './App';

const headlessNotificationListener = async ({ notification }) => {
  if (notification) {
    const parsedNotification = JSON.parse(notification);
    console.log('Received notification from:', parsedNotification.app);
    // If it's a media app (Spotify, etc), we should parse it.
    // For now, let's just log it. Real implementation would sync with Firebase here.
  }
};

AppRegistry.registerHeadlessTask(
  'RNAndroidNotificationListenerHeadlessJs',
  () => headlessNotificationListener
);

registerRootComponent(App);
