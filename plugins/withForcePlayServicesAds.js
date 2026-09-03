const { withProjectBuildGradle } = require('expo/config-plugins');

/**
 * react-native-google-mobile-ads 16.1+ 의 play-services-ads 25.x는
 * Kotlin metadata 2.3을 요구해 Expo/RN 기본 Kotlin 2.1과 충돌한다.
 * 패키지 16.0.1(기본 24.6.0)과 맞춰 강제한다.
 */
function withForcePlayServicesAds(config) {
  return withProjectBuildGradle(config, (cfg) => {
    if (cfg.modResults.language !== 'groovy') return cfg;
    const marker = 'forcePlayServicesAds24';
    if (cfg.modResults.contents.includes(marker)) return cfg;

    cfg.modResults.contents += `
// ${marker} — AdMob Kotlin 2.1 호환 (패키지 16.0.1)
allprojects {
  configurations.configureEach {
    resolutionStrategy {
      force 'com.google.android.gms:play-services-ads:24.6.0'
      force 'com.google.android.gms:play-services-ads-api:24.6.0'
    }
  }
}
`;
    return cfg;
  });
}

module.exports = withForcePlayServicesAds;
