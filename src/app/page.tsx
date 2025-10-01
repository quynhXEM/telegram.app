"use client"

import type React from "react"

import { useState, useEffect, useCallback, useRef, useMemo } from "react"
import { ThemeToggle } from "@/components/game/ThemeToggle"
import { GameHeader } from "@/components/game/GameHeader"
import { MainScreen } from "@/components/game/MainScreen"
import { ColorZones } from "@/components/game/ColorZones"
import { BubbleItem } from "@/components/game/BubbleItem"
import { PauseModal } from "@/components/game/PauseModal"
import { GAME_CONFIG } from "@/components/game/config"
import type { Bubble, ColorZone, GameMode, BubbleColor } from "@/components/game/types"

// types moved to shared module

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
  const handleBubbleClick = useCallback((bubbleId: number) => {
    if (gameMode !== "click" || isPaused) return

    const bubble = bubbles.find((b) => b.id === bubbleId)
    if (!bubble) return

    const points = getPoints(bubble.size)
    setScore((prev) => prev + points)

    // Remove bubble with pop animation
    setBubbles((prev) => prev.filter((b) => b.id !== bubbleId))
  }, [gameMode, isPaused, bubbles])

  // Handle drag start (Move mode)
  const handleDragStart = useCallback((e: React.MouseEvent | React.TouchEvent, bubbleId: number) => {
    if (gameMode !== "move" || isPaused) return
    e.preventDefault()
    setDraggedBubble(bubbleId)
  }, [gameMode, isPaused])

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

  // Animate bubbles using requestAnimationFrame for better performance
  useEffect(() => {
    if (isPaused) return

    let animationId: number
    let lastTime = 0
    const targetFPS = 60
    const frameInterval = 1000 / targetFPS

    const animate = (currentTime: number) => {
      if (currentTime - lastTime >= frameInterval) {
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
        lastTime = currentTime
      }

      animationId = requestAnimationFrame(animate)
    }

    animationId = requestAnimationFrame(animate)

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId)
      }
    }
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

  // Tự động pause khi mất focus
  useEffect(() => {
    const handleBlur = () => {
      if (gameMode && !isPaused) {
        setIsPaused(true)
      }
    }

    const handleVisibilityChange = () => {
      if (document.hidden && gameMode && !isPaused) {
        setIsPaused(true)
      }
    }

    window.addEventListener('blur', handleBlur)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('blur', handleBlur)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [gameMode, isPaused])

  useEffect(() => {
    if (bubbles.length === 0) {
      const initialBubbles = Array.from({ length: GAME_CONFIG.spawn.initialBubblesOnMain }, () => generateBubble())
      setBubbles(initialBubbles)
    }
  }, [bubbles.length, generateBubble])

  return (
    <div className="relative w-full h-screen overflow-hidden bg-gradient-to-br from-background via-accent/20 to-secondary/30">
      {/* Theme toggle */}
      <ThemeToggle isDark={isDark} onToggle={toggleTheme} />

      {/* Game UI */}
      {gameMode && (
        <GameHeader
          score={score}
          onBack={backToMain}
          onTogglePause={() => setIsPaused(!isPaused)}
        />
      )}

      {/* Main screen */}
      {!gameMode && (
        <MainScreen
          showModeSelect={showModeSelect}
          onOpenModes={() => setShowModeSelect(true)}
          onStart={(mode) => startGame(mode)}
        />
      )}

      {gameMode === "move" && <ColorZones zones={colorZones} />}

      {/* Bubbles */}
      {bubbles.map((bubble) => {
        const isDragged = draggedBubble === bubble.id
        return (
          <BubbleItem
            key={bubble.id}
            bubble={bubble}
            isDragged={isDragged}
            onClick={handleBubbleClick}
            onMouseDown={(e) => handleDragStart(e, bubble.id)}
            onTouchStart={(e) => handleDragStart(e, bubble.id)}
          />
        )
      })}

      {/* Pause modal */}
      <PauseModal
        open={isPaused}
        score={score}
        onOpenChange={setIsPaused}
        onResume={() => setIsPaused(false)}
        onBackToMain={backToMain}
      />
    </div>
  )
}
