"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LogOut, User, Moon, Sun } from "lucide-react"
import { motion } from "framer-motion"
import Cookies from "js-cookie"
import { useUser } from "@/context/UserContext"
import { useEffect, useState } from "react"

interface DashboardHeaderProps {
  role: string
}

export function DashboardHeader({ role }: DashboardHeaderProps) {
  const router = useRouter()
  const { user } = useUser()

  const [isDarkMode, setIsDarkMode] = useState(false)

  useEffect(() => {
    const storedTheme = localStorage.getItem("theme")
    if (storedTheme === "dark") {
      document.documentElement.classList.add("dark")
      setIsDarkMode(true)
    }
  }, [])

  const toggleDarkMode = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove("dark")
      localStorage.setItem("theme", "light")
      setIsDarkMode(false)
    } else {
      document.documentElement.classList.add("dark")
      localStorage.setItem("theme", "dark")
      setIsDarkMode(true)
    }
  }

  const handleLogout = () => {
    Cookies.remove("dni")
    Cookies.remove("nombre")
    Cookies.remove("rol")
    localStorage.removeItem("cajaCerrada")
    router.push("/login")
  }

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="sticky top-0 z-10 flex h-16 items-center gap-2 sm:gap-4 border-b border-border/60 bg-background/80 backdrop-blur-xl px-2 sm:px-4 md:px-6"
    >
      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        <button
          onClick={toggleDarkMode}
          className="w-10 h-10 rounded-full bg-card border border-border text-muted-foreground flex items-center justify-center hover:text-foreground hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors shadow-sm btn-press"
          aria-label="Cambiar tema"
        >
          {isDarkMode ? <Sun className="h-5 w-5 text-amber-400" /> : <Moon className="h-5 w-5" />}
        </button>

        <div className="hidden md:flex flex-col items-end mr-1">
          <span className="text-sm font-bold leading-none">{user?.nombre}</span>
          <span className="text-[10px] font-bold text-brand-500 uppercase tracking-wider mt-1">{role}</span>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="rounded-full border-border bg-card shadow-sm hover:bg-brand-50 hover:border-brand-200 dark:hover:bg-accent"
            >
              <User className="h-4 w-4 text-brand-500" />
              <span className="sr-only">Menú de usuario</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="rounded-xl shadow-floating">
            <DropdownMenuItem
              onClick={handleLogout}
              className="cursor-pointer text-red-500 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950 rounded-lg"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Cerrar sesión</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.header>
  )
}
