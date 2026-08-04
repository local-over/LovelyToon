import { registerRootComponent } from 'expo';
import { AppRegistry } from 'react-native';
import App from './App';
import { handleNotification } from './src/services/NotificationService';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);

// Headless task for react-native-android-notification-listener
AppRegistry.registerHeadlessTask('RNAndroidNotificationListenerHeadlessJs', () => async ({ notification }) => {
  if (notification) {
    try {
      const parsed = typeof notification === 'string' ? JSON.parse(notification) : notification;
      await handleNotification(parsed);
    } catch (e) {
      console.error('Error parsing notification', e);
    }
  }
});

import { registerWidgetTaskHandler } from 'react-native-android-widget';
import { widgetTaskHandler } from './src/widget/WidgetTaskHandler';

registerWidgetTaskHandler(widgetTaskHandler);
