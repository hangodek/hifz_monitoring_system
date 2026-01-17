"use client"

import { useState } from "react"
import { router } from "@inertiajs/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowLeft, GraduationCap, Search, Users, CheckCircle2, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

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

interface PromoteStudentsProps {
  students: Student[]
  class_levels: string[]
}

export default function PromoteStudents({ students, class_levels }: PromoteStudentsProps) {
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set())
  const [targetClass, setTargetClass] = useState<string>("")
  const [sourceClassFilter, setSourceClassFilter] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<"success" | "error" | null>(null)
  const [submitMessage, setSubmitMessage] = useState("")

  // Filter students based on source class and search term
  const filteredStudents = students.filter((student) => {
    const matchesClass = sourceClassFilter === "all" || student.class_level === sourceClassFilter
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesClass && matchesSearch && student.status === "active" // Only active students
  })

  const handleSelectStudent = (studentId: string) => {
    const newSelected = new Set(selectedStudents)
    if (newSelected.has(studentId)) {
      newSelected.delete(studentId)
    } else {
      newSelected.add(studentId)
    }
    setSelectedStudents(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedStudents.size === filteredStudents.length) {
      setSelectedStudents(new Set())
    } else {
      setSelectedStudents(new Set(filteredStudents.map((s) => s.id)))
    }
  }

  const handleSubmit = async () => {
    if (selectedStudents.size === 0) {
      setSubmitStatus("error")
      setSubmitMessage("Sila pilih sekurang-kurangnya satu pelajar")
      return
    }

    if (!targetClass) {
      setSubmitStatus("error")
      setSubmitMessage("Sila pilih kelas tujuan")
      return
    }

    setIsSubmitting(true)
    setSubmitStatus(null)

    try {
      const response = await fetch('/students/bulk_promote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
        body: JSON.stringify({
          student_ids: Array.from(selectedStudents),
          target_class: targetClass,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSubmitStatus("success")
        setSubmitMessage(data.message)
        
        // Redirect back to students page after 2 seconds
        setTimeout(() => {
          router.visit('/students')
        }, 2000)
      } else {
        setSubmitStatus("error")
        setSubmitMessage(data.error || "Ralat berlaku")
      }
    } catch (error) {
      setSubmitStatus("error")
      setSubmitMessage("Ralat sambungan berlaku")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="flex flex-col space-y-4 sm:space-y-6 p-4 sm:p-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Naik Kelas Pelajar
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Pilih pelajar dan kelas tujuan untuk kenaikan kelas
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:space-x-4 sm:gap-0">
            <Button
              variant="outline"
              className="border-gray-200 hover:bg-gray-50 hover:text-gray-700 hover:border-gray-300 cursor-pointer"
              onClick={() => router.visit('/students')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Kembali ke Senarai Pelajar</span>
              <span className="sm:hidden">Kembali</span>
            </Button>
          </div>
        </div>

        {/* Status Alert */}
        {submitStatus && (
          <Alert variant={submitStatus === "success" ? "default" : "destructive"}>
            {submitStatus === "success" ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertDescription>{submitMessage}</AlertDescription>
          </Alert>
        )}

        {/* Action Card */}
        <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-slate-50/20 hover:shadow-xl transition-shadow duration-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Users className="h-5 w-5" />
              Maklumat Kenaikan Kelas
            </CardTitle>
            <CardDescription>
              {selectedStudents.size} pelajar dipilih dari {filteredStudents.length} pelajar yang dipaparkan
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Source Class Filter */}
              <div className="space-y-2">
                <Label>Filter Kelas Asal</Label>
                <Select value={sourceClassFilter} onValueChange={setSourceClassFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Semua Kelas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Kelas</SelectItem>
                    {class_levels.map((level) => (
                      <SelectItem key={level} value={level}>
                        {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Target Class */}
              <div className="space-y-2">
                <Label>Kelas Tujuan *</Label>
                <Select value={targetClass} onValueChange={setTargetClass}>
                  <SelectTrigger className={!targetClass ? "border-orange-300" : ""}>
                    <SelectValue placeholder="Pilih Kelas Tujuan" />
                  </SelectTrigger>
                  <SelectContent>
                    {class_levels.map((level) => (
                      <SelectItem key={level} value={level}>
                        {level}
                      </SelectItem>
                    ))}
                    <SelectItem value="Lulus">Lulus</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Search */}
              <div className="space-y-2">
                <Label>Cari Siswa</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Nama siswa..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t">
              <Button
                variant="outline"
                onClick={handleSelectAll}
                disabled={filteredStudents.length === 0}
                className="border-gray-200/60"
              >
                {selectedStudents.size === filteredStudents.length && filteredStudents.length > 0
                  ? "Batalkan Semua"
                  : "Pilih Semua"}
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || selectedStudents.size === 0 || !targetClass}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSubmitting ? "Memproses..." : `Naikkan ${selectedStudents.size} Pelajar`}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Students List */}
        <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-slate-50/20 hover:shadow-xl transition-shadow duration-200">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Senarai Pelajar Aktif</CardTitle>
            <CardDescription>
              Pilih pelajar yang akan naik kelas (hanya pelajar aktif yang dipaparkan)
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-200/30 max-h-[600px] overflow-y-auto">
              {filteredStudents.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-2 opacity-30" />
                  <p>Tiada pelajar yang dijumpai</p>
                </div>
              ) : (
                filteredStudents.map((student) => (
                  <div
                    key={student.id}
                    className="p-4 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-purple-50/50 transition-all duration-200 cursor-pointer"
                    onClick={() => handleSelectStudent(student.id)}
                  >
                    <div className="flex items-center gap-4">
                      <Checkbox
                        checked={selectedStudents.has(student.id)}
                        onCheckedChange={() => handleSelectStudent(student.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <Avatar className="h-10 w-10 flex-shrink-0">
                        <AvatarImage src={student.avatar || "/placeholder.svg"} />
                        <AvatarFallback className="text-xs">
                          {student.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium truncate">{student.name}</h3>
                        <p className="text-xs text-muted-foreground">
                          {student.father_name || student.mother_name || "Tiada maklumat ibu bapa"}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="font-medium">
                          {student.class_level}
                        </Badge>
                        <div className="text-right hidden sm:block">
                          <div className="text-xs text-muted-foreground">Progress</div>
                          <div className="text-sm font-medium">
                            {Math.round(((parseInt(student.current_hifz_in_juz) || 0) / 30) * 100)}%
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
