/**
 * EXP / 레벨 순수 유틸리티
 *
 * - 사이드 이펙트 없음 → Jest에서 바로 테스트 가능
 * - 백엔드(quest.routes.ts)와 프론트(HomeScreen, characterStore) 모두 동일 임계값 사용
 */

export const EXP_THRESHOLDS: Record<number, number> = {
  1: 0,
  2: 100,
  3: 250,
  4: 500,
  5: 800,
  6: 1200,
  7: 2000,
};

export const MAX_LEVEL = 7;

/**
 * 현재 레벨의 EXP 진행률 (0.0 ~ 1.0)
 * - 레벨 7 최대이면 항상 1.0
 * - 결과는 [0, 1] 범위로 클램프
 */
export function getExpProgress(exp: number, level: number): number {
  if (level >= MAX_LEVEL) return 1;
  const cur = EXP_THRESHOLDS[level] ?? 0;
  const next = EXP_THRESHOLDS[level + 1] ?? EXP_THRESHOLDS[MAX_LEVEL];
  if (next === cur) return 1;
  return Math.min(Math.max((exp - cur) / (next - cur), 0), 1);
}

/**
 * EXP 값으로 현재 레벨 계산
 * - 1 ~ 7 범위, 항상 유효한 레벨 반환
 */
export function calcLevel(exp: number): number {
  for (let lv = MAX_LEVEL; lv >= 1; lv--) {
    if (exp >= EXP_THRESHOLDS[lv]) return lv;
  }
  return 1;
}

/**
 * 레벨업 여부 판단
 */
export function didLevelUp(prevExp: number, newExp: number): boolean {
  return calcLevel(newExp) > calcLevel(prevExp);
}
