"use client"

import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import SideBar from "@/components/ui/sidebar-custom"
import { adminTabs } from "@/const/tabs"
import { AdminNavProvider, useAdminNav } from "../administrator/context/AdminNavContext"

function AdminSideBar() {
  const { setSection } = useAdminNav()

  return (
    <SideBar
      tabs={adminTabs}
      onSelect={setSection}
    />
  )
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminNavProvider>
      <div className="flex min-h-screen">
        <div className="fixed top-0 left-0 w-full z-10">
          <DashboardHeader role="Administrador" />
        </div>

        <AdminSideBar />

        <main className="flex-1 md:ml-[80px] mt-16">
          {children}
        </main>
      </div>
    </AdminNavProvider>
  )
}
