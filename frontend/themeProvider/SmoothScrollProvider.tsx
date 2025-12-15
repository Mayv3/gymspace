"use client"

import { useEffect } from "react"
import Lenis from "lenis"

let lenis: Lenis | null = null

export function SmoothScrollProvider() {
  useEffect(() => {
    lenis = new Lenis({
      wheelMultiplier: 0.8,
    })

    function raf(time: number) {
      lenis?.raf(time)
      requestAnimationFrame(raf)
    }

    requestAnimationFrame(raf)

    return () => {
      lenis?.destroy()
      lenis = null
    }
  }, [])

  return null
}

export function stopLenis() {
  lenis?.stop()
}

export function startLenis() {
  lenis?.start()
}
