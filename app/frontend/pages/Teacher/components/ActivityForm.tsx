import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Plus, Save } from "lucide-react"
import { router } from "@inertiajs/react"
import { useMemo, useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"

interface ActivityType {
  value: string
  label: string
  color: string
}

interface Juz30Entry {
  juz: number
  surah: string
  status: "completed" | "incomplete"
  k: number
  t: number
  f: number
  ayat: number
  grade: "excellent" | "good" | "fair" | "needs_improvement"
}

interface PreviousActivity {
  status: "completed" | "incomplete"
  k: number
  t: number
  f: number
  ayat: number
  activity_grade: string
  created_at: string
}

interface ActivityFormProps {
  activityType: string
  setActivityType: (value: string) => void
  activityTypes: ActivityType[]
  selectedStudent: string
}

const JUZ_SURAH_OPTIONS: Record<number, string[]> = {
  1: ["Al-Fatihah", "Al-Baqarah"],
  2: ["Al-Baqarah"],
  3: ["Al-Baqarah", "Ali Imran"],
  4: ["Ali Imran", "An-Nisa"],
  5: ["An-Nisa"],
  6: ["An-Nisa", "Al-Ma'idah"],
  7: ["Al-Ma'idah", "Al-An'am"],
  8: ["Al-An'am", "Al-A'raf", "Al-Anfal"],
  9: ["Al-A'raf", "Al-Anfal", "At-Taubah"],
  10: ["Al-Anfal", "At-Taubah"],
  11: ["At-Taubah", "Yunus", "Hud"],
  12: ["Hud", "Yusuf"],
  13: ["Yusuf", "Ar-Ra'd", "Ibrahim"],
  14: ["Al-Hijr", "An-Nahl"],
  15: ["Al-Isra", "Al-Kahf"],
  16: ["Al-Kahf", "Maryam", "Ta-Ha"],
  17: ["Al-Anbiya", "Al-Hajj"],
  18: ["Al-Mu'minun", "An-Nur", "Al-Furqan"],
  19: ["Al-Furqan", "Ash-Shu'ara", "An-Naml", "Al-Qasas"],
  20: ["Al-Qasas", "Al-Ankabut", "Ar-Rum", "Luqman", "As-Sajdah"],
  21: ["Al-Ankabut", "Ar-Rum", "Luqman", "As-Sajdah", "Al-Ahzab"],
  22: ["Al-Ahzab", "Saba", "Fatir", "Ya-Sin"],
  23: ["Ya-Sin", "As-Saffat", "Sad", "Az-Zumar"],
  24: ["Az-Zumar", "Ghafir", "Fussilat"],
  25: ["Fussilat", "Ash-Shura", "Az-Zukhruf", "Ad-Dukhan", "Al-Jathiyah", "Al-Ahqaf"],
  26: ["Al-Ahqaf", "Muhammad", "Al-Fath", "Al-Hujurat", "Qaf", "Adh-Dhariyat"],
  27: ["Adh-Dhariyat", "At-Tur", "An-Najm", "Al-Qamar", "Ar-Rahman", "Al-Waqi'ah", "Al-Hadid"],
  28: ["Al-Mujadila", "Al-Hashr", "Al-Mumtahanah", "As-Saff", "Al-Jumu'ah", "Al-Munafiqun", "At-Taghabun", "At-Talaq"],
  29: ["At-Talaq", "At-Tahrim", "Al-Mulk", "Al-Qalam", "Al-Haqqah", "Al-Ma'arij", "Nuh", "Al-Jinn", "Al-Muzzammil", "Al-Muddaththir", "Al-Qiyamah", "Al-Insan", "Al-Mursalat"],
  30: ["An-Naba", "An-Nazi'at", "Abasa", "At-Takwir", "Al-Infitar", "Al-Mutaffifin", "Al-Inshiqaq", "Al-Buruj", "At-Tariq", "Al-A'la", "Al-Ghashiyah", "Al-Fajr", "Al-Balad", "Ash-Shams", "Al-Layl", "Ad-Duha", "Ash-Sharh", "At-Tin", "Al-Alaq", "Al-Qadr", "Al-Bayyinah", "Az-Zalzalah", "Al-Adiyat", "Al-Qari'ah", "At-Takathur", "Al-Asr", "Al-Humazah", "Al-Fil", "Quraysh", "Al-Ma'un", "Al-Kawthar", "Al-Kafirun", "An-Nasr", "Al-Masad", "Al-Ikhlas", "Al-Falaq", "An-Nas"],
}

const defaultEntry = (juz: number, surah: string): Juz30Entry => ({
  juz,
  surah,
  status: "incomplete",
  k: 1,
  t: 1,
  f: 1,
  ayat: 0,
  grade: "good",
})

const K_OPTIONS = Array.from({ length: 50 }, (_, i) => i + 1)
const T_OPTIONS = Array.from({ length: 25 }, (_, i) => i + 1)
const F_OPTIONS = Array.from({ length: 15 }, (_, i) => i + 1)

const getGradeFromAverage = (average: number) => {
  if (average >= 85) return "excellent"
  if (average >= 70) return "good"
  if (average >= 55) return "fair"
  return "needs_improvement"
}

const getSurahOptionsForJuz = (juz: number) => JUZ_SURAH_OPTIONS[juz] ?? []

const SelectedSurahEditor = ({
  entry,
  onUpdate,
  previousActivity,
}: {
  entry: Juz30Entry
  onUpdate: (updates: Partial<Juz30Entry>) => void
  previousActivity?: PreviousActivity | null
}) => {
  const statusClass = entry.status === "completed" ? "border-emerald-200 bg-emerald-50/60" : "border-rose-200 bg-rose-50/60"
  const gradeLabels: Record<string, string> = {
    excellent: "Sangat Baik",
    good: "Baik",
    fair: "Cukup",
    needs_improvement: "Perlu Diperbaiki",
  }

  return (
    <div className={`rounded-lg border p-3 ${statusClass}`}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wide text-gray-500">Juz {entry.juz}</p>
          <p className="truncate text-sm font-semibold text-gray-900">{entry.surah}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-gray-700">
            {entry.status === "completed" ? "Tuntas" : "Belum"}
          </span>
          {previousActivity?.activity_grade && (
            <span className="rounded-full px-2 py-0.5 text-xs font-medium bg-indigo-100 text-indigo-700">
              {gradeLabels[previousActivity.activity_grade] || previousActivity.activity_grade}
            </span>
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-xs">Status</Label>
          <Select
            value={entry.status}
            onValueChange={(value: "completed" | "incomplete") => onUpdate({ status: value })}
          >
            <SelectTrigger className="mt-1 h-9 w-full border-gray-200 bg-white text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="completed">Tuntas</SelectItem>
              <SelectItem value="incomplete">Tidak Tuntas</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">K (1-50)</Label>
          <Select value={entry.k.toString()} onValueChange={(value) => onUpdate({ k: Number(value) })}>
            <SelectTrigger className="mt-1 h-9 w-full border-gray-200 bg-white text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {K_OPTIONS.map((num) => (
                <SelectItem key={num} value={num.toString()}>
                  {num}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">T (1-25)</Label>
          <Select value={entry.t.toString()} onValueChange={(value) => onUpdate({ t: Number(value) })}>
            <SelectTrigger className="mt-1 h-9 w-full border-gray-200 bg-white text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {T_OPTIONS.map((num) => (
                <SelectItem key={num} value={num.toString()}>
                  {num}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">F (1-15)</Label>
          <Select value={entry.f.toString()} onValueChange={(value) => onUpdate({ f: Number(value) })}>
            <SelectTrigger className="mt-1 h-9 w-full border-gray-200 bg-white text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {F_OPTIONS.map((num) => (
                <SelectItem key={num} value={num.toString()}>
                  {num}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="col-span-2">
          <Label className="text-xs">Ayat</Label>
          <input
            type="number"
            min={0}
            step={1}
            value={entry.ayat || ""}
            onChange={(e) => onUpdate({ ayat: Number(e.target.value) || 0 })}
            className="mt-1 h-9 w-full rounded-md border border-gray-200 bg-white px-2 text-sm placeholder-gray-400"
            placeholder="0"
            required
          />
        </div>
        <div className="col-span-2">
          <Label className="text-xs">Predikat</Label>
          <Select
            value={entry.grade}
            onValueChange={(value: "excellent" | "good" | "fair" | "needs_improvement") => onUpdate({ grade: value })}
          >
            <SelectTrigger className="mt-1 h-9 w-full border-gray-200 bg-white text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="excellent">Sangat Baik</SelectItem>
              <SelectItem value="good">Baik</SelectItem>
              <SelectItem value="fair">Cukup</SelectItem>
              <SelectItem value="needs_improvement">Perlu Diperbaiki</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}

export function ActivityForm({
  activityType,
  setActivityType,
  activityTypes,
  selectedStudent,
}: ActivityFormProps) {
  const [selectedJuz, setSelectedJuz] = useState<number>(30)
  const [selectedSurah, setSelectedSurah] = useState<string>(getSurahOptionsForJuz(30)[0] ?? "")
  const [entry, setEntry] = useState<Juz30Entry>(defaultEntry(30, getSurahOptionsForJuz(30)[0] ?? ""))
  const [previousActivity, setPreviousActivity] = useState<PreviousActivity | null>(null)
  const [loading, setLoading] = useState(false)

  const juzSurahOptions = useMemo(() => getSurahOptionsForJuz(selectedJuz), [selectedJuz])

  // Fetch previous activity when juz or surah changes
  useEffect(() => {
    if (!selectedStudent || !selectedSurah) {
      setPreviousActivity(null)
      return
    }

    setLoading(true)
    fetch(
      `/teachers/get_previous_activity?student_id=${selectedStudent}&juz=${selectedJuz}&surah=${encodeURIComponent(selectedSurah)}`
    )
      .then((res) => res.json())
      .then((data) => {
        if (data.activity) {
          setPreviousActivity(data.activity)
          // Update entry with previous activity data
          setEntry({
            juz: selectedJuz,
            surah: selectedSurah,
            status: data.activity.status,
            k: data.activity.k,
            t: data.activity.t,
            f: data.activity.f,
            ayat: data.activity.ayat,
            grade: data.activity.activity_grade as "excellent" | "good" | "fair" | "needs_improvement",
          })
        } else {
          setPreviousActivity(null)
          // Reset to default incomplete status
          setEntry(defaultEntry(selectedJuz, selectedSurah))
        }
      })
      .catch((error) => {
        console.error("Error fetching previous activity:", error)
        setPreviousActivity(null)
        setEntry(defaultEntry(selectedJuz, selectedSurah))
      })
      .finally(() => setLoading(false))
  }, [selectedStudent, selectedJuz, selectedSurah])

  // Update juz and reset surah
  useEffect(() => {
    const firstSurah = getSurahOptionsForJuz(selectedJuz)[0] ?? ""
    setSelectedSurah(firstSurah)
  }, [selectedJuz])

  const updateEntry = (updates: Partial<Juz30Entry>) => {
    setEntry((prev) => ({ ...prev, ...updates }))
    // If surah is being changed, update selectedSurah
    if (updates.surah) {
      setSelectedSurah(updates.surah)
    }
  }

  const resetForm = () => {
    setActivityType("")
    setSelectedJuz(30)
    const firstSurah = getSurahOptionsForJuz(30)[0] ?? ""
    setSelectedSurah(firstSurah)
    setEntry(defaultEntry(30, firstSurah))
    setPreviousActivity(null)
  }

  const totalScore = entry.k + entry.t + entry.f
  const averageScore = Math.round((totalScore / 90) * 100)
  
  const handleSubmit = () => {
    if (!selectedStudent || !activityType) {
      alert("Pilih siswa dan jenis aktivitas terlebih dahulu")
      return
    }

    if (entry.ayat === 0 || entry.ayat < 0) {
      alert("Jumlah ayat harus diisi (lebih dari 0)")
      return
    }

    const detailedNotes = {
      format: "juz_based_status_v1",
      entry,
      summary: {
        score: averageScore,
      },
    }

    const activityData = {
      activity_type: activityType,
      activity_grade: entry.grade,
      surah_from: entry.surah,
      surah_to: entry.surah,
      page_from: 0,
      page_to: 0,
      juz: entry.juz,
      juz_from: entry.juz,
      juz_to: entry.juz,
      notes: JSON.stringify(detailedNotes),
    }

    router.post(`/students/${selectedStudent}/activities`, { activity: activityData }, {
      onSuccess: () => {
        resetForm()
      },
      onError: (errors) => {
        console.error("Failed to save activity:", errors)
        alert("Gagal menyimpan aktivitas. Silakan coba lagi.")
      }
    })
  }

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-indigo-50/30 hover:shadow-xl transition-shadow duration-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-indigo-900">
          <div className="h-10 w-10 rounded-full bg-indigo-500/20 flex items-center justify-center">
            <Plus className="h-5 w-5 text-indigo-600" />
          </div>
          Tambah Aktivitas
        </CardTitle>
        <CardDescription>Catat aktivitas siswa</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Jenis Setoran</Label>
          <Select value={activityType} onValueChange={setActivityType}>
            <SelectTrigger className="border-indigo-200 hover:border-indigo-300 cursor-pointer">
              <SelectValue placeholder="Pilih Hafalan / Murajaah" />
            </SelectTrigger>
            <SelectContent className="border-gray-200/60">
              {activityTypes.map((type) => (
                <SelectItem key={type.value} value={type.value} className="cursor-pointer">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${type.color}`}></div>
                    <span>{type.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className={activityType ? "space-y-4" : "hidden"}>
          <div className="grid gap-3 rounded-md border border-gray-200 bg-white p-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Pilih Juz</Label>
              <Select value={selectedJuz.toString()} onValueChange={(value) => setSelectedJuz(Number(value))}>
                <SelectTrigger className="h-9 w-full border-gray-200 bg-white text-sm">
                  <SelectValue placeholder="Pilih juz" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 30 }, (_, i) => 30 - i).map((juz) => (
                    <SelectItem key={juz} value={juz.toString()}>
                      Juz {juz}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Pilih Surah</Label>
              <Select 
                value={selectedSurah} 
                onValueChange={(value) => {
                  setSelectedSurah(value)
                  updateEntry({ surah: value })
                }}
              >
                <SelectTrigger className="h-9 w-full border-gray-200 bg-white text-sm">
                  <SelectValue placeholder="Pilih surah" />
                </SelectTrigger>
                <SelectContent>
                  {juzSurahOptions.map((surah) => (
                    <SelectItem key={surah} value={surah}>
                      {surah}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Dropdown surah akan berubah sesuai juz yang dipilih.
          </p>

          <SelectedSurahEditor
            entry={entry}
            onUpdate={updateEntry}
            previousActivity={previousActivity}
          />

          <Button
            onClick={handleSubmit}
            className="w-full cursor-pointer text-sm sm:text-base bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
            disabled={!selectedStudent || !activityType || !entry.surah}
          >
            <Save className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Simpan Aktivitas</span>
            <span className="sm:hidden">Simpan</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
