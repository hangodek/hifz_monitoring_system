import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User } from "lucide-react"
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

interface StudentListViewProps {
  filteredStudents: Student[]
  getStatusBadge: (status: string) => ReactElement
  handleSelectStudent: (studentId: string) => void
}

export function StudentListView({ filteredStudents, getStatusBadge, handleSelectStudent }: StudentListViewProps) {
  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-slate-50/20 hover:shadow-xl transition-shadow duration-200">
      <CardContent className="p-0">
        <div className="divide-y divide-gray-200/30">
          {filteredStudents.map((student) => (
            <div key={student.id} className="p-3 sm:p-4 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-purple-50/50 transition-all duration-200">
              <div className="flex items-center justify-center">
                <div className="flex items-center space-x-3 sm:space-x-4 min-w-2 flex-1">
                  <Avatar className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0">
                    <AvatarImage src={student.avatar || "/placeholder.svg"} />
                    <AvatarFallback className="text-xs">
                      {student.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm sm:text-base font-medium truncate">{student.name}</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">{student.class_level}</p>
                    <p className="text-xs text-muted-foreground truncate hidden sm:block">
                      {student.father_name || student.mother_name || 'Tidak ada informasi orang tua'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-center space-x-2 sm:space-x-6">
                  <div className="text-center hidden sm:block w-24">
                    <div className="text-sm font-medium truncate">{student.current_hifz_in_surah}</div>
                    <div className="text-xs text-muted-foreground">Juz {student.current_hifz_in_juz}</div>
                  </div>
                  <div className="text-center w-16">
                    <div className="text-sm font-medium">{Math.round((parseInt(student.current_hifz_in_juz) || 0) / 30 * 100)}%</div>
                    <div className="text-xs text-muted-foreground">Progress</div>
                  </div>
                  <div className="text-center hidden md:block w-24">
                    <div className="text-xs font-medium">{student.birth_place}</div>
                    <div className="text-xs text-muted-foreground">{student.birth_date}</div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(student.status)}
                    <Button size="sm" variant="outline" className="border-gray-200/60 cursor-pointer p-1 sm:p-2" onClick={() => handleSelectStudent(student.id)}>
                      <User className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* Mobile-only additional info */}
              <div className="mt-2 sm:hidden">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span className="w-32 text-left truncate">{student.current_hifz_in_surah} • Juz {student.current_hifz_in_juz}</span>
                  <span className="w-24 text-right">{student.birth_place}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
