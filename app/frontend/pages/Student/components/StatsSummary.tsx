import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Award } from "lucide-react"

interface Student {
  status: string
  [key: string]: any
}

interface StatsSummaryProps {
  students: Student[]
}

export function StatsSummary({ students }: StatsSummaryProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
      <Card className="border-gray-200/60 shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium">Jumlah Pelajar</CardTitle>
          <Users className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-lg sm:text-2xl font-bold text-blue-600">{students.length}</div>
          <p className="text-xs text-muted-foreground">Pelajar aktif</p>
        </CardContent>
      </Card>

      <Card className="border-gray-200/60 shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium">Pelajar Aktif</CardTitle>
          <Users className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-lg sm:text-2xl font-bold text-green-600">
            {students.filter((s) => s.status === "active").length}
          </div>
          <p className="text-xs text-muted-foreground">Sedang aktif</p>
        </CardContent>
      </Card>

      <Card className="border-gray-200/60 shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium">Pelajar Tidak Aktif</CardTitle>
          <Users className="h-3 w-3 sm:h-4 sm:w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-lg sm:text-2xl font-bold text-red-600">
            {students.filter((s) => s.status === "inactive").length}
          </div>
          <p className="text-xs text-muted-foreground">Sedang tidak aktif</p>
        </CardContent>
      </Card>

      <Card className="border-gray-200/60 shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium">Pelajar Lulus</CardTitle>
          <Award className="h-3 w-3 sm:h-4 sm:w-4 text-orange-500" />
        </CardHeader>
        <CardContent>
          <div className="text-lg sm:text-2xl font-bold text-orange-600">{students.filter((s) => s.status === "graduated").length}</div>
          <p className="text-xs text-muted-foreground">Pelajar yang selesai hafalan</p>
        </CardContent>
      </Card>
    </div>
  )
}
