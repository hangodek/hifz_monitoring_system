"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { router } from "@inertiajs/react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Copy, CheckCircle2, Printer } from "lucide-react"
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
  parent_credentials?: {
    student_name: string
    username: string
    password: string
  }
}

export default function StudentsIndex({ students, parent_credentials }: StudentsIndexProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [classFilter, setClassFilter] = useState("all")
  const [juzFilter, setJuzFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [showCredentialsDialog, setShowCredentialsDialog] = useState(false)
  const [copiedField, setCopiedField] = useState<string | null>(null)

  // Show credentials dialog if parent_credentials is available
  useEffect(() => {
    if (parent_credentials) {
      setShowCredentialsDialog(true)
    }
  }, [parent_credentials])

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const handlePrint = () => {
    window.print()
  }

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

      {/* Parent Credentials Dialog */}
      <Dialog open={showCredentialsDialog} onOpenChange={setShowCredentialsDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Akaun Ibu Bapa Berjaya Dicipta
            </DialogTitle>
            <DialogDescription>
              Sila simpan maklumat login ini untuk diberikan kepada ibu bapa pelajar.
            </DialogDescription>
          </DialogHeader>

          {parent_credentials && (
            <div className="space-y-4">
              <div className="rounded-lg bg-blue-50 p-4 border border-blue-200">
                <p className="text-sm font-medium text-gray-700 mb-3">
                  Maklumat Login untuk: <span className="font-bold text-gray-900">{parent_credentials.student_name}</span>
                </p>

                <div className="space-y-3">
                  <div className="bg-white rounded p-3 border">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-xs text-gray-500">Nama Pengguna</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2"
                        onClick={() => handleCopy(parent_credentials.username, 'username')}
                      >
                        {copiedField === 'username' ? (
                          <CheckCircle2 className="h-3 w-3 text-green-600" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                    <p className="font-mono font-bold text-lg">{parent_credentials.username}</p>
                  </div>

                  <div className="bg-white rounded p-3 border">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-xs text-gray-500">Kata Laluan</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2"
                        onClick={() => handleCopy(parent_credentials.password, 'password')}
                      >
                        {copiedField === 'password' ? (
                          <CheckCircle2 className="h-3 w-3 text-green-600" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                    <p className="font-mono font-bold text-lg">{parent_credentials.password}</p>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-xs text-yellow-800">
                  ⚠️ <strong>Penting:</strong> Maklumat ini hanya ditunjukkan sekali sahaja. Sila simpan atau cetak sebelum menutup tetingkap ini.
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handlePrint}
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Cetak
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => setShowCredentialsDialog(false)}
                >
                  Tutup
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
