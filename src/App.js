import React, { useState, useEffect } from 'react';
import './App.css';

// 레벨 선택 컴포넌트
function LevelSelection({ onLevelSelect }) {
  return (
    <div className="level-selection">
      <h2>🕷️ 스파이더 카드게임</h2>
      <p>원하는 난이도를 선택하세요</p>
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
function Card({ card, cardIndex, pileIndex, onDragStart, onDragEnd, isDraggable, onCardClick, isDragging, gameBoard }) {
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
    dragContainer.style.height = `${100 + (cards.length - 1) * 15}px`;
    dragContainer.style.pointerEvents = 'none';

    cards.forEach((dragCard, index) => {
      const cardElement = document.createElement('div');
      cardElement.style.position = 'absolute';
      cardElement.style.top = `${index * 15}px`;
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

  return (
    <div 
      className={`card ${card.isVisible ? 'visible' : 'hidden'} ${isDraggable ? 'draggable' : ''} ${getCardColor()} ${isDragging ? 'dragging-preview' : ''}`}
      draggable={isDraggable}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={handleClick}
      data-rank={card.rank}
      data-suit={card.suit}
      style={{
        position: 'absolute',
        top: `${cardIndex * 15}px`,
        zIndex: isDragging ? cardIndex + 1000 : cardIndex, // 드래그 중인 카드들의 z-index를 높임
        left: '10px'
      }}
    >
      {card.isVisible ? `${card.rank}${card.suit}` : '🂠'}
    </div>
  );
}

// 카드 더미 컴포넌트
function CardPile({ cards, pileIndex, onDragStart, onDragEnd, onDrop, onCardClick, draggingCards, gameBoard }) {
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
          isDragging={isDraggingCard(index)}
          gameBoard={gameBoard} // gameBoard 전달
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
  const [gameLevel, setGameLevel] = useState(null);
  const [gameStarted, setGameStarted] = useState(false);
  // 초기 게임 상태를 저장하기 위한 상태 추가
  const [initialGameBoard, setInitialGameBoard] = useState([]);
  const [initialDealPile, setInitialDealPile] = useState([]);
  // 드래그 중인 카드들을 표시하기 위한 상태 추가
  const [draggingCards, setDraggingCards] = useState(null);

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

    // 2덱 생성 (총 104장)
    for (let i = 0; i < 2; i++) {
      suits.forEach(suit => {
        ranks.forEach(rank => {
          deck.push({ suit, rank, isVisible: false });
        });
      });
    }
    
    // 초급과 중급의 경우 카드 수를 맞추기 위해 추가 카드 생성
    if (level === 'beginner') {
      // 1가지 무늬로 104장을 만들기 위해 8덱 생성
      deck = [];
      for (let i = 0; i < 8; i++) {
        ranks.forEach(rank => {
          deck.push({ suit: '♠', rank, isVisible: false });
        });
      }
    } else if (level === 'intermediate') {
      // 2가지 무늬로 104장을 만들기 위해 4덱 생성
      deck = [];
      for (let i = 0; i < 4; i++) {
        ['♠', '♥'].forEach(suit => {
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
    setGameLevel(level);
    setGameStarted(true);
    initializeGame(level);
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
    setInitialGameBoard(deepCopyBoard); // 초기 게임 보드 저장
    setInitialDealPile(deepCopyDeal); // 초기 딜 더미 저장
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

  // 게임 재시작 - 레벨 선택 화면으로 돌아가도록 수정
  const restartGame = () => {
    setGameStarted(false);
    setGameLevel(null);
    setGameBoard([]);
    setDealPile([]);
    setScore(500);
    setCompletedSets(0);
    setGameWon(false);
    setDragInfo(null);
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

  // 게임이 시작되지 않았으면 레벨 선택 화면 표시
  if (!gameStarted) {
    return (
      <div className="App">
        <LevelSelection onLevelSelect={handleLevelSelect} />

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
        <h1>스파이더 카드게임</h1>
        <div className="level-display">{getLevelName()}</div>
        <div className="game-info">
          <div>점수: {score}</div>
          <div>완성된 세트: {completedSets}/8</div>
          <div>남은 카드: {dealPile.length}</div>
        </div>
        <div className="game-controls">
          <button onClick={dealNewCards} disabled={dealPile.length === 0}>
            새 카드 배치 ({Math.ceil(dealPile.length / 8)}회 남음)
          </button>
          <button onClick={restartGame} className="level-back-btn">레벨 선택으로</button>
          <button onClick={restartCurrentLevel} className="restart-level-btn">
            현재 레벨 재시작
          </button>
        </div>
      </header>

      {gameWon && (
        <div className="victory-message">
          🎉 축하합니다! {getLevelName()} 게임을 클리어했습니다! 🎉
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
            draggingCards={draggingCards} // 드래그 중인 카드 정보 전달
            gameBoard={gameBoard} // gameBoard 전달
          />
        ))}
      </div>
    </div>
  );
}

export default App;
