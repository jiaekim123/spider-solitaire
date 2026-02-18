import React, { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';

// localStorage 키 상수
const SAVE_KEY = 'spider-solitaire-save';

// 저장된 게임 불러오기
const loadSavedGame = () => {
  try {
    const saved = localStorage.getItem(SAVE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('저장된 게임 불러오기 실패:', e);
  }
  return null;
};

// 게임 저장하기
const saveGameToStorage = (gameState) => {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({
      ...gameState,
      savedAt: Date.now()
    }));
  } catch (e) {
    console.error('게임 저장 실패:', e);
  }
};

// 저장된 게임 삭제
const clearSavedGame = () => {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch (e) {
    console.error('저장된 게임 삭제 실패:', e);
  }
};

// 레벨 선택 컴포넌트
function LevelSelection({ onLevelSelect, onContinueGame, savedGame }) {
  const getLevelName = (level) => {
    switch(level) {
      case 'beginner': return '초급';
      case 'intermediate': return '중급';
      case 'advanced': return '고급';
      default: return '';
    }
  };

  const formatSavedTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) return '방금 전';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}분 전`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}시간 전`;
    return `${Math.floor(diff / 86400000)}일 전`;
  };

  return (
    <div className="level-selection">
      <h2>🕷️ 스파이더 카드게임</h2>
      <p>원하는 난이도를 선택하세요</p>

      {savedGame && (
        <div className="continue-game-section">
          <button
            className="level-button continue-btn"
            onClick={onContinueGame}
          >
            이어하기
            <div className="level-description">
              {getLevelName(savedGame.gameLevel)} - 점수: {savedGame.score} - {formatSavedTime(savedGame.savedAt)}
            </div>
          </button>
        </div>
      )}

      <div className="level-buttons">
        <button
          className="level-button beginner"
          onClick={() => onLevelSelect('beginner')}
        >
          초급
          <div className="level-description">1가지 무늬 (♠️만)</div>
        </button>
        <button
          className="level-button intermediate"
          onClick={() => onLevelSelect('intermediate')}
        >
          중급
          <div className="level-description">2가지 무늬 (♠️♥️)</div>
        </button>
        <button
          className="level-button advanced"
          onClick={() => onLevelSelect('advanced')}
        >
          고급
          <div className="level-description">4가지 무늬 (♠️♥️♦️♣️)</div>
        </button>
      </div>
    </div>
  );
}

// 카드 컴포넌트 - 드래그 기능 추가
function Card({ card, cardIndex, pileIndex, onDragStart, onDragEnd, isDraggable, onCardClick, onDoubleClick, isDragging, gameBoard, isNonMovable, hintInfo, showingHint, onTouchDragStart, isAnimating }) {
  const handleDragStart = (e) => {
    if (isDraggable) {
      onDragStart(pileIndex, cardIndex);
      e.dataTransfer.effectAllowed = 'move';

      // 커스텀 드래그 이미지 생성 (함께 이동하는 모든 카드들을 보여주기 위해)
      const draggedCards = gameBoard[pileIndex].slice(cardIndex);
      if (draggedCards.length > 1) {
        createCustomDragImage(e, draggedCards);
      }
    }
  };

  const handleDragEnd = () => {
    onDragEnd();
  };

  const handleClick = () => {
    if (onCardClick) {
      onCardClick(pileIndex, cardIndex);
    }
  };

  const handleDoubleClick = () => {
    if (onDoubleClick && isDraggable) {
      onDoubleClick(pileIndex, cardIndex);
    }
  };

  // 터치 시작 핸들러 - 즉시 드래그 시작
  const handleTouchStart = (e) => {
    if (!isDraggable) return;

    e.preventDefault();
    const touch = e.touches[0];
    onTouchDragStart(pileIndex, cardIndex, touch.clientX, touch.clientY);
  };

  // 카드 색상 결정 (빨간색: ♥♦, 검은색: ♠♣)
  const getCardColor = () => {
    if (!card.isVisible) return '';
    return (card.suit === '♥' || card.suit === '♦') ? 'red-suit' : 'black-suit';
  };

  // 커스텀 드래그 이미지 생성 함수
  const createCustomDragImage = (e, cards) => {
    const dragContainer = document.createElement('div');
    dragContainer.style.position = 'absolute';
    dragContainer.style.top = '-9999px';
    dragContainer.style.left = '-9999px';
    dragContainer.style.width = '80px';
    dragContainer.style.height = `${100 + (cards.length - 1) * 18}px`;
    dragContainer.style.pointerEvents = 'none';

    cards.forEach((dragCard, index) => {
      const cardElement = document.createElement('div');
      cardElement.style.position = 'absolute';
      cardElement.style.top = `${index * 18}px`;
      cardElement.style.left = '0px';
      cardElement.style.width = '80px';
      cardElement.style.height = '100px';
      cardElement.style.borderRadius = '8px';
      cardElement.style.border = '1px solid #333';
      cardElement.style.display = 'flex';
      cardElement.style.alignItems = 'center';
      cardElement.style.justifyContent = 'center';
      cardElement.style.fontSize = '14px';
      cardElement.style.fontWeight = 'bold';
      cardElement.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
      cardElement.style.zIndex = index.toString();

      if (dragCard.isVisible) {
        cardElement.style.background = 'linear-gradient(135deg, #ffffff, #f8f8f8)';
        cardElement.style.color = (dragCard.suit === '♥' || dragCard.suit === '♦') ? '#d32f2f' : '#000';
        cardElement.textContent = `${dragCard.rank}${dragCard.suit}`;

        // 작은 숫자와 무늬도 추가
        const topLeft = document.createElement('div');
        topLeft.style.position = 'absolute';
        topLeft.style.top = '2px';
        topLeft.style.left = '3px';
        topLeft.style.fontSize = '10px';
        topLeft.style.fontWeight = 'bold';
        topLeft.style.color = 'inherit';
        topLeft.textContent = `${dragCard.rank} ${dragCard.suit}`;
        cardElement.appendChild(topLeft);

        const bottomRight = document.createElement('div');
        bottomRight.style.position = 'absolute';
        bottomRight.style.bottom = '2px';
        bottomRight.style.right = '3px';
        bottomRight.style.fontSize = '10px';
        bottomRight.style.fontWeight = 'bold';
        bottomRight.style.color = 'inherit';
        bottomRight.style.transform = 'rotate(180deg)';
        bottomRight.textContent = `${dragCard.rank} ${dragCard.suit}`;
        cardElement.appendChild(bottomRight);
      } else {
        cardElement.style.background = 'linear-gradient(135deg, #1e3a8a, #1e40af)';
        cardElement.style.color = '#fff';
        cardElement.style.fontSize = '20px';
        cardElement.textContent = '🂠';
      }

      dragContainer.appendChild(cardElement);
    });

    document.body.appendChild(dragContainer);

    // 드래그 이미지 설정
    e.dataTransfer.setDragImage(dragContainer, 40, 50);

    // 드래그가 끝나면 임시 요소 제거
    setTimeout(() => {
      if (document.body.contains(dragContainer)) {
        document.body.removeChild(dragContainer);
      }
    }, 0);
  };

  // 힌트 카드인지 확인하는 함수
  const isHintCard = () => {
    if (!hintInfo || !showingHint) return false;
    return hintInfo.from === pileIndex &&
           hintInfo.cards.some(hintCard =>
             hintCard.suit === card.suit &&
             hintCard.rank === card.rank
           );
  };

  // 힌트 목적지인지 확인하는 함수
  const isHintTarget = () => {
    if (!hintInfo || !showingHint) return false;
    return hintInfo.to === pileIndex && cardIndex === gameBoard[pileIndex].length - 1;
  };

  return (
    <div
      className={`card ${card.isVisible ? 'visible' : 'hidden'} ${isDraggable ? 'draggable' : ''} ${getCardColor()} ${isDragging ? 'dragging-preview' : ''} ${isNonMovable ? 'non-movable' : ''} ${isHintCard() ? 'hint-source' : ''} ${isHintTarget() ? 'hint-target' : ''} ${isAnimating ? 'animating' : ''}`}
      draggable={isDraggable}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onTouchStart={handleTouchStart}
      data-rank={card.rank}
      data-suit={card.suit}
      style={{
        position: 'absolute',
        top: `${cardIndex * 18}px`,
        zIndex: isDragging || isAnimating ? cardIndex + 1000 : cardIndex,
        left: '50%', // 카드 더미 중앙에 위치
        transform: 'translateX(-50%)' // 카드 자체를 중앙 정렬
      }}
    >
      {card.isVisible ? `${card.rank}${card.suit}` : '🂠'}
    </div>
  );
}

// 카드 더미 컴포넌트
function CardPile({ cards, pileIndex, onDragStart, onDragEnd, onDrop, onCardClick, onDoubleClick, draggingCards, gameBoard, hintInfo, showingHint, onTouchDragStart, animatingCard }) {
  const [isDragOver, setIsDragOver] = useState(false);

  // 드래그가 끝나면 drag-over 상태 초기화 (초록색 점선 버그 수정)
  useEffect(() => {
    if (!draggingCards) {
      setIsDragOver(false);
    }
  }, [draggingCards]);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation(); // 이벤트 버블링 방지
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.stopPropagation(); // 이벤트 버블링 방지

    // 현재 요소에서 완전히 벗어났는지 확인
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;

    // 카드 더미 영역에서 여유 공간(margin)을 둬서 민감도 조정
    const margin = 10; // 20px에서 10px로 줄여서 더 정확하게 감지

    if (x < rect.left - margin ||
        x > rect.right + margin ||
        y < rect.top - margin ||
        y > rect.bottom + margin) {
      setIsDragOver(false);
    }
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation(); // 이벤트 버블링 방지

    // 실제로 이 요소 위에 있는지 확인
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;

    if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
      setIsDragOver(true);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation(); // 이벤트 버블링 방지
    setIsDragOver(false);
    onDrop(pileIndex);
  };

  // 드래그 가능한 카드들 찾기 (연속된 같은 색상의 내림차순 카드들)
  const getDraggableCards = () => {
    const draggableIndices = [];
    
    for (let i = cards.length - 1; i >= 0; i--) {
      if (!cards[i].isVisible) break;
      
      draggableIndices.unshift(i);
      
      if (i > 0 && cards[i - 1].isVisible) {
        const currentRank = getRankValue(cards[i].rank);
        const prevRank = getRankValue(cards[i - 1].rank);
        const currentSuit = cards[i].suit;
        const prevSuit = cards[i - 1].suit;
        
        if (currentRank !== prevRank - 1 || currentSuit !== prevSuit) {
          break;
        }
      } else {
        break;
      }
    }
    
    return draggableIndices;
  };

  // 옮길 수 없는 카드들 찾기 (드래그 가능한 카드를 제외한 보이는 카드들)
  const getNonMovableCards = () => {
    const draggableIndices = getDraggableCards();
    const nonMovableIndices = [];

    for (let i = 0; i < cards.length; i++) {
      if (cards[i].isVisible && !draggableIndices.includes(i)) {
        nonMovableIndices.push(i);
      }
    }

    return nonMovableIndices;
  };

  const draggableIndices = getDraggableCards();
  const nonMovableIndices = getNonMovableCards();

  // 드래그 중인 카드인지 확인하는 함수
  const isDraggingCard = (cardIndex) => {
    if (!draggingCards || draggingCards.pileIndex !== pileIndex) {
      return false;
    }
    return cardIndex >= draggingCards.startIndex;
  };

  return (
    <div 
      className={`card-pile ${isDragOver ? 'drag-over' : ''}`}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{
        minHeight: '120px',
        position: 'relative',
        // 드래그 감지 영역 조정 - 패딩/마진을 줄여서 정확도 향상
        padding: '5px',
        margin: '-5px',
      }}
    >
      {cards.length === 0 && (
        <div className="empty-pile">빈 공간</div>
      )}
      {cards.map((card, index) => (
        <Card
          key={`${pileIndex}-${index}`}
          card={card}
          cardIndex={index}
          pileIndex={pileIndex}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          onCardClick={onCardClick}
          onDoubleClick={onDoubleClick}
          isDraggable={draggableIndices.includes(index)}
          isDragging={isDraggingCard(index)}
          isNonMovable={nonMovableIndices.includes(index)}
          gameBoard={gameBoard}
          hintInfo={hintInfo}
          showingHint={showingHint}
          onTouchDragStart={onTouchDragStart}
          isAnimating={animatingCard?.from === pileIndex && index >= (animatingCard?.startIndex || 0)}
        />
      ))}
    </div>
  );
}

// 카드 랭크를 숫자로 변환하는 함수
function getRankValue(rank) {
  const rankValues = {
    'A': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13
  };
  return rankValues[rank];
}

// 메인 게임 컴포넌트
function App() {
  const [gameBoard, setGameBoard] = useState([]);
  const [dealPile, setDealPile] = useState([]);
  const [completedPiles, setCompletedPiles] = useState([]); // 완성된 세트들을 저장
  const [score, setScore] = useState(500);
  const [dragInfo, setDragInfo] = useState(null);
  const [completedSets, setCompletedSets] = useState(0);
  const [gameWon, setGameWon] = useState(false);
  const [gameLevel, setGameLevel] = useState(null);
  const [gameStarted, setGameStarted] = useState(false);
  // 초기 게임 상태를 저장하기 위한 상태 추가
  const [initialGameBoard, setInitialGameBoard] = useState([]);
  const [initialDealPile, setInitialDealPile] = useState([]);
  // 드래그 중인 카드들을 표시하기 위한 상태 추가
  const [draggingCards, setDraggingCards] = useState(null);
  // 실행취소를 위한 히스토리 상태 추가
  const [gameHistory, setGameHistory] = useState([]);
  const [canUndo, setCanUndo] = useState(false);
  // 힌트 기능을 위한 상태 추가
  const [hintInfo, setHintInfo] = useState(null);
  const [showingHint, setShowingHint] = useState(false);
  // 이동 횟수 카운터 (실행취소해도 줄어들지 않음)
  const [moveCount, setMoveCount] = useState(0);
  // 터치 드래그 상태
  const [touchDrag, setTouchDrag] = useState(null);
  const ghostRef = useRef(null);
  // 자동 완성 상태
  const [isAutoCompleting, setIsAutoCompleting] = useState(false);
  // 카드 애니메이션 상태
  const [animatingCard, setAnimatingCard] = useState(null);
  // 저장된 게임 상태
  const [savedGame, setSavedGame] = useState(() => loadSavedGame());

  // --- 새로운 상태 추가 (이미지 기반 기능) ---
  const [showDealModal, setShowDealModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settings, setSettings] = useState({
    showTime: true,
    showMoves: true,
    autoComplete: false,
    tapToMove: true,
    unlimitedDeals: true,
    lockOrientation: true
  });
  const [gameTime, setGameTime] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [magicWandCount, setMagicWandCount] = useState(4);

  // 타이머 로직
  useEffect(() => {
    let interval;
    if (timerActive && !gameWon) {
      interval = setInterval(() => {
        setGameTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerActive, gameWon]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // 모달 컴포넌트
  const Modal = ({ title, onClose, children }) => (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  );

  // 자동 저장 useEffect - 게임 상태가 변경될 때마다 저장
  useEffect(() => {
    // 게임이 시작되지 않았거나, 게임이 끝났으면 저장하지 않음
    if (!gameStarted || gameWon) return;
    // 게임 보드가 비어있으면 저장하지 않음
    if (gameBoard.length === 0) return;
    // 자동 완성 중에는 저장하지 않음 (너무 잦은 저장 방지)
    if (isAutoCompleting) return;

    const gameState = {
      gameBoard: gameBoard.map(pile => pile.map(card => ({ ...card }))),
      dealPile: dealPile.map(card => ({ ...card })),
      completedPiles: completedPiles.map(p => ({ ...p })),
      score,
      completedSets,
      moveCount,
      gameLevel,
      gameTime,
      magicWandCount,
      initialGameBoard: initialGameBoard.map(pile => pile.map(card => ({ ...card }))),
      initialDealPile: initialDealPile.map(card => ({ ...card }))
    };

    saveGameToStorage(gameState);
    setSavedGame(gameState);
  }, [gameBoard, dealPile, completedPiles, score, completedSets, moveCount, gameStarted, gameWon, gameLevel, isAutoCompleting, initialGameBoard, initialDealPile, gameTime, magicWandCount]);

  // 게임 상태를 히스토리에 저장하는 함수
  const saveGameState = () => {
    const currentState = {
      gameBoard: gameBoard.map(pile => pile.map(card => ({ ...card }))),
      dealPile: dealPile.map(card => ({ ...card })),
      completedPiles: completedPiles.map(p => ({ ...p })),
      score: score,
      completedSets: completedSets,
      moveCount: moveCount, // 이동 횟수 추가
      gameWon: gameWon
    };

    setGameHistory(prev => {
      const newHistory = [...prev, currentState];
      // 최대 20개의 히스토리만 유지 (메모리 효율성을 위해)
      if (newHistory.length > 20) {
        newHistory.shift();
      }
      return newHistory;
    });
    setCanUndo(true);
  };

  // 실행취소 함수
  const undoLastMove = () => {
    if (gameHistory.length === 0) return;

    const lastState = gameHistory[gameHistory.length - 1];

    // 이전 상태로 복원
    setGameBoard(lastState.gameBoard.map(pile => pile.map(card => ({ ...card }))));
    setDealPile(lastState.dealPile.map(card => ({ ...card })));
    setCompletedPiles(lastState.completedPiles.map(p => ({ ...p })));
    setScore(lastState.score);
    setCompletedSets(lastState.completedSets);
    setMoveCount(lastState.moveCount); // 이동 횟수 복원
    setGameWon(lastState.gameWon);

    // 드래그 관련 상태 초기화 (카드 흐림 현상 방지)
    setDragInfo(null);
    setDraggingCards(null);

    // 히스토리에서 마지막 상태 제거
    setGameHistory(prev => {
      const newHistory = prev.slice(0, -1);
      setCanUndo(newHistory.length > 0);
      return newHistory;
    });
  };

  // 히스토리 초기화 함수
  const clearHistory = () => {
    setGameHistory([]);
    setCanUndo(false);
  };

  // 자동 완성 가능 여부 확인 (모든 카드가 보이고, 딜 더미가 비어있을 때)
  const canAutoComplete = useCallback(() => {
    if (dealPile.length > 0) return false;
    if (gameWon) return false;

    // 모든 카드가 보이는지 확인
    for (const pile of gameBoard) {
      for (const card of pile) {
        if (!card.isVisible) return false;
      }
    }
    return true;
  }, [gameBoard, dealPile, gameWon]);

  // 자동 완성 실행
  const performAutoComplete = useCallback(async () => {
    if (isAutoCompleting || !canAutoComplete()) return;

    setIsAutoCompleting(true);

    const autoCompleteStep = () => {
      const newBoard = gameBoard.map(pile => [...pile]);
      let moved = false;

      // 완성된 세트 찾아서 제거
      for (let pileIndex = 0; pileIndex < newBoard.length; pileIndex++) {
        const pile = newBoard[pileIndex];
        if (pile.length >= 13) {
          const topCards = pile.slice(-13);
          if (isCompletedSet(topCards)) {
            pile.splice(-13);
            setGameBoard([...newBoard]);
            setCompletedSets(prev => {
              const newSets = prev + 1;
              if (newSets >= 8) {
                setGameWon(true);
                setIsAutoCompleting(false);
              }
              return newSets;
            });
            setScore(prev => prev + 100);
            moved = true;
            return true;
          }
        }
      }

      // 같은 무늬의 연속 카드를 합칠 수 있는지 확인
      for (let sourcePileIndex = 0; sourcePileIndex < newBoard.length; sourcePileIndex++) {
        const sourcePile = newBoard[sourcePileIndex];
        if (sourcePile.length === 0) continue;

        // 이동 가능한 카드 그룹 찾기
        let startIndex = sourcePile.length - 1;
        for (let i = sourcePile.length - 2; i >= 0; i--) {
          const current = sourcePile[i + 1];
          const prev = sourcePile[i];
          if (prev.suit === current.suit &&
              getRankValue(prev.rank) === getRankValue(current.rank) + 1) {
            startIndex = i;
          } else {
            break;
          }
        }

        const movingCards = sourcePile.slice(startIndex);

        // 최적의 타겟 찾기 (같은 무늬로 연결 가능한 곳)
        for (let targetPileIndex = 0; targetPileIndex < newBoard.length; targetPileIndex++) {
          if (sourcePileIndex === targetPileIndex) continue;

          const targetPile = newBoard[targetPileIndex];
          if (targetPile.length === 0) continue;

          const topCard = targetPile[targetPile.length - 1];
          const bottomCard = movingCards[0];

          // 같은 무늬이고 순서가 맞으면 이동
          if (topCard.suit === bottomCard.suit &&
              getRankValue(topCard.rank) === getRankValue(bottomCard.rank) + 1) {
            // 애니메이션 설정
            setAnimatingCard({
              from: sourcePileIndex,
              to: targetPileIndex,
              cards: movingCards
            });

            setTimeout(() => {
              sourcePile.splice(startIndex);
              targetPile.push(...movingCards);
              setGameBoard([...newBoard]);
              setAnimatingCard(null);
              setMoveCount(prev => prev + 1);
            }, 200);

            moved = true;
            return true;
          }
        }
      }

      return moved;
    };

    // 반복적으로 자동 완성 실행
    const runAutoComplete = () => {
      if (gameWon) {
        setIsAutoCompleting(false);
        return;
      }

      const moved = autoCompleteStep();
      if (moved && !gameWon) {
        setTimeout(runAutoComplete, 300);
      } else {
        setIsAutoCompleting(false);
      }
    };

    runAutoComplete();
  }, [gameBoard, isAutoCompleting, canAutoComplete, gameWon]);

  // 자동 완성 가능 시 버튼 표시를 위한 useEffect
  useEffect(() => {
    // 자동 완성 조건이 충족되면 알림
  }, [canAutoComplete]);

  // 게임 승리 시 저장 데이터 삭제
  useEffect(() => {
    if (gameWon) {
      clearSavedGame();
      setSavedGame(null);
    }
  }, [gameWon]);

  // 카드 더블클릭/탭 시 자동 이동
  const handleCardDoubleClick = useCallback((pileIndex, cardIndex) => {
    if (isAutoCompleting) return;

    const pile = gameBoard[pileIndex];
    const card = pile[cardIndex];

    // 보이지 않는 카드는 이동 불가
    if (!card.isVisible) return;

    // 드래그 가능한 카드 그룹 찾기 (같은 무늬의 연속된 카드)
    let startIndex = cardIndex;
    for (let i = cardIndex; i < pile.length - 1; i++) {
      const current = pile[i];
      const next = pile[i + 1];
      if (current.suit !== next.suit ||
          getRankValue(current.rank) !== getRankValue(next.rank) + 1) {
        return; // 연속되지 않으면 이동 불가
      }
    }

    const movingCards = pile.slice(startIndex);

    // 최적의 타겟 더미 찾기
    let bestTarget = -1;
    let bestScore = -1;

    for (let targetIndex = 0; targetIndex < gameBoard.length; targetIndex++) {
      if (targetIndex === pileIndex) continue;

      const targetPile = gameBoard[targetIndex];

      // 빈 더미인 경우
      if (targetPile.length === 0) {
        // King이 아니면 빈 더미로 이동은 낮은 우선순위
        if (movingCards[0].rank === 'K' && bestScore < 1) {
          bestTarget = targetIndex;
          bestScore = 1;
        } else if (bestScore < 0) {
          bestTarget = targetIndex;
          bestScore = 0;
        }
        continue;
      }

      const topCard = targetPile[targetPile.length - 1];
      const bottomCard = movingCards[0];

      // 순서가 맞는지 확인
      if (getRankValue(topCard.rank) === getRankValue(bottomCard.rank) + 1) {
        // 같은 무늬면 높은 점수
        if (topCard.suit === bottomCard.suit) {
          if (bestScore < 10) {
            bestTarget = targetIndex;
            bestScore = 10;
          }
        } else if (bestScore < 5) {
          // 다른 무늬는 중간 점수
          bestTarget = targetIndex;
          bestScore = 5;
        }
      }
    }

    // 이동 가능한 타겟이 있으면 이동
    if (bestTarget !== -1) {
      // 애니메이션과 함께 이동
      setAnimatingCard({
        from: pileIndex,
        to: bestTarget,
        cards: movingCards,
        startIndex: startIndex
      });

      // 상태 저장
      saveGameState();

      setTimeout(() => {
        const newBoard = gameBoard.map(p => [...p]);
        newBoard[pileIndex].splice(startIndex);
        newBoard[bestTarget].push(...movingCards);

        // 소스 더미의 다음 카드 공개
        if (newBoard[pileIndex].length > 0 &&
            !newBoard[pileIndex][newBoard[pileIndex].length - 1].isVisible) {
          newBoard[pileIndex][newBoard[pileIndex].length - 1].isVisible = true;
        }

        setGameBoard(newBoard);
        setScore(prev => Math.max(0, prev - 1));
        setMoveCount(prev => prev + 1);
        setAnimatingCard(null);

        // 완성된 세트 확인
        checkAndRemoveCompletedSets(newBoard);
      }, 250);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameBoard, isAutoCompleting, saveGameState]);

  // 터치 드래그 클린업 (컴포넌트 언마운트 시)
  useEffect(() => {
    return () => {
      if (ghostRef.current) {
        document.body.removeChild(ghostRef.current);
        ghostRef.current = null;
      }
    };
  }, []);

  // 게임 초기화를 게임 시작될 때만 실행하도록 수정
  useEffect(() => {
    // 게임이 시작되지 않았으면 초기화하지 않음
  }, []);

  // 레벨별 카드 덱 생성
  const createDeckByLevel = (level) => {
    let suits = [];

    switch(level) {
      case 'beginner':
        suits = ['♠']; // 1가지 무늬만
        break;
      case 'intermediate':
        suits = ['♠', '♥']; // 2가지 무늬
        break;
      case 'advanced':
        suits = ['♠', '♥', '♦', '♣']; // 4가지 무늬 (원래 게임)
        break;
      default:
        suits = ['♠', '♥', '♦', '♣'];
    }

    const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    let deck = [];

    // 레벨에 따라 덱 생성
    if (level === 'beginner') {
      // 1가지 무늬로 104장을 만들기 위해 8덱 생성
      for (let i = 0; i < 8; i++) {
        ranks.forEach(rank => {
          deck.push({ suit: '♠', rank, isVisible: false });
        });
      }
    } else if (level === 'intermediate') {
      // 2가지 무늬로 104장을 만들기 위해 4덱 생성
      const intermediateSuits = ['♠', '♥'];
      for (let i = 0; i < 4; i++) {
        intermediateSuits.forEach(suit => {
          ranks.forEach(rank => {
            deck.push({ suit, rank, isVisible: false });
          });
        });
      }
    } else {
      // 고급: 4가지 무늬로 2덱 생성 (총 104장)
      for (let i = 0; i < 2; i++) {
        suits.forEach(suit => {
          ranks.forEach(rank => {
            deck.push({ suit, rank, isVisible: false });
          });
        });
      }
    }

    return deck;
  };

  // 레벨 선택 핸들러
  const handleLevelSelect = (level) => {
    // 새 게임 시작 시 저장된 게임 삭제
    clearSavedGame();
    setSavedGame(null);
    setGameLevel(level);
    setGameStarted(true);
    initializeGame(level);
  };

  // 저장된 게임 이어하기 핸들러
  const handleContinueGame = () => {
    const saved = loadSavedGame();
    if (!saved) return;

    // 저장된 상태 복원
    setGameBoard(saved.gameBoard.map(pile => pile.map(card => ({ ...card }))));
    setDealPile(saved.dealPile.map(card => ({ ...card })));
    setCompletedPiles(saved.completedPiles ? saved.completedPiles.map(p => ({ ...p })) : []);
    setScore(saved.score);
    setCompletedSets(saved.completedSets);
    setMoveCount(saved.moveCount || 0);
    setGameLevel(saved.gameLevel);
    setGameTime(saved.gameTime || 0);
    setMagicWandCount(saved.magicWandCount || 4);
    setGameStarted(true);
    setGameWon(false);
    setTimerActive(true);

    // 초기 상태도 복원
    if (saved.initialGameBoard) {
      setInitialGameBoard(saved.initialGameBoard.map(pile => pile.map(card => ({ ...card }))));
    }
    if (saved.initialDealPile) {
      setInitialDealPile(saved.initialDealPile.map(card => ({ ...card })));
    }

    // 히스토리 초기화
    clearHistory();
  };

  // 게임 초기화 함수 수정
  const initializeGame = (level = gameLevel) => {
    // 레벨별 카드 덱 생성
    let deck = createDeckByLevel(level);

    // 카드 섞기
    deck = shuffleDeck(deck);
    
    // 8개 더미에 카드 배치 (54장)
    const piles = [];
    let cardIndex = 0;
    
    for (let i = 0; i < 8; i++) {
      const pileSize = i < 4 ? 6 : 5; // 처음 4개는 6장, 나머지는 5장
      const pile = [];
      
      for (let j = 0; j < pileSize; j++) {
        const card = deck[cardIndex++];
        card.isVisible = j === pileSize - 1; // 맨 위 카드만 보이게
        pile.push(card);
      }
      piles.push(pile);
    }
    
    // 남은 카드들은 딜 더미에 (50장)
    const remainingCards = deck.slice(cardIndex);

    // 초기 상태를 깊은 복사로 저장
    const deepCopyBoard = piles.map(pile =>
      pile.map(card => ({ ...card }))
    );
    const deepCopyDeal = remainingCards.map(card => ({ ...card }));

    setGameBoard(piles);
    setDealPile(remainingCards);
    setCompletedPiles([]); // 완성된 세트 초기화
    setInitialGameBoard(deepCopyBoard); // 초기 게임 보드 저장
    setInitialDealPile(deepCopyDeal); // 초기 딜 더미 저장
    setScore(500);
    setCompletedSets(0);
    setGameWon(false);
    setGameTime(0);
    setTimerActive(true);
    setMagicWandCount(4);
  };

  const shuffleDeck = (deck) => {
    const shuffled = [...deck];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // 드래그 시작
  const handleDragStart = (pileIndex, cardIndex) => {
    const draggedCards = gameBoard[pileIndex].slice(cardIndex);
    const dragInfo = {
      sourcePile: pileIndex,
      startIndex: cardIndex,
      cards: draggedCards
    };

    setDragInfo(dragInfo);

    // 드래그 중인 카드들의 정보를 저장
    setDraggingCards({
      pileIndex: pileIndex,
      startIndex: cardIndex
    });
  };

  // 드래그 종료
  const handleDragEnd = () => {
    setTimeout(() => {
      if (dragInfo) {
        setDragInfo(null);
      }
      // 드래그 시각 효과 제거
      setDraggingCards(null);
    }, 100);
  };

  // 터치 드래그 시작
  const handleTouchDragStart = (pileIndex, cardIndex, x, y) => {
    const draggedCards = gameBoard[pileIndex].slice(cardIndex);
    const newDragInfo = {
      sourcePile: pileIndex,
      startIndex: cardIndex,
      cards: draggedCards
    };

    setDragInfo(newDragInfo);
    setDraggingCards({
      pileIndex: pileIndex,
      startIndex: cardIndex
    });
    setTouchDrag({
      startX: x,
      startY: y,
      currentX: x,
      currentY: y,
      pileIndex,
      cardIndex,
      cards: draggedCards
    });

    // 고스트 엘리먼트 생성
    createTouchGhost(draggedCards, x, y);
  };

  // 터치 고스트 엘리먼트 생성
  const createTouchGhost = (cards, x, y) => {
    // 기존 고스트 제거
    if (ghostRef.current) {
      document.body.removeChild(ghostRef.current);
    }

    const ghost = document.createElement('div');
    ghost.style.position = 'fixed';
    ghost.style.left = `${x - 40}px`;
    ghost.style.top = `${y - 30}px`;
    ghost.style.width = '80px';
    ghost.style.height = `${90 + (cards.length - 1) * 18}px`;
    ghost.style.pointerEvents = 'none';
    ghost.style.zIndex = '10000';
    ghost.style.opacity = '0.9';

    cards.forEach((card, index) => {
      const cardEl = document.createElement('div');
      cardEl.style.position = 'absolute';
      cardEl.style.top = `${index * 18}px`;
      cardEl.style.left = '0';
      cardEl.style.width = '80px';
      cardEl.style.height = '90px';
      cardEl.style.borderRadius = '8px';
      cardEl.style.border = '2px solid #333';
      cardEl.style.display = 'flex';
      cardEl.style.alignItems = 'center';
      cardEl.style.justifyContent = 'center';
      cardEl.style.fontSize = '18px';
      cardEl.style.fontWeight = 'bold';
      cardEl.style.boxShadow = '0 4px 12px rgba(0,0,0,0.5)';
      cardEl.style.background = 'linear-gradient(135deg, #ffffff, #f0f0f0)';
      cardEl.style.color = (card.suit === '♥' || card.suit === '♦') ? '#d32f2f' : '#000';
      cardEl.textContent = `${card.rank}${card.suit}`;
      ghost.appendChild(cardEl);
    });

    document.body.appendChild(ghost);
    ghostRef.current = ghost;
  };

  // 터치 이동 핸들러
  const handleTouchMove = (e) => {
    if (!touchDrag) return;

    e.preventDefault();
    const touch = e.touches[0];

    setTouchDrag(prev => ({
      ...prev,
      currentX: touch.clientX,
      currentY: touch.clientY
    }));

    // 고스트 위치 업데이트
    if (ghostRef.current) {
      ghostRef.current.style.left = `${touch.clientX - 40}px`;
      ghostRef.current.style.top = `${touch.clientY - 30}px`;
    }
  };

  // 터치 종료 핸들러
  const handleTouchEnd = (e) => {
    if (!touchDrag || !dragInfo) {
      cleanupTouchDrag();
      return;
    }

    // 터치 위치에서 타겟 더미 찾기
    const x = touchDrag.currentX;
    const y = touchDrag.currentY;

    // 고스트 숨기기 (elementFromPoint가 고스트를 감지하지 않도록)
    if (ghostRef.current) {
      ghostRef.current.style.display = 'none';
    }

    const targetElement = document.elementFromPoint(x, y);
    let targetPileIndex = -1;

    // 카드 더미 찾기
    if (targetElement) {
      const pileElement = targetElement.closest('.card-pile');
      if (pileElement) {
        const piles = document.querySelectorAll('.card-pile');
        piles.forEach((pile, index) => {
          if (pile === pileElement) {
            targetPileIndex = index;
          }
        });
      }
    }

    // 드롭 처리
    if (targetPileIndex !== -1 && targetPileIndex !== dragInfo.sourcePile) {
      handleDrop(targetPileIndex);
    }

    cleanupTouchDrag();
  };

  // 터치 드래그 정리
  const cleanupTouchDrag = () => {
    if (ghostRef.current) {
      document.body.removeChild(ghostRef.current);
      ghostRef.current = null;
    }
    setTouchDrag(null);
    setDragInfo(null);
    setDraggingCards(null);
  };

  // 드롭 처리
  const handleDrop = (targetPileIndex) => {
    if (!dragInfo || dragInfo.sourcePile === targetPileIndex) {
      setDragInfo(null);
      return;
    }

    const newGameBoard = [...gameBoard];
    const sourcePile = newGameBoard[dragInfo.sourcePile];
    const targetPile = newGameBoard[targetPileIndex];

    // 이동 가능한지 확인
    if (canDropCards(dragInfo.cards, targetPile)) {
      // 카드 이동 전에 현재 상태를 히스토리에 저장
      saveGameState();

      // 카드 이동
      sourcePile.splice(dragInfo.startIndex);
      targetPile.push(...dragInfo.cards);

      // 소스 더미의 다음 카드를 보이게 만들기
      if (sourcePile.length > 0 && !sourcePile[sourcePile.length - 1].isVisible) {
        sourcePile[sourcePile.length - 1].isVisible = true;
      }

      setGameBoard(newGameBoard);
      setScore(prevScore => Math.max(0, prevScore - 1));
      setMoveCount(prev => prev + 1); // 이동 횟수 증가

      // 완성된 세트 확인 및 제거
      checkAndRemoveCompletedSets(newGameBoard);
    }

    setDragInfo(null);
  };

  // 카드를 놓을 수 있는지 확인
  const canDropCards = (draggedCards, targetPile) => {
    if (targetPile.length === 0) {
      return true; // 빈 더미에는 어떤 카드든 놓을 수 있음
    }

    const topCard = targetPile[targetPile.length - 1];
    const bottomDraggedCard = draggedCards[0];

    const topRank = getRankValue(topCard.rank);
    const bottomRank = getRankValue(bottomDraggedCard.rank);

    return topRank === bottomRank + 1; // 내림차순으로만 놓을 수 있음
  };

  // 완성된 세트 확인 및 제거 (K부터 A까지 같은 무늬)
  const checkAndRemoveCompletedSets = (board) => {
    const newBoard = [...board];
    let setsRemoved = 0;
    const removedSets = [];

    for (let pileIndex = 0; pileIndex < newBoard.length; pileIndex++) {
      const pile = newBoard[pileIndex];

      if (pile.length >= 13) {
        // 맨 위 13장 확인
        const topCards = pile.slice(-13);

        if (isCompletedSet(topCards)) {
          // 완성된 세트 제거 및 보관
          const set = pile.splice(-13);
          removedSets.push(set[0]); // K 카드만 보관 (표시용)
          setsRemoved++;

          // 다음 카드를 보이게 만들기
          if (pile.length > 0 && !pile[pile.length - 1].isVisible) {
            pile[pile.length - 1].isVisible = true;
          }
        }
      }
    }

    if (setsRemoved > 0) {
      setGameBoard(newBoard);
      setCompletedPiles(prev => [...prev, ...removedSets]);
      setCompletedSets(prev => prev + setsRemoved);
      setScore(prevScore => prevScore + (setsRemoved * 100));

      // 승리 조건 확인 (8세트 완성)
      if (completedSets + setsRemoved >= 8) {
        setGameWon(true);
      }
    }
  };

  // 완성된 세트인지 확인 (K부터 A까지 같은 무늬)
  const isCompletedSet = (cards) => {
    if (cards.length !== 13) return false;

    const firstSuit = cards[0].suit;

    for (let i = 0; i < 13; i++) {
      if (!cards[i].isVisible ||
          cards[i].suit !== firstSuit ||
          getRankValue(cards[i].rank) !== 13 - i) {
        return false;
      }
    }

    return true;
  };

  // 카드 클릭 처리 (뒤집힌 카드 클릭 시 앞면으로, 보이는 카드 클릭 시 자동 이동)
  const handleCardClick = (pileIndex, cardIndex) => {
    const newGameBoard = [...gameBoard];
    const card = newGameBoard[pileIndex][cardIndex];

    if (!card.isVisible && cardIndex === newGameBoard[pileIndex].length - 1) {
      // 카드를 뒤집기 전에 현재 상태를 히스토리에 저장
      saveGameState();

      card.isVisible = true;
      setGameBoard(newGameBoard);
    } else if (card.isVisible) {
      // 이미 보이는 카드를 클릭하면 자동 이동 실행
      handleCardDoubleClick(pileIndex, cardIndex);
    }
  };

  // 새 카드 배치 (딜 더미에서)
  const dealNewCards = () => {
    if (dealPile.length === 0) return;

    // 빈 더미가 있으면 딜할 수 없음
    const hasEmptyPile = gameBoard.some(pile => pile.length === 0);
    if (hasEmptyPile) {
      alert('빈 더미가 있을 때는 새 카드를 배치할 수 없습니다!');
      return;
    }

    // 새 카드 배치 전에 현재 상태를 히스토리에 저장
    saveGameState();

    // 드래그 관련 상태 완전 초기화 (투명 카드 버그 방지)
    setDragInfo(null);
    setDraggingCards(null);

    const newGameBoard = [...gameBoard];
    const newDealPile = [...dealPile];

    // 각 더미에 카드 하나씩 배치
    for (let i = 0; i < 8 && newDealPile.length > 0; i++) {
      const card = newDealPile.pop();
      card.isVisible = true;
      newGameBoard[i].push(card);
    }

    setGameBoard(newGameBoard);
    setDealPile(newDealPile);
    setScore(prevScore => Math.max(0, prevScore - 5));
    setMoveCount(prev => prev + 1); // 이동 횟수 증가

    // 완성된 세트 확인
    checkAndRemoveCompletedSets(newGameBoard);
  };

  // 게임 재시작 - 레벨 선택 화면으로 돌아가도록 수정
  const restartGame = () => {
    // 저장된 게임 삭제
    clearSavedGame();
    setSavedGame(null);

    setGameStarted(false);
    setGameLevel(null);
    setGameBoard([]);
    setDealPile([]);
    setScore(500);
    setCompletedSets(0);
    setGameWon(false);
    setDragInfo(null);
    setMoveCount(0); // 이동 횟수 초기화
    clearHistory(); // 히스토리 초기화
  };

  // 현재 레벨로 게임 재시작 (초기 상태로 복원하도록 수정)
  const restartCurrentLevel = () => {
    // 초기 상태를 깊은 복사로 복원
    const restoredBoard = initialGameBoard.map(pile =>
      pile.map(card => ({ ...card }))
    );
    const restoredDeal = initialDealPile.map(card => ({ ...card }));

    setGameBoard(restoredBoard);
    setDealPile(restoredDeal);
    setScore(500);
    setCompletedSets(0);
    setGameWon(false);
    setDragInfo(null);
    setMoveCount(0); // 이동 횟수 초기화
    clearHistory(); // 히스토리 초기화
  };

  // 레벨 이름 표시 함수
  const getLevelName = () => {
    switch(gameLevel) {
      case 'beginner':
        return '초급 (1가지 무늬)';
      case 'intermediate':
        return '중급 (2가지 무늬)';
      case 'advanced':
        return '고급 (4가지 무늬)';
      default:
        return '';
    }
  };

  // 게임 힌트 요청
  const requestHint = () => {
    // 이미 힌트를 보고 있는 경우에는 새로 요청하지 않음
    if (showingHint) return;

    // 가능한 모든 이동 경로 계산
    const possibleMoves = [];

    for (let sourcePileIndex = 0; sourcePileIndex < gameBoard.length; sourcePileIndex++) {
      const sourcePile = gameBoard[sourcePileIndex];
      if (sourcePile.length === 0) continue;

      // 드래그 가능한 카드 그룹들 찾기
      const draggableGroups = findDraggableGroups(sourcePile);

      for (const group of draggableGroups) {
        const draggedCards = sourcePile.slice(group.startIndex);

        // 다른 더미로 이동 가능한지 확인
        for (let targetPileIndex = 0; targetPileIndex < gameBoard.length; targetPileIndex++) {
          if (sourcePileIndex === targetPileIndex) continue;

          const targetPile = gameBoard[targetPileIndex];

          if (canDropCards(draggedCards, targetPile)) {
            // 이동의 유용성 점수 계산
            const moveScore = calculateMoveScore(sourcePileIndex, targetPileIndex, draggedCards, gameBoard);

            possibleMoves.push({
              from: sourcePileIndex,
              to: targetPileIndex,
              cards: draggedCards,
              startIndex: group.startIndex,
              score: moveScore,
              description: getMoveDescription(sourcePileIndex, targetPileIndex, draggedCards, gameBoard)
            });
          }
        }
      }
    }

    // 가능한 이동 경로가 없으면 힌트 없음
    if (possibleMoves.length === 0) {
      // 뒤집을 수 있는 카드가 있는지 확인
      const flipHint = findFlipHint();
      if (flipHint) {
        showFlipHint(flipHint);
        return;
      }

      // 현재 상태에서 이동 가능한 카드가 없음을 알림
      setShowingHint(true);
      showHintMessage('현재 이동 가능한 카드가 없습니다.');
      setTimeout(() => {
        setShowingHint(false);
      }, 3000);
      return;
    }

    // 점수가 가장 높은 이동을 선택
    possibleMoves.sort((a, b) => b.score - a.score);
    const hintMove = possibleMoves[0];

    setHintInfo(hintMove);
    setShowingHint(true);

    // 힌트 메시지 표시
    showHintMessage(hintMove.description);

    // 잠시 후 힌트 자동 제거
    setTimeout(() => {
      setHintInfo(null);
      setShowingHint(false);
    }, 5000);
  };

  // 드래그 가능한 카드 그룹들을 찾는 함수
  const findDraggableGroups = (pile) => {
    const groups = [];

    for (let i = pile.length - 1; i >= 0; i--) {
      if (!pile[i].isVisible) break;

      // 현재 위치부터 시작하는 연속된 같은 무늬 내림차순 그룹 찾기
      let startIndex = i;
      for (let j = i - 1; j >= 0; j--) {
        if (!pile[j].isVisible) break;

        const currentRank = getRankValue(pile[j + 1].rank);
        const prevRank = getRankValue(pile[j].rank);
        const currentSuit = pile[j + 1].suit;
        const prevSuit = pile[j].suit;

        if (currentRank === prevRank - 1 && currentSuit === prevSuit) {
          startIndex = j;
        } else {
          break;
        }
      }

      groups.push({ startIndex, length: i - startIndex + 1 });
      i = startIndex; // 다음 그룹 탐색을 위해 인덱스 조정
    }

    return groups;
  };

  // 이동의 유용성 점수를 계산하는 함수
  const calculateMoveScore = (fromPile, toPile, cards, board) => {
    let score = 0;

    // 1. 새 카드를 뒤집을 수 있으면 높은 점수
    if (board[fromPile].length > cards.length &&
        !board[fromPile][board[fromPile].length - cards.length - 1].isVisible) {
      score += 50;
    }

    // 2. 빈 더미로 이동하는 경우
    if (board[toPile].length === 0) {
      // King을 빈 더미로 이동하는 것은 좋음
      if (cards[0].rank === 'K') {
        score += 30;
      } else {
        score += 10; // 다른 카드는 낮은 점수
      }
    }

    // 3. 더 긴 연속된 카드 만들기
    const sequenceLength = getSequenceLength(cards);
    score += sequenceLength * 5;

    // 4. 완성된 세트에 가까워지는 정도
    if (cards[0].rank === 'K' && sequenceLength > 1) {
      score += sequenceLength * 10; // King으로 시작하는 긴 시퀀스는 높은 점수
    }

    // 5. 같은 더미 내에서 더 나은 정렬 만들기
    if (board[toPile].length > 0) {
      const topCard = board[toPile][board[toPile].length - 1];
      if (topCard.suit === cards[0].suit) {
        score += 20; // 같은 무늬로 연결되면 높은 점수
      }
    }

    return score;
  };

  // 카드 시퀀스 길이를 계산하는 함수
  const getSequenceLength = (cards) => {
    let length = 1;
    for (let i = 1; i < cards.length; i++) {
      const currentRank = getRankValue(cards[i].rank);
      const prevRank = getRankValue(cards[i - 1].rank);

      if (currentRank === prevRank - 1 && cards[i].suit === cards[i - 1].suit) {
        length++;
      } else {
        break;
      }
    }
    return length;
  };

  // 이동 설명을 생성하는 함수
  const getMoveDescription = (fromPile, toPile, cards, board) => {
    const fromPileName = `더미 ${fromPile + 1}`;
    const toPileName = `더미 ${toPile + 1}`;
    const cardDesc = `${cards[0].rank}${cards[0].suit}`;

    if (board[toPile].length === 0) {
      return `${cardDesc}${cards.length > 1 ? ` 등 ${cards.length}장` : ''}을 ${fromPileName}에서 빈 ${toPileName}로 이동`;
    } else {
      const targetCard = board[toPile][board[toPile].length - 1];
      return `${cardDesc}${cards.length > 1 ? ` 등 ${cards.length}장` : ''}을 ${fromPileName}에서 ${toPileName}의 ${targetCard.rank}${targetCard.suit} 위로 이동`;
    }
  };

  // 뒤집을 수 있는 카드 찾기
  const findFlipHint = () => {
    for (let pileIndex = 0; pileIndex < gameBoard.length; pileIndex++) {
      const pile = gameBoard[pileIndex];
      if (pile.length > 0 && !pile[pile.length - 1].isVisible) {
        return { pileIndex, cardIndex: pile.length - 1 };
      }
    }
    return null;
  };

  // 카드 뒤집기 힌트 표시
  const showFlipHint = (flipHint) => {
    setShowingHint(true);
    showHintMessage(`더미 ${flipHint.pileIndex + 1}의 뒤집힌 카드를 클릭해서 뒤집어보세요!`);

    // 해당 카드를 강조 표시 (임시)
    const tempHintInfo = {
      from: flipHint.pileIndex,
      to: -1,
      cards: [gameBoard[flipHint.pileIndex][flipHint.cardIndex]]
    };
    setHintInfo(tempHintInfo);

    setTimeout(() => {
      setHintInfo(null);
      setShowingHint(false);
    }, 3000);
  };

  // 힌트 메시지 표시 함수
  const showHintMessage = (message) => {
    // 기존 힌트 메시지 제거
    const existingMessage = document.querySelector('.hint-message');
    if (existingMessage) {
      existingMessage.remove();
    }

    // 새 힌트 메시지 생성
    const hintElement = document.createElement('div');
    hintElement.className = 'hint-message';
    hintElement.textContent = message;
    document.body.appendChild(hintElement);

    // 3초 후 메시지 제거
    setTimeout(() => {
      if (document.body.contains(hintElement)) {
        document.body.removeChild(hintElement);
      }
    }, 3000);
  };

  // 새 게임 시작 시 초기 상태로 복원
  useEffect(() => {
    if (gameStarted) {
      // 초기 상태를 깊은 복사로 저장
      const deepCopyBoard = gameBoard.map(pile =>
        pile.map(card => ({ ...card }))
      );
      const deepCopyDeal = dealPile.map(card => ({ ...card }));

      setInitialGameBoard(deepCopyBoard);
      setInitialDealPile(deepCopyDeal);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameStarted]);

  // 게임이 시작되지 않았으면 레벨 선택 화면 표시
  if (!gameStarted) {
    return (
      <div className="App">
        <LevelSelection
          onLevelSelect={handleLevelSelect}
          onContinueGame={handleContinueGame}
          savedGame={savedGame}
        />

        <div className="game-instructions">
          <h3>게임 방법:</h3>
          <ul>
            <li>같은 무늬의 카드를 K부터 A까지 순서대로 배치하면 자동으로 제거됩니다</li>
            <li>카드는 내림차순으로만 놓을 수 있습니다 (예: 7 위에 6)</li>
            <li>같은 무늬의 연속된 카드들만 함께 이동할 수 있습니다</li>
            <li>빈 더미에는 어떤 카드든 놓을 수 있습니다</li>
            <li>뒤집힌 카드를 클릭하면 앞면으로 뒤집힙니다</li>
            <li>8개의 세트를 모두 완성하면 승리합니다!</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <header className="game-header">
        <div className="header-top">
          <div className="foundation-piles">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="foundation-slot">
                {completedPiles[i] ? (
                  <div className={`card visible ${completedPiles[i].suit === '♥' || completedPiles[i].suit === '♦' ? 'red-suit' : 'black-suit'}`} 
                       data-rank={completedPiles[i].rank} 
                       data-suit={completedPiles[i].suit}
                       style={{ position: 'relative', left: 'auto', transform: 'none' }}>
                    {completedPiles[i].rank}{completedPiles[i].suit}
                  </div>
                ) : (
                  <div className="empty-foundation"></div>
                )}
              </div>
            ))}
          </div>
          <div className="game-stats-header">
            {settings.showTime && <div className="stat-item">시간: {formatTime(gameTime)}</div>}
            <div className="stat-item">점수: {score}</div>
            {settings.showMoves && <div className="stat-item">횟수: {moveCount}</div>}
          </div>
        </div>
      </header>

      {gameWon && (
        <div className="victory-message">
          🎉 축하합니다! {getLevelName()} 게임을 클리어했습니다! 🎉
          <br />
          최종 점수: {score}
        </div>
      )}

      <div className="main-game-container">
        <div
          className="game-board"
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {gameBoard.map((pile, index) => (
            <CardPile
              key={index}
              cards={pile}
              pileIndex={index}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDrop={handleDrop}
              onCardClick={handleCardClick}
              onDoubleClick={handleCardDoubleClick}
              draggingCards={draggingCards}
              gameBoard={gameBoard}
              hintInfo={hintInfo}
              showingHint={showingHint}
              onTouchDragStart={handleTouchDragStart}
              animatingCard={animatingCard}
            />
          ))}
        </div>

        <aside className="game-sidebar">
          <button className="sidebar-btn" onClick={() => setShowSettingsModal(true)}>
            <div className="btn-icon">⚙️</div>
            <div className="btn-text">설정</div>
          </button>
          <button className="sidebar-btn" onClick={() => {}}>
            <div className="btn-icon">🎨</div>
            <div className="btn-text">테마</div>
          </button>
          <button className="sidebar-btn" onClick={() => setShowDealModal(true)}>
            <div className="btn-icon">❤️</div>
            <div className="btn-text">놀이</div>
          </button>
          <button className="sidebar-btn" onClick={requestHint} disabled={showingHint}>
            <div className="btn-icon">❓</div>
            <div className="btn-text">힌트</div>
          </button>
          <button className="sidebar-btn" onClick={undoLastMove} disabled={!canUndo}>
            <div className="btn-icon">↩️</div>
            <div className="btn-text">되돌리기</div>
          </button>
          
          <div className="deal-pile-container" onClick={dealNewCards}>
            <div className={`deal-pile-visual ${dealPile.length === 0 ? 'empty' : ''}`}>
              🂠
            </div>
            <div className="deal-count">{Math.ceil(dealPile.length / 8)}</div>
          </div>
        </aside>
      </div>

      {showDealModal && (
        <Modal title="무슨 딜을 원하십니까?" onClose={() => setShowDealModal(false)}>
          <div className="deal-options">
            <button className="deal-option-btn magic-wand" onClick={() => {
              if (magicWandCount > 0) {
                setMagicWandCount(prev => prev - 1);
                requestHint();
                setShowDealModal(false);
              }
            }}>
              ✨ 마술 지팡이 사용({magicWandCount})
            </button>
            <button className="deal-option-btn" onClick={() => {
              initializeGame();
              setShowDealModal(false);
            }}>
              🟢 승리 거래
            </button>
            <button className="deal-option-btn" onClick={() => {
              initializeGame();
              setShowDealModal(false);
            }}>
              🎲 임의 거래
            </button>
            <button className="deal-option-btn" onClick={() => {
              restartCurrentLevel();
              setShowDealModal(false);
            }}>
              🔄 다시 하다
            </button>
          </div>
        </Modal>
      )}

      {showSettingsModal && (
        <Modal title="설정" onClose={() => setShowSettingsModal(false)}>
          <div className="settings-grid">
            <div className="setting-item">
              <span>시간/횟수 보기</span>
              <button 
                className={`toggle-btn ${settings.showTime ? 'on' : 'off'}`}
                onClick={() => setSettings(s => ({ ...s, showTime: !s.showTime, showMoves: !s.showTime }))}
              >
                {settings.showTime ? 'ON' : 'OFF'}
              </button>
            </div>
            <div className="setting-item">
              <span>잠금 방향</span>
              <button 
                className={`toggle-btn ${settings.lockOrientation ? 'on' : 'off'}`}
                onClick={() => setSettings(s => ({ ...s, lockOrientation: !s.lockOrientation }))}
              >
                {settings.lockOrientation ? 'ON' : 'OFF'}
              </button>
            </div>
            <div className="setting-item">
              <span>자동 완료</span>
              <button 
                className={`toggle-btn ${settings.autoComplete ? 'on' : 'off'}`}
                onClick={() => setSettings(s => ({ ...s, autoComplete: !s.autoComplete }))}
              >
                {settings.autoComplete ? 'ON' : 'OFF'}
              </button>
            </div>
            <div className="setting-item">
              <span>탭으로 옮기기</span>
              <button 
                className={`toggle-btn ${settings.tapToMove ? 'on' : 'off'}`}
                onClick={() => setSettings(s => ({ ...s, tapToMove: !s.tapToMove }))}
              >
                {settings.tapToMove ? 'ON' : 'OFF'}
              </button>
            </div>
            <hr />
            <button className="menu-link-btn" onClick={restartGame}>다른 난이도 선택</button>
            <button className="menu-link-btn">통계 {'>'}</button>
            <button className="menu-link-btn">규칙 {'>'}</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default App;
