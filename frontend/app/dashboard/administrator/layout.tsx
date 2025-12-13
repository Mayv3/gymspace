"use client"

import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import SideBar from "@/components/ui/sidebar-custom"
import { adminTabs } from "@/const/tabs"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex min-h-screen">
            <div className="fixed top-0 left-0 w-full z-10">
                <DashboardHeader role="Administrador" />
            </div>

            <SideBar tabs={adminTabs} onSelect={() => { }} />

            <main className="flex-1 md:ml-[80px] mt-16">
                {children}
            </main>
        </div>
    )
}
