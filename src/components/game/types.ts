export type BubbleColor = string

export interface Bubble {
  id: number
  x: number
  y: number
  size: number
  color: BubbleColor
  speed: number
  drift: number
}

export interface ColorZone {
  id: number
  color: BubbleColor
  side: "left" | "right"
  y: number
  bubbleId: number
}

export type GameMode = "click" | "move" | null


