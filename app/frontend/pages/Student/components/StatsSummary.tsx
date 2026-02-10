import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Award } from "lucide-react"

interface Student {
  status: string
  [key: string]: any
}

interface StatsSummaryProps {
  statistics: {
    total: number
    active: number
    inactive: number
    graduated: number
    class_distribution: Record<string, number>
  }
}

export function StatsSummary({ statistics }: StatsSummaryProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
      <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100/50 hover:shadow-xl transition-shadow duration-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium text-blue-900">Jumlah Siswa</CardTitle>
          <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-blue-500/20 flex items-center justify-center">
            <Users className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-lg sm:text-2xl font-bold text-blue-600">{statistics.total}</div>
          <p className="text-xs text-blue-700/70">Total siswa</p>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100/50 hover:shadow-xl transition-shadow duration-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium text-green-900">Siswa Aktif</CardTitle>
          <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-green-500/20 flex items-center justify-center">
            <Users className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-lg sm:text-2xl font-bold text-green-600">
            {statistics.active}
          </div>
          <p className="text-xs text-green-700/70">Sedang aktif</p>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50 to-red-100/50 hover:shadow-xl transition-shadow duration-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium text-red-900">Siswa Tidak Aktif</CardTitle>
          <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-red-500/20 flex items-center justify-center">
            <Users className="h-3 w-3 sm:h-4 sm:w-4 text-red-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-lg sm:text-2xl font-bold text-red-600">
            {statistics.inactive}
          </div>
          <p className="text-xs text-red-700/70">Sedang tidak aktif</p>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100/50 hover:shadow-xl transition-shadow duration-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium text-orange-900">Siswa Lulus</CardTitle>
          <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-orange-500/20 flex items-center justify-center">
            <Award className="h-3 w-3 sm:h-4 sm:w-4 text-orange-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-lg sm:text-2xl font-bold text-orange-600">{statistics.graduated}</div>
          <p className="text-xs text-orange-700/70">Siswa yang selesai hafalan</p>
        </CardContent>
      </Card>
    </div>
  )
}
