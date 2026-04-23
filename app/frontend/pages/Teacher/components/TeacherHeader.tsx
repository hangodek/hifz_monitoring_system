import { Button } from "@/components/ui/button"
import { ArrowLeft, Download, LogOut, Plus, Users, UserCircle } from "lucide-react"
import { router, usePage } from "@inertiajs/react"
import { PageProps } from "@/types/auth"

type TeacherHeaderProps = {
  mode?: "index" | "bulk"
}

export function TeacherHeader({ mode = "index" }: TeacherHeaderProps) {
  const { auth } = usePage<PageProps>().props
  const userRole = auth?.user?.role
  const canExport = userRole === "admin" || userRole === "teacher"

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Mode Guru</h1>
        <p className="text-sm sm:text-base text-muted-foreground">Catat aktivitas hafalan siswa</p>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
        {canExport && mode === "index" && (
          <Button
            variant="outline"
            className="hover:bg-accent hover:text-accent-foreground cursor-pointer"
            onClick={() => router.visit("/teachers/bulk_edit")}
          >
            <Plus className="h-4 w-4 mr-2" />
            Edit Massal
          </Button>
        )}
        {mode === "bulk" && (
          <Button
            variant="outline"
            className="hover:bg-accent hover:text-accent-foreground cursor-pointer"
            onClick={() => router.visit("/teachers")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali ke Input Biasa
          </Button>
        )}
        {canExport && (
          <Button
            variant="outline"
            className="hover:bg-accent hover:text-accent-foreground cursor-pointer"
            onClick={() => window.location.href = "/teachers/export_scores.xlsx"}
          >
            <Download className="h-4 w-4 mr-2" />
            Ekspor Nilai
          </Button>
        )}
        {/* Only show "View All Students" for admin */}
        {userRole === "admin" && (
          <Button variant="outline" className="hover:bg-accent hover:text-accent-foreground cursor-pointer" onClick={() => router.visit("/students")}>
            <Users className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Lihat Semua Siswa</span>
            <span className="sm:hidden">Siswa</span>
          </Button>
        )}
        {userRole === "admin" && (
          <Button variant="outline" className="hover:bg-accent hover:text-accent-foreground cursor-pointer" onClick={() => router.visit("/dashboard")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Kembali ke Dashboard</span>
            <span className="sm:hidden">Kembali</span>
          </Button>
        )}
        <Button variant="outline" className="hover:bg-accent hover:text-accent-foreground cursor-pointer" onClick={() => router.visit("/profile/edit")}>
          <UserCircle className="h-4 w-4 mr-2" />
          Profil Saya
        </Button>
        {userRole === "teacher" && (
          <Button variant="outline" className="border-destructive/30 hover:bg-destructive/5 hover:text-destructive cursor-pointer" onClick={() => router.delete("/session")}>
            <LogOut className="h-4 w-4 mr-2" />
            Keluar
          </Button>
        )}
      </div>
    </div>
  )
}
