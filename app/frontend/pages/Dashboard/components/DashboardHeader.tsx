import { Button } from "@/components/ui/button"
import { Users, Mic, LogOut } from "lucide-react"
import { router } from "@inertiajs/react"

export function DashboardHeader() {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Papan Pemuka Hifz</h1>
        <p className="text-sm sm:text-base text-muted-foreground">Pantau dan analisis kemajuan hafalan Al-Quran pelajar</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" className="border-gray-200/60 cursor-pointer w-full" onClick={() => router.visit("/students")}>
          <Users className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Lihat Semua Pelajar</span>
          <span className="sm:hidden">Pelajar</span>
        </Button>
        <Button variant="outline" className="border-gray-200/60 cursor-pointer w-full" onClick={() => router.visit("/teachers")}>
          <Mic className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Mod Guru</span>
          <span className="sm:hidden">Guru</span>
        </Button>
        <Button variant="outline" className="border-gray-200/60 cursor-pointer w-full col-span-2" onClick={() => router.delete("/session")}>
          <LogOut className="h-4 w-4 mr-2" />
          Log Keluar
        </Button>
      </div>
    </div>
  )
}
