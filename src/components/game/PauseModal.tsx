"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface PauseModalProps {
  open: boolean
  score: number
  onOpenChange: (open: boolean) => void
  onResume: () => void
  onBackToMain: () => void
}

export function PauseModal({ open, score, onOpenChange, onResume, onBackToMain }: PauseModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl text-center">Game tạm dừng</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4">
          <div className="text-center">
            <p className="text-4xl font-bold text-primary mb-2">{score}</p>
            <p className="text-muted-foreground">Điểm hiện tại</p>
          </div>
          <Button onClick={onResume} size="lg" className="w-full">
            Tiếp tục
          </Button>
          <Button onClick={onBackToMain} variant="outline" size="lg" className="w-full bg-transparent">
            Về màn hình chính
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}


