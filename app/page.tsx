"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, UserRound, Users, Dumbbell } from "lucide-react"
import { motion } from "framer-motion"

export default function LoginPage() {
  const router = useRouter()
  const [selectedRole, setSelectedRole] = useState<string | null>(null)

  const handleRoleSelect = (role: string) => {
    setSelectedRole(role)
  }

  const handleContinue = () => {
    if (selectedRole) {
      router.push(`/dashboard/${selectedRole.toLowerCase()}`)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4 bg-[url('/placeholder.svg?height=1080&width=1920')] bg-cover bg-center">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Card className="w-[95vw] max-w-md shadow-xl">
          <CardHeader className="text-center">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex justify-center mb-4"
            >
              <img src="/Gymspace-logo-png.png" alt="GymSpace Logo" className="h-20" />
            </motion.div>
            <CardTitle className="text-3xl font-bold gradient-text">GymSpace</CardTitle>
            <CardDescription className="text-[#ff6b00] font-medium">
              Por favor selecciona tu rol para continuar
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant={selectedRole === "administrator" ? "orange" : "outline"}
                  className="flex flex-col h-20 sm:h-24 items-center justify-center gap-2 w-full text-sm sm:text-base"
                  onClick={() => handleRoleSelect("administrator")}
                >
                  <Shield
                    className={selectedRole === "administrator" ? "h-6 w-6 text-white" : "h-6 w-6 text-[#ff6b00]"}
                  />
                  <span>
                    {selectedRole === "administrator" ? (
                      "Administrador"
                    ) : (
                      <span className="text-[#ff6b00]">Administrador</span>
                    )}
                  </span>
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant={selectedRole === "receptionist" ? "orange" : "outline"}
                  className="flex flex-col h-20 sm:h-24 items-center justify-center gap-2 w-full text-sm sm:text-base"
                  onClick={() => handleRoleSelect("receptionist")}
                >
                  <UserRound
                    className={selectedRole === "receptionist" ? "h-6 w-6 text-white" : "h-6 w-6 text-[#ff6b00]"}
                  />
                  <span>
                    {selectedRole === "receptionist" ? (
                      "Recepcionista"
                    ) : (
                      <span className="text-[#ff6b00]">Recepcionista</span>
                    )}
                  </span>
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant={selectedRole === "member" ? "orange" : "outline"}
                  className="flex flex-col h-20 sm:h-24 items-center justify-center gap-2 w-full text-sm sm:text-base"
                  onClick={() => handleRoleSelect("member")}
                >
                  <Users className={selectedRole === "member" ? "h-6 w-6 text-white" : "h-6 w-6 text-[#ff6b00]"} />
                  <span>{selectedRole === "member" ? "Miembro" : <span className="text-[#ff6b00]">Miembro</span>}</span>
                </Button>
              </motion.div>
            </div>
          </CardContent>
          <CardFooter>
            <motion.div className="w-full" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                variant="orange"
                className="w-full text-lg font-semibold"
                disabled={!selectedRole}
                onClick={handleContinue}
              >
                Continuar
              </Button>
            </motion.div>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  )
}

