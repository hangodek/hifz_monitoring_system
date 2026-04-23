import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Download, Plus, Mic, FileText, Sheet, GraduationCap, Upload } from "lucide-react"
import { router } from "@inertiajs/react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface Student {
  id: string
  nisn?: string
  student_number: string
  name: string
  current_hifz_in_juz: string
  current_hifz_in_pages: string
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
  parent_phone?: string
  created_at: string
  updated_at: string
}

interface StudentHeaderProps {
  students?: Student[]
  filteredStudents?: Student[]
}

export function StudentHeader({ students = [], filteredStudents }: StudentHeaderProps) {
  const [isExporting, setIsExporting] = useState(false)

  const handleExportPDF = async () => {
    try {
      setIsExporting(true)
      const { exportStudentsToPDF } = await import('@/utils/exportUtils')
      exportStudentsToPDF(students, filteredStudents)
    } catch (error) {
      console.error('Failed to export PDF:', error)
    } finally {
      setIsExporting(false)
    }
  }

  const handleExportExcel = async () => {
    try {
      setIsExporting(true)
      const queryString = window.location.search
      window.location.href = `/students/export_report.xlsx${queryString}`
    } catch (error) {
      console.error('Failed to export Excel:', error)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Daftar Siswa</h1>
        <p className="text-sm sm:text-base text-muted-foreground">Kelola dan pantau data siswa hafalan Al-Quran</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" className="hover:bg-accent hover:text-accent-foreground cursor-pointer md:w-full" onClick={() => router.visit("/teachers")}>
          <Mic className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Mode Guru</span>
          <span className="sm:hidden">Guru</span>
        </Button>
        <Button variant="outline" className="hover:bg-accent hover:text-accent-foreground cursor-pointer md:w-full" onClick={() => router.visit("/students/new")}>
          <Plus className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Tambah Siswa</span>
          <span className="sm:hidden">Tambah</span>
        </Button>
        <Button variant="outline" className="hover:bg-accent hover:text-accent-foreground cursor-pointer md:w-full" onClick={() => router.visit("/students/bulk_import")}>
          <Upload className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Import Massal</span>
          <span className="sm:hidden">Import</span>
        </Button>
        <Button variant="outline" className="hover:bg-accent hover:text-accent-foreground cursor-pointer md:w-full" onClick={() => router.visit("/students/promote")}>
          <GraduationCap className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Naik Kelas</span>
          <span className="sm:hidden">Naik Kelas</span>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="hover:bg-accent hover:text-accent-foreground cursor-pointer md:w-full" disabled={isExporting}>
              <Download className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">{isExporting ? 'Mengekspor...' : 'Ekspor Data'}</span>
              <span className="sm:hidden">{isExporting ? '...' : 'Ekspor'}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={handleExportPDF} className="cursor-pointer" disabled={isExporting}>
              <FileText className="h-4 w-4 mr-2" />
              Ekspor sebagai PDF
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportExcel} className="cursor-pointer" disabled={isExporting}>
              <Sheet className="h-4 w-4 mr-2" />
              Ekspor sebagai Excel
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button
          variant="outline"
          className="border-destructive/30 hover:bg-destructive/5 hover:text-destructive cursor-pointer md:w-full"
          onClick={() => router.visit("/dashboard")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Kembali ke Dashboard</span>
          <span className="sm:hidden">Kembali</span>
        </Button>
      </div>
    </div>
  )
}
