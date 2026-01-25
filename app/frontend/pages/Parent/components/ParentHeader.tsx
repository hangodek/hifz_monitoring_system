import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
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
      <div>
        <Button 
          variant="outline" 
          className="border-red-200 hover:bg-red-50 hover:text-red-700 hover:border-red-300 cursor-pointer w-full" 
          onClick={() => router.delete("/session")}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Log Keluar
        </Button>
      </div>
    </div>
  )
}
