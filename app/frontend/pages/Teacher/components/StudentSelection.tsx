import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Check, ChevronsUpDown, Search, Users, ExternalLink, Loader2 } from "lucide-react"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Link } from "@inertiajs/react"

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

export function StudentSelection({ students, selectedStudent, setSelectedStudent, currentStudent }: StudentSelectionProps) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<Student[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showAllStudents, setShowAllStudents] = useState(true)

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
    }, 300) // 300ms debounce

    return () => clearTimeout(timeoutId)
  }, [searchQuery])

  // Display students based on search state
  const displayStudents = showAllStudents ? students.slice(0, 20) : searchResults

  const handleSelectStudent = (studentId: string, studentData?: Student) => {
    setSelectedStudent(studentId)
    setOpen(false)
    setSearchQuery("")
    setShowAllStudents(true)
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
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between border-violet-200 hover:bg-violet-50 hover:border-violet-300 cursor-pointer"
            >
              {selectedStudent
                ? students.find((student) => student.id === selectedStudent)?.name
                : "Pilih siswa..."}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0" align="start">
            <div className="flex items-center border-b px-3">
              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
              <Input
                placeholder="Ketik untuk mencari siswa..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
              />
              {isSearching && (
                <Loader2 className="ml-2 h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>
            <div className="max-h-[300px] overflow-y-auto p-1">
              {showAllStudents && displayStudents.length === 20 && (
                <div className="px-2 py-2 text-xs text-muted-foreground bg-blue-50 border-b">
                  Menampilkan 20 siswa pertama. Ketik untuk mencari lebih banyak.
                </div>
              )}
              {!isSearching && displayStudents.length === 0 && (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  {searchQuery ? "Tidak ada siswa ditemukan." : "Ketik untuk mencari siswa."}
                </div>
              )}
              {displayStudents.map((student) => (
                <div
                  key={student.id}
                  onClick={() => handleSelectStudent(student.id)}
                  className={cn(
                    "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                    selectedStudent === student.id && "bg-accent"
                  )}
                >
                  <div className="flex gap-2 items-center flex-1">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src="/placeholder.svg" />
                      <AvatarFallback className="text-xs">
                        {student.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="font-medium">{student.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {student.class_level} - Juz {student.current_hifz_in_juz}
                      </span>
                    </div>
                  </div>
                  {selectedStudent === student.id && (
                    <Check className="h-4 w-4 ml-2" />
                  )}
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {currentStudent && (
          <div className="mt-4 p-3 sm:p-4 bg-blue-50 rounded-lg">
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
        )}
      </CardContent>
    </Card>
  )
}
