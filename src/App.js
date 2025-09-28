import React, { useState, useEffect } from 'react';
import './App.css';

// 카드 컴포넌트 - 드래그 기능 추가
function Card({ card, cardIndex, pileIndex, onDragStart, onDragEnd, isDraggable, onCardClick }) {
  const handleDragStart = (e) => {
    if (isDraggable) {
      onDragStart(pileIndex, cardIndex);
      e.dataTransfer.effectAllowed = 'move';
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

  // 카드 색상 결정 (빨간색: ♥♦, 검은색: ♠♣)
  const getCardColor = () => {
    if (!card.isVisible) return '';
    return (card.suit === '♥' || card.suit === '♦') ? 'red-suit' : 'black-suit';
  };

  return (
    <div 
      className={`card ${card.isVisible ? 'visible' : 'hidden'} ${isDraggable ? 'draggable' : ''} ${getCardColor()}`}
      draggable={isDraggable}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={handleClick}
      style={{
        position: 'absolute',
        top: `${cardIndex * 20}px`,
        zIndex: cardIndex
      }}
    >
      {card.isVisible ? `${card.rank}${card.suit}` : '🂠'}
    </div>
  );
}

// 카드 더미 컴포넌트
function CardPile({ cards, pileIndex, onDragStart, onDragEnd, onDrop, onCardClick }) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
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

  const draggableIndices = getDraggableCards();

  return (
    <div 
      className={`card-pile ${isDragOver ? 'drag-over' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{ minHeight: '120px', position: 'relative' }}
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
          isDraggable={draggableIndices.includes(index)}
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
  const [score, setScore] = useState(500);
  const [dragInfo, setDragInfo] = useState(null);
  const [completedSets, setCompletedSets] = useState(0);
  const [gameWon, setGameWon] = useState(false);

  // 게임 초기화
  useEffect(() => {
    initializeGame();
  }, []);

  const initializeGame = () => {
    // 카드 덱 생성 (스파이더는 2덱 사용)
    const suits = ['♠', '♥', '♦', '♣'];
    const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    
    let deck = [];
    // 2덱 생성
    for (let i = 0; i < 2; i++) {
      suits.forEach(suit => {
        ranks.forEach(rank => {
          deck.push({ suit, rank, isVisible: false });
        });
      });
    }
    
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

    setGameBoard(piles);
    setDealPile(remainingCards);
    setScore(500);
    setCompletedSets(0);
    setGameWon(false);
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
    setDragInfo({
      sourcePile: pileIndex,
      startIndex: cardIndex,
      cards: draggedCards
    });
  };

  // 드래그 종료
  const handleDragEnd = () => {
    setTimeout(() => {
      if (dragInfo) {
        setDragInfo(null);
      }
    }, 100);
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
      // 카드 이동
      sourcePile.splice(dragInfo.startIndex);
      targetPile.push(...dragInfo.cards);

      // 소스 더미의 다음 카드를 보이게 만들기
      if (sourcePile.length > 0 && !sourcePile[sourcePile.length - 1].isVisible) {
        sourcePile[sourcePile.length - 1].isVisible = true;
      }

      setGameBoard(newGameBoard);
      setScore(prevScore => Math.max(0, prevScore - 1));

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

    for (let pileIndex = 0; pileIndex < newBoard.length; pileIndex++) {
      const pile = newBoard[pileIndex];

      if (pile.length >= 13) {
        // 맨 위 13장 확인
        const topCards = pile.slice(-13);

        if (isCompletedSet(topCards)) {
          // 완성된 세트 제거
          pile.splice(-13);
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

  // 카드 클릭 처리 (뒤집힌 카드 클릭 시 앞면으로)
  const handleCardClick = (pileIndex, cardIndex) => {
    const newGameBoard = [...gameBoard];
    const card = newGameBoard[pileIndex][cardIndex];

    if (!card.isVisible && cardIndex === newGameBoard[pileIndex].length - 1) {
      card.isVisible = true;
      setGameBoard(newGameBoard);
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

    // 완성된 세트 확인
    checkAndRemoveCompletedSets(newGameBoard);
  };

  // 게임 재시작
  const restartGame = () => {
    initializeGame();
  };

  return (
    <div className="App">
      <header className="game-header">
        <h1>스파이더 카드게임</h1>
        <div className="game-info">
          <div>점수: {score}</div>
          <div>완성된 세트: {completedSets}/8</div>
          <div>남은 카드: {dealPile.length}</div>
        </div>
        <div className="game-controls">
          <button onClick={dealNewCards} disabled={dealPile.length === 0}>
            새 카드 배치 ({Math.ceil(dealPile.length / 8)}회 남음)
          </button>
          <button onClick={restartGame}>게임 재시작</button>
        </div>
      </header>

      {gameWon && (
        <div className="victory-message">
          🎉 축하합니다! 게임을 클리어했습니다! 🎉
          <br />
          최종 점수: {score}
        </div>
      )}

      <div className="game-board">
        {gameBoard.map((pile, index) => (
          <CardPile
            key={index}
            cards={pile}
            pileIndex={index}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDrop={handleDrop}
            onCardClick={handleCardClick}
          />
        ))}
      </div>

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

export default App;
