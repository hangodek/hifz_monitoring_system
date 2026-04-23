import { Button } from "@/components/ui/button"
import { Save } from "lucide-react"
import { router } from "@inertiajs/react"

interface StudentFormActionsProps {
  isSubmitting: boolean
}

export function StudentFormActions({ isSubmitting }: StudentFormActionsProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:justify-end">
      <Button
        type="button"
        variant="outline"
        onClick={() => router.visit("/students")}
        className="sm:w-auto cursor-pointer"
      >
        Cancel
      </Button>
      <Button
        type="submit"
        disabled={isSubmitting}
        className="sm:w-auto cursor-pointer"
      >
        <Save className="h-4 w-4 mr-2" />
        {isSubmitting ? "Saving..." : "Save Student"}
      </Button>
    </div>
  )
}
