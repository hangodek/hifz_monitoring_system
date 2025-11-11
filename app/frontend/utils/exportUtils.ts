import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { format } from 'date-fns'
import * as XLSX from 'xlsx'
import matanLogo from '@/assets/matan_logo.png'

interface Student {
  id: string
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
  father_phone?: string
  mother_phone?: string
  date_joined: string
  created_at: string
  updated_at: string
}

export const exportStudentsToPDF = (students: Student[], filteredStudents?: Student[]) => {
  const doc = new jsPDF()
  const dataToExport = filteredStudents || students
  
  // Group students by class
  const studentsByClass = dataToExport.reduce((acc, student) => {
    const className = student.class_level || 'Tiada Kelas'
    if (!acc[className]) {
      acc[className] = []
    }
    acc[className].push(student)
    return acc
  }, {} as Record<string, Student[]>)

  // Sort classes alphabetically
  const sortedClasses = Object.keys(studentsByClass).sort()
  
  // Title page with logo
  // Add logo at the top center
  const logoWidth = 30
  const logoHeight = 30
  const pageWidth = doc.internal.pageSize.width
  const logoX = (pageWidth - logoWidth) / 2
  doc.addImage(matanLogo, 'JPEG', logoX, 15, logoWidth, logoHeight)
  
  doc.setFontSize(24)
  doc.setTextColor(40, 40, 40)
  doc.text('Laporan Pelajar Hifz', pageWidth / 2, 60, { align: 'center' })
  doc.text('Dikelaskan mengikut Kelas', pageWidth / 2, 75, { align: 'center' })

  // Subtitle with date
  doc.setFontSize(12)
  doc.setTextColor(100, 100, 100)
  doc.text(`Dijana pada: ${format(new Date(), 'dd MMMM yyyy')}`, 14, 95)
  doc.text(`Jumlah Pelajar: ${dataToExport.length}`, 14, 105)
  doc.text(`Jumlah Kelas: ${sortedClasses.length}`, 14, 115)
  
  // Overall summary statistics
  const activeStudents = dataToExport.filter(s => s.status === 'active').length
  const graduatedStudents = dataToExport.filter(s => s.status === 'graduated').length
  const inactiveStudents = dataToExport.filter(s => s.status === 'inactive').length
  
  doc.text(`Status Keseluruhan - Aktif: ${activeStudents} | Lulus: ${graduatedStudents} | Tidak Aktif: ${inactiveStudents}`, 14, 130)
  
  let currentY = 145
  
  // Class overview section
  doc.setFontSize(16)
  doc.setTextColor(40, 40, 40)
  doc.text('Ringkasan Kelas', 14, currentY)
  currentY += 15
  
  doc.setFontSize(10)
  doc.setTextColor(80, 80, 80)
  
  sortedClasses.forEach(className => {
    const classStudents = studentsByClass[className]
    const activeInClass = classStudents.filter(s => s.status === 'active').length
    const graduatedInClass = classStudents.filter(s => s.status === 'graduated').length
    const inactiveInClass = classStudents.filter(s => s.status === 'inactive').length
    
    doc.text(`${className}: ${classStudents.length} pelajar (Aktif: ${activeInClass}, Lulus: ${graduatedInClass}, Tidak Aktif: ${inactiveInClass})`, 20, currentY)
    currentY += 8
    
    // Add new page if needed
    if (currentY > 250) {
      doc.addPage()
      currentY = 20
    }
  })
  
  // Helper function to create table for a status group
  const createStatusTable = (students: Student[], className: string, statusLabel: string, statusColor: number[]) => {
    if (students.length === 0) return
    
    doc.addPage()
    
    // Add logo at the top
    doc.addImage(matanLogo, 'JPEG', pageWidth - 35, 10, 25, 25)
    
    // Class header
    doc.setFontSize(18)
    doc.setTextColor(40, 40, 40)
    doc.text(`${className}`, 14, 25)
    
    doc.setFontSize(14)
    doc.setTextColor(statusColor[0], statusColor[1], statusColor[2])
    doc.text(`Pelajar ${statusLabel}`, 14, 37)
    
    doc.setFontSize(12)
    doc.setTextColor(100, 100, 100)
    doc.text(`${students.length} pelajar`, 14, 47)
    
    // Prepare table data
    const tableData = students.map((student, index) => [
      index + 1,
      student.name,
      student.gender === 'male' ? 'L' : 'P',
      `Juz ${student.current_hifz_in_juz}`,
      `${student.current_hifz_in_pages} halaman`,
      format(new Date(student.date_joined), 'dd/MM/yyyy')
    ])
    
    // Create table
    autoTable(doc, {
      head: [['No', 'Nama', 'Jantina', 'Juz Semasa', 'Halaman', 'Tarikh Menyertai']],
      body: tableData,
      startY: 57,
      styles: {
        fontSize: 8,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: statusColor,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      columnStyles: {
        0: { cellWidth: 15 },
        1: { cellWidth: 55 },
        2: { cellWidth: 20 },
        3: { cellWidth: 30 },
        4: { cellWidth: 30 },
        5: { cellWidth: 30 },
      },
      margin: { top: 57 },
    })
  }
  
  // Section 1: All classes - Active students only (sorted by hafalan)
  sortedClasses.forEach((className) => {
    const classStudents = studentsByClass[className]
    const activeStudentsInClass = classStudents.filter(s => s.status === 'active')
    
    // Sort active students by hafalan (highest to lowest)
    const sortedActiveStudents = activeStudentsInClass.sort((a, b) => {
      const juzA = parseInt(a.current_hifz_in_juz) || 0
      const juzB = parseInt(b.current_hifz_in_juz) || 0
      
      if (juzA !== juzB) {
        return juzB - juzA
      }
      
      const pagesA = parseInt(a.current_hifz_in_pages) || 0
      const pagesB = parseInt(b.current_hifz_in_pages) || 0
      return pagesB - pagesA
    })
    
    if (sortedActiveStudents.length > 0) {
      createStatusTable(sortedActiveStudents, className, 'Aktif', [34, 197, 94])
    }
  })
  
  // Section 2: All classes - Inactive students
  sortedClasses.forEach((className) => {
    const classStudents = studentsByClass[className]
    const inactiveStudentsInClass = classStudents.filter(s => s.status === 'inactive')
    
    if (inactiveStudentsInClass.length > 0) {
      createStatusTable(inactiveStudentsInClass, className, 'Tidak Aktif', [156, 163, 175])
    }
  })
  
  // Section 3: All classes - Graduated students
  sortedClasses.forEach((className) => {
    const classStudents = studentsByClass[className]
    const graduatedStudentsInClass = classStudents.filter(s => s.status === 'graduated')
    
    if (graduatedStudentsInClass.length > 0) {
      createStatusTable(graduatedStudentsInClass, className, 'Lulus', [59, 130, 246])
    }
  })
  
  // Footer
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(150, 150, 150)
    
    // Center the title
    const pageWidth = doc.internal.pageSize.width
    const title = 'Sistem Pengurusan Hifz'
    const titleWidth = doc.getTextWidth(title)
    const titleX = (pageWidth - titleWidth) / 2
    
    doc.text(title, titleX, doc.internal.pageSize.height - 10)
    doc.text(`Halaman ${i} daripada ${pageCount}`, doc.internal.pageSize.width - 40, doc.internal.pageSize.height - 10)
  }
  
  // Save the PDF
  const fileName = `laporan-hifz-${format(new Date(), 'yyyy-MM-dd')}.pdf`
  doc.save(fileName)
}

export const exportStudentsToCSV = (students: Student[], filteredStudents?: Student[]) => {
  const dataToExport = filteredStudents || students
  
  // Define CSV headers in Bahasa Malaysia
  const headers = [
    'No',
    'Nama',
    'Kelas',
    'Jantina',
    'Tempat Lahir',
    'Tarikh Lahir',
    'Alamat',
    'Juz Semasa',
    'Halaman Dihafal',
    'Status',
    'Nama Bapa',
    'Nama Ibu',
    'Telefon Bapa',
    'Telefon Ibu',
    'Emel',
    'Telefon',
    'Tarikh Menyertai'
  ]
  
  // Prepare CSV data with Bahasa Malaysia translations
  const csvData = dataToExport.map((student, index) => [
    index + 1,
    student.name,
    student.class_level,
    student.gender === 'male' ? 'Lelaki' : 'Perempuan',
    student.birth_place,
    student.birth_date,
    student.address || '',
    student.current_hifz_in_juz,
    student.current_hifz_in_pages,
    student.status === 'active' ? 'Aktif' : student.status === 'graduated' ? 'Lulus' : 'Tidak Aktif',
    student.father_name,
    student.mother_name,
    student.father_phone || '',
    student.mother_phone || '',
    student.email || '',
    student.phone || '',
    student.date_joined
  ])
  
  // Convert to CSV format
  const csvContent = [
    headers.join(','),
    ...csvData.map(row => row.map(field => 
      typeof field === 'string' && field.includes(',') 
        ? `"${field}"` 
        : field
    ).join(','))
  ].join('\n')
  
  // Create and download CSV file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', `laporan-hifz-${format(new Date(), 'yyyy-MM-dd')}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export const exportStudentsToExcel = (students: Student[], filteredStudents?: Student[]) => {
  const dataToExport = filteredStudents || students
  
  // Group students by class
  const studentsByClass = dataToExport.reduce((acc, student) => {
    const className = student.class_level || 'Tiada Kelas'
    if (!acc[className]) {
      acc[className] = []
    }
    acc[className].push(student)
    return acc
  }, {} as Record<string, Student[]>)

  // Sort classes alphabetically
  const sortedClasses = Object.keys(studentsByClass).sort()
  
  // Create a new workbook
  const workbook = XLSX.utils.book_new()
  
  // Summary sheet in Bahasa Malaysia
  const summaryData = [
    ['Laporan Pelajar Hifz - Ringkasan'],
    ['Dijana pada:', format(new Date(), 'dd MMMM yyyy')],
    ['Jumlah Pelajar:', dataToExport.length],
    ['Jumlah Kelas:', sortedClasses.length],
    [''],
    ['Ringkasan Status Keseluruhan:'],
    ['Pelajar Aktif:', dataToExport.filter(s => s.status === 'active').length],
    ['Pelajar Lulus:', dataToExport.filter(s => s.status === 'graduated').length],
    ['Pelajar Tidak Aktif:', dataToExport.filter(s => s.status === 'inactive').length],
    [''],
    ['Pecahan Kelas:'],
    ['Nama Kelas', 'Jumlah Pelajar', 'Aktif', 'Lulus', 'Tidak Aktif']
  ]
  
  // Add class breakdown data
  sortedClasses.forEach(className => {
    const classStudents = studentsByClass[className]
    const activeInClass = classStudents.filter(s => s.status === 'active').length
    const graduatedInClass = classStudents.filter(s => s.status === 'graduated').length
    const inactiveInClass = classStudents.filter(s => s.status === 'inactive').length
    
    summaryData.push([
      className,
      classStudents.length,
      activeInClass,
      graduatedInClass,
      inactiveInClass
    ])
  })
  
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Ringkasan')
  
  // Create a sheet for each class
  sortedClasses.forEach(className => {
    const classStudents = studentsByClass[className]
    
    // Sort students by status: graduated > active > inactive
    const sortedClassStudents = classStudents.sort((a, b) => {
      const statusOrder: Record<string, number> = { 'graduated': 0, 'active': 1, 'inactive': 2 }
      return (statusOrder[a.status] || 3) - (statusOrder[b.status] || 3)
    })
    
    // Prepare data for this class with Bahasa Malaysia headers
    const classData = [
      ['No', 'Nama', 'Jantina', 'Tempat Lahir', 'Tarikh Lahir', 'Alamat', 'Juz Semasa', 'Halaman Dihafal', 'Status', 'Nama Bapa', 'Nama Ibu', 'Telefon Bapa', 'Telefon Ibu', 'Emel', 'Telefon', 'Tarikh Menyertai'],
      ...sortedClassStudents.map((student, index) => [
        index + 1,
        student.name,
        student.gender === 'male' ? 'Lelaki' : 'Perempuan',
        student.birth_place,
        student.birth_date,
        student.address || '',
        student.current_hifz_in_juz,
        student.current_hifz_in_pages,
        student.status === 'active' ? 'Aktif' : student.status === 'graduated' ? 'Lulus' : 'Tidak Aktif',
        student.father_name,
        student.mother_name,
        student.father_phone || '',
        student.mother_phone || '',
        student.email || '',
        student.phone || '',
        student.date_joined
      ])
    ]
    
    const classSheet = XLSX.utils.aoa_to_sheet(classData)
    
    // Auto-size columns
    const colWidths = classData[0].map((_, colIndex) => ({
      wch: Math.max(
        classData[0][colIndex].toString().length,
        ...classData.slice(1).map(row => (row[colIndex] || '').toString().length)
      ) + 2
    }))
    classSheet['!cols'] = colWidths
    
    // Clean class name for sheet name (Excel has restrictions)
    const cleanClassName = className.replace(/[\\\/\?\*\[\]]/g, '_').substring(0, 31)
    XLSX.utils.book_append_sheet(workbook, classSheet, cleanClassName)
  })
  
  // Create all students sheet with Bahasa Malaysia headers
  const allStudentsData = [
    ['No', 'Nama', 'Kelas', 'Jantina', 'Tempat Lahir', 'Tarikh Lahir', 'Alamat', 'Juz Semasa', 'Halaman Dihafal', 'Status', 'Nama Bapa', 'Nama Ibu', 'Telefon Bapa', 'Telefon Ibu', 'Emel', 'Telefon', 'Tarikh Menyertai'],
    ...dataToExport.map((student, index) => [
      index + 1,
      student.name,
      student.class_level,
      student.gender === 'male' ? 'Lelaki' : 'Perempuan',
      student.birth_place,
      student.birth_date,
      student.address || '',
      student.current_hifz_in_juz,
      student.current_hifz_in_pages,
      student.status === 'active' ? 'Aktif' : student.status === 'graduated' ? 'Lulus' : 'Tidak Aktif',
      student.father_name,
      student.mother_name,
      student.father_phone || '',
      student.mother_phone || '',
      student.email || '',
      student.phone || '',
      student.date_joined
    ])
  ]
  
  const allStudentsSheet = XLSX.utils.aoa_to_sheet(allStudentsData)
  
  // Auto-size columns for all students sheet
  const allColWidths = allStudentsData[0].map((_, colIndex) => ({
    wch: Math.max(
      allStudentsData[0][colIndex].toString().length,
      ...allStudentsData.slice(1).map(row => (row[colIndex] || '').toString().length)
    ) + 2
  }))
  allStudentsSheet['!cols'] = allColWidths
  
  XLSX.utils.book_append_sheet(workbook, allStudentsSheet, 'Semua Pelajar')
  
  // Generate and download the file
  const fileName = `laporan-hifz-${format(new Date(), 'yyyy-MM-dd')}.xlsx`
  XLSX.writeFile(workbook, fileName)
}
