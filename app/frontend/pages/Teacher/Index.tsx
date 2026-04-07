"use client"

import { useState } from "react"
import {
  BookOpen,
  Star,
} from "lucide-react"
import {
  TeacherHeader,
  StudentSelection,
  ActivityForm,
  RecentActivities,
} from "./components"

// Activity types
const activityTypes = [
  { value: "memorization", label: "Hafalan", icon: BookOpen, color: "bg-blue-500" },
  { value: "revision", label: "Murajaah", icon: Star, color: "bg-green-500" },
]

type TeacherIndexProps = {
  students: Array<{
    id: string
    name: string
    class_level: string
    current_hifz_in_juz: string
    current_hifz_in_pages: string
    current_hifz_in_surah: string
    total_juz_memorized?: number | 0
  }>
  recent_activities: Array<{
    id: string
    activity_type: string
    activity_grade: string
    surah_from: string
    surah_to: string
    page_from: number
    page_to: number
    juz: number | null
    juz_from: number | null
    juz_to: number | null
    notes: string | null
    created_at: string
    student: {
      id: string
      name: string
    }
  }>
}

export default function TeacherIndex({ students }: TeacherIndexProps) {
  const [selectedStudent, setSelectedStudent] = useState<string>("")
  const [activityType, setActivityType] = useState<string>("")

  const currentStudent = students.find((s) => s.id === selectedStudent)

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="flex flex-col space-y-4 sm:space-y-6 p-4 sm:p-6">
        {/* Header */}
        <TeacherHeader />

        <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
          {/* Student Selection & Recording */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Student Selection */}
            <StudentSelection
              students={students}
              selectedStudent={selectedStudent}
              setSelectedStudent={setSelectedStudent}
              currentStudent={currentStudent}
            />

          </div>

          {/* Activity Form */}
          <div className="space-y-4 sm:space-y-6">
            <ActivityForm
              activityType={activityType}
              setActivityType={setActivityType}
              activityTypes={activityTypes}
              selectedStudent={selectedStudent}
            />

            {/* Recent Activities for Selected Student */}
            <RecentActivities
              currentStudent={currentStudent}
              activityTypes={activityTypes}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
