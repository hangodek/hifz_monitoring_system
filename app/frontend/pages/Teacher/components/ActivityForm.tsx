import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Plus, Save } from "lucide-react"
import { router } from "@inertiajs/react"
import { memo, useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"

interface ActivityType {
  value: string
  label: string
  color: string
}

interface Juz30Entry {
  surah: string
  status: "completed" | "incomplete"
  k: number
  t: number
  f: number
}

interface ActivityFormProps {
  activityType: string
  setActivityType: (value: string) => void
  activityTypes: ActivityType[]
  selectedStudent: string
}

const JUZ_30_SURAHS = [
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
] as const

const defaultEntry = (surah: string): Juz30Entry => ({
  surah,
  status: "incomplete",
  k: 1,
  t: 1,
  f: 1,
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

type EntryRowProps = {
  entry: Juz30Entry
  index: number
  onUpdate: (index: number, updates: Partial<Juz30Entry>) => void
}

const SelectedSurahEditor = memo(function SelectedSurahEditor({ entry, index, onUpdate }: EntryRowProps) {
  const statusClass = entry.status === "completed" ? "border-emerald-200 bg-emerald-50/60" : "border-rose-200 bg-rose-50/60"

  return (
    <div className={`rounded-lg border p-3 ${statusClass}`}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-gray-900">{entry.surah}</p>
        <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-gray-700">
          {entry.status === "completed" ? "Tuntas" : "Belum"}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="col-span-2">
          <Label className="text-xs">Status</Label>
          <select
            value={entry.status}
            onChange={(e) => onUpdate(index, { status: e.target.value as "completed" | "incomplete" })}
            className="mt-1 h-9 w-full rounded-md border border-gray-200 bg-white px-2 text-sm"
          >
            <option value="completed">Tuntas</option>
            <option value="incomplete">Tidak Tuntas</option>
          </select>
        </div>
        <div>
          <Label className="text-xs">K (1-50)</Label>
          <select
            value={entry.k}
            onChange={(e) => onUpdate(index, { k: Number(e.target.value) })}
            className="mt-1 h-9 w-full rounded-md border border-gray-200 bg-white px-2 text-sm"
          >
            {K_OPTIONS.map((num) => (
              <option key={num} value={num}>
                {num}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label className="text-xs">T (1-25)</Label>
          <select
            value={entry.t}
            onChange={(e) => onUpdate(index, { t: Number(e.target.value) })}
            className="mt-1 h-9 w-full rounded-md border border-gray-200 bg-white px-2 text-sm"
          >
            {T_OPTIONS.map((num) => (
              <option key={num} value={num}>
                {num}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label className="text-xs">F (1-15)</Label>
          <select
            value={entry.f}
            onChange={(e) => onUpdate(index, { f: Number(e.target.value) })}
            className="mt-1 h-9 w-full rounded-md border border-gray-200 bg-white px-2 text-sm"
          >
            {F_OPTIONS.map((num) => (
              <option key={num} value={num}>
                {num}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
})

export function ActivityForm({
  activityType,
  setActivityType,
  activityTypes,
  selectedStudent,
}: ActivityFormProps) {
  const [juz30Entries, setJuz30Entries] = useState<Juz30Entry[]>(
    JUZ_30_SURAHS.map((surah) => defaultEntry(surah))
  )
  const [selectedSurah, setSelectedSurah] = useState<string>(JUZ_30_SURAHS[0])

  const updateEntry = (index: number, updates: Partial<Juz30Entry>) => {
    setJuz30Entries((prev) =>
      prev.map((entry, currentIndex) => (currentIndex === index ? { ...entry, ...updates } : entry))
    )
  }

  const resetForm = () => {
    setActivityType("")
    setJuz30Entries(JUZ_30_SURAHS.map((surah) => defaultEntry(surah)))
    setSelectedSurah(JUZ_30_SURAHS[0])
  }

  const totals = useMemo(
    () =>
      juz30Entries.reduce(
        (acc, entry) => {
          const totalScore = entry.k + entry.t + entry.f
          const percentage = Math.round((totalScore / 90) * 100)

          return {
            completedCount: acc.completedCount + (entry.status === "completed" ? 1 : 0),
            incompleteCount: acc.incompleteCount + (entry.status === "incomplete" ? 1 : 0),
            totalPercentage: acc.totalPercentage + percentage,
          }
        },
        {
          completedCount: 0,
          incompleteCount: 0,
          totalPercentage: 0,
        }
      ),
    [juz30Entries]
  )

  const averageScore = Math.round(totals.totalPercentage / juz30Entries.length)

  const selectedEntry = useMemo(() => {
    const index = juz30Entries.findIndex((entry) => entry.surah === selectedSurah)
    if (index === -1) {
      return null
    }

    return {
      index,
      entry: juz30Entries[index],
    }
  }, [juz30Entries, selectedSurah])

  const incompleteCount = totals.incompleteCount
  
  const handleSubmit = () => {
    if (!selectedStudent || !activityType) {
      alert("Pilih siswa dan jenis aktivitas terlebih dahulu")
      return
    }

    const detailedNotes = {
      format: "juz30_status_v1",
      entries: juz30Entries,
      summary: {
        completed: totals.completedCount,
        incomplete: totals.incompleteCount,
        average_score: averageScore,
      },
    }

    const activityData = {
      activity_type: activityType,
      activity_grade: getGradeFromAverage(averageScore),
      surah_from: "An-Naba",
      surah_to: "Al-Ikhlas",
      page_from: 582,
      page_to: 604,
      juz: 30,
      juz_from: 30,
      juz_to: 30,
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
            <div className="flex flex-wrap items-center gap-2 rounded-md bg-indigo-50 p-3">
              <Badge variant="secondary">Juz 30</Badge>
              <Badge className="bg-emerald-600">Tuntas: {totals.completedCount}</Badge>
              <Badge variant="outline" className={incompleteCount > 0 ? "border-rose-300 text-rose-700" : ""}>
                Belum Tuntas: {totals.incompleteCount}
              </Badge>
              <Badge variant="outline">Rata-rata: {averageScore}</Badge>
            </div>

            <div className="space-y-3 rounded-md border border-gray-200 bg-white p-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Pilih Surah Yang Mau Dinilai</Label>
                <select
                  value={selectedSurah}
                  onChange={(e) => setSelectedSurah(e.target.value)}
                  className="h-9 w-full rounded-md border border-gray-200 bg-white px-2 text-sm"
                >
                  {JUZ_30_SURAHS.map((surah) => (
                    <option key={surah} value={surah}>
                      {surah}
                    </option>
                  ))}
                </select>
              </div>

              <p className="text-xs text-muted-foreground">Yang ditampilkan hanya 1 surah agar ringan dan cepat.</p>
            </div>

            {selectedEntry ? (
              <SelectedSurahEditor
                entry={selectedEntry.entry}
                index={selectedEntry.index}
                onUpdate={updateEntry}
              />
            ) : (
              <div className="rounded-md border border-dashed border-gray-300 p-4 text-center text-sm text-muted-foreground">
                Surah tidak ditemukan. Pilih dari daftar surah Juz 30.
              </div>
            )}

            <Button
              onClick={handleSubmit}
              className="w-full cursor-pointer text-sm sm:text-base bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              disabled={!selectedStudent || !activityType}
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
