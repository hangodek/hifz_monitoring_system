import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users } from "lucide-react"

interface StudentFormData {
  name: string
  address: string
  birth_date: string
  mother_name: string
  father_name: string
  date_joined: string
  hifz_in_juz: string
  hifz_in_page: string
}

interface ParentInformationFormProps {
  formData: StudentFormData
  errors: Partial<StudentFormData>
  handleInputChange: (field: keyof StudentFormData, value: string) => void
}

export function ParentInformationForm({ formData, errors, handleInputChange }: ParentInformationFormProps) {
  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-pink-50/30 hover:shadow-xl transition-shadow duration-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-pink-900">
          <div className="h-10 w-10 rounded-full bg-pink-500/20 flex items-center justify-center">
            <Users className="h-5 w-5 text-pink-600" />
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

          <div className="space-y-2">
            <Label htmlFor="mother_name">Nama Ibu *</Label>
            <Input
              id="mother_name"
              value={formData.mother_name}
              onChange={(e) => handleInputChange("mother_name", e.target.value)}
              placeholder="Masukkan nama lengkap ibu"
              className={errors.mother_name ? "border-red-500" : ""}
            />
            {errors.mother_name && <p className="text-sm text-red-500">{errors.mother_name}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="parent_phone">No HP Orang Tua</Label>
            <Input
              id="parent_phone"
              value={formData.parent_phone}
              onChange={(e) => handleInputChange("parent_phone", e.target.value)}
              placeholder="Contoh: 081234567890"
              className={errors.parent_phone ? "border-red-500" : ""}
            />
            {errors.parent_phone && <p className="text-sm text-red-500">{errors.parent_phone}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
