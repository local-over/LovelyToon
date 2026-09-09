const { withAndroidManifest } = require('expo/config-plugins');

module.exports = function withAllowBackupFix(config) {
  return withAndroidManifest(config, (config) => {
    if (!config.modResults.manifest.$['xmlns:tools']) {
      config.modResults.manifest.$['xmlns:tools'] = 'http://schemas.android.com/tools';
    }
    const mainApplication = config.modResults.manifest.application[0];
    mainApplication.$['tools:replace'] = 'android:allowBackup';
    return config;
  });
};
