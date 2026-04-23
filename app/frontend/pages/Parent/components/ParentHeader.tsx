import { Button } from "@/components/ui/button"
import { LogOut, UserCircle } from "lucide-react"
import { router } from "@inertiajs/react"

export function ParentHeader({ studentName }: { studentName: string }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Progress Hafalan
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Pantau kemajuan hafalan Al-Quran {studentName}
        </p>
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          className="hover:bg-accent hover:text-accent-foreground cursor-pointer"
          onClick={() => router.visit("/profile/edit")}
        >
          <UserCircle className="h-4 w-4 mr-2" />
          Profil Saya
        </Button>
        <Button
          variant="outline"
          className="border-destructive/30 hover:bg-destructive/5 hover:text-destructive cursor-pointer"
          onClick={() => router.delete("/session")}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Keluar
        </Button>
      </div>
    </div>
  )
}
