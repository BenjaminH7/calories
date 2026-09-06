/** @type {import('@bacons/apple-targets/app.plugin').ConfigFunction} */
module.exports = (config) => ({
  type: 'widget',
  name: 'KcalWidget',
  displayName: 'Kcal',
  // Même App Group que l'app principale : c'est par là que transitent les
  // calories restantes et les protéines du jour.
  entitlements: {
    'com.apple.security.application-groups':
      config.ios.entitlements['com.apple.security.application-groups'],
  },
  colors: {
    $widgetBackground: { light: '#FFFFFF', dark: '#161618' },
    $accent: { light: '#111111', dark: '#FFFFFF' },
  },
});
