import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CalendarIcon, BookOpen } from "lucide-react"

interface DashboardStats {
  today_submissions: number
  students_revising_today: number
  students_memorizing_today: number
  total_active_students: number
}

interface StatsCardsProps {
  stats: DashboardStats
}

export function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
      <Card className="border-gray-200/60 shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Penyerahan Hari Ini</CardTitle>
          <CalendarIcon className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">
            {stats.today_submissions} <span className="text-lg font-normal text-blue-500">Penyerahan</span>
          </div>
          <p className="text-xs text-muted-foreground">Aktiviti pelajar yang direkodkan oleh guru</p>
        </CardContent>
      </Card>

      <Card className="border-gray-200/60 shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pelajar Sedang Murajaah Hari Ini</CardTitle>
          <BookOpen className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {stats.students_revising_today}<span className="text-lg font-normal text-green-500"> / {stats.total_active_students}</span>
          </div>
          <p className="text-xs text-muted-foreground">Pelajar aktif berlatih ulang kaji</p>
        </CardContent>
      </Card>
      
      <Card className="border-gray-200/60 shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pelajar Sedang Menghafal Hari Ini</CardTitle>
          <BookOpen className="h-4 w-4 text-orange-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">
            {stats.students_memorizing_today}<span className="text-lg font-normal text-orange-500"> / {stats.total_active_students}</span>
          </div>
          <p className="text-xs text-muted-foreground">Pelajar aktif menghafal ayat baharu</p>
        </CardContent>
      </Card>
    </div>
    
  )
}
