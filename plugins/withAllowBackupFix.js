const { withAndroidManifest } = require('expo/config-plugins');

module.exports = function withAllowBackupFix(config) {
  return withAndroidManifest(config, (config) => {
    const mainApplication = config.modResults.manifest.application[0];
    mainApplication.$['tools:replace'] = 'android:allowBackup';
    return config;
  });
};
