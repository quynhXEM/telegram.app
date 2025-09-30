"use client"

import { GAME_CONFIG } from "./config"
import type { ColorZone } from "./types"

interface ColorZonesProps {
  zones: ColorZone[]
}

export function ColorZones({ zones }: ColorZonesProps) {
  return (
    <>
      {zones.map((zone) => (
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
            // borderRadius: zone.side === "left" ? "0 50px 50px 0" : "50px 0 0 50px",
          }}
        />
      ))}
    </>
  )
}


