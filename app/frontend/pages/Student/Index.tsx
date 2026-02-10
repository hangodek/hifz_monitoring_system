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
import { Copy, CheckCircle2, Printer, Loader2 } from "lucide-react"
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
  nisn?: string
  student_number: string
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
  parent_phone?: string
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
  statistics: {
    total: number
    active: number
    inactive: number
    graduated: number
    class_distribution: Record<string, number>
  }
  pagination: {
    current_page: number
    per_page: number
    total_count: number
    total_pages: number
    has_more: boolean
  }
}

export default function StudentsIndex({ students: initialStudents, parent_credentials, statistics, pagination }: StudentsIndexProps) {
  const [students, setStudents] = useState<Student[]>(initialStudents)
  const [allStudentsForStats] = useState<Student[]>(initialStudents) // Keep original for stats if needed
  const [searchInput, setSearchInput] = useState("") // For debouncing
  const [classFilter, setClassFilter] = useState("all")
  const [juzFilter, setJuzFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [showCredentialsDialog, setShowCredentialsDialog] = useState(false)
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [currentPage, setCurrentPage] = useState(pagination.current_page)
  const [hasMore, setHasMore] = useState(pagination.has_more)
  const [totalCount, setTotalCount] = useState(pagination.total_count)

  // Debounced search - trigger backend search 500ms after user stops typing
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== "" || classFilter !== "all" || statusFilter !== "all" || juzFilter !== "all") {
        // Trigger backend search via Inertia
        router.get('/students', {
          search: searchInput,
          class_filter: classFilter,
          status_filter: statusFilter,
          juz_filter: juzFilter
        }, {
          preserveState: true,
          preserveScroll: true,
          only: ['students', 'statistics', 'pagination'],
          onSuccess: (page) => {
            const props = page.props as unknown as StudentsIndexProps
            setStudents(props.students)
            setCurrentPage(props.pagination.current_page)
            setHasMore(props.pagination.has_more)
            setTotalCount(props.pagination.total_count)
          }
        })
      } else if (searchInput === "" && classFilter === "all" && statusFilter === "all" && juzFilter === "all") {
        // Reset to initial state when all filters cleared
        router.get('/students', {}, {
          preserveState: true,
          preserveScroll: true,
          only: ['students', 'statistics', 'pagination'],
          onSuccess: (page) => {
            const props = page.props as unknown as StudentsIndexProps
            setStudents(props.students)
            setCurrentPage(props.pagination.current_page)
            setHasMore(props.pagination.has_more)
            setTotalCount(props.pagination.total_count)
          }
        })
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [searchInput, classFilter, statusFilter, juzFilter])

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

  // Load more students
  const handleLoadMore = async () => {
    if (isLoadingMore || !hasMore) return

    setIsLoadingMore(true)
    try {
      const nextPage = currentPage + 1
      const params = new URLSearchParams({
        page: nextPage.toString(),
        ...(searchInput && { search: searchInput }),
        ...(classFilter !== "all" && { class_filter: classFilter }),
        ...(statusFilter !== "all" && { status_filter: statusFilter }),
        ...(juzFilter !== "all" && { juz_filter: juzFilter })
      })
      
      const response = await fetch(`/students/load_more?${params}`, {
        headers: {
          'Accept': 'application/json',
          'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
        }
      })
      
      const data = await response.json()
      
      if (data.students) {
        setStudents(prev => [...prev, ...data.students])
        setCurrentPage(nextPage)
        setHasMore(data.pagination.has_more)
        setTotalCount(data.pagination.total_count)
      }
    } catch (error) {
      console.error('Error loading more students:', error)
    } finally {
      setIsLoadingMore(false)
    }
  }

  // No need for client-side filtering anymore - backend handles it
  const filteredStudents = students

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
          searchTerm={searchInput}
          setSearchTerm={setSearchInput}
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
        <StatsSummary statistics={statistics} />

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

        {/* Load More Button */}
        {hasMore && filteredStudents.length > 0 && (
          <div className="flex justify-center py-6">
            <Button
              onClick={handleLoadMore}
              disabled={isLoadingMore}
              size="lg"
              className="min-w-[200px]"
            >
              {isLoadingMore ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Memuat...
                </>
              ) : (
                <>Muat Lebih Banyak ({students.length} dari {totalCount})</>
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Parent Credentials Dialog */}
      <Dialog open={showCredentialsDialog} onOpenChange={setShowCredentialsDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Akun Orang Tua Berhasil Dibuat
            </DialogTitle>
            <DialogDescription>
              Silakan simpan informasi login ini untuk diberikan kepada orang tua siswa.
            </DialogDescription>
          </DialogHeader>

          {parent_credentials && (
            <div className="space-y-4">
              <div className="rounded-lg bg-blue-50 p-4 border border-blue-200">
                <p className="text-sm font-medium text-gray-700 mb-3">
                  Informasi Login untuk: <span className="font-bold text-gray-900">{parent_credentials.student_name}</span>
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
                      <span className="text-xs text-gray-500">Kata Sandi</span>
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
                  ⚠️ <strong>Penting:</strong> Informasi ini hanya ditunjukkan sekali saja. Silakan simpan atau cetak sebelum menutup jendela ini.
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
