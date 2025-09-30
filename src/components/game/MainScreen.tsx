"use client"

import { Button } from "@/components/ui/button"
import type { GameMode } from "./types"

interface MainScreenProps {
  showModeSelect: boolean
  onOpenModes: () => void
  onStart: (mode: Exclude<GameMode, null>) => void
}

export function MainScreen({ showModeSelect, onOpenModes, onStart }: MainScreenProps) {
  return (
    <div className="absolute inset-0 flex items-center justify-center z-40 bg-background/40 backdrop-blur-sm">
      <div className="text-center">
        <h1
          className="text-8xl font-bold text-primary start-text cursor-pointer select-none mb-8"
          onClick={onOpenModes}
        >
          START
        </h1>

        {showModeSelect && (
          <div className="flex gap-6 justify-center animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Button
              size="lg"
              onClick={() => onStart("click")}
              className="text-2xl px-12 py-8 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-2xl hover:scale-105 transition-transform"
            >
              Click
            </Button>
            <Button
              size="lg"
              onClick={() => onStart("move")}
              className="text-2xl px-12 py-8 rounded-2xl bg-secondary hover:bg-secondary/90 text-secondary-foreground shadow-2xl hover:scale-105 transition-transform"
            >
              Move
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}


