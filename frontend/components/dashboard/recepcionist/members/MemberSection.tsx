"use client"
import React from "react"
import { MembersTab } from "./MembersTab"

type MembersSectionProps = {
  searchTerm: string
  setSearchTerm: (value: string) => void
  onAddMember: () => void
  onEdit: (member: any) => void
  onDelete: (member: any) => void
}

// La lista de socios la pide MembersTab paginada al servidor
export default function MembersSection({
  searchTerm,
  setSearchTerm,
  onAddMember,
  onEdit,
  onDelete,
}: MembersSectionProps) {
  return (
      <MembersTab
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        onAddMember={() => onAddMember()}
        onEdit={onEdit}
        onDelete={onDelete}
      />
  )
}
