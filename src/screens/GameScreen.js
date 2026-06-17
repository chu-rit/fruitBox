import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Image,
} from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
  withSequence,
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');
const DEFAULT_GRID_SIZE = 7;

/**
 * @param {number} step - 현재 게임의 목표 숫자 (STEP)
 * @returns {number} 생성된 사과의 숫자 (1~10, 20)
 */
function getNextAppleNumber(step) {
  const rand = Math.random() * 100; // 0~100 사이의 난수 발생

  // 1단계: STEP 7 ~ 20 (워밍업 구간)
  if (step <= 20) {
    // 1~5가 80%, 나머지는 20% (6~9)
    if (rand < 80) {
      return Math.floor(Math.random() * 5) + 1; // 1, 2, 3, 4, 5
    } else {
      return Math.floor(Math.random() * 4) + 6; // 6, 7, 8, 9
    }
  }

  // 2단계: STEP 21 ~ 30 (전환기 - 숫자 10 등장)
  else if (step <= 30) {
    // 모든 숫자(1~10) 균등하게 등장 (각 10%)
    return Math.floor(Math.random() * 10) + 1;
  }

  // 3단계: STEP 31 ~ 39 (본격 추격전 - 높은 숫자 위주)
  else if (step <= 39) {
    // 7~10이 70%, 나머지는 30%
    if (rand < 70) {
      return Math.floor(Math.random() * 4) + 7; // 7, 8, 9, 10
    } else {
      return Math.floor(Math.random() * 6) + 1; // 1, 2, 3, 4, 5, 6
    }
  }

  // 4단계: STEP 40 이상 (최종 보스 구간 - 숫자 20 등장)
  else {
    // 숫자 20 (5% 잭팟), 7~10 (65%), 1~6 (30%)
    if (rand < 5) {
      return 20; // 희귀한 20번 사과!
    } else if (rand < 70) {
      return Math.floor(Math.random() * 4) + 7; // 7, 8, 9, 10
    } else {
      return Math.floor(Math.random() * 6) + 1; // 1, 2, 3, 4, 5, 6
    }
  }
}

// Generate random board based on current step and grid size
const generateBoard = (step = START_STEP, gridSize = DEFAULT_GRID_SIZE) => {
  return Array(gridSize).fill(null).map(() =>
    Array(gridSize).fill(null).map(() => ({
      value: getNextAppleNumber(step),
      removed: false,
    }))
  );
};

const CELL_MARGIN = 2;

const MAX_TIME = 20;
const START_TIME = 15;
const START_STEP = 7;

export default function GameScreen({ onBackToStart, mapSize = DEFAULT_GRID_SIZE }) {
  const GRID_SIZE = mapSize;
  const CELL_SIZE = Math.floor((width - 40) / GRID_SIZE);
  
  const [step, setStep] = useState(START_STEP);
  const [board, setBoard] = useState(() => generateBoard(0, GRID_SIZE));
  const [selection, setSelection] = useState(null);
  const [dragRect, setDragRect] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const timeLeft = useSharedValue(START_TIME);
  const [gameOver, setGameOver] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const selectionRef = useRef(null);
  const timerRef = useRef(null);
  
  // Reanimated shared values for cell animations (dynamic grid)
  // cellAnims 비활성화 - 243개 useSharedValue 제거
  const cellAnims = useRef(
    Array(GRID_SIZE).fill(null).map(() =>
      Array(GRID_SIZE).fill(null).map(() => ({
        opacity: { value: 1 },
        scale: { value: 1 },
        translateY: { value: 0 },
      }))
    )
  ).current;
  
  // Reset board when mapSize changes
  useEffect(() => {
    const newBoard = generateBoard(step, GRID_SIZE);
    setBoard(newBoard);
  }, [mapSize]);
  
  // Score pop animation
  const scoreScale = useSharedValue(1);
  
  // Timer countdown
  useEffect(() => {
    // 기존 interval 정리
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    if (gameOver) return;
    
    timerRef.current = setInterval(() => {
      timeLeft.value = Math.max(0, timeLeft.value - 0.2);
      if (timeLeft.value <= 0.2) {
        timeLeft.value = 0;
        setGameOver(true);
      }
    }, 200);
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [gameOver]);
  
  // Prevent context menu globally
  useEffect(() => {
    const preventContextMenu = (e) => {
      e.preventDefault();
      return false;
    };
    
    document.addEventListener('contextmenu', preventContextMenu, true);
    
    return () => {
      document.removeEventListener('contextmenu', preventContextMenu, true);
    };
  }, []);

  // Calculate sum of selected area (regular function, not useCallback)
  const calculateSum = (sel) => {
    if (!sel) return { sum: 0, minRow: 0, maxRow: 0, minCol: 0, maxCol: 0 };
    const minRow = Math.min(sel.startRow, sel.endRow);
    const maxRow = Math.max(sel.startRow, sel.endRow);
    const minCol = Math.min(sel.startCol, sel.endCol);
    const maxCol = Math.max(sel.startCol, sel.endCol);
    
    let sum = 0;
    for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        if (board[r] && board[r][c] && !board[r][c].removed) {
          sum += board[r][c].value;
        }
      }
    }
    return { sum, minRow, maxRow, minCol, maxCol };
  };
  
  // Memoize current sum for display
  const currentSum = useMemo(() => calculateSum(selection), [selection, board]);
  
  // Assist mode state
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

  // Find all possible combinations for current step target
  const combos = useMemo(() => {
    const result = [];
    for (let r1 = 0; r1 < GRID_SIZE; r1++) {
      for (let c1 = 0; c1 < GRID_SIZE; c1++) {
        for (let r2 = r1; r2 < GRID_SIZE; r2++) {
          for (let c2 = c1; c2 < GRID_SIZE; c2++) {
            let sum = 0;
            for (let r = r1; r <= r2; r++) {
              for (let c = c1; c <= c2; c++) {
                if (!board[r][c].removed) sum += board[r][c].value;
              }
            }
            const cellCount = (r2 - r1 + 1) * (c2 - c1 + 1);
            if (sum === step && cellCount >= 2) result.push({ r1, c1, r2, c2 });
          }
        }
      }
    }
    return result;
  }, [board, step, GRID_SIZE]);

  const possibleCombinations = combos.length;

  // Pick up to 5 non-overlapping combos for assist mode
  const assistCombos = useMemo(() => {
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
  
  // Reset board with new apples
  const resetBoard = useCallback(() => {
    const newBoard = generateBoard(step, GRID_SIZE);
    setBoard(newBoard);
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        cellAnims[r][c].opacity.value = 1;
        cellAnims[r][c].scale.value = 1;
      }
    }
  }, [step, GRID_SIZE]);
  
  // Calculate time bonus based on apple count
  const calculateTimeBonus = (count) => {
    if (count === 2) return 4;
    if (count === 3) return 6;
    return 8; // 4 or more
  };
  
  // Add time to timer (capped at MAX_TIME)
  const addTime = useCallback((bonusSeconds) => {
    timeLeft.value = Math.min(MAX_TIME, timeLeft.value + bonusSeconds);
  }, []);

  // Remove apples with simple animations
  const removeApples = useCallback((minRow, maxRow, minCol, maxCol) => {
    const count = (maxRow - minRow + 1) * (maxCol - minCol + 1);
    const timeBonus = calculateTimeBonus(count);
    const newStep = step + 1;
    
    // Step 1: Fade out removed cells
    for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        const anims = cellAnims[r][c];
        anims.opacity.value = 0;
        anims.scale.value = 0.8;
      }
    }
    
    // Step 2: Update board
    setTimeout(() => {
      setStep(newStep);
      addTime(timeBonus);
      scoreScale.value = withSpring(1.15, { damping: 12 });
      
      setBoard(prev => {
        const newBoard = prev.map(row => row.map(cell => ({ ...cell })));
        
        for (let r = minRow; r <= maxRow; r++) {
          for (let c = minCol; c <= maxCol; c++) {
            newBoard[r][c].removed = true;
          }
        }
        
        // Gravity: move existing apples down
        const newStep = step + 1;
        for (let c = minCol; c <= maxCol; c++) {
          const columnCells = []; // { cell, originalRow }
          for (let r = 0; r < GRID_SIZE; r++) {
            if (!newBoard[r][c].removed) {
              columnCells.push({ cell: { ...newBoard[r][c] }, originalRow: r });
            }
          }
          let writeRow = GRID_SIZE - 1;
          for (let i = columnCells.length - 1; i >= 0; i--) {
            const { cell, originalRow } = columnCells[i];
            newBoard[writeRow][c] = cell;
            // Animate fall: start from original position
            if (writeRow !== originalRow) {
              const fallDist = (writeRow - originalRow) * (CELL_SIZE + CELL_MARGIN * 2);
              const anims = cellAnims[writeRow][c];
              anims.translateY.value = -fallDist;
              anims.opacity.value = 1;
            }
            writeRow--;
          }
          // Cache next apple number per column
          const nextAppleNum = getNextAppleNumber(newStep);
          for (let r = 0; r <= writeRow; r++) {
            newBoard[r][c] = { value: nextAppleNum, removed: false };
            const dropDist = (writeRow + 1) * (CELL_SIZE + CELL_MARGIN * 2);
            const anims = cellAnims[r][c];
            anims.opacity.value = 1;
            anims.scale.value = 1;
            anims.translateY.value = -dropDist; // Start above grid
          }
        }
        
        return newBoard;
      });
      
      // Step 3: Animate all cells into position
      setTimeout(() => {
        for (let c = minCol; c <= maxCol; c++) {
          for (let r = 0; r < GRID_SIZE; r++) {
            const anims = cellAnims[r][c];
            anims.translateY.value = 0;
            anims.opacity.value = 1;
            anims.scale.value = 1;
          }
        }
      }, 50);
    }, 200);
  }, [board, step]);

  // Get cell from position
  const getCellFromPos = (x, y) => {
    const col = Math.floor(x / (CELL_SIZE + CELL_MARGIN * 2));
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

  // Gesture Handler callbacks
  const onDragStart = useCallback((x, y) => {
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
    setSelection(newSelection);
  }, []);

  const onDragUpdate = useCallback((x, y) => {
    // 드래그 중에는 setDragRect 업데이트하지 않음 (리렌더링 방지)
    const startCell = getCellFromPos(dragStartPos.current.x, dragStartPos.current.y);
    const endCell = getCellFromPos(x, y);
    
    const newSelection = {
      startRow: startCell.row,
      startCol: startCell.col,
      endRow: endCell.row,
      endCol: endCell.col,
    };
    
    selectionRef.current = newSelection;
    setSelection(newSelection);
  }, []);

  const onDragEnd = useCallback(() => {
    const currentSelection = selectionRef.current;
    
    // Clear visual selection immediately
    selectionRef.current = null;
    setIsDragging(false);
    setSelection(null);
    setDragRect(null);
    
    // Check sum after visual cleared
    if (currentSelection) {
      const { sum, minRow, maxRow, minCol, maxCol } = calculateSum(currentSelection);
      if (sum === step) {
        removeApples(minRow, maxRow, minCol, maxCol);
      }
    }
  }, [removeApples, step]);

  const panGesture = Gesture.Pan()
    .minDistance(0)
    .onBegin((e) => { runOnJS(onDragStart)(e.x, e.y); })
    .onUpdate((e) => { runOnJS(onDragUpdate)(e.x, e.y); })
    .onEnd(() => { runOnJS(onDragEnd)(); })
    .onFinalize(() => { runOnJS(onDragEnd)(); });

  return (
    <View style={styles.container}>
      <View style={[styles.header, { transform: [{ translateY: 150 }] }]}>
        <Text style={styles.backText} onPress={onBackToStart}>←</Text>
        <Text style={styles.title}>APPLE BOX</Text>
        <Text style={styles.resetText}>↻</Text>
      </View>

      <View style={[styles.stats, { transform: [{ translateY: 50 }] }]}>
        <Animated.View style={styles.statBox}>
          <Text style={styles.statLabel}>STEP</Text>
          <ScoreDisplay score={step} scale={scoreScale} />
        </Animated.View>
        <View style={[styles.statBox, assistMode && styles.statBoxAssist]} onTouchEnd={handlePossibleTap}>
          <Text style={styles.statLabel}>POSSIBLE</Text>
          <Text style={[styles.statValue, styles.possibleValue]}>
            {possibleCombinations}
          </Text>
        </View>
      </View>

      <TimerBar timeLeft={timeLeft} maxTime={MAX_TIME} />

      {!gameOver && possibleCombinations === 0 && (
        <View style={styles.noComboBanner}>
          <Text style={styles.noComboText}>No combinations available!</Text>
          <Text style={styles.noComboBtn} onPress={resetBoard}>Refresh Board</Text>
        </View>
      )}

      {gameOver && (
        <View style={styles.gameOverOverlay}>
          <Text style={styles.gameOverText}>GAME OVER</Text>
          <Text style={styles.gameOverScore}>Reached Step: {step}</Text>
          <Text style={styles.gameOverHint} onPress={onBackToStart}>
            ← Back to Menu
          </Text>
        </View>
      )}
    </View>
  );
}

// Separate Cell component for reanimated
const Cell = React.memo(function Cell({ cell, anims, isSelected, cellSize }) {
  // Reanimated 비활성화 - 일반 View 사용
  // const animatedStyle = useAnimatedStyle(() => ({
  //   opacity: anims.opacity.value,
  //   transform: [
  //     { translateY: anims.translateY.value },
  //     { scale: anims.scale.value },
  //   ],
  // }), []);

  // Dynamic font sizes based on cell size
  const appleFontSize = Math.max(10, Math.floor(cellSize * 0.55));
  const numberFontSize = Math.max(8, Math.floor(cellSize * 0.32));

  return (
    <View
      style={[
        styles.cell,
        { width: cellSize, height: cellSize },
        // animatedStyle,
        isSelected && styles.cellSelected,
      ]}
    >
      {cell.value > 0 && (
        <>
          <Image 
            source={require('../assets/img/apple.png')} 
            style={{ width: appleFontSize, height: appleFontSize }} 
            resizeMode="contain" 
          />
          <Text style={[styles.number, { fontSize: numberFontSize }]}>{cell.value}</Text>
        </>
      )}
    </View>
  );
}, (prevProps, nextProps) => {
  return prevProps.cell.value === nextProps.cell.value &&
         prevProps.cell.removed === nextProps.cell.removed &&
         prevProps.isSelected === nextProps.isSelected &&
         prevProps.cellSize === nextProps.cellSize;
});

// Animated score display component
const ScoreDisplay = React.memo(function ScoreDisplay({ score, scale }) {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.Text style={[styles.statValue, animatedStyle]}>
      {score}
    </Animated.Text>
  );
});

// Timer bar with hedgehog chasing farmer
const TimerBar = React.memo(function TimerBar({ timeLeft, maxTime }) {
  const fillStyle = useAnimatedStyle(() => {
    const progress = timeLeft.value / maxTime;
    const fillColor = progress > 0.5 ? '#4CAF50' : progress > 0.3 ? '#FF9800' : '#FF4444';
    return {
      width: `${progress * 100}%`,
      backgroundColor: fillColor,
    };
  });

  return (
    <View style={timerStyles.container}>
      <Text style={timerStyles.emoji}>🦔</Text>
      <View style={timerStyles.track}>
        <Animated.View style={[timerStyles.fill, fillStyle]} />
      </View>
      <Text style={timerStyles.emoji}>👨‍🌾</Text>
    </View>
  );
});

const timerStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginVertical: 8,
  },
  emoji: {
    fontSize: 24,
  },
  track: {
    flex: 1,
    height: 12,
    backgroundColor: '#E0E0E0',
    borderRadius: 6,
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 6,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8E7',
    paddingTop: 150,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 40,
    zIndex: 1000,
  },
  backText: {
    width: 40,
    height: 40,
    backgroundColor: '#FF4444',
    borderRadius: 20,
    textAlign: 'center',
    lineHeight: 40,
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FF4444',
    letterSpacing: 2,
  },
  resetText: {
    width: 40,
    height: 40,
    backgroundColor: '#8B7355',
    borderRadius: 20,
    textAlign: 'center',
    lineHeight: 40,
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    marginBottom: 40,
    zIndex: 1000,
  },
  statBox: {
    backgroundColor: '#FFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    minWidth: 80,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statLabel: {
    fontSize: 12,
    color: '#8B7355',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  sumBadgeWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  },
  sumBadge: {
    color: '#FFF',
    fontWeight: '900',
    fontSize: 22,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  sumBadgePerfect: {
    color: '#AFFFB0',
    textShadowColor: 'rgba(0,100,0,0.5)',
  },
  possibleValue: {
    color: '#FF6B6B',
  },
  board: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  boardDisabled: {
    opacity: 0.3,
  },
  noComboBanner: {
    marginHorizontal: 20,
    marginBottom: 6,
    backgroundColor: '#FFF3CD',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#FFCA28',
  },
  noComboText: {
    fontSize: 13,
    color: '#8B6914',
    fontWeight: 'bold',
  },
  noComboBtn: {
    fontSize: 13,
    color: '#FFF',
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    fontWeight: 'bold',
    overflow: 'hidden',
  },
  gameOverOverlay: {
    position: 'absolute',
    top: '40%',
    left: 20,
    right: 20,
    backgroundColor: '#FFF8E7',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    zIndex: 1000,
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 3,
    borderColor: '#FF6B6B',
  },
  gameOverText: {
    fontSize: 36,
    fontWeight: '900',
    color: '#FF4444',
    marginBottom: 12,
    letterSpacing: 2,
  },
  gameOverScore: {
    fontSize: 24,
    color: '#8B7355',
    fontWeight: 'bold',
    marginBottom: 24,
  },
  gameOverHint: {
    fontSize: 16,
    color: '#FFF',
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    fontWeight: 'bold',
    overflow: 'hidden',
  },
  gridWrapper: {
    position: 'relative',
  },
  assistOverlay: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 220, 0, 0.25)',
    borderWidth: 2,
    borderColor: '#FFD700',
    borderRadius: 8,
    zIndex: 50,
  },
  dragOverlay: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 68, 68, 0.3)',
    borderWidth: 2,
    borderColor: '#FF4444',
    zIndex: 100,
    pointerEvents: 'none',
  },
  statBoxAssist: {
    borderWidth: 2,
    borderColor: '#FFD700',
    backgroundColor: 'rgba(255, 220, 0, 0.15)',
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FF6B6B',
    margin: CELL_MARGIN,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FF4757',
    shadowColor: '#C0392B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 5,
  },
  cellSelected: {
    backgroundColor: '#FFD93D',
    borderColor: '#F39C12',
    shadowColor: '#D68910',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    elevation: 8,
  },
  number: {
    position: 'absolute',
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
});
