import { Button } from "@/components/ui/button"
import { ArrowLeft, Users, LogOut } from "lucide-react"
import { router, usePage } from "@inertiajs/react"
import { PageProps } from "@/types/auth"

export function TeacherHeader() {
  const { auth } = usePage<PageProps>().props
  const userRole = auth?.user?.role

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Mode Guru</h1>
        <p className="text-sm sm:text-base text-muted-foreground">Catat aktivitas hafalan siswa</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {/* Only show "View All Students" for admin */}
        {userRole === "admin" && (
          <Button variant="outline" className="border-blue-200 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 cursor-pointer" onClick={() => router.visit("/students")}>
            <Users className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Lihat Semua Siswa</span>
            <span className="sm:hidden">Siswa</span>
          </Button>
        )}
        {/* Only show "Back to Dashboard" for admin */}
        {userRole === "admin" && (
          <Button variant="outline" className="border-gray-200 hover:bg-gray-50 hover:text-gray-700 hover:border-gray-300 cursor-pointer" onClick={() => router.visit("/dashboard")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Kembali ke Dasbor</span>
            <span className="sm:hidden">Kembali</span>
          </Button>
        )}
        {/* Show logout for teacher role */}
        {userRole === "teacher" && (
          <Button variant="outline" className="border-red-200 hover:bg-red-50 hover:text-red-700 hover:border-red-300 cursor-pointer col-span-2" onClick={() => router.delete("/session")}>
            <LogOut className="h-4 w-4 mr-2" />
            Keluar
          </Button>
        )}
      </div>
    </div>
  )
}
