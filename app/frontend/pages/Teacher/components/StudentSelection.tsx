import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Check, ChevronsUpDown, Search } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"

interface Student {
  id: string
  name: string
  class_level: string
  current_hifz_in_juz: string
}

interface StudentSelectionProps {
  students: Student[]
  selectedStudent: string
  setSelectedStudent: (value: string) => void
  currentStudent: Student | undefined
}

export function StudentSelection({ students, selectedStudent, setSelectedStudent, currentStudent }: StudentSelectionProps) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  // Filter students based on search query
  const filteredStudents = students.filter((student) =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.class_level.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.current_hifz_in_juz.includes(searchQuery)
  )

  const handleSelectStudent = (studentId: string) => {
    setSelectedStudent(studentId)
    setOpen(false)
    setSearchQuery("")
  }

  return (
    <Card className="border-gray-200/60 shadow-lg">
      <CardHeader>
        <CardTitle>Pilih Pelajar</CardTitle>
        <CardDescription>Pilih pelajar untuk sesi hafalan</CardDescription>
      </CardHeader>
      <CardContent>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between border-gray-200/60 cursor-pointer"
            >
              {selectedStudent
                ? students.find((student) => student.id === selectedStudent)?.name
                : "Pilih pelajar..."}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0" align="start">
            <div className="flex items-center border-b px-3">
              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
              <Input
                placeholder="Cari pelajar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>
            <div className="max-h-[300px] overflow-y-auto p-1">
              {filteredStudents.length === 0 && (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  Tiada pelajar dijumpai.
                </div>
              )}
              {filteredStudents.map((student) => (
                <div
                  key={student.id}
                  onClick={() => handleSelectStudent(student.id)}
                  className={cn(
                    "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                    selectedStudent === student.id && "bg-accent"
                  )}
                >
                  <div className="flex gap-2 items-center flex-1">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src="/placeholder.svg" />
                      <AvatarFallback className="text-xs">
                        {student.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="font-medium">{student.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {student.class_level} - Juz {student.current_hifz_in_juz}
                      </span>
                    </div>
                  </div>
                  {selectedStudent === student.id && (
                    <Check className="h-4 w-4 ml-2" />
                  )}
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {currentStudent && (
          <div className="mt-4 p-3 sm:p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <Avatar className="h-10 w-10 sm:h-12 sm:w-12">
                <AvatarImage src="/placeholder.svg" />
                <AvatarFallback>
                  {currentStudent.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-sm sm:text-base font-semibold">{currentStudent.name}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">{currentStudent.class_level}</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
