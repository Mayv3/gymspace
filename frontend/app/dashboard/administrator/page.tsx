"use client"

import { useEffect, useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, TrendingUp } from "lucide-react"

import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { AddMemberDialog } from "@/components/dashboard/recepcionist/members/add-member-dialog"
import { useUser } from "@/context/UserContext"
import { useRouter } from "next/navigation"
import { MembersStatsTab } from "@/components/dashboard/administrator/MembersStatsTab"
import AdminOverviewCharts from "@/components/dashboard/administrator/AdminOverviewCharts"

export default function AdministratorDashboard() {
  const [showAddMember, setShowAddMember] = useState(false)
  const [tabValue, setTabValue] = useState("overview")
  const { user, loading } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (!loading && (!user?.dni || !user?.rol)) {
      router.push("/login")
    }
  }, [user, loading, router])

  return (
    <div className="flex min-h-screen flex-col">
      <DashboardHeader role="Administrador" />
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight gradient-text">GymSpace - Panel de administrador</h2>
        </div>

        <Tabs value={tabValue} onValueChange={setTabValue} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 md:w-auto">
            <TabsTrigger value="overview" className="data-[state=active]:bg-[#ff6b00] data-[state=active]:text-white">
              <TrendingUp className="mr-2 h-4 w-4" />
              Resumen
            </TabsTrigger>
            <TabsTrigger value="members" className="data-[state=active]:bg-[#ff6b00] data-[state=active]:text-white">
              <Users className="mr-2 h-4 w-4" />
              Miembros
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" forceMount>
            <AdminOverviewCharts isVisible={tabValue === "overview"} />
          </TabsContent>

          <TabsContent value="members" className="space-y-4">
            <MembersStatsTab />
          </TabsContent>
        </Tabs>
      </div>
      <AddMemberDialog
        open={showAddMember}
        onOpenChange={setShowAddMember}
        onMemberAdded={(newMember) => {
          console.log("New member added:", newMember)
        }}
      />
    </div>
  )
}

