import { Platform } from 'react-native';
import Constants from 'expo-constants';

const isExpoGo = Constants.appOwnership === 'expo';

let RewardedAd, RewardedAdEventType, AdEventType, TestIds, MobileAds;

if (Platform.OS !== 'web' && !isExpoGo) {
  try {
    const ads = require('react-native-google-mobile-ads');
    RewardedAd = ads.RewardedAd;
    RewardedAdEventType = ads.RewardedAdEventType;
    AdEventType = ads.AdEventType;
    TestIds = ads.TestIds;
    MobileAds = ads.default;
    console.log('[AdService] package loaded, TestIds:', JSON.stringify(TestIds));
    MobileAds().setRequestConfiguration({
      testDeviceIdentifiers: ['EMULATOR'],
    }).catch(() => {});
    MobileAds().initialize()
      .then(() => console.log('[AdService] MobileAds initialized'))
      .catch(e => console.log('[AdService] MobileAds init error:', e));
  } catch (e) {
    console.log('[AdService] require error:', e);
  }
} else {
  console.log('[AdService] skipped - web or ExpoGo, OS:', Platform.OS, 'isExpoGo:', isExpoGo);
}

const REWARDED_AD_UNIT_ID = Platform.OS !== 'web' && TestIds ? Platform.select({
  android: TestIds.REWARDED,
  ios: TestIds.REWARDED,
}) : null;

let rewardedAd = null;
let isAdLoaded = false;
let isAdLoading = false;

export const loadRewardedAd = () => {
  console.log('[AdService] loadRewardedAd called, RewardedAd:', !!RewardedAd, 'isExpoGo:', isExpoGo, 'OS:', Platform.OS);
  if (Platform.OS === 'web' || isExpoGo || !RewardedAd) {
    return Promise.resolve({ success: true, skipped: true });
  }
  return new Promise((resolve) => {
    if (isAdLoaded || isAdLoading) {
      console.log('[AdService] already loaded/loading:', isAdLoaded, isAdLoading);
      resolve({ success: isAdLoaded, skipped: false });
      return;
    }
    isAdLoading = true;
    console.log('[AdService] creating ad request, unitId:', REWARDED_AD_UNIT_ID);
    rewardedAd = RewardedAd.createForAdRequest(REWARDED_AD_UNIT_ID, {
      requestNonPersonalizedAdsOnly: true,
    });
    const unsubLoaded = rewardedAd.addAdEventListener(RewardedAdEventType.LOADED, () => {
      console.log('[AdService] ad LOADED');
      isAdLoaded = true;
      isAdLoading = false;
      unsubLoaded();
      resolve({ success: true, skipped: false });
    });
    rewardedAd.addAdEventListener(AdEventType.ERROR, (e) => {
      console.log('[AdService] ad ERROR:', e);
      isAdLoaded = false;
      isAdLoading = false;
      resolve({ success: false, skipped: true });
    });
    rewardedAd.load();
  });
};

export const showRewardedAd = () => {
  return new Promise((resolve) => {
    if (Platform.OS === 'web' || isExpoGo || !RewardedAd || !isAdLoaded) {
      resolve({ success: true, skipped: true });
      return;
    }
    const unsubEarned = rewardedAd.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
      unsubEarned();
    });
    const unsubClosed = rewardedAd.addAdEventListener(AdEventType.CLOSED, () => {
      console.log('[AdService] ad CLOSED');
      isAdLoaded = false;
      unsubEarned();
      unsubClosed();
      resolve({ success: true, skipped: false });
    });
    console.log('[AdService] ad show()');
    try {
      rewardedAd.show();
    } catch (e) {
      console.log('[AdService] show() error:', e);
      resolve({ success: true, skipped: true });
    }
  });
};

export const showRewardedAdOrSkip = async () => {
  if (Platform.OS === 'web' || isExpoGo || !RewardedAd) {
    return { success: true, skipped: true };
  }
  return await showRewardedAd();
};
