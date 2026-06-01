import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  Platform,
  Image,
  TextInput,
  Modal,
  Animated as RNAnimated,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { useFonts, Fredoka_700Bold } from '@expo-google-fonts/fredoka';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedReaction,
  withTiming,
  withSpring,
  withSequence,
  withDelay,
  runOnJS,
  cancelAnimation,
  runOnUI,
} from 'react-native-reanimated';

import FruitBlock from '../assets/icons/FruitBlock';


const FRUIT_IMAGES = {
  apple: require('../assets/img/apple.png'),
  orange: require('../assets/img/orange.png'),
  grape: require('../assets/img/grape.png'),
  pear: require('../assets/img/pear.png'),
  watermelon: require('../assets/img/watermelon.png'),
  strawberry: require('../assets/img/strawberry.png'),
  peach: require('../assets/img/peach.png'),
  pineapple: require('../assets/img/pineapple.png'),
};
import { saveRanking } from '../services/rankingService';
import { showRewardedAdOrSkip, loadRewardedAd } from '../services/adService';
import { startBGM, stopBGM, pauseBGM, resumeBGM, setBGMRateByTime } from '../services/musicService';
import { playStartSFX, playTradeSFX } from '../services/sfxService';

const workerImg = require('../assets/img/S1.png');
const workerImgDelivery = require('../assets/img/S2.png');
const customerImgs = {
  c1: require('../assets/img/C1.png'),
  c2: require('../assets/img/C2.png'),
  c3: require('../assets/img/C3.png'),
  c4: require('../assets/img/C4.png'),
  c5: require('../assets/img/C5.png'),
};

const getCustomerImg = (request, seed) => {
  if (request >= 21) return { img: customerImgs.c5 };
  if (request >= 16) return { img: customerImgs.c3, isC3: true };
  if (request >= 10) return { img: customerImgs.c1 };
  return { img: seed % 2 === 0 ? customerImgs.c2 : customerImgs.c4 };
};

const { width, height } = Dimensions.get('window');
const nativeDriver = Platform.OS !== 'web';
const aspectRatio = height / width;
const isTall = aspectRatio > 1.9; // 20:9 vs 16:9

// ─── Layout Config ──────────────────────────────────────────
// All aspect-ratio-dependent sizes in one place.
// isTall = 20:9 (most modern phones), !isTall = 16:9 (tablets, older phones, web)
const LAYOUT = {
  // Header (back / pause / help buttons row)
  headerMarginTopPct: isTall ? 0.15 : 0.12,       // % of screen height

  // Background images
  bgTopHeightPct: '50%',                           // BG_TOP covers top half

  // Background numbers (level & score on BG_TOP image)
  bgNumberTopPct: '19.5%',
  bgLevelLeftPct: '34%',
  bgScoreLeftPct: '48%',
  bgNumberFontSize: width * 0.05,
  bgLevelWidth: width * 0.10,
  bgScoreWidth: width * 0.12,

  // Characters row (worker & customer)
  charactersTop : isTall ? "33%" : "27%",
  charactersHeight: isTall ? 160 : 160,
  // charactersMarginTop: isTall ? 0 : 0,
  charactersMarginBottom: -10, // 캐릭터랑 타이머바 거리
  workerHeight: isTall ? 200 : 160,
  customerHeight: isTall ? 200 : 160,
  customerHeightSmall: isTall ? 130 : 110,

  // 타이머,보드 양쪽 여백
  GRID_PADDING_HORIZONTAL : isTall ? 6 : 9, // percentage (%)

  // Timer bar
  timerTop: "10%",
  timerPaddingH: isTall ? 6 : 7,                   // %

  // Bubble (top is relative to characterEmojiWrapper height=130)
  bubbleTop: isTall ? -120 : -90,
  bubbleWidth: 140,
  bubbleHeight: 100,
  bubbleLargeWidth: 180,
  bubbleLargeHeight: 120,

  // Board
  boardTop: isTall ? '40%' : '38%',
};
const DEFAULT_GRID_SIZE = 6;
const FRUITS = ['apple', 'orange', 'grape', 'pear', 'watermelon', 'strawberry', 'peach', 'pineapple'];

const generateC5Condition = (board) => {
  const type = Math.random() < 0.5 ? 'include' : 'exclude';
  if (type === 'include' && board) {
    const presentFruits = [...new Set(
      board.flat().filter(cell => !cell.removed).map(cell => cell.fruit)
    )];
    const fruit = presentFruits.length > 0
      ? presentFruits[Math.floor(Math.random() * presentFruits.length)]
      : FRUITS[Math.floor(Math.random() * FRUITS.length)];
    return { fruit, type };
  }
  const fruit = FRUITS[Math.floor(Math.random() * FRUITS.length)];
  return { fruit, type };
};

const getNextNumber = (currentTargetSum) => {
  const roll = Math.random();

  // 너무 낮은 숫자만 생성되는거 방지
  if (currentTargetSum <= 10) {
    currentTargetSum = 10;
  }

  if (roll < 0.1) {
    // 10% 확률로 손님이 부른 숫자의 절반 값을 생성 (가장 강력한 재료)
    return Math.ceil(currentTargetSum / 2);
  } else if (roll < 0.4) {
    // 30% 확률로 아주 작은 숫자(1~3) 생성 (세밀한 합 조절용)
    return Math.floor(Math.random() * 3) + 1;
  } else {
    // 나머지 60%는 현재 난이도에 맞는 적절한 숫자 생성
    // (예: 현재 목표의 20%~40% 사이)
    const min = Math.max(1, Math.floor(currentTargetSum * 0.2));
    const max = Math.floor(currentTargetSum * 0.4);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
};

const generateBoard = (score = 0, gridSize = DEFAULT_GRID_SIZE, customerRequest = 5) => {
  const fruits = getAvailableFruits(score);
  return Array(gridSize).fill(null).map(() =>
    Array(gridSize).fill(null).map(() => ({ 
      value: getNextNumber(customerRequest),
      fruit: fruits[Math.floor(Math.random() * fruits.length)],
      removed: false,
    }))
  );
};

const CELL_MARGIN = 2;
const START_TIME = 15;
const getMaxTime = () => START_TIME;

// 레벨: 1=봄, 2=여름, 3=가을, 4=겨울, 5=MAX
// 임계값: 봄→여름:150, 여름→가을:400, 가을→겨울:700, 겨울→MAX:1000
const LEVEL_THEMES = [
  { bg: '#FFF8E7', blockFill: '#FFB347', blockStroke: '#FF8C42', name: '봄' },
  { bg: '#E8F5E9', blockFill: '#66BB6A', blockStroke: '#388E3C', name: '여름' },
  { bg: '#F5DEB3', blockFill: '#D2691E', blockStroke: '#8B4513', name: '가을' },
  { bg: '#E3F2FD', blockFill: '#42A5F5', blockStroke: '#1565C0', name: '겨울' },
  { bg: '#E8E0F5', blockFill: '#7C4DFF', blockStroke: '#5C35CC', name: 'MAX' },
];

const LEVEL_THRESHOLDS = [0, 150, 400, 700, 1000];

const getLevel = (score) => {
  let lv = 1;
  for (let i = 1; i < LEVEL_THRESHOLDS.length; i++) {
    if (score >= LEVEL_THRESHOLDS[i]) lv = i + 1;
  }
  return lv;
};

const getTheme = (lv) => LEVEL_THEMES[Math.min(lv - 1, LEVEL_THEMES.length - 1)];

// Lv1:2종, Lv2:4종, Lv3:6종, Lv4+:8종
const FRUITS_BY_LEVEL = [
  ['apple', 'strawberry'],
  ['apple', 'strawberry', 'watermelon', 'peach'],
  ['apple', 'strawberry', 'watermelon', 'peach', 'pear', 'grape'],
  ['apple', 'strawberry', 'watermelon', 'peach', 'pear', 'grape', 'orange', 'pineapple'],
  ['apple', 'strawberry', 'watermelon', 'peach', 'pear', 'grape', 'orange', 'pineapple'],
];

const getAvailableFruits = (score) => FRUITS_BY_LEVEL[Math.min(getLevel(score) - 1, FRUITS_BY_LEVEL.length - 1)];

// Customer request ranges based on score
const getCustomerRequestRange = (score) => {
  if (score <= 150)  return { min: 5, max: 8 };
  if (score <= 300)  return { min: 5, max: 11 };
  if (score <= 500)  return { min: 5, max: 14 };
  if (score <= 750)  return { min: 5, max: 17 };
  if (score <= 999)  return { min: 5, max: 20 };
  const extra = Math.floor((score - 1000) / 100) + 1;
  return { min: 5, max: 20 + extra };
};
   
const generateCustomerRequest = (score) => {
  const { min, max } = getCustomerRequestRange(score);
  const range = max - min + 1;

  const roll = Math.random();

  let adjustedMin, adjustedMax;

  if (roll < 0.15) {
    // 1. [15% 확률] 
    adjustedMin = min;
    adjustedMax = min + Math.floor(range * 0.2);
  } else if (roll < 0.6) {
    // 2. [45% 확률] 
    adjustedMin = min + Math.floor(range * 0.3);
    adjustedMax = max - Math.floor(range * 0.2);
  } else {
    // 3. [40% 확률] 
    adjustedMin = max - Math.floor(range * 0.3);
    adjustedMax = max;
  }

  // 최종 숫자 산출 (최소 min, 최대 max 보장)
  const finalMin = Math.max(min, adjustedMin);
  const finalMax = Math.min(max, adjustedMax);

  return Math.floor(Math.random() * (finalMax - finalMin + 1)) + finalMin;
};

export default function FruitBoxScreen({ onBackToStart, mapSize = DEFAULT_GRID_SIZE }) {
  const insets = useSafeAreaInsets();
  const [fontsLoaded] = useFonts({
    Fredoka_700Bold ,
  });

  const GRID_SIZE = mapSize;
  const appWidth = Platform.OS === 'web' ? Math.min(width, 430) : width;
  const CELL_SIZE = Math.floor((appWidth * (1 - LAYOUT.GRID_PADDING_HORIZONTAL * 2 / 100) - (CELL_MARGIN * 2 * GRID_SIZE)) / GRID_SIZE);
  
  const [board, setBoard] = useState(() => generateBoard(0, GRID_SIZE, generateCustomerRequest(0)));
  const boardRef = useRef(null);
  const [selection, setSelection] = useState(null);
  const dragSelection = useSharedValue(null);
  const [isDragging, setIsDragging] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [customerRequest, setCustomerRequest] = useState(() => generateCustomerRequest(0));
  const [customerImgSeed, setCustomerImgSeed] = useState(() => Math.floor(Math.random() * 20));
  const [c5Condition, setC5Condition] = useState(null);
  const [showDelivery, setShowDelivery] = useState(false);
  const timeLeftRef = useRef(START_TIME);
  const timeLeft = useSharedValue(START_TIME);
  const [showTimeBonus, setShowTimeBonus] = useState(null); // { amount: number }
  const [showScoreBonus, setShowScoreBonus] = useState(null); // { amount: number }
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [paused, setPaused] = useState(false);
  const [showGameOverModal, setShowGameOverModal] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false); // Will check AsyncStorage
  const [tutorialStep, setTutorialStep] = useState(0);
  const [playerName, setPlayerName] = useState('');
  const prevLevelRef = useRef(1);
  const [chance, setChance] = useState(1);
  const hintCells = useSharedValue(null);
  const chanceUsedRef = useRef(false);
  const gameOverFiredRef = useRef(false);
  const combosRef = useRef([]);
  const c5ConditionRef = useRef(c5Condition);
  c5ConditionRef.current = c5Condition;
  const scoreRef = useRef(score);
  scoreRef.current = score;
  const customerRequestRef = useRef(customerRequest);
  customerRequestRef.current = customerRequest;
  const dragStartPos = useRef({ x: 0, y: 0 });
  const selectionRef = useRef(null);
  const deliveryTimeoutRef = useRef(null);
  const timerRef = useRef(null);
  const timeBonusTimeoutRef = useRef(null);
  const lastTickTime = useRef(Date.now());
  
  const cellAnims = useRef(
    Array(GRID_SIZE).fill(null).map(() =>
      Array(GRID_SIZE).fill(null).map(() => ({
        opacity: new RNAnimated.Value(1),
        scale: new RNAnimated.Value(1),
        translateYAnim: new RNAnimated.Value(0),
      }))
    )
  ).current;
  
  const scoreScale = useSharedValue(1);
  const deliveryScale = useSharedValue(0);
  const deliveryY = useSharedValue(0);
  const hintShake = useSharedValue(0);
  const cellShakeAnims = useMemo(() =>
    Array.from({ length: GRID_SIZE }, () =>
      Array.from({ length: GRID_SIZE }, () => new RNAnimated.Value(0))
    )
  , [GRID_SIZE]);
  const timerBarFlash = useSharedValue(0);
  const levelUpScale = useSharedValue(0);
  const levelUpOpacity = useSharedValue(0);
  const customerSlideX = useSharedValue(200);
  const customerSlideOpacity = useSharedValue(0);
  const customerSlideStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: customerSlideX.value }],
    opacity: customerSlideOpacity.value,
  }));
  const levelUpAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: levelUpScale.value }],
    opacity: levelUpOpacity.value,
  }));
  
  // BGM 관리 - StartScreen의 START 버튼 클릭 시 이미 startBGM 호출됨
  useEffect(() => {
    playStartSFX();
    startBGM();
    loadRewardedAd();
    return () => { stopBGM(); };
  }, []);

  useEffect(() => {
    // BGM 비활성화
    /*
    if (paused) {
      pauseBGM();
    } else {
      resumeBGM();
    }
    */
  }, [gameOver, paused]);

  useEffect(() => {
    if (paused || gameOver) {
      pauseBGM();
    }
  }, [paused, gameOver]);

  // Check if first run
  useEffect(() => {
    AsyncStorage.getItem('tutorialSeen').then(seen => {
      if (seen !== 'true') {
        setShowTutorial(true);
        setPaused(true);
      }
    });
  }, []);

  // Timer
  useEffect(() => {
    // 기존 타이머 정리
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    
    if (gameOver || paused) {
      return;
    }
    
    const tick = () => {
      const now = Date.now();
      const elapsed = (now - lastTickTime.current) / 1000;
      const newVal = Math.max(0, timeLeftRef.current - elapsed);
      timeLeftRef.current = newVal;
      timeLeft.value = newVal;
      if (newVal <= 0.05) {
        if (gameOverFiredRef.current) return;
        gameOverFiredRef.current = true;
        timeLeftRef.current = 0;
        timeLeft.value = 0;
        setGameOver(true);
        showRewardedAdOrSkip().then(() => {
          setShowGameOverModal(true);
          loadRewardedAd();
        });
        return;
      }
      if (possibleCombinationsRef.current !== 0) {
        if (newVal <= 5.1 && !chanceUsedRef.current) {
          chanceUsedRef.current = true;
          setChance(c => (c > 0 ? 0 : c));
          setHintTrigger(t => t + 1);
        }
      }
      lastTickTime.current = Date.now();
      timerRef.current = setTimeout(tick, 200);
    };
    lastTickTime.current = Date.now();
    timerRef.current = setTimeout(tick, 200);
    
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [gameOver, paused]);
  
  const addTime = useCallback((bonusSeconds) => {
    const maxTime = getMaxTime();
    const currentTime = timeLeftRef.current;
    const overflowScore = (currentTime + bonusSeconds) > maxTime ? Math.floor((currentTime + bonusSeconds - maxTime) * 5) : 0;
    const actualBonus = Math.round(Math.min(bonusSeconds, maxTime - currentTime));
    const newTime = Math.min(maxTime, currentTime + bonusSeconds);
    timeLeftRef.current = newTime;
    timeLeft.value = newTime;
    lastTickTime.current = Date.now();
    
    // Show time bonus text (actual amount added)
    setShowTimeBonus({ amount: actualBonus });
    timerBarFlash.value = withTiming(1, { duration: 100 });
    
    clearTimeout(timeBonusTimeoutRef.current);
    timeBonusTimeoutRef.current = setTimeout(() => {
      setShowTimeBonus(null);
      timerBarFlash.value = withTiming(0, { duration: 300 });
    }, 1000);
    
    return overflowScore;
  }, []);

  const handleSaveScore = async () => {
    if (playerName.trim() === '') return;
    const result = await saveRanking(playerName, score, getLevel(score), GRID_SIZE);
    if (result.success) {
      setShowGameOverModal(false);
      setPlayerName('');
    }
  };
  
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const preventContextMenu = (e) => {
      e.preventDefault();
      return false;
    };
    document.addEventListener('contextmenu', preventContextMenu, true);

    // Listen for scroll events from window
    const handleScroll = () => {
      console.log('FruitBoxScreen: scroll event received');
    };
    window.addEventListener('scroll', handleScroll);

    return () => {
      document.removeEventListener('contextmenu', preventContextMenu, true);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const calculateSum = (sel, b) => {
    if (!sel) return { sum: 0, minRow: 0, maxRow: 0, minCol: 0, maxCol: 0 };
    const currentBoard = b || boardRef.current || board;
    const minRow = Math.min(sel.startRow, sel.endRow);
    const maxRow = Math.max(sel.startRow, sel.endRow);
    const minCol = Math.min(sel.startCol, sel.endCol);
    const maxCol = Math.max(sel.startCol, sel.endCol);
    let sum = 0;
    for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        if (currentBoard[r] && currentBoard[r][c] && !currentBoard[r][c].removed) {
          sum += currentBoard[r][c].value;
        }
      }
    }
    return { sum, minRow, maxRow, minCol, maxCol };
  };
  
  const [assistMode, setAssistMode] = useState(false);
  const assistTapCount = useRef(0);
  const assistTapTimer = useRef(null);

  const handlePossibleTap = useCallback(() => {
    assistTapCount.current += 1;
    clearTimeout(assistTapTimer.current);
    if (assistTapCount.current >= 3) {
      assistTapCount.current = 0;
      setAssistMode(prev => !prev);
    } else {
      assistTapTimer.current = setTimeout(() => {
        assistTapCount.current = 0;
      }, 600);
    }
  }, []);

  const [hintTrigger, setHintTrigger] = useState(0);

  const doHintShake = useCallback(() => {
    if (!combosRef.current || combosRef.current.length === 0) return;
    const combo = combosRef.current[0];
    const anims = [];
    for (let r = combo.r1; r <= combo.r2; r++) {
      for (let c = combo.c1; c <= combo.c2; c++) {
        if (cellShakeAnims[r] && cellShakeAnims[r][c]) {
          anims.push(cellShakeAnims[r][c]);
        }
      }
    }
    const shakeSeq = (anim) => RNAnimated.sequence([
      RNAnimated.timing(anim, { toValue: 6, duration: 60, useNativeDriver: nativeDriver }),
      RNAnimated.timing(anim, { toValue: -6, duration: 60, useNativeDriver: nativeDriver }),
      RNAnimated.timing(anim, { toValue: 6, duration: 60, useNativeDriver: nativeDriver }),
      RNAnimated.timing(anim, { toValue: -6, duration: 60, useNativeDriver: nativeDriver }),
      RNAnimated.timing(anim, { toValue: 0, duration: 60, useNativeDriver: nativeDriver }),
      RNAnimated.delay(800),
      RNAnimated.timing(anim, { toValue: 6, duration: 60, useNativeDriver: nativeDriver }),
      RNAnimated.timing(anim, { toValue: -6, duration: 60, useNativeDriver: nativeDriver }),
      RNAnimated.timing(anim, { toValue: 6, duration: 60, useNativeDriver: nativeDriver }),
      RNAnimated.timing(anim, { toValue: -6, duration: 60, useNativeDriver: nativeDriver }),
      RNAnimated.timing(anim, { toValue: 0, duration: 60, useNativeDriver: nativeDriver }),
    ]);
    anims.forEach(anim => { anim.setValue(0); shakeSeq(anim).start(); });
  }, [cellShakeAnims]);

  // Hint effect: hintTrigger 변경 시 shake 실행
  useEffect(() => {
    if (hintTrigger === 0) return;
    if (combosRef.current && combosRef.current.length > 0) {
      doHintShake();
    } else {
      // combos 계산 완료 대기 후 재시도
      const t = setTimeout(() => doHintShake(), 300);
      return () => clearTimeout(t);
    }
  }, [hintTrigger]);

  const [combos, setCombos] = useState(null);
  const possibleCombinationsRef = useRef(0);

  useEffect(() => {
    setCombos(null);
    const timer = setTimeout(() => {
      const result = [];
      for (let r1 = 0; r1 < GRID_SIZE; r1++) {
        for (let c1 = 0; c1 < GRID_SIZE; c1++) {
          for (let r2 = r1; r2 < GRID_SIZE; r2++) {
            for (let c2 = c1; c2 < GRID_SIZE; c2++) {
              let sum = 0;
              let hasFruit = false;
              let fruitCheckNeeded = !!c5Condition;
              for (let r = r1; r <= r2; r++) {
                for (let c = c1; c <= c2; c++) {
                  if (!board[r][c].removed) {
                    sum += board[r][c].value;
                    if (fruitCheckNeeded && !hasFruit && board[r][c].fruit === c5Condition.fruit) {
                      hasFruit = true;
                    }
                  }
                }
              }
              const cellCount = (r2 - r1 + 1) * (c2 - c1 + 1);
              if (sum === customerRequest && cellCount >= 2) {
                if (c5Condition) {
                  const fruitOk = c5Condition.type === 'include' ? hasFruit : !hasFruit;
                  if (!fruitOk) continue;
                }
                result.push({ r1, c1, r2, c2 });
              }
            }
          }
        }
      }
      setCombos(result);
      combosRef.current = result;
      possibleCombinationsRef.current = result.length;
    }, 0);
    return () => clearTimeout(timer);
  }, [board, c5Condition, customerRequest, GRID_SIZE]);

  const possibleCombinations = combos === null ? -1 : combos.length;

  // Pause when no combinations
  useEffect(() => {
    if (possibleCombinations === 0 && !gameOver) {
      setPaused(true);
    }
  }, [possibleCombinations, gameOver]);

  const assistCombos = useMemo(() => {
    if (!combos) return [];
    const picked = [];
    const usedCells = new Set();
    for (const combo of combos) {
      let overlaps = false;
      for (let r = combo.r1; r <= combo.r2; r++) {
        for (let c = combo.c1; c <= combo.c2; c++) {
          if (usedCells.has(`${r},${c}`)) { overlaps = true; break; }
        }
        if (overlaps) break;
      }
      if (!overlaps) {
        picked.push(combo);
        for (let r = combo.r1; r <= combo.r2; r++)
          for (let c = combo.c1; c <= combo.c2; c++)
            usedCells.add(`${r},${c}`);
      }
      if (picked.length >= 5) break;
    }
    return picked;
  }, [combos]);
  
  const resetBoard = useCallback(() => {
    const newBoard = generateBoard(score, GRID_SIZE, customerRequest);
    setBoard(newBoard);
    timeLeftRef.current = START_TIME;
    timeLeft.value = START_TIME;
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        cellAnims[r][c].opacity.setValue(1);
        cellAnims[r][c].scale.setValue(1);
        cellAnims[r][c].translateYAnim.setValue(0);
      }
    }
  }, [score, customerRequest, GRID_SIZE]);
  
  // Delivery animation
  const playDeliveryAnimation = useCallback(() => {
    setShowDelivery(true);
    deliveryScale.value = withSpring(1, { damping: 12 });
    deliveryY.value = withTiming(-50, { duration: 500 });
    
    deliveryTimeoutRef.current = setTimeout(() => {
      deliveryScale.value = withTiming(0, { duration: 200 });
      deliveryY.value = withTiming(0, { duration: 200 });
      setTimeout(() => setShowDelivery(false), 200);
    }, 800);
  }, []);

  const removeApples = useCallback((minRow, maxRow, minCol, maxCol) => {
    const count = (maxRow - minRow + 1) * (maxCol - minCol + 1);
    const points = count * 5;
    const timeBonus = count >= 4 ? 7 : count >= 3 ? 6 : 5;
    
    // Play delivery animation first
    playDeliveryAnimation();
    playTradeSFX();
    const scoreBonus = addTime(timeBonus);
    const newScore = scoreRef.current + points + scoreBonus;
    
    for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        const anims = cellAnims[r][c];
        RNAnimated.timing(anims.opacity, { toValue: 0, duration: 150, useNativeDriver: nativeDriver }).start();
        RNAnimated.timing(anims.scale, { toValue: 0.8, duration: 150, useNativeDriver: nativeDriver }).start();
      }
    }
    
    setTimeout(() => {
      // 상태 업데이트 일괄 처리
      setScore(newScore);
      setShowScoreBonus({ amount: points + scoreBonus });
      const newCustomerRequest = generateCustomerRequest(newScore);
      setCustomerRequest(newCustomerRequest);
      setCustomerImgSeed(Math.floor(Math.random() * 20));
      setC5Condition(newCustomerRequest >= 21 ? generateC5Condition(null) : null);
      const newLevel = getLevel(newScore);
      // 애니메이션
      customerSlideX.value = 200;
      customerSlideOpacity.value = 0;
      customerSlideX.value = withSpring(0, { damping: 25, stiffness: 80 });
      customerSlideOpacity.value = withTiming(1, { duration: 200 });
      scoreScale.value = withSpring(1.15, { damping: 12 });
      // Level up check
      if (newLevel > prevLevelRef.current) {
        prevLevelRef.current = newLevel;
        const { max: lvUpMax } = getCustomerRequestRange(newScore);
        setCustomerRequest(lvUpMax);
        setC5Condition(lvUpMax >= 21 ? generateC5Condition(null) : null);
        setShowLevelUp(true);
        setChance(1);
        chanceUsedRef.current = false;
        levelUpScale.value = 0;
        levelUpOpacity.value = 0;
        levelUpScale.value = withSpring(1, { damping: 8, stiffness: 120 });
        levelUpOpacity.value = withTiming(1, { duration: 200 });
        setTimeout(() => {
          levelUpOpacity.value = withTiming(0, { duration: 300 });
          setTimeout(() => setShowLevelUp(false), 300);
        }, 800);
      }
      
      // Hide score bonus after 1 second
      setTimeout(() => {
        setShowScoreBonus(null);
      }, 1000);
      
      const fallTargets = [];
      setBoard(prev => {
        const newBoard = prev.map(row => row.map(cell => ({ ...cell })));
        
        for (let r = minRow; r <= maxRow; r++) {
          for (let c = minCol; c <= maxCol; c++) {
            newBoard[r][c].removed = true;
          }
        }
        
        // Gravity: move existing fruits down
        const availableFruits = getAvailableFruits(scoreRef.current);
        fallTargets.length = 0;
        for (let c = minCol; c <= maxCol; c++) {
          const columnCells = [];
          for (let r = 0; r < GRID_SIZE; r++) {
            if (!newBoard[r][c].removed) {
              columnCells.push({ cell: { ...newBoard[r][c] }, originalRow: r });
            }
          }
          let writeRow = GRID_SIZE - 1;
          for (let i = columnCells.length - 1; i >= 0; i--) {
            const { cell, originalRow } = columnCells[i];
            newBoard[writeRow][c] = cell;
            if (writeRow !== originalRow) {
              const fallDist = (writeRow - originalRow) * (CELL_SIZE + CELL_MARGIN * 2);
              fallTargets.push({ r: writeRow, c, startY: -fallDist });
            }
            writeRow--;
          }
          for (let r = 0; r <= writeRow; r++) {
            newBoard[r][c] = { 
              value: getNextNumber(customerRequest), 
              fruit: availableFruits[Math.floor(Math.random() * availableFruits.length)],
              removed: false 
            };
            const dropDist = (writeRow + 1) * (CELL_SIZE + CELL_MARGIN * 2);
            fallTargets.push({ r, c, startY: -dropDist });
          }
        }
        
        return newBoard;
      });
      
      setTimeout(() => {
        fallTargets.forEach(({ r, c, startY }) => {
          const anims = cellAnims[r][c];
          anims.opacity.setValue(1);
          anims.scale.setValue(1);
          anims.translateYAnim.setValue(startY);
          RNAnimated.spring(anims.translateYAnim, {
            toValue: 0,
            damping: 18,
            stiffness: 200,
            useNativeDriver: nativeDriver,
          }).start();
        });
      }, 30);
    }, 200);
  }, [GRID_SIZE, CELL_SIZE]);

  const gridPaddingLeft = appWidth * LAYOUT.GRID_PADDING_HORIZONTAL / 100;
  const getCellFromPos = (x, y) => {
    const adjustedX = x - gridPaddingLeft;
    const col = Math.floor(adjustedX / (CELL_SIZE + CELL_MARGIN * 2));
    const row = Math.floor(y / (CELL_SIZE + CELL_MARGIN * 2));
    return {
      row: Math.max(0, Math.min(GRID_SIZE - 1, row)),
      col: Math.max(0, Math.min(GRID_SIZE - 1, col)),
    };
  };

  const isInSelection = (row, col) => {
    if (!isDragging) return false;
    const sel = selectionRef.current;
    if (!sel) return false;
    const minRow = Math.min(sel.startRow, sel.endRow);
    const maxRow = Math.max(sel.startRow, sel.endRow);
    const minCol = Math.min(sel.startCol, sel.endCol);
    const maxCol = Math.max(sel.startCol, sel.endCol);
    return row >= minRow && row <= maxRow && col >= minCol && col <= maxCol;
  };

  const onDragStart = useCallback((x, y) => {
    if (gameOver) return;
    dragStartPos.current = { x, y };
    setIsDragging(true);
    const cell = getCellFromPos(x, y);
    const newSelection = {
      startRow: cell.row,
      startCol: cell.col,
      endRow: cell.row,
      endCol: cell.col,
    };
    selectionRef.current = newSelection;
    dragSelection.value = newSelection;
  }, [gameOver]);

  const onDragUpdate = useCallback((x, y) => {
    if (gameOver) return;
    const startCell = getCellFromPos(dragStartPos.current.x, dragStartPos.current.y);
    const endCell = getCellFromPos(x, y);
    const newSelection = {
      startRow: startCell.row,
      startCol: startCell.col,
      endRow: endCell.row,
      endCol: endCell.col,
    };
    selectionRef.current = newSelection;
    dragSelection.value = newSelection;
  }, [gameOver]);

  const onDragEnd = useCallback(() => {
    if (gameOver) return;
    const currentSelection = selectionRef.current;
    selectionRef.current = null;
    setIsDragging(false);
    setSelection(null);
    dragSelection.value = null;
    if (currentSelection) {
      const { sum, minRow, maxRow, minCol, maxCol } = calculateSum(currentSelection);
      if (sum === customerRequestRef.current) {
        const cond = c5ConditionRef.current;
        let fruitOk = true;
        if (cond) {
          let hasFruit = false;
          const b = boardRef.current || board;
          for (let r = minRow; r <= maxRow; r++) {
            for (let c = minCol; c <= maxCol; c++) {
              if (!b[r][c].removed && b[r][c].fruit === cond.fruit) {
                hasFruit = true;
              }
            }
          }
          fruitOk = cond.type === 'include' ? hasFruit : !hasFruit;
        }
        if (fruitOk) {
          removeApples(minRow, maxRow, minCol, maxCol);
        }
      }
    }
  }, [removeApples, gameOver]);

  const panGesture = Gesture.Pan()
    .minDistance(0)
    .onBegin((e) => { runOnJS(onDragStart)(e.x, e.y); })
    .onUpdate((e) => { runOnJS(onDragUpdate)(e.x, e.y); })
    .onEnd(() => { runOnJS(onDragEnd)(); })
    .onFinalize(() => { runOnJS(onDragEnd)(); });

  useEffect(() => {
    boardRef.current = board;
  }, [board]);

  useEffect(() => {
    const newBoard = generateBoard(0, GRID_SIZE, generateCustomerRequest(0));
    boardRef.current = newBoard;
    setBoard(newBoard);
  }, [GRID_SIZE]);

  // Initial customer slide-in on mount
  useEffect(() => {
    customerSlideX.value = 200;
    customerSlideOpacity.value = 0;
    customerSlideX.value = withSpring(0, { damping: 25, stiffness: 80 });
    customerSlideOpacity.value = withTiming(1, { duration: 200 });
  }, []);

  // Delivery animation styles
  const deliveryAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: deliveryScale.value },
      { translateY: deliveryY.value },
    ],
  }));

  const level = useMemo(() => getLevel(score), [score]);
  const theme = useMemo(() => getTheme(level), [level]);

  return (
    <>
    <View style={styles.container}>
      <View style={[styles.header, { zIndex: 20, marginTop: height * LAYOUT.headerMarginTopPct }]}>
        <Pressable style={styles.backBtn} onPress={onBackToStart}>
          <Image source={require('../assets/img/back_arrow.png')} style={{ width: 24, height: 24, tintColor: '#000' }} resizeMode="contain" />
        </Pressable>
<View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <TouchableOpacity style={styles.resetBtn} onPress={() => setPaused(p => !p)}><Text style={styles.resetIcon}>{paused ? '▶' : '⏸'}</Text></TouchableOpacity>
          <TouchableOpacity 
            style={styles.helpBtn} 
            onPress={() => { setPaused(true); setShowTutorial(true); setTutorialStep(0); }}
          >
            <Text style={styles.helpIcon}>?</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Background: BOT fills full screen, TOP anchored to top */}
      <Image source={require('../assets/img/BG_BOT.png')} style={[styles.bgBot, { height: height + insets.top + insets.bottom }]} resizeMode="stretch" />
      <Image source={require('../assets/img/BG_TOP.png')} style={styles.bgTop} resizeMode="stretch" />

      {/* Score + Level Numbers on Background */}
      <Text style={[styles.bgLevelNumber, { color: '#8B5A3C' }]}>{level >= 5 ? 'MAX' : level}</Text>
      <Pressable onPress={handlePossibleTap} style={styles.bgScoreNumber}>
        <Text style={[styles.bgScoreNumber, { color: '#8B5A3C' }]}>{score}</Text>
      </Pressable>
      {showScoreBonus && (
        <Text style={styles.scoreBonusText}>+{showScoreBonus.amount}점</Text>
      )}

      {/* Level Up Banner */}
      {showLevelUp && (
        <Animated.View style={[styles.levelUpBanner, levelUpAnimStyle]}>
          <Text style={styles.levelUpBannerText}>⭐ LEVEL UP! Lv.{level >= 5 ? 'MAX' : level}</Text>
        </Animated.View>
      )}


      {/* Worker and Customer */}
      <View style={styles.charactersRow}>
        {/* Worker (Left) */}
        <View style={styles.characterWrapper}>
          <Image 
            source={showDelivery ? workerImgDelivery : workerImg} 
            style={[styles.workerImage, { transform: [{ translateY: -10, translateX: -20 }] }]} 
            resizeMode="contain" 
          />
        </View>

        {/* Customer (Right) */}
        <View style={styles.characterWrapper}>
          <Animated.View style={[styles.characterEmojiWrapper, customerSlideStyle]}>
            {(() => {
              const customerData = getCustomerImg(customerRequest, customerImgSeed);
              const isC3 = customerData.isC3;
              const img = customerData.img || customerData;
              return (
                <Image 
                  source={img} 
                  style={[
                    customerRequest <= 9 ? styles.customerImageSmall : styles.customerImage,
                    { transform: [{ translateY: -13 }] }
                  ]} 
                  resizeMode="contain" 
                />
              );
            })()}
            <View style={[styles.bubbleContainer, c5Condition && styles.bubbleContainerLarge]}>
              <Image 
                source={require('../assets/img/bubble.png')} 
                style={{ width: '100%', height: '100%', position: 'absolute' }} 
                resizeMode="contain"
              />
              <View style={styles.bubbleContent}>
                <Text style={styles.bubbleText}>{customerRequest}</Text>
                {c5Condition && (
                  <View style={styles.bubbleFruitRow}>
                    <Image source={FRUIT_IMAGES[c5Condition.fruit]} style={{ width: 20, height: 20 }} resizeMode="contain" />
                    {c5Condition.type === 'exclude' && <Text style={styles.bubbleFruitType}>❌</Text>}
                  </View>
                )}
              </View>
            </View>
          </Animated.View>
        </View>
      </View>

      <TimerBar timeLeft={timeLeft} maxTime={getMaxTime()} flashValue={timerBarFlash} showTimeBonus={showTimeBonus} paddingH={appWidth * LAYOUT.timerPaddingH / 100} />

      {!gameOver && possibleCombinations === 0 && (
        <View style={styles.noComboBanner}>
          <View style={styles.noComboPopup}>
            <Text style={styles.noComboTitle}>No Combinations!</Text>
            <Text style={styles.noComboDesc}>No possible combinations{`\n`}Please refresh the board</Text>
            <Pressable style={styles.noComboBtn} onPress={() => { setPaused(false); resetBoard(); }}>
              <Text style={styles.noComboBtnText}>Refresh</Text>
            </Pressable>
          </View>
        </View>
      )}

      {gameOver && (
        <View style={styles.gameOverOverlay}>
          <Text style={styles.gameOverText}>GAME OVER</Text>
          <Text style={styles.gameOverScore}>Score: {score}</Text>
          <Text style={styles.gameOverHint} onPress={onBackToStart}>← Back to Menu</Text>
        </View>
      )}

      <GestureHandlerRootView style={[styles.board, gameOver && styles.boardDisabled]}>
        <GestureDetector gesture={panGesture}>
        <View style={styles.gridWrapper}>
          {assistMode && assistCombos.map((combo, i) => (
            <View
              key={i}
              pointerEvents="none"
              style={[styles.assistOverlay, {
                left: combo.c1 * (CELL_SIZE + CELL_MARGIN * 2) + gridPaddingLeft,
                top: combo.r1 * (CELL_SIZE + CELL_MARGIN * 2),
                width: (combo.c2 - combo.c1 + 1) * (CELL_SIZE + CELL_MARGIN * 2) - CELL_MARGIN * 2,
                height: (combo.r2 - combo.r1 + 1) * (CELL_SIZE + CELL_MARGIN * 2) - CELL_MARGIN * 2,
              }]}
            />
          ))}
          <DragOverlay
            dragSelection={dragSelection}
            cellSize={CELL_SIZE}
            cellMargin={CELL_MARGIN}
            boardRef={boardRef}
            customerRequestRef={customerRequestRef}
            boardPaddingLeft={appWidth * LAYOUT.GRID_PADDING_HORIZONTAL / 100}
          />
          {board.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.row}>
              {row.map((cell, colIndex) => (
                <Cell
                  key={colIndex}
                  cell={cell}
                  rowIndex={rowIndex}
                  colIndex={colIndex}
                  anims={cellAnims[rowIndex][colIndex]}
                  isSelected={!isDragging && isInSelection(rowIndex, colIndex)}
                  shakeAnim={cellShakeAnims[rowIndex][colIndex]}
                  cellSize={CELL_SIZE}
                  blockFill={theme.blockFill}
                  blockStroke={theme.blockStroke}
                />
              ))}
            </View>
          ))}
          </View>
        </GestureDetector>
      </GestureHandlerRootView>
    </View>
    
    {/* Game Over Modal */}
    <Modal visible={showGameOverModal} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>GAME OVER</Text>
          <Text style={styles.modalScore}>Score: {score}</Text>
          <Text style={styles.modalLevel}>Level: {level}</Text>
          <TextInput
            style={styles.modalInput}
            placeholder="Enter your name"
            placeholderTextColor="#999"
            value={playerName}
            onChangeText={setPlayerName}
            maxLength={20}
          />
          <Pressable style={styles.modalButton} onPress={handleSaveScore}>
            <Text style={styles.modalButtonText}>Save Score</Text>
          </Pressable>
          <Pressable style={styles.modalSkipButton} onPress={() => { setShowGameOverModal(false); setPlayerName(''); }}>
            <Text style={styles.modalSkipButtonText}>Skip</Text>
          </Pressable>
        </View>
      </View>
    </Modal>

    {/* Tutorial Modal */}
    <Modal transparent visible={showTutorial} animationType="fade">
      <View style={styles.tutorialOverlay}>
        <View style={styles.tutorialBox}>
          <Text style={styles.tutorialTitle}>🎮 How to Play</Text>
          <View style={styles.tutorialContent}>
            {tutorialStep === 0 && (
              <View style={styles.tutorialStepContent}>
                <Image 
                  source={require('../assets/img/T1.jpg')} 
                  style={styles.tutorialImage} 
                  resizeMode="contain"
                />
                <Text style={styles.tutorialBold}>Check the number the customer calls out.</Text>
              </View>
            )}
            {tutorialStep === 1 && (
              <View style={styles.tutorialStepContent}>
                <Image 
                  source={require('../assets/img/T2.jpg')} 
                  style={styles.tutorialImage} 
                  resizeMode="contain"
                />
                <Text style={styles.tutorialBold}>Select the appropriate numbers from the fruit blocks.</Text>
              </View>
            )}
            {tutorialStep === 2 && (
              <View style={styles.tutorialStepContent}>
                <Image 
                  source={require('../assets/img/T3.jpg')} 
                  style={styles.tutorialImage} 
                  resizeMode="contain"
                />
                <Text style={styles.tutorialBold}>Drag to match the sum with the number the customer called out.</Text>
              </View>
            )}
            {tutorialStep === 3 && (
              <View style={styles.tutorialStepContent}>
                <Image 
                  source={require('../assets/img/S2.png')} 
                  style={styles.tutorialImage} 
                  resizeMode="contain"
                />
                <Text style={styles.tutorialBold}>Release your finger when the numbers match to complete the delivery.</Text>
              </View>
            )}
          </View>

          {/* Dot Indicator */}
          <View style={styles.tutorialDots}>
            {[0, 1, 2, 3].map((i) => (
              <View
                key={i}
                style={[
                  styles.tutorialDot,
                  tutorialStep === i && styles.tutorialDotActive,
                ]}
              />
            ))}
          </View>

          {/* Navigation Buttons */}
          <View style={styles.tutorialNav}>
            {tutorialStep > 0 ? (
              <TouchableOpacity
                style={styles.tutorialNavButton}
                onPress={() => setTutorialStep(tutorialStep - 1)}
              >
                <Text style={styles.tutorialNavButtonText}>◀ 이전</Text>
              </TouchableOpacity>
            ) : <View style={styles.tutorialNavPlaceholder} />}

            {tutorialStep < 3 ? (
              <TouchableOpacity
                style={styles.tutorialNavButtonPrimary}
                onPress={() => setTutorialStep(tutorialStep + 1)}
              >
                <Text style={styles.tutorialNavButtonText}>NEXT ▶</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.tutorialStartButton}
                onPress={() => {
                  setShowTutorial(false);
                  setPaused(false);
                  lastTickTime.current = Date.now();
                  AsyncStorage.setItem('tutorialSeen', 'true');
                }}
              >
                <Text style={styles.tutorialStartButtonText}>▶  START</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
    </>
  );
}

const TimerBar = React.memo(function TimerBar({ timeLeft, maxTime, flashValue, showTimeBonus, paddingH = 0 }) {
  const [timeDisplay, setTimeDisplay] = useState(maxTime);
  const [trackWidth, setTrackWidth] = useState(0);

  useAnimatedReaction(
    () => Math.ceil(timeLeft.value),
    (current, previous) => {
      if (current !== previous) {
        runOnJS(setTimeDisplay)(current);
        runOnJS(setBGMRateByTime)(timeLeft.value);
      }
    }
  );

  const fillStyle = useAnimatedStyle(() => {
    const progress = Math.max(0, Math.min(1, timeLeft.value / maxTime));
    const fillColor = timeLeft.value > 9 ? '#4CAF50' : timeLeft.value > 5 ? '#FF9800' : '#FF4444';
    return {
      width: `${progress * 100}%`,
      backgroundColor: fillColor,
    };
  });
  
  const IMG_RATIO = 750 / 150;
  const trackHeight = trackWidth / IMG_RATIO;
  const GAUGE_OFFSET = trackWidth * 0.18;
  const GAUGE_WIDTH = trackWidth * 0.72;

  const imageWidthStyle = useAnimatedStyle(() => {
    const progress = Math.max(0, Math.min(1, timeLeft.value / maxTime));
    return { width: GAUGE_OFFSET + GAUGE_WIDTH * progress };
  });

  return (
    <View style={timerStyles.wrapper}>
      {showTimeBonus && (
        <Text style={timerStyles.bonusText}>+{Math.round(showTimeBonus.amount)}초</Text>
      )}
      <View style={[timerStyles.container, { paddingHorizontal: paddingH }]}>
        <View style={timerStyles.track} onLayout={e => setTrackWidth(e.nativeEvent.layout.width)}>
          <Image
            source={require('../assets/img/time_e.png')}
            style={{ width: trackWidth, height: trackHeight }}
            resizeMode="stretch"
          />
          <Animated.View style={[timerStyles.imageClip, imageWidthStyle, { height: trackHeight }]}>
            <Image
              source={require('../assets/img/time_f.png')}
              style={{ width: trackWidth, height: trackHeight, transform: [{ scaleY: 0.9 }, { translateY: -trackHeight * 0.03 }] }}
              resizeMode="stretch"
            />
          </Animated.View>
          <View style={{ position: 'absolute', left: 14, top: -10, width: GAUGE_OFFSET, height: trackHeight, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ fontSize: trackHeight * 0.3, fontWeight: '900', color: '#5A3A1A', textShadowColor: 'rgba(255,255,255,0.6)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 }}>{timeDisplay}s</Text>
          </View>
        </View>
      </View>
    </View>
  );
});

const timerStyles = StyleSheet.create({
  wrapper: {
    marginTop: 0,
    marginBottom: 0,
    paddingVertical: 0,
    width: '100%',
    top: LAYOUT.timerTop,
    position: 'absolute',
  },
  container: { 
    width: '100%',
    flexDirection: 'row', 
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 0,
  },
  track: {
    flex: 1,
    position: 'relative',
  },
  imageClip: {
    overflow: 'hidden',
    position: 'absolute',
    left: 0,
    top: 0,
  },
  bonusText: {
    position: 'absolute',
    top: -20,
    right: 20,
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '800',
  },
});

const DragOverlay = React.memo(function DragOverlay({ dragSelection, cellSize, cellMargin, boardRef, customerRequestRef, boardPaddingLeft = 0 }) {
  const cellStep = cellSize + cellMargin * 2;

  const overlayStyle = useAnimatedStyle(() => {
    const sel = dragSelection.value;
    if (!sel) return { display: 'none' };
    const minRow = Math.min(sel.startRow, sel.endRow);
    const maxRow = Math.max(sel.startRow, sel.endRow);
    const minCol = Math.min(sel.startCol, sel.endCol);
    const maxCol = Math.max(sel.startCol, sel.endCol);
    return {
      display: 'flex',
      position: 'absolute',
      left: minCol * cellStep + boardPaddingLeft,
      top: minRow * cellStep,
      width: (maxCol - minCol + 1) * cellStep - cellMargin * 2,
      height: (maxRow - minRow + 1) * cellStep - cellMargin * 2,
    };
  });

  const [sumText, setSumText] = useState('');
  const [isPerfect, setIsPerfect] = useState(false);

  const updateSum = useCallback((sel) => {
    if (!sel) { setSumText(''); setIsPerfect(false); return; }
    const b = boardRef.current;
    if (!b) return;
    const minRow = Math.min(sel.startRow, sel.endRow);
    const maxRow = Math.max(sel.startRow, sel.endRow);
    const minCol = Math.min(sel.startCol, sel.endCol);
    const maxCol = Math.max(sel.startCol, sel.endCol);
    let sum = 0;
    for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        if (b[r] && b[r][c] && !b[r][c].removed) {
          sum += b[r][c].value;
        }
      }
    }
    setSumText(String(sum));
    setIsPerfect(sum === customerRequestRef.current);
  }, []);

  useAnimatedReaction(
    () => dragSelection.value,
    (sel) => {
      runOnJS(updateSum)(sel);
    }
  );

  return (
    <Animated.View pointerEvents="none" style={[styles.dragOverlay, overlayStyle]}>
      <View style={styles.sumBadgeWrapper}>
        <Text style={[styles.sumBadge, isPerfect && styles.sumBadgePerfect]}>
          {sumText}
        </Text>
      </View>
    </Animated.View>
  );
});

const Cell = React.memo(function Cell({ cell, anims, isSelected, shakeAnim, cellSize, blockFill, blockStroke, rowIndex, colIndex }) {
  const appleFontSize = Math.floor(cellSize * 0.55);
  const numberFontSize = Math.floor(cellSize * 0.40);
  const translateY = anims?.translateYAnim || null;
  const opacity = anims?.opacity || null;
  const scale = anims?.scale || null;

  return (
    <RNAnimated.View style={[
      styles.cellContainer,
      { width: cellSize, height: cellSize },
      opacity ? { opacity } : null,
      { transform: [
        { translateX: shakeAnim },
        ...(translateY ? [{ translateY }] : []),
        ...(scale ? [{ scale }] : isSelected ? [{ scale: 0.95 }] : []),
      ]},
    ]}>
      {cell.value > 0 && (
        <>
          <FruitBlock
            size={cellSize}
            fruit={cell.fruit || FRUITS[0]}
            selected={isSelected}
            style={styles.cellBackground}
            blockFill={blockFill}
            blockStroke={blockStroke}
          />
          <View style={styles.cellContent}>
            <Image
              source={FRUIT_IMAGES[cell.fruit] || FRUIT_IMAGES.apple}
              style={{ width: appleFontSize * 1.2, height: appleFontSize * 1.2 }}
              resizeMode="contain"
            />
            <Text style={[styles.number, { fontSize: numberFontSize, lineHeight: numberFontSize * 1.2 }]}>{cell.value}</Text>
          </View>
        </>
      )}
    </RNAnimated.View>
  );
}, (prevProps, nextProps) => {
  return prevProps.cell.value === nextProps.cell.value &&
         prevProps.cell.fruit === nextProps.cell.fruit &&
         prevProps.cell.removed === nextProps.cell.removed &&
         prevProps.isSelected === nextProps.isSelected &&
         prevProps.cellSize === nextProps.cellSize &&
         prevProps.blockFill === nextProps.blockFill &&
         prevProps.blockStroke === nextProps.blockStroke;
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent', position: 'relative' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginTop: '20%', marginBottom: 2 },
  backBtn: { width: 40, height: 40, backgroundColor: 'transparent', borderRadius: 12, justifyContent: 'center', alignItems: 'center', opacity: 0 },
  title: { fontSize: 24, fontWeight: '900', color: '#FF8C42', letterSpacing: 2 },
  resetBtn: { width: 40, height: 40, backgroundColor: 'transparent', borderRadius: 12, justifyContent: 'center', alignItems: 'center', opacity: 0 },
  resetIcon: { color: '#000', fontSize: 18, fontWeight: 'bold', includeFontPadding: false, textAlign: 'center', textAlignVertical: 'center' },
  helpBtn: { width: 56, height: 56, backgroundColor: 'transparent', borderRadius: 16, justifyContent: 'center', alignItems: 'center', opacity: 0 },
  helpIcon: { color: '#000', fontSize: 20, fontWeight: 'bold' },
  
  // Level Up Overlay
  levelUpBanner: { position: 'absolute', top: 60, alignSelf: 'center', zIndex: 200, backgroundColor: '#FF8C42', borderRadius: 20, paddingHorizontal: 20, paddingVertical: 8 },
  levelUpBannerText: { fontSize: 16, fontWeight: '900', color: '#FFF', letterSpacing: 1 },

  // Score Box
  statCardOuter: {
    alignItems: 'center',
    backgroundColor: '#6B3E1E',
    borderRadius: 14,
    padding: 3,
    shadowColor: '#3B1F08',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 6,
  },
  statCard: {
    width: 68,
    borderRadius: 11,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#E8C88A',
  },
  statCardHeader: {
    backgroundColor: '#8B5E2E',
    paddingVertical: 4,
    alignItems: 'center',
    borderBottomWidth: 1.5,
    borderBottomColor: '#E8C88A',
  },
  statCardLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: '#FFF0CC',
    letterSpacing: 1,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  statCardBody: {
    backgroundColor: '#FDF0D0',
    paddingVertical: 6,
    alignItems: 'center',
  },
  statCardValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#7A4010',
    textAlign: 'center',
    textShadowColor: 'rgba(120,60,0,0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  levelValue: { color: '#7A4010' },
  scoreValue: { color: '#7A4010' },
  scoreBonusText: {
    position: 'absolute',
    top: 70,
    color: '#FF8C42',
    fontSize: 16,
    fontWeight: '800',
  },

  // Background Numbers (Level & Score on BG2) - Individual Position Control
  bgLevelNumber: {
    position: 'absolute',
    top: LAYOUT.bgNumberTopPct,
    left: LAYOUT.bgLevelLeftPct,
    width: LAYOUT.bgLevelWidth,
    fontSize: LAYOUT.bgNumberFontSize,
    fontFamily: 'Fredoka_700Bold',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    zIndex: 10,
    textAlign: 'center',
    whiteSpace: 'nowrap',
  },
  bgScoreNumber: {
    position: 'absolute',
    top: LAYOUT.bgNumberTopPct,
    left: LAYOUT.bgScoreLeftPct,
    width: LAYOUT.bgScoreWidth,
    fontSize: LAYOUT.bgNumberFontSize,
    fontFamily: 'Fredoka_700Bold',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    zIndex: 10,
    textAlign: 'center',
  },
  
  // Background images
  bgBot: { position: 'absolute', top: 0, left: 0, width: width, zIndex: 0 },
  bgTop: { position: 'absolute', top: 0, left: 0, width: width, height: LAYOUT.bgTopHeightPct, zIndex: 0 },

  // Characters (Worker & Customer)
  charactersRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end',
               paddingHorizontal: 0, paddingBottom: 0, position: 'absolute', borderRadius: 16, 
               marginBottom: LAYOUT.charactersMarginBottom, top: LAYOUT.charactersTop,
               width: '100%',
               height: LAYOUT.charactersHeight },
  characterWrapper: { 
    alignItems: 'center', 
    flex: 1,
    justifyContent: 'flex-end',
    zIndex: 1,
  },
  workerImage: {
    height: LAYOUT.workerHeight,
    aspectRatio: 677 / 369,
  },
  customerImage: {
    height: LAYOUT.customerHeight,
    aspectRatio: 677 / 369,
  },
  customerImageSmall: {
    height: LAYOUT.customerHeightSmall,
    aspectRatio: 677 / 369,
  },
  characterEmojiWrapper: {
    position: 'relative',
    width: 275,
    height: 130,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  bigCharacter: { fontSize: 52 },
  bubbleContainer: {
    position: 'absolute',
    top: LAYOUT.bubbleTop,
    right: 30,
    width: LAYOUT.bubbleWidth,
    height: LAYOUT.bubbleHeight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubbleContainerLarge: {
    width: LAYOUT.bubbleLargeWidth,
    height: LAYOUT.bubbleLargeHeight,
  },
  bubbleContent: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 0,
    marginBottom: 12,
  },
  bubbleText: { 
    fontSize: 28,
    fontFamily: 'Fredoka_700Bold',
    color: '#8B5A3C',
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  bubbleFruitRow: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  bubbleFruitType: {
    position: 'absolute',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFF8E7',
    borderRadius: 20,
    padding: 30,
    width: '80%',
    maxWidth: 320,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FF8C42',
    marginBottom: 16,
  },
  modalScore: {
    fontSize: 20,
    fontWeight: '700',
    color: '#8B7355',
    marginBottom: 8,
  },
  modalLevel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#8B7355',
    marginBottom: 20,
  },
  modalInput: {
    width: '100%',
    height: 48,
    backgroundColor: '#FFF',
    borderRadius: 10,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#333',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  modalButton: {
    width: '100%',
    backgroundColor: '#FF8C42',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 8,
  },
  modalButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  modalSkipButton: {
    paddingVertical: 8,
  },
  modalSkipButtonText: {
    color: '#8B7355',
    fontSize: 14,
    fontWeight: '600',
  },
  
  // Delivery Animation
  deliveryAnimation: { position: 'absolute', top: '28%', left: '50%', marginLeft: -80, alignItems: 'center', zIndex: 100 },
  deliveryCard: { backgroundColor: '#FFF', borderRadius: 20, paddingHorizontal: 20, paddingVertical: 14, alignItems: 'center', shadowColor: '#FF8C42', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 10, borderWidth: 2, borderColor: '#FFD700' },
  deliveryText: { fontSize: 15, fontWeight: '800', color: '#FF8C42', marginTop: 6, letterSpacing: 1 },
  
  sumBadgeWrapper: { flex: 1, alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' },
  sumBadge: { color: '#FFF', fontWeight: '900', fontSize: 22, textShadowColor: 'rgba(0,0,0,0.6)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  sumBadgePerfect: { color: '#AFFFB0', textShadowColor: 'rgba(0,100,0,0.5)' },
  board: { flex: 1, justifyContent: 'flex-start', alignItems: 'center', width: '100%' },
  boardDisabled: { opacity: 0.3 },
  noComboBanner: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', zIndex: 100 },
  noComboPopup: { backgroundColor: 'rgba(30,20,10,0.92)', borderRadius: 24, paddingVertical: 28, paddingHorizontal: 32, alignItems: 'center', borderWidth: 2, borderColor: '#FF8C42', shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 12 },
  noComboEmoji: { fontSize: 40, marginBottom: 8 },
  noComboTitle: { fontSize: 22, fontWeight: '900', color: '#FF8C42', marginBottom: 8 },
  noComboDesc: { fontSize: 14, color: '#FFE0B2', textAlign: 'center', marginBottom: 20, lineHeight: 20 },
  noComboBtn: { backgroundColor: '#FF8C42', paddingHorizontal: 28, paddingVertical: 12, borderRadius: 20 },
  noComboBtnText: { fontSize: 16, fontWeight: '900', color: '#FFF' },
  gameOverOverlay: { position: 'absolute', top: '40%', left: 20, right: 20, backgroundColor: '#FFF8E7', borderRadius: 20, padding: 30, alignItems: 'center', zIndex: 1000, shadowColor: '#FF8C42', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8, borderWidth: 3, borderColor: '#FF8C42' },
  gameOverText: { fontSize: 36, fontWeight: '900', color: '#FF8C42', marginBottom: 12, letterSpacing: 2 },
  gameOverScore: { fontSize: 24, color: '#8B7355', fontWeight: 'bold', marginBottom: 24 },
  gameOverHint: { fontSize: 16, color: '#FFF', backgroundColor: '#FF8C42', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 25, fontWeight: 'bold', overflow: 'hidden' },
  gridWrapper: { position: 'absolute', top:LAYOUT.boardTop, width: '100%', paddingHorizontal: `${LAYOUT.GRID_PADDING_HORIZONTAL}%` },
  assistOverlay: { position: 'absolute', backgroundColor: 'rgba(255, 140, 66, 0.25)', borderWidth: 2, borderColor: '#FF8C42', borderRadius: 8, zIndex: 50 },
  hintOverlay: { position: 'absolute', backgroundColor: 'rgba(255, 220, 0, 0.35)', borderWidth: 3, borderColor: '#FFD700', borderRadius: 8, zIndex: 60 },
  dragOverlay: { position: 'absolute', backgroundColor: 'rgba(255, 140, 66, 0.3)', borderWidth: 2, borderColor: '#FF8C42', zIndex: 100, pointerEvents: 'none' },
  row: { flexDirection: 'row', justifyContent: 'center' },
  cellContainer: { justifyContent: 'center', alignItems: 'center', margin: CELL_MARGIN },
  cellBackground: { position: 'absolute', top: 0, left: 0 },
  cellContent: { justifyContent: 'center', alignItems: 'center', zIndex: 10 },
  cellSelected: { transform: [{ scale: 0.98 }] },
  apple: { fontSize: 28 },
  number: { 
    position: 'absolute', 
    fontSize: 16, 
    fontWeight: '900', 
    color: '#FFF',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },

  // Tutorial Styles
  tutorialOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tutorialBox: {
    backgroundColor: '#FFF8E7',
    borderRadius: 24,
    padding: 24,
    width: '85%',
    maxWidth: 360,
    alignItems: 'center',
    shadowColor: '#FF8C42',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  tutorialTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FF8C42',
    marginBottom: 20,
  },
  tutorialContent: {
    width: '100%',
    minHeight: 180,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tutorialStepContent: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  tutorialImage: {
    width: 200,
    height: 120,
    borderRadius: 12,
    marginVertical: 12,
  },
  tutorialDesc: {
    fontSize: 14,
    color: '#5C4A2A',
    textAlign: 'center',
  },
  tutorialText: {
    fontSize: 15,
    color: '#5C4A2A',
    lineHeight: 24,
    textAlign: 'center',
  },
  tutorialBold: {
    fontWeight: '800',
    color: '#FF8C42',
    fontSize: 17,
  },
  tutorialEmoji: {
    fontSize: 40,
  },
  tutorialTip: {
    fontWeight: '700',
    color: '#4CAF50',
    fontSize: 14,
  },
  tutorialDots: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 20,
  },
  tutorialDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#DDD',
  },
  tutorialDotActive: {
    backgroundColor: '#FF8C42',
    width: 20,
  },
  tutorialNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 8,
  },
  tutorialNavButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  tutorialNavButtonPrimary: {
    backgroundColor: '#FF8C42',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  tutorialNavButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  tutorialNavPlaceholder: {
    width: 60,
  },
  tutorialStartButton: {
    backgroundColor: '#FF8C42',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 16,
    shadowColor: '#FF8C42',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  tutorialStartButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1,
  },
});
