import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, updateDoc, increment } from 'firebase/firestore';

// Firebase 설정
// 환경 변수 또는 직접 설정값 사용
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "YOUR_API_KEY",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "YOUR_AUTH_DOMAIN",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "YOUR_PROJECT_ID",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "YOUR_STORAGE_BUCKET",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "YOUR_MESSAGING_SENDER_ID",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "YOUR_APP_ID"
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// 경험치 레벨 시스템
const XP_PER_LEVEL = 1000; // 레벨업에 필요한 XP

// 레벨 계산
export const calculateLevel = (xp) => {
  return Math.floor(xp / XP_PER_LEVEL) + 1;
};

// 현재 레벨에서의 XP 진행률 (0-100%)
export const calculateLevelProgress = (xp) => {
  return ((xp % XP_PER_LEVEL) / XP_PER_LEVEL) * 100;
};

// 다음 레벨까지 필요한 XP
export const xpToNextLevel = (xp) => {
  return XP_PER_LEVEL - (xp % XP_PER_LEVEL);
};

// 게임 완료 시 획득 XP 계산
export const calculateGameXP = (level, score, moveCount, completedSets) => {
  let baseXP = 0;

  // 난이도별 기본 XP
  switch (level) {
    case 'beginner':
      baseXP = 50;
      break;
    case 'intermediate':
      baseXP = 100;
      break;
    case 'advanced':
      baseXP = 200;
      break;
    default:
      baseXP = 50;
  }

  // 점수 보너스 (점수 / 10)
  const scoreBonus = Math.floor(score / 10);

  // 효율성 보너스 (이동 횟수가 적을수록 높은 보너스)
  const efficiencyBonus = Math.max(0, 100 - Math.floor(moveCount / 5));

  // 완성된 세트 보너스
  const setsBonus = completedSets * 25;

  return baseXP + scoreBonus + efficiencyBonus + setsBonus;
};

// Google 로그인
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    // 사용자 문서가 없으면 생성
    const userRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      await setDoc(userRef, {
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        xp: 0,
        gamesPlayed: 0,
        gamesWon: 0,
        totalScore: 0,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString()
      });
    } else {
      // 마지막 로그인 시간 업데이트
      await updateDoc(userRef, {
        lastLoginAt: new Date().toISOString()
      });
    }

    return user;
  } catch (error) {
    console.error('로그인 오류:', error);
    throw error;
  }
};

// 로그아웃
export const logOut = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('로그아웃 오류:', error);
    throw error;
  }
};

// 사용자 데이터 가져오기
export const getUserData = async (uid) => {
  try {
    const userRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      return userDoc.data();
    }
    return null;
  } catch (error) {
    console.error('사용자 데이터 로드 오류:', error);
    return null;
  }
};

// 게임 완료 시 XP 및 통계 업데이트
export const updateGameStats = async (uid, gameLevel, score, moveCount, completedSets, won) => {
  try {
    const userRef = doc(db, 'users', uid);
    const earnedXP = won ? calculateGameXP(gameLevel, score, moveCount, completedSets) : Math.floor(calculateGameXP(gameLevel, score, moveCount, completedSets) / 4);

    const updateData = {
      xp: increment(earnedXP),
      gamesPlayed: increment(1),
      totalScore: increment(score)
    };

    if (won) {
      updateData.gamesWon = increment(1);
    }

    await updateDoc(userRef, updateData);

    return earnedXP;
  } catch (error) {
    console.error('통계 업데이트 오류:', error);
    return 0;
  }
};

// 인증 상태 감지
export const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};

export { auth, db };
