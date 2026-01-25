"use client"

import { useState } from "react"
import { router } from "@inertiajs/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { 
  ArrowLeft, 
  Download, 
  Upload, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  FileSpreadsheet 
} from "lucide-react"

interface PreviewStudent {
  line_number: number
  name: string
  gender: string
  birth_place: string
  birth_date: string
  father_name: string
  mother_name: string
  father_phone?: string
  mother_phone?: string
  address?: string
  class_level: string
  status: string
  date_joined: string
  current_hifz_in_juz: string
  current_hifz_in_pages: string
  current_hifz_in_surah: string
  errors?: string[]
  valid: boolean
}

interface PreviewData {
  data: PreviewStudent[]
  total: number
  valid: number
  invalid: number
}

export default function BulkImport() {
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [previewData, setPreviewData] = useState<PreviewData | null>(null)
  const [creationResult, setCreationResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const droppedFile = e.dataTransfer.files[0]
    const validExtensions = ['.xlsx', '.xls', '.csv']
    const fileExtension = droppedFile?.name.toLowerCase().substring(droppedFile.name.lastIndexOf('.'))
    
    if (droppedFile && validExtensions.includes(fileExtension)) {
      setFile(droppedFile)
      setError(null)
    } else {
      setError("File harus berformat Excel (.xlsx, .xls) atau CSV")
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      const validExtensions = ['.xlsx', '.xls', '.csv']
      const fileExtension = selectedFile.name.toLowerCase().substring(selectedFile.name.lastIndexOf('.'))
      
      if (validExtensions.includes(fileExtension)) {
        setFile(selectedFile)
        setError(null)
      } else {
        setError("File harus berformat Excel (.xlsx, .xls) atau CSV")
      }
    }
  }

  const handleDownloadTemplate = () => {
    window.location.href = '/students/download_template'
  }

  const handleUpload = async () => {
    if (!file) return

    setIsUploading(true)
    setError(null)
    setPreviewData(null)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('/students/preview_import', {
        method: 'POST',
        headers: {
          'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
        },
        body: formData
      })

      const data = await response.json()

      if (response.ok) {
        setPreviewData(data)
      } else {
        setError(data.error || 'Gagal memproses file')
      }
    } catch (err) {
      setError('Terjadi kesalahan saat mengupload file')
      console.error(err)
    } finally {
      setIsUploading(false)
    }
  }

  const handleCreate = async () => {
    if (!previewData) return

    const validStudents = previewData.data.filter(s => s.valid)
    if (validStudents.length === 0) {
      setError('Tidak ada data valid untuk dibuat')
      return
    }

    setIsCreating(true)
    setError(null)
    setProgress(0)

    try {
      const response = await fetch('/students/bulk_create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
        },
        body: JSON.stringify({
          students: validStudents
        })
      })

      const data = await response.json()

      if (response.ok) {
        setCreationResult(data)
        setProgress(100)
        
        // Redirect ke index setelah 3 detik
        setTimeout(() => {
          router.visit('/students')
        }, 3000)
      } else {
        setError(data.error || 'Gagal membuat pelajar')
      }
    } catch (err) {
      setError('Terjadi kesalahan saat membuat pelajar')
      console.error(err)
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="flex flex-col space-y-6 p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Import Pelajar Beramai-ramai</h1>
            <p className="text-muted-foreground">Upload file Excel atau CSV untuk menambahkan banyak pelajar sekaligus</p>
          </div>
          <Button 
            variant="outline" 
            className="cursor-pointer" 
            onClick={() => router.visit('/students')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali
          </Button>
        </div>

        {/* Step 1: Download Template */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold text-sm">1</span>
              Download Template
            </CardTitle>
            <CardDescription>
              Download template CSV terlebih dahulu untuk memastikan format data yang benar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handleDownloadTemplate} 
              variant="outline"
              className="cursor-pointer"
            >
              <Download className="h-4 w-4 mr-2" />
              Download Template Excel
            </Button>
            <p className="text-sm text-muted-foreground mt-3">
              Template Excel sudah termasuk contoh data dan format yang rapi. Lebih mudah digunakan daripada CSV.
            </p>
          </CardContent>
        </Card>

        {/* Step 2: Upload File */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold text-sm">2</span>
              Upload File Excel atau CSV
            </CardTitle>
            <CardDescription>
              Upload file Excel (.xlsx, .xls) atau CSV yang sudah diisi dengan data pelajar
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                isDragging 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => document.getElementById('file-input')?.click()}
            >
              <FileSpreadsheet className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-lg font-medium mb-2">
                {file ? file.name : 'Drag & drop file Excel atau CSV di sini'}
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                atau klik untuk memilih file (.xlsx, .xls, .csv)
              </p>
              <Button variant="outline" className="cursor-pointer">
                <Upload className="h-4 w-4 mr-2" />
                Pilih File
              </Button>
              <input
                id="file-input"
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {file && !previewData && (
              <Button 
                onClick={handleUpload} 
                disabled={isUploading}
                className="w-full cursor-pointer"
              >
                {isUploading ? 'Memproses...' : 'Preview Data'}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Step 3: Preview & Validation */}
        {previewData && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold text-sm">3</span>
                Preview & Validasi Data
              </CardTitle>
              <CardDescription>
                Periksa data sebelum membuat pelajar. Data yang tidak valid akan ditandai dengan warna merah.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold">{previewData.total}</p>
                      <p className="text-sm text-muted-foreground">Total Data</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">{previewData.valid}</p>
                      <p className="text-sm text-muted-foreground">Valid</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-red-600">{previewData.invalid}</p>
                      <p className="text-sm text-muted-foreground">Tidak Valid</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">Baris</TableHead>
                      <TableHead className="w-12">Status</TableHead>
                      <TableHead>Nama</TableHead>
                      <TableHead>Gender</TableHead>
                      <TableHead>Tempat, Tanggal Lahir</TableHead>
                      <TableHead>Kelas</TableHead>
                      <TableHead>Orang Tua</TableHead>
                      <TableHead>Error</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewData.data.map((student, index) => (
                      <TableRow 
                        key={index}
                        className={student.valid ? '' : 'bg-red-50'}
                      >
                        <TableCell>{student.line_number}</TableCell>
                        <TableCell>
                          {student.valid ? (
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-600" />
                          )}
                        </TableCell>
                        <TableCell className="font-medium">{student.name}</TableCell>
                        <TableCell>{student.gender}</TableCell>
                        <TableCell>
                          {student.birth_place}, {student.birth_date}
                        </TableCell>
                        <TableCell>{student.class_level}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>Ayah: {student.father_name}</div>
                            <div>Ibu: {student.mother_name}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {student.errors && student.errors.length > 0 && (
                            <ul className="text-sm text-red-600 list-disc list-inside">
                              {student.errors.map((err, i) => (
                                <li key={i}>{err}</li>
                              ))}
                            </ul>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {previewData.valid > 0 && (
                <div className="flex gap-2">
                  <Button 
                    onClick={handleCreate} 
                    disabled={isCreating}
                    className="flex-1 cursor-pointer"
                  >
                    {isCreating ? 'Membuat Pelajar...' : `Buat ${previewData.valid} Pelajar`}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setFile(null)
                      setPreviewData(null)
                    }}
                    className="cursor-pointer"
                  >
                    Batal
                  </Button>
                </div>
              )}

              {previewData.invalid > 0 && previewData.valid === 0 && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Semua data tidak valid. Perbaiki kesalahan pada file CSV dan upload ulang.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 4: Creation Result */}
        {creationResult && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
                Berhasil!
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  {creationResult.message}
                </AlertDescription>
              </Alert>

              {creationResult.failed > 0 && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    {creationResult.failed} pelajar gagal dibuat
                  </AlertDescription>
                </Alert>
              )}

              <Progress value={progress} className="h-2" />

              <p className="text-sm text-muted-foreground text-center">
                Mengalihkan ke halaman pelajar...
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
