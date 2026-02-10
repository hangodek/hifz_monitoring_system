import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Award, User } from "lucide-react"
import { router } from "@inertiajs/react"

interface TopStudent {
  id: string
  name: string
  current_juz: string
  activity_count: number
  progress: number
  avatar?: string
}

interface TopStudentsRankingProps {
  students: TopStudent[]
}

export function TopStudentsRanking({ students }: TopStudentsRankingProps) {
  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-amber-50/30 hover:shadow-xl transition-shadow duration-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-amber-900">
          <div className="h-10 w-10 rounded-full bg-amber-500/20 flex items-center justify-center">
            <Award className="h-5 w-5 text-amber-600" />
          </div>
          Peringkat Siswa Terbaik
        </CardTitle>
        <CardDescription>10 siswa terbaik dengan hafalan terbanyak bulan ini</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4">
        {students.map((student, index) => (
          <div key={student.name} className="flex items-center space-x-3 sm:space-x-4 p-3 rounded-lg hover:bg-amber-50/50 transition-colors duration-200">
            <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
              <div className={`flex h-6 w-6 sm:h-8 sm:w-8 items-center justify-center rounded-full text-xs sm:text-sm font-bold ${
                index === 0 ? "bg-gradient-to-br from-yellow-400 to-amber-500 text-white shadow-md" :
                index === 1 ? "bg-gradient-to-br from-gray-300 to-gray-400 text-white shadow-md" :
                index === 2 ? "bg-gradient-to-br from-orange-400 to-orange-500 text-white shadow-md" :
                "bg-amber-500/20 text-amber-700"
              }`}>
                {index + 1}
              </div>
              <Avatar className="h-6 w-6 sm:h-8 sm:w-8">
                <AvatarImage src={student.avatar || "/placeholder.svg"} />
                <AvatarFallback className="text-xs">
                  {student.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
            <div className="flex-1 space-y-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-xs sm:text-sm font-medium truncate pr-2">{student.name}</p>
                <Badge variant="secondary" className="text-xs flex-shrink-0 bg-amber-100 text-amber-700 border-amber-200">
                  Juz {student.current_juz}
                </Badge>
              </div>
              <Progress value={student.progress} className="h-1.5 sm:h-2 bg-amber-100" />
            </div>
            <Button variant="ghost" size="sm" className="border border-amber-200 hover:bg-amber-50 hover:text-amber-700 cursor-pointer h-8 w-8 p-0 flex-shrink-0" onClick={() => router.visit(`/students/${student.id}`)}>
              <User className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
