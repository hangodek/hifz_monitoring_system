"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { router } from "@inertiajs/react"
import {
  StudentHeader,
  FiltersAndSearch,
  StatsSummary,
  StudentGridView,
  StudentListView,
  NoStudentsFound,
} from "./components"

interface Student {
  id: string
  name: string
  current_hifz_in_juz: string
  current_hifz_in_pages: string
  current_hifz_in_surah: string
  avatar?: string
  class_level: string
  phone?: string
  email?: string
  status: string
  gender: string
  birth_place: string
  birth_date: string
  address?: string
  father_name: string
  mother_name: string
  father_phone?: string
  mother_phone?: string
  date_joined: string
  created_at: string
  updated_at: string
}

interface StudentsIndexProps {
  students: Student[]
}

export default function StudentsIndex({ students }: StudentsIndexProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [classFilter, setClassFilter] = useState("all")
  const [juzFilter, setJuzFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  // Filter and sort students
  const filteredStudents = students.filter((student) => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesClass = classFilter === "all" || student.class_level === classFilter
    const matchesStatus = statusFilter === "all" || student.status === statusFilter
    
    // Convert current_hifz_in_juz to number for Juz filtering
    const currentJuz = parseInt(student.current_hifz_in_juz) || 0
    const matchesJuz =
      juzFilter === "all" ||
      (juzFilter === "Juz 1-5" && currentJuz >= 1 && currentJuz <= 5) ||
      (juzFilter === "Juz 6-10" && currentJuz >= 6 && currentJuz <= 10) ||
      (juzFilter === "Juz 11-15" && currentJuz >= 11 && currentJuz <= 15) ||
      (juzFilter === "Juz 16-20" && currentJuz >= 16 && currentJuz <= 20) ||
      (juzFilter === "Juz 21-25" && currentJuz >= 21 && currentJuz <= 25) ||
      (juzFilter === "Juz 26-30" && currentJuz >= 26 && currentJuz <= 30)
    return matchesSearch && matchesClass && matchesStatus && matchesJuz
  })

  const getStatusBadge = (status: string) => {
    return status === "active" ? (
      <Badge variant="default" className="bg-green-100 text-green-800">
        Aktif
      </Badge>
    ) : status === "graduated" ? (
      <Badge variant="default" className="bg-orange-100 text-orange-800">
        Lulus
      </Badge>
    ) : (
      <Badge variant="secondary" className="bg-red-100 text-red-800">
        Tidak Aktif
      </Badge>
    )
  }

  const handleSelectStudent = (studentId: string) => {
    router.visit(`/students/${studentId}`)
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="flex flex-col space-y-4 sm:space-y-6 p-4 sm:p-6">
        {/* Header */}
        <StudentHeader students={students} filteredStudents={filteredStudents} />

        {/* Filters and Search */}
        <FiltersAndSearch
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          classFilter={classFilter}
          setClassFilter={setClassFilter}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          juzFilter={juzFilter}
          setJuzFilter={setJuzFilter}
          viewMode={viewMode}
          setViewMode={setViewMode}
        />

        {/* Stats Summary */}
        <StatsSummary students={students} />

        {viewMode === "grid" ? (
          <StudentGridView
            filteredStudents={filteredStudents}
            getStatusBadge={getStatusBadge}
            handleSelectStudent={handleSelectStudent}
          />
        ) : (
          <StudentListView
            filteredStudents={filteredStudents}
            getStatusBadge={getStatusBadge}
            handleSelectStudent={handleSelectStudent}
          />
        )}

        {filteredStudents.length === 0 && <NoStudentsFound />}
      </div>
    </div>
  )
}
