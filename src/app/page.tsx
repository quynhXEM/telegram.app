"use client"

import type React from "react"

import { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Moon, Sun, ArrowLeft, Settings } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

type BubbleColor = string // Changed to string for unique random colors

// Centralized game configuration for easy tuning
const GAME_CONFIG = {
  spawn: {
    batchSize: 4, // số lượng bóng sinh ra mỗi lần
    baseIntervalMs: 2000, // khoảng thời gian cơ sở giữa các lần spawn
    intervalDecreasePerDifficulty: 200, // giảm theo độ khó
    minIntervalMs: 1000, // khoảng thời gian tối thiểu
    initialBubblesOnMain: 15, // số bóng ban đầu ở màn chính
  },
  movement: {
    frameIntervalMs: 16, // ms mỗi frame
    verticalSpeedMultiplier: 0.35, // hệ số tốc độ dọc mỗi frame
    horizontalDriftMultiplier: 0.005, // hệ số trôi ngang mỗi frame
  },
  bubble: {
    minSize: 30,
    maxSize: 90,
    baseSpeedMin: 3,
    baseSpeedMax: 5,
    driftRange: 100,
  },
  zone: {
    width: 100,
    height: 100,
    verticalGap: 20,
    yPadding: 50,
  },
} as const

interface Bubble {
  id: number
  x: number
  y: number
  size: number
  color: BubbleColor
  speed: number
  drift: number
}

interface ColorZone {
  id: number
  color: BubbleColor
  side: "left" | "right"
  y: number
  bubbleId: number // Track which bubble this zone belongs to
}

type GameMode = "click" | "move" | null

const generateRandomColor = (existingColors: string[]): string => {
  let color: string
  let attempts = 0
  do {
    const hue = Math.floor(Math.random() * 360)
    const saturation = 70 + Math.random() * 20 // 70-90%
    const lightness = 55 + Math.random() * 15 // 55-70%
    color = `hsl(${hue}, ${saturation}%, ${lightness}%)`
    attempts++
  } while (existingColors.includes(color) && attempts < 50)
  return color
}

const getPoints = (size: number) => {
  if (size >= 80) return 50
  if (size >= 60) return 30
  if (size >= 40) return 20
  return 10
}

export default function BubbleGame() {
  const [isDark, setIsDark] = useState(false)
  const [gameMode, setGameMode] = useState<GameMode>(null)
  const [showModeSelect, setShowModeSelect] = useState(false)
  const [bubbles, setBubbles] = useState<Bubble[]>([])
  const [score, setScore] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [colorZones, setColorZones] = useState<ColorZone[]>([])
  const [draggedBubble, setDraggedBubble] = useState<number | null>(null)
  const [difficulty, setDifficulty] = useState(1)

  const bubbleIdCounter = useRef(0)
  const zoneIdCounter = useRef(0)
  const gameStartTime = useRef<number>(0)

  // Toggle dark mode
  const toggleTheme = () => {
    setIsDark(!isDark)
    document.documentElement.classList.toggle("dark")
  }

  // Generate random bubble
  const generateBubble = useCallback((): Bubble => {
    const size = Math.random() * (GAME_CONFIG.bubble.maxSize - GAME_CONFIG.bubble.minSize) + GAME_CONFIG.bubble.minSize
    // Không phụ thuộc vào danh sách bubbles để tránh reset interval spawn
    const color = generateRandomColor([])
    const baseSpeedRange = GAME_CONFIG.bubble.baseSpeedMax - GAME_CONFIG.bubble.baseSpeedMin
    const baseSpeed = Math.random() * baseSpeedRange + GAME_CONFIG.bubble.baseSpeedMin
    const speed = baseSpeed * difficulty // Speed increases with difficulty
    const drift = (Math.random() - 0.5) * GAME_CONFIG.bubble.driftRange // Random horizontal drift

    return {
      id: bubbleIdCounter.current++,
      x: Math.random() * (window.innerWidth - size),
      y: window.innerHeight + size,
      size,
      color,
      speed,
      drift,
    }
  }, [difficulty])

  const generateColorZone = useCallback(
    (color: BubbleColor, bubbleId: number): ColorZone => {
      const side = Math.random() > 0.5 ? "left" : "right"
      const zoneHeight = GAME_CONFIG.zone.height
      const yPadding = GAME_CONFIG.zone.yPadding
      const verticalGap = GAME_CONFIG.zone.verticalGap

      // Find non-overlapping position
      let y: number
      let attempts = 0
      do {
        y = Math.random() * (window.innerHeight - zoneHeight - yPadding * 2) + yPadding
        const overlaps = colorZones.some(
          (zone) => zone.side === side && Math.abs(zone.y - y) < zoneHeight + verticalGap,
        )
        if (!overlaps) break
        attempts++
      } while (attempts < 20)

      return {
        id: zoneIdCounter.current++,
        color,
        side,
        y,
        bubbleId,
      }
    },
    [colorZones],
  )

  // Start game
  const startGame = (mode: GameMode) => {
    setGameMode(mode)
    setShowModeSelect(false)
    setScore(0)
    setDifficulty(1)
    gameStartTime.current = Date.now()

    // Keep existing bubbles and continue
    if (mode === "move") {
      // Create initial color zones for existing bubbles
      const zones: ColorZone[] = []
      bubbles.forEach((bubble) => {
        zones.push(generateColorZone(bubble.color, bubble.id))
      })
      setColorZones(zones)
    }
  }

  // Back to main screen
  const backToMain = () => {
    setGameMode(null)
    setShowModeSelect(false)
    setScore(0)
    setColorZones([])
    setIsPaused(false)
    setDifficulty(1)
  }

  // Handle bubble click (Click mode)
  const handleBubbleClick = (bubbleId: number) => {
    if (gameMode !== "click" || isPaused) return

    const bubble = bubbles.find((b) => b.id === bubbleId)
    if (!bubble) return

    const points = getPoints(bubble.size)
    setScore((prev) => prev + points)

    // Remove bubble with pop animation
    setBubbles((prev) => prev.filter((b) => b.id !== bubbleId))
  }

  // Handle drag start (Move mode)
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent, bubbleId: number) => {
    if (gameMode !== "move" || isPaused) return
    e.preventDefault()
    setDraggedBubble(bubbleId)
  }

  // Handle drag move
  const handleDragMove = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (draggedBubble === null || isPaused) return

      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY

      setBubbles((prev) =>
        prev.map((bubble) => {
          if (bubble.id === draggedBubble) {
            return {
              ...bubble,
              x: clientX - bubble.size / 2,
              y: clientY - bubble.size / 2,
            }
          }
          return bubble
        }),
      )
    },
    [draggedBubble, isPaused],
  )

  // Handle drag end
  const handleDragEnd = useCallback(() => {
    if (draggedBubble === null) return

    const bubble = bubbles.find((b) => b.id === draggedBubble)
    if (!bubble) {
      setDraggedBubble(null)
      return
    }

    // Check if bubble is in a matching color zone
    const matchingZone = colorZones.find((zone) => {
      const zoneX = zone.side === "left" ? 0 : window.innerWidth - GAME_CONFIG.zone.width
      const zoneWidth = GAME_CONFIG.zone.width
      const isInZone =
        bubble.x >= zoneX - 40 &&
        bubble.x <= zoneX + zoneWidth + 40 &&
        bubble.y >= zone.y - 40 &&
        bubble.y <= zone.y + GAME_CONFIG.zone.height + 40 &&
        zone.color === bubble.color
      return isInZone
    })

    if (matchingZone) {
      const points = getPoints(bubble.size)
      setScore((prev) => prev + points)
      setBubbles((prev) => prev.filter((b) => b.id !== draggedBubble))
      setColorZones((prev) => prev.filter((z) => z.id !== matchingZone.id))
    }

    setDraggedBubble(null)
  }, [draggedBubble, bubbles, colorZones])

  useEffect(() => {
    const spawnRate = Math.max(
      GAME_CONFIG.spawn.baseIntervalMs - difficulty * GAME_CONFIG.spawn.intervalDecreasePerDifficulty,
      GAME_CONFIG.spawn.minIntervalMs,
    )

    const interval = setInterval(() => {
      if (isPaused) return

      const batch: Bubble[] = []
      for (let i = 0; i < GAME_CONFIG.spawn.batchSize; i++) {
        batch.push(generateBubble())
      }
      setBubbles((prev) => [...prev, ...batch])

      // Add color zone for move mode
      if (gameMode === "move") {
        setColorZones((prev) => [...prev, ...batch.map((b) => generateColorZone(b.color, b.id))])
      }
    }, spawnRate)

    return () => clearInterval(interval)
  }, [generateBubble, generateColorZone, gameMode, isPaused, difficulty])

  // Animate bubbles
  useEffect(() => {
    if (isPaused) return

    const interval = setInterval(() => {
      setBubbles((prev) => {
        const removedBubbleIds: number[] = []

        const updatedBubbles = prev
          .filter((bubble) => {
            // Don't move dragged bubble
            if (bubble.id === draggedBubble) return true

            // Remove bubbles that went off screen
            const shouldRemove = bubble.y < -bubble.size
            if (shouldRemove) {
              removedBubbleIds.push(bubble.id)
            }
            return !shouldRemove
          })
          .map((bubble) => {
            if (bubble.id === draggedBubble) return bubble

            return {
              ...bubble,
              // Quãng đường di chuyển mỗi frame theo cấu hình
              y: bubble.y - bubble.speed * GAME_CONFIG.movement.verticalSpeedMultiplier,
              x: bubble.x + bubble.drift * GAME_CONFIG.movement.horizontalDriftMultiplier,
            }
          })

        if (removedBubbleIds.length > 0 && gameMode === "move") {
          setColorZones((prevZones) => prevZones.filter((zone) => !removedBubbleIds.includes(zone.bubbleId)))
        }

        return updatedBubbles
      })
    }, GAME_CONFIG.movement.frameIntervalMs)

    return () => clearInterval(interval)
  }, [isPaused, draggedBubble, gameMode])

  // Increase difficulty over time
  useEffect(() => {
    if (!gameMode || isPaused) return

    const interval = setInterval(() => {
      const elapsed = (Date.now() - gameStartTime.current) / 1000
      const newDifficulty = 1 + Math.floor(elapsed / 15) * 0.3
      setDifficulty(newDifficulty)
    }, 5000)

    return () => clearInterval(interval)
  }, [gameMode, isPaused])

  // Drag event listeners
  useEffect(() => {
    if (gameMode !== "move") return

    window.addEventListener("mousemove", handleDragMove)
    window.addEventListener("mouseup", handleDragEnd)
    window.addEventListener("touchmove", handleDragMove)
    window.addEventListener("touchend", handleDragEnd)

    return () => {
      window.removeEventListener("mousemove", handleDragMove)
      window.removeEventListener("mouseup", handleDragEnd)
      window.removeEventListener("touchmove", handleDragMove)
      window.removeEventListener("touchend", handleDragEnd)
    }
  }, [gameMode, handleDragMove, handleDragEnd])

  useEffect(() => {
    if (bubbles.length === 0) {
      const initialBubbles = Array.from({ length: GAME_CONFIG.spawn.initialBubblesOnMain }, () => generateBubble())
      setBubbles(initialBubbles)
    }
  }, [])

  return (
    <div className="relative w-full h-screen overflow-hidden bg-gradient-to-br from-background via-accent/20 to-secondary/30">
      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        className="absolute top-4 right-4 z-50 p-3 rounded-full bg-card/80 backdrop-blur-sm shadow-lg hover:scale-110 transition-transform"
      >
        {isDark ? <Sun className="w-6 h-6 text-yellow-400" /> : <Moon className="w-6 h-6 text-primary" />}
      </button>

      {/* Game UI */}
      {gameMode && (
        <>
          {/* Back button */}
          <button
            onClick={backToMain}
            className="absolute top-4 left-4 z-50 p-3 rounded-full bg-card/80 backdrop-blur-sm shadow-lg hover:scale-110 transition-transform"
          >
            <ArrowLeft className="w-6 h-6 text-foreground" />
          </button>

          {/* Score */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-full bg-card/90 backdrop-blur-sm shadow-lg">
            <p className="text-2xl font-bold text-foreground">{score}</p>
          </div>

          {/* Settings button */}
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="absolute top-4 right-20 z-50 p-3 rounded-full bg-card/80 backdrop-blur-sm shadow-lg hover:scale-110 transition-transform"
          >
            <Settings className="w-6 h-6 text-foreground" />
          </button>
        </>
      )}

      {/* Main screen */}
      {!gameMode && (
        <div className="absolute inset-0 flex items-center justify-center z-40 bg-background/40 backdrop-blur-sm">
          <div className="text-center">
            <h1
              className="text-8xl font-bold text-primary start-text cursor-pointer select-none mb-8"
              onClick={() => setShowModeSelect(true)}
            >
              START
            </h1>

            {showModeSelect && (
              <div className="flex gap-6 justify-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                <Button
                  size="lg"
                  onClick={() => startGame("click")}
                  className="text-2xl px-12 py-8 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-2xl hover:scale-105 transition-transform"
                >
                  Click
                </Button>
                <Button
                  size="lg"
                  onClick={() => startGame("move")}
                  className="text-2xl px-12 py-8 rounded-2xl bg-secondary hover:bg-secondary/90 text-secondary-foreground shadow-2xl hover:scale-105 transition-transform"
                >
                  Move
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {gameMode === "move" &&
        colorZones.map((zone) => (
          <div
            key={zone.id}
            className="absolute z-10 pointer-events-none"
            style={{
              left: zone.side === "left" ? "0" : "auto",
              right: zone.side === "right" ? "0" : "auto",
              top: `${zone.y}px`,
              width: `${GAME_CONFIG.zone.width}px`,
              height: `${GAME_CONFIG.zone.height}px`,
              background:
                zone.side === "left"
                  ? `linear-gradient(to right, ${zone.color}, transparent)`
                  : `linear-gradient(to left, ${zone.color}, transparent)`,
              borderRadius: zone.side === "left" ? "0 50px 50px 0" : "50px 0 0 50px",
            }}
          />
        ))}

      {/* Bubbles */}
      {bubbles.map((bubble) => (
        <div
          key={bubble.id}
          className={`absolute rounded-full shadow-2xl cursor-pointer transition-transform hover:scale-110 ${draggedBubble === bubble.id ? "z-50 scale-110" : "z-20"
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
          onClick={() => handleBubbleClick(bubble.id)}
          onMouseDown={(e) => handleDragStart(e, bubble.id)}
          onTouchStart={(e) => handleDragStart(e, bubble.id)}
        />
      ))}

      {/* Pause modal */}
      <Dialog open={isPaused} onOpenChange={setIsPaused}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl text-center">Game tạm dừng</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <div className="text-center">
              <p className="text-4xl font-bold text-primary mb-2">{score}</p>
              <p className="text-muted-foreground">Điểm hiện tại</p>
            </div>
            <Button onClick={() => setIsPaused(false)} size="lg" className="w-full">
              Tiếp tục
            </Button>
            <Button onClick={backToMain} variant="outline" size="lg" className="w-full bg-transparent">
              Về màn hình chính
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
