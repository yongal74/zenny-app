/**
 * Session B — GameScreen 핵심 로직 단위 테스트
 *
 * 커버 범위:
 *  1. getExpProgress  — EXP 진행률 계산
 *  2. calcLevel       — EXP → 레벨 변환
 *  3. didLevelUp      — 레벨업 감지
 *  4. Quest 중복 완료 가드 (순수 로직 시뮬레이션)
 *  5. Emotion 409 가드 (순수 로직 시뮬레이션)
 *  6. updateExp 로직 시뮬레이션 (characterStore 핵심 로직)
 */

import {
  EXP_THRESHOLDS,
  MAX_LEVEL,
  getExpProgress,
  calcLevel,
  didLevelUp,
} from '../src/utils/exp';

// ─── 1. getExpProgress ───────────────────────────────────────

describe('getExpProgress', () => {
  it('레벨 1 시작(exp=0) → 0.0', () => {
    expect(getExpProgress(0, 1)).toBe(0);
  });

  it('레벨 1 → 2 정확히 절반(exp=50) → 0.5', () => {
    // Lv1: 0~100 구간, 50/100 = 0.5
    expect(getExpProgress(50, 1)).toBeCloseTo(0.5);
  });

  it('레벨 경계 직전 (exp=99, level=1) → 0.99', () => {
    expect(getExpProgress(99, 1)).toBeCloseTo(0.99);
  });

  it('MAX_LEVEL(7)이면 항상 1.0 반환', () => {
    expect(getExpProgress(2000, MAX_LEVEL)).toBe(1);
    expect(getExpProgress(9999, MAX_LEVEL)).toBe(1);
  });

  it('음수 EXP는 0으로 클램프', () => {
    expect(getExpProgress(-10, 2)).toBe(0);
  });

  it('다음 레벨 초과 EXP는 1.0으로 클램프', () => {
    // Lv2: 100~250 구간, exp=300이면 초과 → 1.0
    expect(getExpProgress(300, 2)).toBe(1);
  });
});

// ─── 2. calcLevel ────────────────────────────────────────────

describe('calcLevel', () => {
  it('exp=0 → 레벨 1', () => {
    expect(calcLevel(0)).toBe(1);
  });

  it('exp=99 → 레벨 1 (경계 미만)', () => {
    expect(calcLevel(99)).toBe(1);
  });

  it('exp=100 → 레벨 2 (정확한 경계)', () => {
    expect(calcLevel(100)).toBe(2);
  });

  it('exp=250 → 레벨 3', () => {
    expect(calcLevel(250)).toBe(3);
  });

  it('exp=2000 → 레벨 7 (MAX)', () => {
    expect(calcLevel(2000)).toBe(MAX_LEVEL);
  });

  it('exp=9999 → 레벨 7 (MAX 초과도 MAX)', () => {
    expect(calcLevel(9999)).toBe(MAX_LEVEL);
  });

  it('EXP_THRESHOLDS 전체 경계값 검증', () => {
    const expected: Record<number, number> = {
      1: 0, 2: 100, 3: 250, 4: 500, 5: 800, 6: 1200, 7: 2000,
    };
    for (const [lv, threshold] of Object.entries(expected)) {
      expect(calcLevel(threshold)).toBe(Number(lv));
    }
  });
});

// ─── 3. didLevelUp ───────────────────────────────────────────

describe('didLevelUp', () => {
  it('같은 레벨 내 EXP 증가 → false', () => {
    expect(didLevelUp(0, 50)).toBe(false);   // 1→1
  });

  it('레벨업 발생 → true', () => {
    expect(didLevelUp(90, 110)).toBe(true);  // 1→2
  });

  it('EXP 감소(버그 시나리오) → false', () => {
    expect(didLevelUp(200, 100)).toBe(false);
  });

  it('두 단계 레벨업 → true', () => {
    expect(didLevelUp(0, 500)).toBe(true);   // 1→4
  });

  it('이미 MAX 레벨 → false (더 이상 올라갈 수 없음)', () => {
    expect(didLevelUp(2000, 9999)).toBe(false);
  });
});

// ─── 4. Quest 중복 완료 가드 시뮬레이션 ─────────────────────
//
//  실제 quest.routes.ts 로직:
//    if (userQuest.completedAt !== null) throw 409
//
//  여기서는 그 순수 판단 함수를 직접 테스트합니다.

function isQuestAlreadyDone(completedAt: string | null): boolean {
  return completedAt !== null;
}

describe('Quest 중복 완료 가드', () => {
  it('completedAt=null → 아직 미완료 (409 발생 안 함)', () => {
    expect(isQuestAlreadyDone(null)).toBe(false);
  });

  it('completedAt=ISO문자열 → 이미 완료 (409 반환해야 함)', () => {
    expect(isQuestAlreadyDone('2026-03-05T10:00:00Z')).toBe(true);
  });

  it('completedAt="" (빈 문자열, 방어 케이스) → 완료로 간주', () => {
    // 빈 문자열은 null이 아니므로 409 처리 (안전한 쪽)
    expect(isQuestAlreadyDone('')).toBe(true);
  });
});

// ─── 5. Emotion 409 가드 시뮬레이션 ─────────────────────────
//
//  실제 emotion.routes.ts 로직:
//    const today = new Date().toISOString().split('T')[0]
//    if (existing && existing.date === today) throw 409

function isTodayCheckinDone(existingDate: string | null, today: string): boolean {
  return existingDate !== null && existingDate === today;
}

describe('Emotion 하루 1회 중복 체크인 가드', () => {
  const today = '2026-03-05';

  it('오늘 체크인 없음(null) → 409 없음', () => {
    expect(isTodayCheckinDone(null, today)).toBe(false);
  });

  it('오늘 날짜와 일치 → 409 반환해야 함', () => {
    expect(isTodayCheckinDone('2026-03-05', today)).toBe(true);
  });

  it('어제 날짜면 → 오늘 체크인 허용', () => {
    expect(isTodayCheckinDone('2026-03-04', today)).toBe(false);
  });
});

// ─── 6. updateExp 로직 시뮬레이션 ────────────────────────────
//
//  characterStore.updateExp의 핵심:
//    const newExp = prev.exp + amount
//    const newLevel = calcLevel(newExp)  ← utils/exp.ts의 calcLevel 사용
//
//  Zustand store 자체는 React 환경이 필요하므로 로직을 순수 함수로 시뮬레이션.
//  (calcLevel 자체는 describe 2에서 이미 7개 케이스로 검증됨)

function simulateUpdateExp(
  prevExp: number,
  prevLevel: number,
  amount: number,
): { newExp: number; newLevel: number } {
  const newExp = prevExp + amount;
  const newLevel = calcLevel(newExp);
  return { newExp, newLevel };
}

describe('updateExp 로직 시뮬레이션 (characterStore)', () => {
  it('EXP 추가 후 exp 값이 정확하게 누적됨', () => {
    const { newExp } = simulateUpdateExp(0, 1, 50);
    expect(newExp).toBe(50);
  });

  it('EXP 증가로 레벨업 트리거 (90 + 20 = 110 → Lv2)', () => {
    const { newExp, newLevel } = simulateUpdateExp(90, 1, 20);
    expect(newExp).toBe(110);
    expect(newLevel).toBe(2);
  });

  it('레벨업 없이 EXP만 증가 (50 + 30 = 80 → 여전히 Lv1)', () => {
    const { newLevel } = simulateUpdateExp(50, 1, 30);
    expect(newLevel).toBe(1);
  });

  it('MAX 레벨(7)에서 EXP 추가해도 레벨 7 유지', () => {
    const { newLevel } = simulateUpdateExp(2000, 7, 999);
    expect(newLevel).toBe(MAX_LEVEL);
  });

  it('두 단계 레벨업: 0 + 500 = 500 → Lv4', () => {
    const { newLevel } = simulateUpdateExp(0, 1, 500);
    expect(newLevel).toBe(4);
  });
});
