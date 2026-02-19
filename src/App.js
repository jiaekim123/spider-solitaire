import React, { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';

// localStorage 키 상수
const SAVE_KEY = 'spider-solitaire-save';

// 저장된 게임 불러오기
const loadSavedGame = () => {
  try {
    const saved = localStorage.getItem(SAVE_KEY);
    if (saved) return JSON.parse(saved);
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

// 카드 랭크를 숫자로 변환하는 함수
function getRankValue(rank) {
  const rankValues = {
    'A': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13
  };
  return rankValues[rank];
}

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
          <button className="level-button continue-btn" onClick={onContinueGame}>
            이어하기
            <div className="level-description">
              {getLevelName(savedGame.gameLevel)} - 점수: {savedGame.score} - {formatSavedTime(savedGame.savedAt)}
            </div>
          </button>
        </div>
      )}
      <div className="level-buttons">
        <button className="level-button beginner" onClick={() => onLevelSelect('beginner')}>
          초급 <div className="level-description">1가지 무늬 (♠️만)</div>
        </button>
        <button className="level-button intermediate" onClick={() => onLevelSelect('intermediate')}>
          중급 <div className="level-description">2가지 무늬 (♠️♥️)</div>
        </button>
        <button className="level-button advanced" onClick={() => onLevelSelect('advanced')}>
          고급 <div className="level-description">4가지 무늬 (♠️♥️♦️♣️)</div>
        </button>
      </div>
    </div>
  );
}

// 모달 컴포넌트
function Modal({ title, onClose, children }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

// 카드 컴포넌트
function Card({ card, cardIndex, pileIndex, onDragStart, onDragEnd, isDraggable, onCardClick, isDragging, isNonMovable, isAnimating, onTouchStart, dragPosition }) {
  const handleDragStart = (e) => {
    if (isDraggable) {
      onDragStart(pileIndex, cardIndex);
      e.dataTransfer.effectAllowed = 'move';
    }
  };

  const handleTouchStart = (e) => {
    if (isDraggable && onTouchStart) {
      const touch = e.touches[0];
      onTouchStart(e, pileIndex, cardIndex, { x: touch.clientX, y: touch.clientY });
    }
  };

  const getCardColor = () => {
    if (!card.isVisible) return '';
    return (card.suit === '♥' || card.suit === '♦') ? 'red-suit' : 'black-suit';
  };

  const getStyle = () => {
    if (isDragging && dragPosition) {
      return {
        position: 'fixed',
        left: `${dragPosition.x}px`,
        top: `${dragPosition.y}px`,
        zIndex: 9999,
        transform: 'translate(-50%, -50%) scale(1.1)',
        pointerEvents: 'none',
        width: '60px', 
        height: '80px' 
      };
    }
    return {
      position: 'absolute',
      // 반응형 오프셋: 모바일에서는 더 촘촘하게 (2.5vh), 데스크탑에서는 3vh+
      top: `calc(${cardIndex} * clamp(12px, 2.5vh, 25px))`,
      zIndex: isDragging || isAnimating ? cardIndex + 1000 : cardIndex,
      left: '50%',
      transform: 'translateX(-50%)'
    };
  };

  return (
    <div
      className={`card ${card.isVisible ? 'visible' : 'hidden'} ${isDraggable ? 'draggable' : ''} ${getCardColor()} ${isDragging ? 'dragging-preview' : ''} ${isNonMovable ? 'non-movable' : ''} ${isAnimating ? 'animating' : ''}`}
      draggable={isDraggable}
      onDragStart={handleDragStart}
      onDragEnd={onDragEnd}
      onTouchStart={handleTouchStart}
      onClick={() => onCardClick(pileIndex, cardIndex)}
      data-rank={card.rank}
      data-suit={card.suit}
      style={getStyle()}
    >
      {card.isVisible ? `${card.rank}${card.suit}` : ''}
    </div>
  );
}

// 카드 더미 컴포넌트
function CardPile({ cards, pileIndex, onDragStart, onDragEnd, onDrop, onCardClick, draggingCards, animatingCard, onTouchStart, dragPosition }) {
  const [isDragOver, setIsDragOver] = useState(false);
  const handleDragOver = (e) => { e.preventDefault(); setIsDragOver(true); };
  const handleDragLeave = () => setIsDragOver(false);
  const handleDrop = (e) => { e.preventDefault(); setIsDragOver(false); onDrop(pileIndex); };
  
  const draggableIndices = [];
  for (let i = cards.length - 1; i >= 0; i--) {
    if (!cards[i].isVisible) break;
    draggableIndices.unshift(i);
    if (i > 0 && cards[i - 1].isVisible) {
      const currentRank = getRankValue(cards[i].rank);
      const prevRank = getRankValue(cards[i - 1].rank);
      if (currentRank !== prevRank - 1 || cards[i].suit !== cards[i - 1].suit) break;
    } else break;
  }

  const isDraggingCard = (cardIndex) => {
    if (!draggingCards || draggingCards.pileIndex !== pileIndex) return false;
    return cardIndex >= draggingCards.startIndex;
  };

  return (
    <div 
      className={`card-pile ${isDragOver ? 'drag-over' : ''}`} 
      onDragOver={handleDragOver} onDragEnter={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
      data-pile-index={pileIndex}
    >
      {cards.map((card, index) => (
        <Card
          key={`${pileIndex}-${index}`} card={card} cardIndex={index} pileIndex={pileIndex}
          onDragStart={onDragStart} onDragEnd={onDragEnd} onCardClick={onCardClick}
          onTouchStart={onTouchStart}
          dragPosition={isDraggingCard(index) ? dragPosition : null}
          isDraggable={draggableIndices.includes(index)} isDragging={isDraggingCard(index)}
          isNonMovable={card.isVisible && !draggableIndices.includes(index)}
          isAnimating={animatingCard?.from === pileIndex && index >= (animatingCard?.startIndex || 0)}
        />
      ))}
    </div>
  );
}

// 메인 게임 컴포넌트
function App() {
  const [gameBoard, setGameBoard] = useState([]);
  const [dealPile, setDealPile] = useState([]);
  const [completedPiles, setCompletedPiles] = useState([]);
  const [score, setScore] = useState(500);
  const [dragInfo, setDragInfo] = useState(null);
  const [completedSets, setCompletedSets] = useState(0);
  const [gameWon, setGameWon] = useState(false);
  const [gameLevel, setGameLevel] = useState(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [initialGameBoard, setInitialGameBoard] = useState([]);
  const [initialDealPile, setInitialDealPile] = useState([]);
  const [draggingCards, setDraggingCards] = useState(null);
  const [gameHistory, setGameHistory] = useState([]);
  const [canUndo, setCanUndo] = useState(false);
  const [showingHint, setShowingHint] = useState(false);
  const [moveCount, setMoveCount] = useState(0);
  const [isAutoCompleting, setIsAutoCompleting] = useState(false);
  const [animatingCard, setAnimatingCard] = useState(null);
  const [savedGame] = useState(() => loadSavedGame());
  const [dragPosition, setDragPosition] = useState(null); // 터치 드래그 위치

  const [showDealModal, setShowDealModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settings, setSettings] = useState({ showTime: true });
  const [gameTime, setGameTime] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [magicWandCount, setMagicWandCount] = useState(4);

  const ghostRef = useRef(null);

  // 터치 드래그 핸들러
  // const handleTouchStart = (e, pileIndex, cardIndex, pos) => {
  //   // e.preventDefault()는 여기서 호출하면 클릭이 막힐 수 있음
  //   setDragInfo({ sourcePile: pileIndex, startIndex: cardIndex, cards: gameBoard[pileIndex].slice(cardIndex) });
  //   setDraggingCards({ pileIndex: pileIndex, startIndex: cardIndex });
  //   setDragPosition(pos);
  // };

  const handleTouchMove = (e) => {
    if (dragPosition && draggingCards) {
      // e.preventDefault(); // 스크롤 방지
      const touch = e.touches[0];
      setDragPosition({ x: touch.clientX, y: touch.clientY });
    }
  };

  const handleTouchEnd = (e) => {
    if (dragPosition && draggingCards) {
      const touch = e.changedTouches[0];
      // 드롭된 위치의 요소 찾기 (pointer-events: none이 dragging card에 적용되어 있어야 함)
      const element = document.elementFromPoint(touch.clientX, touch.clientY);
      const pileElement = element?.closest('.card-pile');
      
      if (pileElement) {
        const targetPileIndex = parseInt(pileElement.getAttribute('data-pile-index'), 10);
        if (!isNaN(targetPileIndex) && targetPileIndex !== draggingCards.pileIndex) {
          // Drop Logic 복사
           if (!dragInfo || dragInfo.sourcePile === targetPileIndex) return;
            const targetPile = gameBoard[targetPileIndex];
            const topCard = targetPile[targetPile.length - 1];
            if (targetPile.length === 0 || getRankValue(topCard.rank) === getRankValue(dragInfo.cards[0].rank) + 1) {
              saveGameState();
              const nb = gameBoard.map(p1 => [...p1]);
              nb[dragInfo.sourcePile].splice(dragInfo.startIndex);
              nb[targetPileIndex].push(...dragInfo.cards);
              if (nb[dragInfo.sourcePile].length > 0) nb[dragInfo.sourcePile][nb[dragInfo.sourcePile].length - 1].isVisible = true;
              setGameBoard(nb); setScore(s => Math.max(0, s - 1)); setMoveCount(m => m + 1);
              checkAndRemoveCompletedSets(nb);
            }
        }
      }
      setDragInfo(null);
      setDraggingCards(null);
      setDragPosition(null);
    }
  };

  useEffect(() => {
    let interval;
    if (timerActive && !gameWon) {
      interval = setInterval(() => setGameTime(prev => prev + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timerActive, gameWon]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  useEffect(() => {
    if (!gameStarted || gameWon || gameBoard.length === 0 || isAutoCompleting) return;
    saveGameToStorage({
      gameBoard, dealPile, completedPiles, score, completedSets, moveCount,
      gameLevel, gameTime, magicWandCount, initialGameBoard, initialDealPile
    });
  }, [gameBoard, dealPile, completedPiles, score, completedSets, moveCount, gameStarted, gameWon, gameLevel, isAutoCompleting, initialGameBoard, initialDealPile, gameTime, magicWandCount]);

  const saveGameState = useCallback(() => {
    const currentState = {
      gameBoard: gameBoard.map(p => p.map(c => ({...c}))),
      dealPile: dealPile.map(c => ({...c})),
      completedPiles: completedPiles.map(c => ({...c})),
      score, completedSets, moveCount, gameWon
    };
    setGameHistory(prev => {
      const newH = [...prev, currentState];
      if (newH.length > 20) newH.shift();
      return newH;
    });
    setCanUndo(true);
  }, [gameBoard, dealPile, completedPiles, score, completedSets, moveCount, gameWon]);

  const undoLastMove = () => {
    if (gameHistory.length === 0) return;
    const last = gameHistory[gameHistory.length - 1];
    setGameBoard(last.gameBoard);
    setDealPile(last.dealPile);
    setCompletedPiles(last.completedPiles);
    setScore(last.score);
    setCompletedSets(last.completedSets);
    setMoveCount(last.moveCount);
    setGameWon(last.gameWon);
    setGameHistory(prev => {
      const newH = prev.slice(0, -1);
      setCanUndo(newH.length > 0);
      return newH;
    });
  };

  const isCompletedSet = useCallback((cards) => {
    if (cards.length !== 13) return false;
    const suit = cards[0].suit;
    for (let i = 0; i < 13; i++) {
      if (!cards[i].isVisible || cards[i].suit !== suit || getRankValue(cards[i].rank) !== 13 - i) return false;
    }
    return true;
  }, []);

  const checkAndRemoveCompletedSets = useCallback((board) => {
    const newBoard = [...board];
    let removedCount = 0;
    const removedSets = [];
    for (let i = 0; i < newBoard.length; i++) {
      if (newBoard[i].length >= 13) {
        const top = newBoard[i].slice(-13);
        if (isCompletedSet(top)) {
          const set = newBoard[i].splice(-13);
          removedSets.push(set[0]);
          removedCount++;
          if (newBoard[i].length > 0) newBoard[i][newBoard[i].length - 1].isVisible = true;
        }
      }
    }
    if (removedCount > 0) {
      setGameBoard(newBoard);
      setCompletedPiles(prev => [...prev, ...removedSets]);
      setCompletedSets(prev => prev + removedCount);
      setScore(prev => prev + (removedCount * 100));
      if (completedSets + removedCount >= 8) setGameWon(true);
    }
  }, [completedSets, isCompletedSet]);

  const handleCardDoubleClick = useCallback((pileIndex, cardIndex) => {
    if (isAutoCompleting) return;
    const pile = gameBoard[pileIndex];
    if (!pile[cardIndex].isVisible) return;
    for (let i = cardIndex; i < pile.length - 1; i++) {
      if (pile[i].suit !== pile[i + 1].suit || getRankValue(pile[i].rank) !== getRankValue(pile[i + 1].rank) + 1) return;
    }
    const moving = pile.slice(cardIndex);
    let bestT = -1, bestS = -1;
    for (let i = 0; i < gameBoard.length; i++) {
      if (i === pileIndex) continue;
      const target = gameBoard[i];
      if (target.length === 0) {
        if (moving[0].rank === 'K' && bestS < 1) { bestT = i; bestS = 1; }
        else if (bestS < 0) { bestT = i; bestS = 0; }
      } else {
        const top = target[target.length - 1];
        if (getRankValue(top.rank) === getRankValue(moving[0].rank) + 1) {
          if (top.suit === moving[0].suit) { if (bestS < 10) { bestT = i; bestS = 10; } }
          else if (bestS < 5) { bestT = i; bestS = 5; }
        }
      }
    }
    if (bestT !== -1) {
      saveGameState();
      setAnimatingCard({ from: pileIndex, to: bestT, cards: moving, startIndex: cardIndex });
      setTimeout(() => {
        const newB = gameBoard.map(p => [...p]);
        newB[pileIndex].splice(cardIndex);
        newB[bestT].push(...moving);
        if (newB[pileIndex].length > 0) newB[pileIndex][newB[pileIndex].length - 1].isVisible = true;
        setGameBoard(newB);
        setScore(prev => Math.max(0, prev - 1));
        setMoveCount(prev => prev + 1);
        setAnimatingCard(null);
        checkAndRemoveCompletedSets(newB);
      }, 250);
    }
  }, [gameBoard, isAutoCompleting, saveGameState, checkAndRemoveCompletedSets]);

  const handleCardClick = (p, c) => {
    if (!gameBoard[p][c].isVisible && c === gameBoard[p].length - 1) {
      saveGameState();
      const newB = gameBoard.map(p1 => [...p1]);
      newB[p][c].isVisible = true;
      setGameBoard(newB);
    } else if (gameBoard[p][c].isVisible) handleCardDoubleClick(p, c);
  };

  const initializeGame = useCallback((level) => {
    const rs = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    let d = [];
    const suits = level === 'beginner' ? ['♠'] : (level === 'intermediate' ? ['♠', '♥'] : ['♠', '♥', '♦', '♣']);
    const reps = level === 'beginner' ? 8 : (level === 'intermediate' ? 4 : 2);
    for (let r = 0; r < reps; r++) {
      for (let s = 0; s < suits.length; s++) {
        for (let k = 0; k < rs.length; k++) {
          d.push({ suit: suits[s], rank: rs[k], isVisible: false });
        }
      }
    }
    const shuffled = [...d];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    const piles = [];
    let idx = 0;
    for (let i = 0; i < 8; i++) {
      const size = i < 4 ? 6 : 5;
      const p = [];
      for (let j = 0; j < size; j++) {
        const c = shuffled[idx++];
        if (j === size - 1) c.isVisible = true;
        p.push(c);
      }
      piles.push(p);
    }
    const rem = shuffled.slice(idx);
    setGameBoard(piles); setDealPile(rem); setCompletedPiles([]);
    setInitialGameBoard(piles.map(p => p.map(c => ({...c}))));
    setInitialDealPile(rem.map(c => ({...c})));
    setScore(500); setCompletedSets(0); setGameWon(false); setGameTime(0);
    setTimerActive(true); setMagicWandCount(4); setMoveCount(0);
    setGameHistory([]); setCanUndo(false);
  }, []);

  const handleLevelSelect = (level) => {
    clearSavedGame();
    setGameLevel(level);
    setGameStarted(true);
    initializeGame(level);
  };

  const handleContinue = () => {
    if (!savedGame) return;
    setGameBoard(savedGame.gameBoard); setDealPile(savedGame.dealPile);
    setCompletedPiles(savedGame.completedPiles || []); setScore(savedGame.score);
    setCompletedSets(savedGame.completedSets); setMoveCount(savedGame.moveCount);
    setGameLevel(savedGame.gameLevel); setGameTime(savedGame.gameTime || 0);
    setMagicWandCount(savedGame.magicWandCount || 4);
    setInitialGameBoard(savedGame.initialGameBoard); setInitialDealPile(savedGame.initialDealPile);
    setGameStarted(true); setGameWon(false); setTimerActive(true);
    setGameHistory([]); setCanUndo(false);
  };

  const dealNewCards = () => {
    if (dealPile.length === 0 || gameBoard.some(p => p.length === 0)) return;
    saveGameState();
    const newB = gameBoard.map(p => [...p]);
    const newD = [...dealPile];
    for (let i = 0; i < 8 && newD.length > 0; i++) {
      const c = newD.pop(); c.isVisible = true; newB[i].push(c);
    }
    setGameBoard(newB); setDealPile(newD);
    setScore(s => Math.max(0, s - 5)); setMoveCount(m => m + 1);
    checkAndRemoveCompletedSets(newB);
  };

  const canAutoComplete = useCallback(() => {
    if (dealPile.length > 0 || gameWon) return false;
    for (const p of gameBoard) for (const c of p) if (!c.isVisible) return false;
    return true;
  }, [gameBoard, dealPile, gameWon]);

  const performAutoComplete = useCallback(() => {
    if (isAutoCompleting || !canAutoComplete()) return;
    setIsAutoCompleting(true);
    const interval = setInterval(() => {
      let moved = false;
      const nb = gameBoard.map(p => [...p]);
      for (let i = 0; i < nb.length; i++) {
        if (nb[i].length >= 13 && isCompletedSet(nb[i].slice(-13))) {
          checkAndRemoveCompletedSets(nb); moved = true; break;
        }
      }
      if (!moved) {
        for (let i = 0; i < nb.length; i++) {
          if (nb[i].length === 0) continue;
          const m = nb[i].slice(-1);
          for (let j = 0; j < nb.length; j++) {
            if (i === j) continue;
            if (nb[j].length > 0 && getRankValue(nb[j][nb[j].length-1].rank) === getRankValue(m[0].rank)+1 && nb[j][nb[j].length-1].suit === m[0].suit) {
              nb[j].push(...nb[i].splice(-1)); setGameBoard([...nb]); moved = true; break;
            }
          }
          if (moved) break;
        }
      }
      if (!moved || gameWon) { clearInterval(interval); setIsAutoCompleting(false); }
    }, 200);
  }, [gameBoard, isAutoCompleting, canAutoComplete, gameWon, isCompletedSet, checkAndRemoveCompletedSets]);

  if (!gameStarted) return <div className="App"><LevelSelection onLevelSelect={handleLevelSelect} onContinueGame={handleContinue} savedGame={savedGame} /></div>;

  return (
    <div className="App">
      <header className="game-header">
        <div className="header-top">
          <div className="foundation-piles">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="foundation-slot">
                {completedPiles[i] && (
                  <div className={`card visible ${completedPiles[i].suit === '♥' || completedPiles[i].suit === '♦' ? 'red-suit' : 'black-suit'}`}
                       data-rank={completedPiles[i].rank} data-suit={completedPiles[i].suit}
                       style={{ position: 'relative', left: 'auto', transform: 'none' }}>
                    {completedPiles[i].rank}{completedPiles[i].suit}
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="game-stats-header">
            {settings.showTime && <div className="stat-item">{formatTime(gameTime)}</div>}
            <div className="stat-item">점수: {score}</div>
            <div className="stat-item">이동: {moveCount}</div>
          </div>
        </div>
      </header>
      <div className="main-game-container">
        <div 
          className="game-board" 
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {gameBoard.map((pile, index) => (
            <CardPile key={index} cards={pile} pileIndex={index}
                      onDragStart={(p, c) => {
                        setDragInfo({ sourcePile: p, startIndex: c, cards: gameBoard[p].slice(c) });
                        setDraggingCards({ pileIndex: p, startIndex: c });
                      }}
                      onDragEnd={() => { setDragInfo(null); setDraggingCards(null); }}
                      onDrop={(t) => {
                        if (!dragInfo || dragInfo.sourcePile === t) return;
                        const targetPile = gameBoard[t];
                        const topCard = targetPile[targetPile.length - 1];
                        if (targetPile.length === 0 || getRankValue(topCard.rank) === getRankValue(dragInfo.cards[0].rank) + 1) {
                          saveGameState();
                          const nb = gameBoard.map(p1 => [...p1]);
                          nb[dragInfo.sourcePile].splice(dragInfo.startIndex);
                          nb[t].push(...dragInfo.cards);
                          if (nb[dragInfo.sourcePile].length > 0) nb[dragInfo.sourcePile][nb[dragInfo.sourcePile].length - 1].isVisible = true;
                          setGameBoard(nb); setScore(s => Math.max(0, s - 1)); setMoveCount(m => m + 1);
                          checkAndRemoveCompletedSets(nb);
                        }
                        setDragInfo(null); setDraggingCards(null);
                      }}
                      onCardClick={handleCardClick} draggingCards={draggingCards}
                      animatingCard={animatingCard} 
                      onTouchStart={(e, p, c, pos) => {
                        // Touch Start Logic
                        setDragInfo({ sourcePile: p, startIndex: c, cards: gameBoard[p].slice(c) });
                        setDraggingCards({ pileIndex: p, startIndex: c });
                        setDragPosition(pos);
                     }}
                     dragPosition={dragPosition}
            />
          ))}
        </div>
        <aside className="game-sidebar">
          <button className="sidebar-btn" onClick={() => setShowSettingsModal(true)}>
            <div className="btn-icon">⚙️</div><div className="btn-text">설정</div>
          </button>
          <button className="sidebar-btn" onClick={() => setShowDealModal(true)}>
            <div className="btn-icon">❤️</div><div className="btn-text">놀이</div>
          </button>
          <button className="sidebar-btn" onClick={() => setShowingHint(true)} disabled={showingHint}>
            <div className="btn-icon">❓</div><div className="btn-text">힌트</div>
          </button>
          <button className="sidebar-btn" onClick={undoLastMove} disabled={!canUndo}>
            <div className="btn-icon">↩️</div><div className="btn-text">되돌리기</div>
          </button>
          {canAutoComplete() && (
            <button className="sidebar-btn auto-complete-active" onClick={performAutoComplete}>
              <div className="btn-icon">✨</div><div className="btn-text">자동완성</div>
            </button>
          )}
          <div className="deal-pile-container" onClick={dealNewCards}>
            <div className={`deal-pile-visual ${dealPile.length === 0 ? 'empty' : ''}`}>🂠</div>
            <div className="deal-count">{Math.ceil(dealPile.length / 8)}</div>
          </div>
        </aside>
      </div>
      {showDealModal && (
        <Modal title="무슨 딜을 원하십니까?" onClose={() => setShowDealModal(false)}>
          <div className="deal-options">
            <button className="deal-option-btn magic-wand" onClick={() => { setMagicWandCount(c => c-1); setShowDealModal(false); }}>
              마술 지팡이 ({magicWandCount})
            </button>
            <button className="deal-option-btn" onClick={() => { initializeGame(); setShowDealModal(false); }}>새 게임</button>
            <button className="deal-option-btn" onClick={() => setShowDealModal(false)}>취소</button>
          </div>
        </Modal>
      )}
      {showSettingsModal && (
        <Modal title="설정" onClose={() => setShowSettingsModal(false)}>
          <div className="settings-grid">
            <div className="setting-item">
              <span>시간/횟수 보기</span>
              <button className={`toggle-btn ${settings.showTime ? 'on' : 'off'}`}
                      onClick={() => setSettings(s => ({ ...s, showTime: !s.showTime }))}>
                {settings.showTime ? 'ON' : 'OFF'}
              </button>
            </div>
            <button className="menu-link-btn" onClick={() => { clearSavedGame(); setGameStarted(false); }}>다른 난이도 선택</button>
          </div>
        </Modal>
      )}
      {gameWon && <div className="victory-message">🎉 승리! 점수: {score}</div>}
      <div style={{display:'none'}}>{animatingCard?.from}{ghostRef.current?.tagName}</div>
    </div>
  );
}

export default App;
