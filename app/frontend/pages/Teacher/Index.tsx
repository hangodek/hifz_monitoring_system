"use client"

import { useState, useEffect } from "react"
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

// Surah list for reference
const surahList = [
  "Al-Fatihah",
  "Al-Baqarah",
  "Ali Imran",
  "An-Nisa",
  "Al-Maidah",
  "Al-An'am",
  "Al-A'raf",
  "Al-Anfal",
  "At-Taubah",
  "Yunus",
  "Hud",
  "Yusuf",
  "Ar-Ra'd",
  "Ibrahim",
  "Al-Hijr",
  "An-Nahl",
  "Al-Isra",
  "Al-Kahf",
  "Maryam",
  "Ta-Ha",
  "Al-Anbiya",
  "Al-Hajj",
  "Al-Mu'minun",
  "An-Nur",
  "Al-Furqan",
  "Ash-Shu'ara",
  "An-Naml",
  "Al-Qasas",
  "Al-Ankabut",
  "Ar-Rum",
  "Luqman",
  "As-Sajdah",
  "Al-Ahzab",
  "Saba",
  "Fatir",
  "Ya-Sin",
  "As-Saffat",
  "Sad",
  "Az-Zumar",
  "Ghafir",
  "Fussilat",
  "Ash-Shura",
  "Az-Zukhruf",
  "Ad-Dukhan",
  "Al-Jathiyah",
  "Al-Ahqaf",
  "Muhammad",
  "Al-Fath",
  "Al-Hujurat",
  "Qaf",
  "Adh-Dhariyat",
  "At-Tur",
  "An-Najm",
  "Al-Qamar",
  "Ar-Rahman",
  "Al-Waqi'ah",
  "Al-Hadid",
  "Al-Mujadila",
  "Al-Hashr",
  "Al-Mumtahanah",
  "As-Saff",
  "Al-Jumu'ah",
  "Al-Munafiqun",
  "At-Taghabun",
  "At-Talaq",
  "At-Tahrim",
  "Al-Mulk",
  "Al-Qalam",
  "Al-Haqqah",
  "Al-Ma'arij",
  "Nuh",
  "Al-Jinn",
  "Al-Muzzammil",
  "Al-Muddaththir",
  "Al-Qiyamah",
  "Al-Insan",
  "Al-Mursalat",
  "An-Naba",
  "An-Nazi'at",
  "Abasa",
  "At-Takwir",
  "Al-Infitar",
  "Al-Mutaffifin",
  "Al-Inshiqaq",
  "Al-Buruj",
  "At-Tariq",
  "Al-A'la",
  "Al-Ghashiyah",
  "Al-Fajr",
  "Al-Balad",
  "Ash-Shams",
  "Al-Layl",
  "Ad-Duha",
  "Ash-Sharh",
  "At-Tin",
  "Al-Alaq",
  "Al-Qadr",
  "Al-Bayyinah",
  "Az-Zalzalah",
  "Al-Adiyat",
  "Al-Qari'ah",
  "At-Takathur",
  "Al-Asr",
  "Al-Humazah",
  "Al-Fil",
  "Quraysh",
  "Al-Ma'un",
  "Al-Kawthar",
  "Al-Kafirun",
  "An-Nasr",
  "Al-Masad",
  "Al-Ikhlas",
  "Al-Falaq",
  "An-Nas",
]

type TeacherIndexProps = {
  students: Array<{
    id: string
    name: string
    class_level: string
    current_hifz_in_juz: string
    current_hifz_in_pages: string
    current_hifz_in_surah: string
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

export default function TeacherIndex({ students, recent_activities }: TeacherIndexProps) {
  const [selectedStudent, setSelectedStudent] = useState<string>("")
  const [activityType, setActivityType] = useState<string>("")

  // Activity form fields
  const [activityDetails, setActivityDetails] = useState({
    surahFrom: "",
    surahTo: "",
    pageFrom: "",
    pageTo: "",
    juz: "",
    juzFrom: "",
    juzTo: "",
    notes: "",
    evaluation: "",
  })

  const currentStudent = students.find((s) => s.id === selectedStudent)

  // Reset form when activity type changes, then auto-fill for memorization
  useEffect(() => {
    if (activityType) {
      // Reset form first
      setActivityDetails({
        surahFrom: "",
        surahTo: "",
        pageFrom: "",
        pageTo: "",
        juz: "",
        juzFrom: "",
        juzTo: "",
        notes: "",
        evaluation: "",
      })

      // Then auto-fill for memorization
      if (activityType === "memorization" && currentStudent) {
        setActivityDetails({
          surahFrom: currentStudent.current_hifz_in_surah || "",
          surahTo: "",
          pageFrom: currentStudent.current_hifz_in_pages || "",
          pageTo: "",
          juz: "",
          juzFrom: currentStudent.current_hifz_in_juz || "",
          juzTo: "",
          notes: "",
          evaluation: "",
        })
      }
    }
  }, [activityType, currentStudent])

  const handleSaveActivity = () => {
    // This function is now handled by the ActivityForm component itself
    // Reset form after successful save
    setActivityDetails({
      surahFrom: "",
      surahTo: "",
      pageFrom: "",
      pageTo: "",
      juz: "",
      juzFrom: "",
      juzTo: "",
      notes: "",
      evaluation: "",
    })
  }

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
              surahList={surahList}
              activityDetails={activityDetails}
              setActivityDetails={setActivityDetails}
              handleSaveActivity={handleSaveActivity}
              selectedStudent={selectedStudent}
              currentStudent={currentStudent}
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
