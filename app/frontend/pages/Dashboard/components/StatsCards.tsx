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
      <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100/50 hover:shadow-xl transition-shadow duration-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-blue-900">Penyerahan Hari Ini</CardTitle>
          <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center">
            <CalendarIcon className="h-5 w-5 text-blue-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">
            {stats.today_submissions} <span className="text-lg font-normal text-blue-500">Penyerahan</span>
          </div>
          <p className="text-xs text-blue-700/70 mt-1">Aktiviti pelajar yang direkodkan oleh guru</p>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100/50 hover:shadow-xl transition-shadow duration-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-green-900">Pelajar Sedang Murajaah Hari Ini</CardTitle>
          <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center">
            <BookOpen className="h-5 w-5 text-green-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {stats.students_revising_today}<span className="text-lg font-normal text-green-500"> / {stats.total_active_students}</span>
          </div>
          <p className="text-xs text-green-700/70 mt-1">Pelajar aktif berlatih ulang kaji</p>
        </CardContent>
      </Card>
      
      <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100/50 hover:shadow-xl transition-shadow duration-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-orange-900">Pelajar Sedang Menghafal Hari Ini</CardTitle>
          <div className="h-10 w-10 rounded-full bg-orange-500/20 flex items-center justify-center">
            <BookOpen className="h-5 w-5 text-orange-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">
            {stats.students_memorizing_today}<span className="text-lg font-normal text-orange-500"> / {stats.total_active_students}</span>
          </div>
          <p className="text-xs text-orange-700/70 mt-1">Pelajar aktif menghafal ayat baharu</p>
        </CardContent>
      </Card>
    </div>
    
  )
}
