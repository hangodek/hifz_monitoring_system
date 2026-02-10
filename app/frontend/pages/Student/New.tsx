"use client"

import { useState } from "react"
import { router } from "@inertiajs/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, Save } from "lucide-react"
import { NewStudentForm } from "./components/NewStudentForm"

interface StudentFormData {
  nisn: string
  student_number: string
  name: string
  current_hifz_in_juz: string
  current_hifz_in_pages: string
  current_hifz_in_surah: string
  avatar: File | null
  class_level: string
  phone: string
  email: string
  status: string
  gender: string
  birth_place: string
  birth_date: string
  address: string
  father_name: string
  mother_name: string
  parent_phone: string
}

export default function CreateStudent() {
  const [formData, setFormData] = useState<StudentFormData>({
    nisn: "",
    student_number: "",
    name: "",
    current_hifz_in_juz: "0",
    current_hifz_in_pages: "0",
    current_hifz_in_surah: "",
    avatar: null,
    class_level: "",
    phone: "",
    email: "",
    status: "active",
    gender: "",
    birth_place: "",
    birth_date: "",
    address: "",
    father_name: "",
    mother_name: "",
    parent_phone: "",
  })

  const [errors, setErrors] = useState<Partial<StudentFormData>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleInputChange = (field: keyof StudentFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }))
    }
  }

  const handleFileChange = (file: File | null) => {
    setFormData(prev => ({
      ...prev,
      avatar: file
    }))
    // Clear error when file is selected
    if (errors.avatar) {
      setErrors(prev => ({
        ...prev,
        avatar: undefined
      }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<StudentFormData> = {}

    // Required fields (null: false in schema)
    if (!formData.student_number.trim()) newErrors.student_number = "No Induk diperlukan"
    if (!formData.name.trim()) newErrors.name = "Nama siswa diperlukan"
    if (!formData.current_hifz_in_juz.trim()) newErrors.current_hifz_in_juz = "Juz saat ini diperlukan"
    if (!formData.current_hifz_in_pages.trim()) newErrors.current_hifz_in_pages = "Halaman saat ini diperlukan"
    if (!formData.class_level.trim()) newErrors.class_level = "Kelas diperlukan"
    if (!formData.status.trim()) newErrors.status = "Status diperlukan"
    if (!formData.gender.trim()) newErrors.gender = "Jenis kelamin diperlukan"
    if (!formData.birth_place.trim()) newErrors.birth_place = "Tempat lahir diperlukan"
    if (!formData.birth_date) newErrors.birth_date = "Tanggal lahir diperlukan"
    if (!formData.father_name.trim()) newErrors.father_name = "Nama ayah diperlukan"
    if (!formData.mother_name.trim()) newErrors.mother_name = "Nama ibu diperlukan"

    // Optional fields validation (only validate format if provided)
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Format email tidak valid"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    
    try {
      // Create FormData for file upload
      const formDataToSend = new FormData()
      
      // Add all form fields
      formDataToSend.append('student[nisn]', formData.nisn)
      formDataToSend.append('student[student_number]', formData.student_number)
      formDataToSend.append('student[name]', formData.name.charAt(0).toUpperCase() + formData.name.slice(1))
      formDataToSend.append('student[current_hifz_in_juz]', formData.current_hifz_in_juz)
      formDataToSend.append('student[current_hifz_in_pages]', formData.current_hifz_in_pages)
      formDataToSend.append('student[current_hifz_in_surah]', formData.current_hifz_in_surah)
      formDataToSend.append('student[class_level]', formData.class_level)
      formDataToSend.append('student[phone]', formData.phone)
      formDataToSend.append('student[email]', formData.email)
      formDataToSend.append('student[status]', formData.status)
      formDataToSend.append('student[gender]', formData.gender)
      formDataToSend.append('student[birth_place]', formData.birth_place.charAt(0).toUpperCase() + formData.birth_place.slice(1))
      formDataToSend.append('student[birth_date]', formData.birth_date)
      formDataToSend.append('student[address]', formData.address)
      formDataToSend.append('student[father_name]', formData.father_name.charAt(0).toUpperCase() + formData.father_name.slice(1))
      formDataToSend.append('student[mother_name]', formData.mother_name.charAt(0).toUpperCase() + formData.mother_name.slice(1))
      formDataToSend.append('student[parent_phone]', formData.parent_phone)
      
      // Add avatar file if selected
      if (formData.avatar) {
        formDataToSend.append('student[avatar]', formData.avatar)
      }
      
      router.post('/students', formDataToSend, {
        forceFormData: true
      })
    } catch (error) {
      console.error('Error creating student:', error)
      setIsSubmitting(false)
    }
  }

  const handleBackClick = () => {
    router.visit('/students')
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="flex flex-col space-y-4 sm:space-y-6 p-4 sm:p-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Tambah Siswa Baru</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Buat profil siswa baru dan tambah ke sistem</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:space-x-4 sm:gap-0">
            <Button
              variant="outline"
              className="border-gray-200 hover:bg-gray-50 hover:text-gray-700 hover:border-gray-300 cursor-pointer"
              onClick={handleBackClick}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Kembali ke Daftar Siswa</span>
              <span className="sm:hidden">Kembali</span>
            </Button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <NewStudentForm
            formData={formData}
            errors={errors}
            handleInputChange={handleInputChange}
            handleFileChange={handleFileChange}
          />

          {/* Submit Actions */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-green-50/30">
            <CardContent className="pt-6">
              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="cursor-pointer border-gray-300 hover:bg-gray-50"
                  onClick={handleBackClick}
                  disabled={isSubmitting}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 cursor-pointer bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                >
                  <Save className="h-4 w-4" />
                  {isSubmitting ? "Membuat..." : "Buat Siswa"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  )
}
