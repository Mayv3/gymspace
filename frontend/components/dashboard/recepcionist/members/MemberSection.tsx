"use client"
import React from "react"
import { TabsContent } from "@radix-ui/react-tabs"
import { MembersTab } from "./MembersTab"

type MembersSectionProps = {
  members: any[]
  searchTerm: string
  setSearchTerm: (value: string) => void
  onAddMember: () => void
  onEdit: (member: any) => void
  onDelete: (member: any) => void
}

export default function MembersSection({
  members,
  searchTerm,
  setSearchTerm,
  onAddMember,
  onEdit,
  onDelete
}: MembersSectionProps) {
  return (
    <TabsContent value="members" className="space-y-4">
      <MembersTab
        members={members}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        onAddMember={onAddMember}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </TabsContent>
  )
}
