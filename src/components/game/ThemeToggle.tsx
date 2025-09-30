"use client"

import { Moon, Sun } from "lucide-react"

interface ThemeToggleProps {
  isDark: boolean
  onToggle: () => void
}

export function ThemeToggle({ isDark, onToggle }: ThemeToggleProps) {
  return (
    <button
      onClick={onToggle}
      className="absolute top-4 right-4 z-50 p-3 rounded-full bg-card/80 backdrop-blur-sm shadow-lg hover:scale-110 transition-transform"
    >
      {isDark ? <Sun className="w-6 h-6 text-yellow-400" /> : <Moon className="w-6 h-6 text-primary" />}
    </button>
  )
}


