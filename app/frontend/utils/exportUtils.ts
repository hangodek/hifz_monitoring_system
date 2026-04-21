import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { format } from 'date-fns'
import * as XLSX from 'xlsx'
// import matanLogo from '@/assets/matan_logo.png'

interface Student {
  id: string
  name: string
  avatar?: string
  class_level?: string
  total_juz_memorized?: number
  completed_surah_count?: number
}

const getCompletedJuz = (student: Student) => student.total_juz_memorized ?? 0

const getCompletedSurahCount = (student: Student) => student.completed_surah_count ?? 0

const classSortKey = (className: string) => {
  const classMatch = className.match(/^(\d+)([A-Za-z]*)$/)
  if (!classMatch) {
    return { grade: Number.MAX_SAFE_INTEGER, suffix: className }
  }

  return {
    grade: Number(classMatch[1]),
    suffix: classMatch[2] || ''
  }
}

const groupStudentsByClass = (students: Student[]) => {
  const grouped = students.reduce((acc, student) => {
    const className = student.class_level || 'Tanpa Kelas'
    if (!acc[className]) {
      acc[className] = []
    }

    acc[className].push(student)
    return acc
  }, {} as Record<string, Student[]>)

  const sortedClasses = Object.keys(grouped).sort((a, b) => {
    const left = classSortKey(a)
    const right = classSortKey(b)

    if (left.grade !== right.grade) {
      return left.grade - right.grade
    }

    return left.suffix.localeCompare(right.suffix)
  })

  return { grouped, sortedClasses }
}

const sortStudentsByProgress = (students: Student[]) => {
  return [...students].sort((a, b) => {
    const juzDiff = getCompletedJuz(b) - getCompletedJuz(a)
    if (juzDiff !== 0) {
      return juzDiff
    }

    return getCompletedSurahCount(b) - getCompletedSurahCount(a)
  })
}

export const exportStudentsToPDF = (students: Student[], filteredStudents?: Student[]) => {
  const doc = new jsPDF()
  const dataToExport = filteredStudents || students
  const { grouped, sortedClasses } = groupStudentsByClass(dataToExport)
  const pageWidth = doc.internal.pageSize.width
  
  doc.setFontSize(24)
  doc.setTextColor(40, 40, 40)
  doc.text('Laporan Hafalan Siswa', pageWidth / 2, 60, { align: 'center' })
  doc.text('Ringkasan semua kelas dan detail per kelas', pageWidth / 2, 75, { align: 'center' })

  doc.setFontSize(12)
  doc.setTextColor(100, 100, 100)
  doc.text(`Dibuat pada: ${format(new Date(), 'dd MMMM yyyy')}`, 14, 95)
  doc.text(`Jumlah Siswa: ${dataToExport.length}`, 14, 105)
  doc.text(`Jumlah Kelas: ${sortedClasses.length}`, 14, 115)

  const summaryRows = sortedClasses.map((className) => {
    const classStudents = grouped[className]
    const totalJuz = classStudents.reduce((sum, student) => sum + getCompletedJuz(student), 0)
    const totalSurah = classStudents.reduce((sum, student) => sum + getCompletedSurahCount(student), 0)

    return [
      className,
      classStudents.length,
      `${totalJuz} juz`,
      `${totalSurah} surah`
    ]
  })

  autoTable(doc, {
    head: [['Kelas', 'Jumlah Siswa', 'Total Juz Dihafal', 'Total Surah Dihafal']],
    body: summaryRows,
    startY: 120,
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [34, 197, 94],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 35 },
      1: { cellWidth: 35 },
      2: { cellWidth: 55 },
      3: { cellWidth: 55 },
    },
    margin: { top: 120 },
  })

  sortedClasses.forEach((className) => {
    const classStudents = sortStudentsByProgress(grouped[className])
    const classRows = classStudents.map((student, index) => [
      index + 1,
      student.name,
      `${getCompletedJuz(student)} juz`,
      `${getCompletedSurahCount(student)} surah`
    ])

    doc.addPage()
    doc.setFontSize(16)
    doc.setTextColor(40, 40, 40)
    doc.text(`Kelas ${className}`, 14, 20)

    autoTable(doc, {
      head: [['No', 'Nama', 'Jumlah Juz yang Dihafal', 'Jumlah Surah yang Dihafal']],
      body: classRows,
      startY: 28,
      styles: {
        fontSize: 9,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [59, 130, 246],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      columnStyles: {
        0: { cellWidth: 14 },
        1: { cellWidth: 70 },
        2: { cellWidth: 53 },
        3: { cellWidth: 53 },
      },
    })
  })

  doc.save(`laporan_siswa_hifz_${format(new Date(), 'yyyy-MM-dd')}.pdf`)
}

export const exportStudentsToExcel = (students: Student[], filteredStudents?: Student[]) => {
  const dataToExport = filteredStudents || students
  const { grouped, sortedClasses } = groupStudentsByClass(dataToExport)

  const workbook = XLSX.utils.book_new()

  const summaryRows = sortedClasses.map((className) => {
    const classStudents = grouped[className]
    const totalJuz = classStudents.reduce((sum, student) => sum + getCompletedJuz(student), 0)
    const totalSurah = classStudents.reduce((sum, student) => sum + getCompletedSurahCount(student), 0)

    return [
      className,
      classStudents.length,
      `${totalJuz} juz`,
      `${totalSurah} surah`
    ]
  })

  const classRows = sortedClasses.flatMap((className) => {
    const studentsInClass = sortStudentsByProgress(grouped[className])

    return [
      [''],
      [`Kelas ${className}`],
      ['No', 'Nama', 'Jumlah Juz yang Dihafal', 'Jumlah Surah yang Dihafal'],
      ...studentsInClass.map((student, index) => [
        index + 1,
        student.name,
        `${getCompletedJuz(student)} juz`,
        `${getCompletedSurahCount(student)} surah`
      ])
    ]
  })

  const reportRows = [
    ['Laporan Hafalan Siswa'],
    [''],
    ['Dibuat pada', format(new Date(), 'dd MMMM yyyy')],
    ['Jumlah Siswa', dataToExport.length],
    ['Jumlah Kelas', sortedClasses.length],
    [''],
    ['Ringkasan Semua Kelas'],
    ['Kelas', 'Jumlah Siswa', 'Total Juz Dihafal', 'Total Surah Dihafal'],
    ...summaryRows,
    ...classRows
  ]

  const summarySheet = XLSX.utils.aoa_to_sheet(reportRows)
  const maxColumns = reportRows.reduce((max, row) => Math.max(max, row.length), 0)
  const columnWidths = Array.from({ length: maxColumns }, (_, columnIndex) => ({
    wch: Math.max(...reportRows.map(row => String(row[columnIndex] ?? '').length), 14) + 3
  }))
  summarySheet['!cols'] = columnWidths
  
  // Add row heights for better spacing
  const headerRowIndex = reportRows.findIndex(row => row[0] === 'Kelas')
  summarySheet['!rows'] = reportRows.map((_, index) => {
    if (index === headerRowIndex) {
      return { hpx: 25 }
    }
    if (index === 0 || index === 1 || index === 6) {
      return { hpx: 18 }
    }
    return { hpx: 20 }
  })

  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Laporan')
  
  // Generate and download the file
  const fileName = `laporan-hifz-${format(new Date(), 'yyyy-MM-dd')}.xlsx`
  XLSX.writeFile(workbook, fileName)
}
