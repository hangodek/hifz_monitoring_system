import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Download, Plus, Mic, FileText, FileSpreadsheet, Sheet, GraduationCap, Upload } from "lucide-react"
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
  mother_name: string
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

  const handleExportCSV = async () => {
    try {
      setIsExporting(true)
      const { exportStudentsToCSV } = await import('@/utils/exportUtils')
      exportStudentsToCSV(students, filteredStudents)
    } catch (error) {
      console.error('Failed to export CSV:', error)
    } finally {
      setIsExporting(false)
    }
  }

  const handleExportExcel = async () => {
    try {
      setIsExporting(true)
      const { exportStudentsToExcel } = await import('@/utils/exportUtils')
      exportStudentsToExcel(students, filteredStudents)
    } catch (error) {
      console.error('Failed to export Excel:', error)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Senarai Pelajar</h1>
        <p className="text-sm sm:text-base text-muted-foreground">Urus dan pantau data pelajar hafalan Al-Quran</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" className="border-purple-200 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-300 cursor-pointer md:w-full" onClick={() => router.visit("/teachers")}>
          <Mic className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Mod Guru</span>
          <span className="sm:hidden">Guru</span>
        </Button>
        <Button
          variant="outline" 
          className="border-green-200 hover:bg-green-50 hover:text-green-700 hover:border-green-300 cursor-pointer md:w-full"
          onClick={() => router.visit("/students/new")}
        >
          <Plus className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Tambah Pelajar</span>
          <span className="sm:hidden">Tambah</span>
        </Button>
        <Button
          variant="outline"
          className="border-cyan-200 hover:bg-cyan-50 hover:text-cyan-700 hover:border-cyan-300 cursor-pointer md:w-full"
          onClick={() => router.visit("/students/bulk_import")}
        >
          <Upload className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Import Beramai-ramai</span>
          <span className="sm:hidden">Import</span>
        </Button>
        <Button
          variant="outline"
          className="border-orange-200 hover:bg-orange-50 hover:text-orange-700 hover:border-orange-300 cursor-pointer md:w-full"
          onClick={() => router.visit("/students/promote")}
        >
          <GraduationCap className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Naik Kelas</span>
          <span className="sm:hidden">Naik Kelas</span>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="border-blue-200 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 cursor-pointer md:w-full" disabled={isExporting}>
              <Download className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">{isExporting ? 'Mengeksport...' : 'Eksport Data'}</span>
              <span className="sm:hidden">{isExporting ? '...' : 'Eksport'}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 border-gray-200/60">
            <DropdownMenuItem onClick={handleExportPDF} className="cursor-pointer" disabled={isExporting}>
              <FileText className="h-4 w-4 mr-2" />
              Eksport sebagai PDF
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportExcel} className="cursor-pointer" disabled={isExporting}>
              <Sheet className="h-4 w-4 mr-2" />
              Eksport sebagai Excel
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportCSV} className="cursor-pointer" disabled={isExporting}>
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Eksport sebagai CSV
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button variant="outline" className="border-gray-200 hover:bg-gray-50 hover:text-gray-700 hover:border-gray-300 cursor-pointer md:w-full" onClick={() => router.visit("/dashboard")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Kembali ke Papan Pemuka</span>
          <span className="sm:hidden">Kembali</span>
        </Button>
      </div>
    </div>
  )
}
