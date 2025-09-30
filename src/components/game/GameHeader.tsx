"use client"

import { ArrowLeft, Settings } from "lucide-react"

interface GameHeaderProps {
  score: number
  onBack: () => void
  onTogglePause: () => void
}

export function GameHeader({ score, onBack, onTogglePause }: GameHeaderProps) {
  return (
    <>
      <button
        onClick={onBack}
        className="absolute top-4 left-4 z-50 p-3 rounded-full bg-card/80 backdrop-blur-sm shadow-lg hover:scale-110 transition-transform"
      >
        <ArrowLeft className="w-6 h-6 text-foreground" />
      </button>

      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-full bg-card/90 backdrop-blur-sm shadow-lg">
        <p className="text-2xl font-bold text-foreground">{score}</p>
      </div>

      <button
        onClick={onTogglePause}
        className="absolute top-4 right-20 z-50 p-3 rounded-full bg-card/80 backdrop-blur-sm shadow-lg hover:scale-110 transition-transform"
      >
        <Settings className="w-6 h-6 text-foreground" />
      </button>
    </>
  )
}


