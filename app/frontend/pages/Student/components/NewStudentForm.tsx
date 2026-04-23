import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DatePicker } from "@/components/ui/date-picker"
import { User, Upload } from "lucide-react"
import { useState } from "react"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyFormData = Record<string, any>

interface NewStudentFormProps {
  formData: AnyFormData
  errors: AnyFormData
  handleInputChange: (field: string, value: string) => void
  handleFileChange: (file: File | null) => void
  isEdit?: boolean
  existingAvatar?: string
}

export function NewStudentForm({ formData, errors, handleInputChange, handleFileChange, isEdit = false, existingAvatar }: NewStudentFormProps) {
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

  const handleDateChange = (field: 'birth_date') => (date: Date | undefined) => {
    if (date) {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const formattedDate = `${year}-${month}-${day}`
      handleInputChange(field, formattedDate)
    } else {
      handleInputChange(field, "")
    }
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    handleFileChange(file)
    
    if (file) {
      const reader = new FileReader()
      reader.onload = () => {
        setAvatarPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    } else {
      setAvatarPreview(null)
    }
  }

  // Determine which avatar to display
  const getDisplayAvatar = () => {
    if (avatarPreview) {
      // New file selected
      return avatarPreview
    }
    if (isEdit && existingAvatar) {
      // In edit mode with existing avatar
      return existingAvatar
    }
    return null
  }

  const displayAvatar = getDisplayAvatar()

  const selectedBirthDate = formData.birth_date ? new Date(formData.birth_date + 'T12:00:00') : undefined

  // Generate class levels for SMP/SMA (7-12) with sections A-D
  const classes = [
    // Kelas 7 (SMP)
    "7A", "7B", "7C", "7D",
    // Kelas 8 (SMP)
    "8A", "8B", "8C", "8D",
    // Kelas 9 (SMP)
    "9A", "9B", "9C", "9D",
    // Kelas 10 (SMA)
    "10A", "10B", "10C", "10D",
    // Kelas 11 (SMA)
    "11A", "11B", "11C", "11D",
    // Kelas 12 (SMA)
    "12A", "12B", "12C", "12D"
  ]
  const statuses = ["active", "inactive", "graduated"]
  const genders = ["male", "female"]
  


  return (
    <div className="space-y-6">
      {/* Avatar Upload */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-indigo-50/30 hover:shadow-xl transition-shadow duration-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-indigo-900">
            <div className="h-10 w-10 rounded-full bg-indigo-500/20 flex items-center justify-center">
              <Upload className="h-5 w-5 text-indigo-600" />
            </div>
            Foto Siswa
          </CardTitle>
          <CardDescription>
            Unggah foto profil untuk siswa
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="w-24 h-24 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
              {displayAvatar ? (
                <img src={displayAvatar} alt="Avatar preview" className="w-full h-full object-cover rounded-full" />
              ) : (
                <User className="h-8 w-8 text-gray-400" />
              )}
            </div>
            <div className="flex-1">
              <Input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="cursor-pointer"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {isEdit ? "Unggah foto baru untuk menggantikan yang ada (opsional)" : "Disarankan: Gambar persegi, maksimum 5MB"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Basic Information */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-blue-50/30 hover:shadow-xl transition-shadow duration-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center">
              <User className="h-5 w-5 text-blue-600" />
            </div>
            Informasi Dasar
          </CardTitle>
          <CardDescription>
            Detail pribadi siswa
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nisn">NISN</Label>
              <Input
                id="nisn"
                value={formData.nisn}
                onChange={(e) => handleInputChange("nisn", e.target.value)}
                placeholder="Nomor Induk Siswa Nasional"
                className={errors.nisn ? "border-red-500" : ""}
              />
              {errors.nisn && <p className="text-sm text-red-500">{errors.nisn}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="student_number">No Induk *</Label>
              <Input
                id="student_number"
                value={formData.student_number}
                onChange={(e) => handleInputChange("student_number", e.target.value)}
                placeholder="Nomor Induk Sekolah"
                className={errors.student_number ? "border-red-500" : ""}
              />
              {errors.student_number && <p className="text-sm text-red-500">{errors.student_number}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Nama Lengkap *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Masukkan nama lengkap siswa"
                className={errors.name ? "border-red-500" : ""}
              />
              {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender">Jenis Kelamin *</Label>
              <Select value={formData.gender} onValueChange={(value) => handleInputChange("gender", value)}>
                <SelectTrigger className={`cursor-pointer border-gray-300/60 ${errors.gender ? "border-red-500" : ""}`}>
                  <SelectValue placeholder="Pilih jenis kelamin" />
                </SelectTrigger>
                <SelectContent className="border-gray-200/60">
                  {genders.map((gender) => (
                    <SelectItem key={gender} value={gender} className="cursor-pointer" >
                      {gender === "male" ? "Laki-laki" : "Perempuan"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.gender && <p className="text-sm text-red-500">{errors.gender}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="birth_place">Tempat Lahir *</Label>
              <Input
                id="birth_place"
                value={formData.birth_place}
                onChange={(e) => handleInputChange("birth_place", e.target.value)}
                placeholder="Masukkan tempat lahir"
                className={errors.birth_place ? "border-red-500" : ""}
              />
              {errors.birth_place && <p className="text-sm text-red-500">{errors.birth_place}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="birth_date">Tanggal Lahir *</Label>
              <DatePicker
                id="birth_date"
                date={selectedBirthDate}
                onDateChange={handleDateChange('birth_date')}
                placeholder="Pilih tanggal lahir"
                className={`cursor-pointer border-gray-300/60 ${errors.birth_date ? "border-red-500" : ""}`}
              />
              {errors.birth_date && <p className="text-sm text-red-500">{errors.birth_date}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Nomor Telepon</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                placeholder="Contoh: 081234567890"
                className={errors.phone ? "border-red-500" : ""}
              />
              {errors.phone && <p className="text-sm text-red-500">{errors.phone}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Alamat Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="siswa@email.com"
                className={errors.email ? "border-red-500" : ""}
              />
              {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Alamat</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => handleInputChange("address", e.target.value)}
              placeholder="Masukkan alamat lengkap"
              rows={3}
              className={errors.address ? "border-red-500" : ""}
            />
            {errors.address && <p className="text-sm text-red-500">{errors.address}</p>}
          </div>
        </CardContent>
      </Card>

      {/* Parent Information */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-purple-50/30 hover:shadow-xl transition-shadow duration-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-900">
            <div className="h-10 w-10 rounded-full bg-purple-500/20 flex items-center justify-center">
              <User className="h-5 w-5 text-purple-600" />
            </div>
            Informasi Orang Tua
          </CardTitle>
          <CardDescription>
            Informasi mengenai orang tua atau wali siswa
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="father_name">Nama Ayah *</Label>
              <Input
                id="father_name"
                value={formData.father_name}
                onChange={(e) => handleInputChange("father_name", e.target.value)}
                placeholder="Masukkan nama lengkap ayah"
                className={errors.father_name ? "border-red-500" : ""}
              />
              {errors.father_name && <p className="text-sm text-red-500">{errors.father_name}</p>}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Academic Information */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-emerald-50/30 hover:shadow-xl transition-shadow duration-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-emerald-900">
            <div className="h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <User className="h-5 w-5 text-emerald-600" />
            </div>
            Informasi Akademik
          </CardTitle>
          <CardDescription>
            Informasi kelas dan program
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="class">Kelas *</Label>
              <Select value={formData.class_level} onValueChange={(value) => handleInputChange("class_level", value)}>
                <SelectTrigger className={`cursor-pointer ${errors.class_level ? "border-red-500" : ""}`}>
                  <SelectValue placeholder="Pilih kelas" />
                </SelectTrigger>
                <SelectContent className="border-gray-200/60">
                  {classes.map((cls) => (
                    <SelectItem key={cls} value={cls} className="cursor-pointer">
                      {cls}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.class_level && <p className="text-sm text-red-500">{errors.class_level}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
                <SelectTrigger className="cursor-pointer">
                  <SelectValue placeholder="Pilih status" />
                </SelectTrigger>
                <SelectContent className="border-gray-200/60">
                  {statuses.map((status) => (
                    <SelectItem key={status} value={status} className="cursor-pointer">
                      {status === "active" ? "Aktif" : status === "inactive" ? "Tidak Aktif" : "Lulus"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

          </div>
        </CardContent>
      </Card>
    </div>
  )
}
