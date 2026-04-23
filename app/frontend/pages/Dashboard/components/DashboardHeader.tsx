import { Button } from "@/components/ui/button"
import { Users, Mic, LogOut, UserCog, Settings, UserCircle } from "lucide-react"
import { router, usePage } from "@inertiajs/react"
import { PageProps } from "@/types/auth"

export function DashboardHeader() {
  const { auth } = usePage<PageProps>().props
  const userRole = auth?.user?.role

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Dashboard Hafalan</h1>
        <p className="text-sm sm:text-base text-muted-foreground">Pantau dan analisis kemajuan hafalan Al-Quran siswa</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {/* Only admin can see all students */}
        {userRole === "admin" && (
          <>
          <Button variant="outline" className="hover:bg-accent hover:text-accent-foreground cursor-pointer w-full" onClick={() => router.visit("/students")}>
              <Users className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Lihat Semua Siswa</span>
              <span className="sm:hidden">Siswa</span>
            </Button>
            <Button variant="outline" className="hover:bg-accent hover:text-accent-foreground cursor-pointer w-full" onClick={() => router.visit("/users")}>
              <UserCog className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Manajemen Pengguna</span>
              <span className="sm:hidden">Pengguna</span>
            </Button>
            <Button variant="outline" className="hover:bg-accent hover:text-accent-foreground cursor-pointer w-full col-span-full" onClick={() => router.visit("/settings/edit")}>
              <Settings className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Pengaturan</span>
              <span className="sm:hidden">Pengaturan</span>
            </Button>
          </>
        )}
        {/* Both admin and teacher can access teacher mode */}
        {(userRole === "admin" || userRole === "teacher") && (
          <Button variant="outline" className="hover:bg-accent hover:text-accent-foreground cursor-pointer w-full col-span-full" onClick={() => router.visit("/teachers")}>
            <Mic className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Mode Guru</span>
            <span className="sm:hidden">Guru</span>
          </Button>
        )}
        <Button variant="outline" className="hover:bg-accent hover:text-accent-foreground cursor-pointer w-full col-span-2" onClick={() => router.visit("/profile/edit")}>
          <UserCircle className="h-4 w-4 mr-2" />
          Profil Saya
        </Button>
        <Button variant="outline" className="border-red-200 hover:bg-red-50 hover:text-red-700 hover:border-red-300 cursor-pointer w-full col-span-2" onClick={() => router.delete("/session")}>
          <LogOut className="h-4 w-4 mr-2" />
          Keluar
        </Button>
      </div>
    </div>
  )
}
