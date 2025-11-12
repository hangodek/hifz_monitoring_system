import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DatePicker } from "@/components/ui/date-picker"
import { BookOpen } from "lucide-react"

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

interface ProgramInformationFormProps {
  formData: StudentFormData
  errors: Partial<StudentFormData>
  handleInputChange: (field: keyof StudentFormData, value: string) => void
}

export function ProgramInformationForm({ formData, errors, handleInputChange }: ProgramInformationFormProps) {
  const handleDateJoinedChange = (date: Date | undefined) => {
    if (date) {
      // Use local date formatting to avoid timezone issues
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const formattedDate = `${year}-${month}-${day}`
      handleInputChange("date_joined", formattedDate)
    } else {
      handleInputChange("date_joined", "")
    }
  }

  const selectedDateJoined = formData.date_joined ? new Date(formData.date_joined + 'T12:00:00') : undefined

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-amber-50/30 hover:shadow-xl transition-shadow duration-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-amber-900">
          <div className="h-10 w-10 rounded-full bg-amber-500/20 flex items-center justify-center">
            <BookOpen className="h-5 w-5 text-amber-600" />
          </div>
          Maklumat Program Hifz
        </CardTitle>
        <CardDescription>
          Butiran kemajuan hafalan Al-Quran pelajar
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="date_joined">Date Joined *</Label>
            <DatePicker
              id="date_joined"
              date={selectedDateJoined}
              onDateChange={handleDateJoinedChange}
              placeholder="Select date joined"
              className={`cursor-pointer border-gray-200/60 ${errors.date_joined ? "border-red-500" : ""}`}
            />
            {errors.date_joined && <p className="text-sm text-red-500">{errors.date_joined}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="hifz_in_juz">Current Juz Memorized</Label>
            <Input
              id="hifz_in_juz"
              type="number"
              min="0"
              max="30"
              value={formData.hifz_in_juz}
              onChange={(e) => handleInputChange("hifz_in_juz", e.target.value)}
              placeholder="0"
            />
            <p className="text-xs text-muted-foreground">Enter number of Juz completed (0-30)</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="hifz_in_page">Current Page in Juz</Label>
            <Input
              id="hifz_in_page"
              type="number"
              min="0"
              max="604"
              value={formData.hifz_in_page}
              onChange={(e) => handleInputChange("hifz_in_page", e.target.value)}
              placeholder="0"
            />
            <p className="text-xs text-muted-foreground">Enter current page in ongoing Juz (0-604)</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
