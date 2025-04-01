"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Dumbbell, LogOut, User, Bell, Settings } from "lucide-react"
import { motion } from "framer-motion"

interface DashboardHeaderProps {
  role: string
}

export function DashboardHeader({ role }: DashboardHeaderProps) {
  const router = useRouter()

  const handleLogout = () => {
    router.push("/")
  }

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="sticky top-0 z-10 flex h-16 items-center gap-2 sm:gap-4 border-b bg-background px-2 sm:px-4 md:px-6 shadow-sm"
    >
      <Link href={`/dashboard/${role.toLowerCase()}`} className="flex items-center gap-2 font-semibold">
      <img src="/Gymspace-logo-png.png" alt="GymSpace Logo" className="h-16" />
        <span className="gradient-text hidden xs:inline-block text-lg sm:inline-block">GymSpace</span>
      </Link>
      <div className="ml-auto flex items-center gap-4">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary"></span>
        </Button>
        <span className="hidden text-sm text-muted-foreground md:inline-block">
          Conectado como <strong className="text-[#ff6b00]">{role}</strong>
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="rounded-full border-[#ff6b00]/50">
              <User className="h-4 w-4 text-[#ff6b00]" />
              <span className="sr-only">Menú de usuario</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              <span>Perfil</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              <span>Configuración</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Cerrar sesión</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.header>
  )
}

