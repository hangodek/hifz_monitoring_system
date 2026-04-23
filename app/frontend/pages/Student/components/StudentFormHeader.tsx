import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { router } from "@inertiajs/react"

export function StudentFormHeader() {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Add New Student</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Add a new student to the Quran memorization program
        </p>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:space-x-4 sm:gap-0">
        <Button 
          variant="outline" 
          className="cursor-pointer" 
          onClick={() => router.visit("/students")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Back to Students</span>
          <span className="sm:hidden">Back</span>
        </Button>
      </div>
    </div>
  )
}
