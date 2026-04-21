import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Check, Search, Users, ExternalLink, Loader2, BookOpenCheck } from "lucide-react"
import { useState, useEffect, useRef, useMemo, useCallback } from "react"
import { cn } from "@/lib/utils"
import { Link } from "@inertiajs/react"
import { JUZ_SURAH_MAP } from "@/lib/quran"

interface Student {
  id: string
  name: string
  class_level: string
  current_hifz_in_juz: string
}

interface StudentSelectionProps {
  students: Student[]
  selectedStudent: string
  setSelectedStudent: (value: string) => void
  currentStudent: Student | undefined
}

interface StudentSurahProgression {
  surah: string
  juz: number
  completion_status: string
  last_activity_at?: string | null
}

export function StudentSelection({ students, selectedStudent, setSelectedStudent, currentStudent }: StudentSelectionProps) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<Student[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showAllStudents, setShowAllStudents] = useState(true)
  const [surahProgressions, setSurahProgressions] = useState<StudentSurahProgression[]>([])
  const [isLoadingProgressions, setIsLoadingProgressions] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const fetchStudentProgressions = useCallback(async (studentId?: string) => {
    if (!studentId) {
      setSurahProgressions([])
      return
    }

    setIsLoadingProgressions(true)
    try {
      const response = await fetch(`/teachers/student_activities?student_id=${studentId}`)
      const data = await response.json()
      setSurahProgressions(data.surah_progressions || [])
    } catch (error) {
      console.error("Failed to load student progressions:", error)
      setSurahProgressions([])
    } finally {
      setIsLoadingProgressions(false)
    }
  }, [])

  const groupedProgressionsByJuz = useMemo(() => {
    const grouped = new Map<number, StudentSurahProgression[]>()

    surahProgressions.forEach((progression) => {
      const key = Number(progression.juz)
      if (!grouped.has(key)) grouped.set(key, [])
      grouped.get(key)?.push(progression)
    })

    const currentJuz = Number(currentStudent?.current_hifz_in_juz)
    if (!Number.isNaN(currentJuz) && currentJuz > 0 && !grouped.has(currentJuz)) {
      grouped.set(currentJuz, [])
    }

    return Array.from(grouped.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([juz, progressions]) => {
        const mapBySurah = new Map<string, StudentSurahProgression>()
        progressions.forEach((item) => mapBySurah.set(item.surah, item))

        const surahOrder = JUZ_SURAH_MAP[String(juz)] || []

        // Show full juz checklist with default "belum_tuntas" for untouched surahs.
        const orderedSurahs = surahOrder.map((surahName) => {
          return (
            mapBySurah.get(surahName) || {
              juz,
              surah: surahName,
              completion_status: "belum_tuntas",
              last_activity_at: null,
            }
          )
        })

        // Keep any legacy/non-canonical records visible at the end for transparency.
        const extras = [...mapBySurah.values()]
          .filter((item) => !surahOrder.includes(item.surah))
          .sort((a, b) => a.surah.localeCompare(b.surah))

        return { juz, progressions: [...orderedSurahs, ...extras] }
      })
  }, [surahProgressions, currentStudent?.current_hifz_in_juz])

  // Debounced search function with native fetch
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      setShowAllStudents(true)
      setIsSearching(false)
      return
    }

    setIsSearching(true)
    setShowAllStudents(false)

    const timeoutId = setTimeout(async () => {
      try {
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
        const response = await fetch(`/teachers/search_students?q=${encodeURIComponent(searchQuery)}`, {
          headers: {
            'X-CSRF-Token': csrfToken || '',
            'Accept': 'application/json'
          }
        })
        
        if (!response.ok) {
          throw new Error('Search failed')
        }
        
        const data = await response.json()
        setSearchResults(data)
      } catch (error) {
        console.error('Error searching students:', error)
        setSearchResults([])
      } finally {
        setIsSearching(false)
      }
    }, 500) // 500ms debounce to reduce server calls

    return () => clearTimeout(timeoutId)
  }, [searchQuery])

  // Auto-focus search input when dialog opens
  useEffect(() => {
    if (open && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus()
      }, 0)
    }
  }, [open])

  useEffect(() => {
    fetchStudentProgressions(currentStudent?.id)
  }, [currentStudent?.id, fetchStudentProgressions])

  useEffect(() => {
    const handleActivitySaved = (event: Event) => {
      const customEvent = event as CustomEvent<{ studentId?: string }>
      const savedStudentId = customEvent.detail?.studentId
      if (savedStudentId && savedStudentId === currentStudent?.id) {
        fetchStudentProgressions(savedStudentId)
      }
    }

    window.addEventListener("teacher:activity-saved", handleActivitySaved)
    return () => window.removeEventListener("teacher:activity-saved", handleActivitySaved)
  }, [currentStudent?.id, fetchStudentProgressions])

  // Display students based on search state
  const displayStudents = showAllStudents ? students.slice(0, 20) : searchResults

  const handleSelectStudent = (studentId: string) => {
    setSelectedStudent(studentId)
    setOpen(false)
    setSearchQuery("")
    setShowAllStudents(true)
  }

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      setSearchQuery("")
      setShowAllStudents(true)
    }
  }

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-violet-50/30 hover:shadow-xl transition-shadow duration-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-violet-900">
          <div className="h-10 w-10 rounded-full bg-violet-500/20 flex items-center justify-center">
            <Users className="h-5 w-5 text-violet-600" />
          </div>
          Pilih Siswa
        </CardTitle>
        <CardDescription>Pilih siswa untuk sesi hafalan</CardDescription>
      </CardHeader>
      <CardContent>
        <Dialog open={open} onOpenChange={handleOpenChange}>
          <Button
            onClick={() => setOpen(true)}
            variant="outline"
            className="w-full justify-between border-violet-200 hover:bg-violet-50 hover:border-violet-300 cursor-pointer"
          >
            {selectedStudent
              ? students.find((student) => student.id === selectedStudent)?.name
              : "Cari siswa..."}
            <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>

          <DialogContent className="max-w-sm m-0 gap-0 p-0 rounded-t-2xl rounded-b-none max-h-[80vh] flex flex-col">
            <DialogHeader className="border-b px-4 pt-4">
              <DialogTitle className="text-lg font-semibold text-violet-900">Cari Siswa</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground pb-3">
                Pilih siswa dengan mencari nama, lalu tekan pada hasil untuk memilih.
              </DialogDescription>
            </DialogHeader>

            <div className="flex-shrink-0 border-b px-4 py-3">
              <div className="flex items-center border border-violet-200 rounded-lg px-3 py-2 bg-white">
                <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <Input
                  ref={searchInputRef}
                  placeholder="Ketik nama siswa..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="ml-2 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-0 text-base"
                />
                {isSearching && (
          <Loader2 className="ml-2 h-4 w-4 animate-spin text-muted-foreground flex-shrink-0" />
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {!isSearching && displayStudents.length === 0 && (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  {searchQuery ? "Tidak ada siswa ditemukan." : "Mulai ketik untuk mencari siswa."}
                </div>
              )}
              <div className="p-2">
                {displayStudents.map((student) => (
                  <div
                    key={student.id}
                    onClick={() => handleSelectStudent(student.id)}
                    className={cn(
                      "relative flex cursor-pointer select-none items-center rounded-lg px-3 py-3 text-sm outline-none transition-colors",
                      "hover:bg-violet-50 hover:text-accent-foreground",
                      selectedStudent === student.id && "bg-violet-100"
                    )}
                  >
                    <div className="flex gap-3 items-center flex-1">
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarImage src="/placeholder.svg" />
                        <AvatarFallback className="text-xs">
                          {student.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="font-medium text-gray-900">{student.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {student.class_level} - Juz {student.current_hifz_in_juz}
                        </span>
                      </div>
                    </div>
                    {selectedStudent === student.id && (
                      <Check className="h-5 w-5 ml-2 text-violet-600 flex-shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {currentStudent && (
          <div className="mt-4 space-y-3">
            <div className="p-3 sm:p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 sm:space-x-3 flex-1">
                  <Avatar className="h-10 w-10 sm:h-12 sm:w-12">
                    <AvatarImage src="/placeholder.svg" />
                    <AvatarFallback>
                      {currentStudent.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <Link 
                      href={`/students/${currentStudent.id}`}
                      className="text-sm sm:text-base font-semibold hover:underline hover:text-blue-600 cursor-pointer block truncate"
                    >
                      {currentStudent.name}
                    </Link>
                    <p className="text-xs sm:text-sm text-muted-foreground">{currentStudent.class_level}</p>
                  </div>
                </div>
                <Link 
                  href={`/students/${currentStudent.id}`}
                  className="ml-2 p-2 hover:bg-blue-100 rounded-full transition-colors cursor-pointer flex-shrink-0"
                  title="Lihat profil lengkap"
                >
                  <ExternalLink className="h-4 w-4 text-blue-600" />
                </Link>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-3 sm:p-4 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <BookOpenCheck className="h-4 w-4 text-violet-700" />
                <h4 className="text-sm font-semibold text-violet-900">Ringkasan Hafalan Siswa</h4>
              </div>

              <p className="text-xs text-slate-600 mb-3">
                Posisi saat ini: Juz {currentStudent.current_hifz_in_juz}
              </p>

              {isLoadingProgressions ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Memuat progres surah...
                </div>
              ) : groupedProgressionsByJuz.length === 0 ? (
                <p className="text-xs text-muted-foreground">Belum ada progres surah tersimpan untuk siswa ini.</p>
              ) : (
                <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                  {groupedProgressionsByJuz.map(({ juz, progressions }) => {
                    const completedCount = progressions.filter((item) => item.completion_status === "tuntas").length
                    return (
                      <div key={`juz-${juz}`} className="rounded-lg border border-slate-200 bg-slate-50/70 p-2.5">
                        <div className="mb-2 flex items-center justify-between">
                          <p className="text-xs font-semibold text-slate-800">Juz {juz}</p>
                          <p className="text-[11px] text-muted-foreground">{completedCount}/{progressions.length} surah tuntas</p>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {progressions.map((progression) => {
                            const isCompleted = progression.completion_status === "tuntas"
                            return (
                              <span
                                key={`${juz}-${progression.surah}`}
                                className={cn(
                                  "inline-flex items-center rounded-full px-2 py-1 text-[11px] font-medium",
                                  isCompleted
                                    ? "bg-emerald-100 text-emerald-800"
                                    : "bg-rose-100 text-rose-800"
                                )}
                              >
                                {progression.surah}
                              </span>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
