export const GAME_CONFIG = {
  spawn: {
    batchSize: 4,
    baseIntervalMs: 2000,
    intervalDecreasePerDifficulty: 200,
    minIntervalMs: 1000,
    initialBubblesOnMain: 10,
  },
  movement: {
    frameIntervalMs: 16,
    verticalSpeedMultiplier: 0.35,
    horizontalDriftMultiplier: 0.005,
  },
  bubble: {
    minSize: 30,
    maxSize: 90,
    baseSpeedMin: 3,
    baseSpeedMax: 5,
    driftRange: 100,
  },
  zone: {
    width: 50,
    height: 100,
    verticalGap: 100,
    yPadding: 10,
  },
} as const

export type GameConfig = typeof GAME_CONFIG


