"use client"

import type React from "react"
import type { Bubble } from "./types"

interface BubbleItemProps {
  bubble: Bubble
  isDragged: boolean
  onClick: (id: number) => void
  onMouseDown: (e: React.MouseEvent, id: number) => void
  onTouchStart: (e: React.TouchEvent, id: number) => void
}

export function BubbleItem({ bubble, isDragged, onClick, onMouseDown, onTouchStart }: BubbleItemProps) {
  return (
    <div
      className={`absolute rounded-full shadow-2xl cursor-pointer transition-transform hover:scale-110 ${
        isDragged ? "z-50 scale-110" : "z-20"
      }`}
      style={{
        width: `${bubble.size}px`,
        height: `${bubble.size}px`,
        left: `${bubble.x}px`,
        top: `${bubble.y}px`,
        backgroundColor: bubble.color,
        boxShadow:
          "0 8px 32px rgba(0, 0, 0, 0.2), inset 0 -8px 16px rgba(0, 0, 0, 0.1), inset 0 8px 16px rgba(255, 255, 255, 0.3)",
      }}
      onClick={() => onClick(bubble.id)}
      onMouseDown={(e) => onMouseDown(e, bubble.id)}
      onTouchStart={(e) => onTouchStart(e, bubble.id)}
    />
  )
}


