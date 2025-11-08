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
    <Card className="border-gray-200/60 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Maklumat Ibu Bapa
        </CardTitle>
        <CardDescription>
          Maklumat mengenai ibu bapa atau penjaga pelajar
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="father_name">Nama Bapa *</Label>
            <Input
              id="father_name"
              value={formData.father_name}
              onChange={(e) => handleInputChange("father_name", e.target.value)}
              placeholder="Masukkan nama penuh bapa"
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
              placeholder="Masukkan nama penuh ibu"
              className={errors.mother_name ? "border-red-500" : ""}
            />
            {errors.mother_name && <p className="text-sm text-red-500">{errors.mother_name}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
