import { Platform } from 'react-native';
import Constants from 'expo-constants';

const isExpoGo = Constants.appOwnership === 'expo';

let InterstitialAd, AdEventType, TestIds, MobileAds;

if (Platform.OS !== 'web' && !isExpoGo) {
  try {
    const ads = require('react-native-google-mobile-ads');
    InterstitialAd = ads.InterstitialAd;
    AdEventType = ads.AdEventType;
    TestIds = ads.TestIds;
    MobileAds = ads.default;
    MobileAds().setRequestConfiguration({
      testDeviceIdentifiers: ['EMULATOR'],
    }).catch(() => {});
    MobileAds().initialize().catch(e => console.log('[AdService] init error:', e));
  } catch (e) {
    console.log('[AdService] require error:', e);
  }
}

// 실사용 APP ID: ca-app-pub-4086309578344734~4106328206 (AndroidManifest에 적용됨)
// 실사용 광고 단위 ID (출시 시 교체):
// android: 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX'
// ios: 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX'
const AD_UNIT_ID = Platform.OS !== 'web' && TestIds ? Platform.select({
  android: TestIds.INTERSTITIAL,
  ios: TestIds.INTERSTITIAL,
}) : null;

let interstitialAd = null;
let isAdLoaded = false;
let isAdLoading = false;

export const loadRewardedAd = () => {
  if (Platform.OS === 'web' || isExpoGo || !InterstitialAd) {
    return Promise.resolve({ success: true, skipped: true });
  }
  return new Promise((resolve) => {
    if (isAdLoaded || isAdLoading) {
      resolve({ success: isAdLoaded, skipped: false });
      return;
    }
    isAdLoading = true;
    interstitialAd = InterstitialAd.createForAdRequest(AD_UNIT_ID, {
      requestNonPersonalizedAdsOnly: true,
    });
    const unsubLoaded = interstitialAd.addAdEventListener(AdEventType.LOADED, () => {
      isAdLoaded = true;
      isAdLoading = false;
      unsubLoaded();
      resolve({ success: true, skipped: false });
    });
    interstitialAd.addAdEventListener(AdEventType.ERROR, (e) => {
      console.log('[AdService] ad ERROR:', e);
      isAdLoaded = false;
      isAdLoading = false;
      resolve({ success: false, skipped: true });
    });
    interstitialAd.load();
  });
};

export const showRewardedAd = () => {
  return new Promise((resolve) => {
    if (Platform.OS === 'web' || isExpoGo || !InterstitialAd || !isAdLoaded) {
      resolve({ success: true, skipped: true });
      return;
    }
    const unsubClosed = interstitialAd.addAdEventListener(AdEventType.CLOSED, () => {
      isAdLoaded = false;
      unsubClosed();
      resolve({ success: true, skipped: false });
    });
    try {
      interstitialAd.show();
    } catch (e) {
      console.log('[AdService] show() error:', e);
      resolve({ success: true, skipped: true });
    }
  });
};

export const showRewardedAdOrSkip = async () => {
  if (Platform.OS === 'web' || isExpoGo || !InterstitialAd) {
    return { success: true, skipped: true };
  }
  return await showRewardedAd();
};
