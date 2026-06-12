import { Audio } from 'expo-av';

let sound = null;
let loading = false;
let bgmEnabled = false;

async function _load() {
  if (sound || loading) return;
  loading = true;
  try {
    if (Audio.setAudioModeAsync) {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });
    }
    const { sound: s } = await Audio.Sound.createAsync(
      require('../assets/sound/bgm1.mp3'),
      { isLooping: true, volume: 0.7, shouldPlay: false }
    );
    sound = s;
  } catch (e) {
    console.log('[BGM] 로드 실패:', e);
  } finally {
    loading = false;
  }
}

export async function preloadBGM() {
  await _load();
}

export function setBGMEnabled(enabled) {
  bgmEnabled = enabled;
  if (enabled) {
    resumeBGM();
  } else {
    pauseBGM();
  }
}

// ── 공개 API ────────────────────────────────────────────────
export async function startBGM() {
  await _load();
  if (!sound) return;
  try {
    const status = await sound.getStatusAsync();
    if (status.isLoaded && !status.isPlaying && bgmEnabled) {
      await sound.playAsync();
      if (pendingRate) {
        console.log('[BGM] Applying pending rate:', pendingRate);
        currentRate = pendingRate;
        pendingRate = null;
        await sound.setRateAsync(currentRate, true);
      }
    }
  } catch (e) {
    console.log('[BGM] 재생 실패:', e);
  }
}

export async function stopBGM() {
  try {
    if (!sound) return;
    await sound.stopAsync();
    await sound.unloadAsync();
    sound = null;
  } catch (e) {}
}

export async function pauseBGM() {
  try {
    if (!sound) return;
    const status = await sound.getStatusAsync();
    if (status.isLoaded && status.isPlaying) await sound.pauseAsync();
  } catch (e) {}
}

export async function resumeBGM() {
  try {
    if (!sound) return;
    const status = await sound.getStatusAsync();
    if (status.isLoaded && !status.isPlaying) await sound.playAsync();
  } catch (e) {}
}

// 남은 시간 구간별 rate
// 10초 이상: 1.0x / 5~9초: 1.5x / 5초 미만: 2.0x
let currentRate = 0;
let pendingRate = null;
export async function setBGMRateByTime(timeLeft) {
  try {
    const rate = timeLeft > 9 ? 1.0 : timeLeft > 5 ? 1.5 : 2.0;
    if (!sound) {
      pendingRate = rate;
      return;
    }
    if (rate !== currentRate) {
      currentRate = rate;
      pendingRate = null;
      await sound.setRateAsync(rate, true);
    }
  } catch (e) {}
}
