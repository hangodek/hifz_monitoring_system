import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import {
  BookOpen,
  User,
  Phone,
  MapPin,
  Users,
} from "lucide-react"
import { ReactElement } from "react"

interface Student {
  id: string
  nisn?: string
  student_number: string
  name: string
  current_hifz_in_juz: string
  current_hifz_in_pages: string
  current_hifz_in_surah: string
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

interface StudentGridViewProps {
  filteredStudents: Student[]
  getStatusBadge: (status: string) => ReactElement
  handleSelectStudent: (studentId: string) => void
}

export function StudentGridView({ filteredStudents, getStatusBadge, handleSelectStudent }: StudentGridViewProps) {
  return (
    <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      {filteredStudents.map((student) => (
        <Card key={student.id} className="hover:shadow-xl transition-shadow border-gray-200/60 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Avatar className="h-10 w-10 sm:h-12 sm:w-12">
                  <AvatarImage src={student.avatar || "/placeholder.svg"} />
                  <AvatarFallback className="text-xs sm:text-sm">
                    {student.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-base sm:text-lg truncate">{student.name}</CardTitle>
                  <p className="text-xs sm:text-sm text-muted-foreground">{student.class_level}</p>
                </div>
              </div>
              {getStatusBadge(student.status)}
            </div>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4">
            <div className="grid grid-cols-1 gap-2 text-sm">
              <div className="flex items-center gap-2">
                <BookOpen className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500" />
                <span className="text-xs sm:text-sm truncate">{student.current_hifz_in_surah}</span>
              </div>
              <div className="flex items-center gap-2 ml-5 sm:ml-6">
                <span className="text-xs sm:text-sm text-muted-foreground">Juz {student.current_hifz_in_juz} • {student.current_hifz_in_pages} pages</span>
              </div>
            </div>

            {/* Additional info preview */}
            <div className="space-y-2 pt-2 border-t border-t-gray-200/60">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Users className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">
                  {student.father_name ? `${student.father_name} (Ayah)` : 
                  student.mother_name ? `${student.mother_name} (Ibu)` : 'Tidak ada informasi orang tua'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Phone className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">
                  {student.parent_phone || 'Tidak ada telepon'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">
                  {student.birth_place}, {student.birth_date}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs sm:text-sm">
                <span>Kemajuan Keseluruhan</span>
                <span>{Math.round((parseInt(student.current_hifz_in_juz) || 0) / 30 * 100)}%</span>
              </div>
              <Progress value={Math.round((parseInt(student.current_hifz_in_juz) || 0) / 30 * 100)} className="h-1.5 sm:h-2" />
            </div>

            <div className="flex gap-2 pt-2">
              <Button size="sm" className="flex-1 cursor-pointer text-xs sm:text-sm" onClick={() => handleSelectStudent(student.id)}>
                <User className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Lihat Detail</span>
                <span className="sm:hidden">Details</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
