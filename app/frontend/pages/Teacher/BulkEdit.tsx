"use client"

import { useEffect, useMemo, useState } from "react"
import { Check, CheckCircle2, Circle, Save, Sparkles } from "lucide-react"
import { TeacherHeader, StudentSelection } from "./components"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { JUZ_OPTIONS, JUZ_SURAH_MAP } from "@/lib/quran"

type Student = {
  id: string
  name: string
  class_level: string
  current_hifz_in_juz: string
  current_hifz_in_pages: string
  current_hifz_in_surah: string
}

type TeacherBulkEditProps = {
  students: Student[]
}

type StudentActivity = {
  id: string
  activity_type: string
  surah_from: string
  page_from: number | null
  juz: number | null
  completion_status: string
  kelancaran: number | null
  fashohah: number | null
  tajwid: number | null
  notes: string | null
}

type StudentProgression = {
  juz: number
  surah: string
  completion_status: string
  last_activity_at?: string | null
}

type BulkRow = {
  rowKey: string
  activityId: string
  juz: string
  surah: string
  ayat: string
  completionStatus: string
  kelancaran: string
  fashohah: string
  tajwid: string
  notes: string
  originalActivityId: string
  originalJuz: string
  originalSurah: string
  originalAyat: string
  originalCompletionStatus: string
  originalKelancaran: string
  originalFashohah: string
  originalTajwid: string
  originalNotes: string
}

type ActivityPayload = {
  activities: StudentActivity[]
  surah_progressions: StudentProgression[]
}

function normalizeSurahName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "")
}

function createEmptyRow(surah: string, juz: string, status = "belum_tuntas"): BulkRow {
  const rowKey = `${juz}-${surah}`

  return {
    rowKey,
    activityId: "",
    juz,
    surah,
    ayat: "",
    completionStatus: status,
    kelancaran: "",
    fashohah: "",
    tajwid: "",
    notes: "",
    originalActivityId: "",
    originalJuz: juz,
    originalSurah: surah,
    originalAyat: "",
    originalCompletionStatus: status,
    originalKelancaran: "",
    originalFashohah: "",
    originalTajwid: "",
    originalNotes: "",
  }
}

function buildRowsForJuz(juz: string, payload: ActivityPayload): BulkRow[] {
  const surahs = JUZ_SURAH_MAP[juz] || []

  return surahs.map((surah) => {
    const latestActivity = payload.activities
      .filter((activity) => activity.activity_type === "memorization")
      .find((activity) => String(activity.juz || "") === juz && activity.surah_from === surah)

    const progression = payload.surah_progressions.find(
      (item) => String(item.juz) === juz && item.surah === surah
    )

    const completionStatus = progression?.completion_status || latestActivity?.completion_status || "belum_tuntas"
    const ayat = latestActivity?.page_from ? String(latestActivity.page_from) : ""

    const kelancaran = latestActivity?.kelancaran ? String(latestActivity.kelancaran) : ""
    const fashohah = latestActivity?.fashohah ? String(latestActivity.fashohah) : ""
    const tajwid = latestActivity?.tajwid ? String(latestActivity.tajwid) : ""
    const notes = latestActivity?.notes || ""

    return {
      rowKey: `${juz}-${surah}`,
      activityId: latestActivity?.id || "",
      juz,
      surah,
      ayat,
      completionStatus,
      kelancaran,
      fashohah,
      tajwid,
      notes,
      originalActivityId: latestActivity?.id || "",
      originalJuz: juz,
      originalSurah: surah,
      originalAyat: ayat,
      originalCompletionStatus: completionStatus,
      originalKelancaran: kelancaran,
      originalFashohah: fashohah,
      originalTajwid: tajwid,
      originalNotes: notes,
    }
  })
}

function isRowDirty(row: BulkRow) {
  return [
    row.activityId,
    row.juz,
    row.surah,
    row.ayat,
    row.completionStatus,
    row.kelancaran,
    row.fashohah,
    row.tajwid,
    row.notes,
  ].join("|") !== [
    row.originalActivityId,
    row.originalJuz,
    row.originalSurah,
    row.originalAyat,
    row.originalCompletionStatus,
    row.originalKelancaran,
    row.originalFashohah,
    row.originalTajwid,
    row.originalNotes,
  ].join("|")
}

function serializeRowForSave(row: BulkRow) {
  return {
    activity_id: row.activityId,
    juz: row.juz,
    surah: row.surah,
    ayat: row.ayat,
    completion_status: row.completionStatus,
    kelancaran: row.kelancaran,
    fashohah: row.fashohah,
    tajwid: row.tajwid,
    notes: row.notes,
    original_activity_id: row.originalActivityId,
    original_juz: row.originalJuz,
    original_surah: row.originalSurah,
    original_ayat: row.originalAyat,
    original_completion_status: row.originalCompletionStatus,
    original_kelancaran: row.originalKelancaran,
    original_fashohah: row.originalFashohah,
    original_tajwid: row.originalTajwid,
    original_notes: row.originalNotes,
  }
}

function statusChipClass(status: string) {
  return status === "tuntas"
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : "border-rose-200 bg-rose-50 text-rose-700"
}

export default function TeacherBulkEdit({ students }: TeacherBulkEditProps) {
  const [selectedStudent, setSelectedStudent] = useState("")
  const [selectedJuz, setSelectedJuz] = useState("")
  const [payload, setPayload] = useState<ActivityPayload>({ activities: [], surah_progressions: [] })
  const [rows, setRows] = useState<BulkRow[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [statusMessage, setStatusMessage] = useState("")

  const currentStudent = useMemo(
    () => students.find((student) => student.id === selectedStudent),
    [students, selectedStudent]
  )

  useEffect(() => {
    if (!selectedStudent) {
      setPayload({ activities: [], surah_progressions: [] })
      setSelectedJuz("")
      setRows([])
      return
    }

    const loadStudentData = async () => {
      setIsLoading(true)
      setStatusMessage("")

      try {
        const response = await fetch(`/teachers/student_activities?student_id=${selectedStudent}`)
        const data: ActivityPayload = await response.json()
        setPayload({
          activities: data.activities || [],
          surah_progressions: data.surah_progressions || [],
        })
      } catch (error) {
        console.error("Failed to load student activities:", error)
        setPayload({ activities: [], surah_progressions: [] })
      } finally {
        setIsLoading(false)
      }
    }

    loadStudentData()
  }, [selectedStudent])

  useEffect(() => {
    if (!selectedStudent || !selectedJuz) {
      setRows([])
      return
    }

    setRows(buildRowsForJuz(selectedJuz, payload))
  }, [payload, selectedJuz, selectedStudent])

  const currentCounts = useMemo(() => {
    const completed = rows.filter((row) => row.completionStatus === "tuntas").length
    return {
      completed,
      remaining: rows.length - completed,
    }
  }, [rows])

  const completedJuzSet = useMemo(() => {
    const completed = new Set<string>()

    JUZ_OPTIONS.forEach((juz) => {
      const expectedSurahs = (JUZ_SURAH_MAP[juz] || []).map(normalizeSurahName)
      if (expectedSurahs.length === 0) return

      const tuntasSurahs = new Set(
        payload.surah_progressions
          .filter((progression) => String(progression.juz) === juz && progression.completion_status === "tuntas")
          .map((progression) => normalizeSurahName(progression.surah))
      )

      if (expectedSurahs.every((surah) => tuntasSurahs.has(surah))) {
        completed.add(juz)
      }
    })

    return completed
  }, [payload.surah_progressions])

  const updateRow = (rowKey: string, field: keyof BulkRow, value: string) => {
    setRows((prev) =>
      prev.map((row) => {
        if (row.rowKey !== rowKey) return row

        return {
          ...row,
          [field]: value,
        }
      })
    )
  }

  const setAllStatus = (status: string) => {
    setRows((prev) => prev.map((row) => ({ ...row, completionStatus: status })))
  }

  const handleSave = async () => {
    if (!selectedStudent) {
      setStatusMessage("Pilih siswa dulu.")
      return
    }

    if (!selectedJuz) {
      setStatusMessage("Pilih juz dulu.")
      return
    }

    const dirtyRows = rows.filter(isRowDirty)
    if (dirtyRows.length === 0) {
      setStatusMessage("Tidak ada perubahan untuk disimpan.")
      return
    }

    setIsSaving(true)
    setStatusMessage("")

    try {
      const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute("content")
      const response = await fetch("/teachers/bulk_save_activities", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(csrfToken ? { "X-CSRF-Token": csrfToken } : {}),
          Accept: "application/json",
        },
        body: JSON.stringify({
          student_id: selectedStudent,
          juz: selectedJuz,
          activities: dirtyRows.map(serializeRowForSave),
        }),
      })

      const payloadResponse = await response.json()

      if (!response.ok) {
        setStatusMessage(payloadResponse.message || "Gagal menyimpan data.")
        return
      }

      const savedRows: Array<{ row_index: number; id: string; action: string }> = payloadResponse.saved_rows || []
      const savedRowIndexMap = new Map(savedRows.map((item) => [item.row_index, item]))

      setRows((prev) =>
        prev.map((row, index) => {
          const saved = savedRowIndexMap.get(index)
          if (!saved) return row

          const activityId = saved.action.includes("progression") ? row.activityId : saved.id

          return {
            ...row,
            activityId,
            originalActivityId: activityId,
            originalJuz: row.juz,
            originalSurah: row.surah,
            originalAyat: row.ayat,
            originalCompletionStatus: row.completionStatus,
            originalKelancaran: row.kelancaran,
            originalFashohah: row.fashohah,
            originalTajwid: row.tajwid,
            originalNotes: row.notes,
          }
        })
      )

      setStatusMessage(payloadResponse.message || "Data berhasil disimpan.")
    } catch (error) {
      console.error("Bulk save failed:", error)
      setStatusMessage("Gagal menyimpan data. Coba lagi.")
    } finally {
      setIsSaving(false)
    }
  }

  const hasSelection = Boolean(selectedStudent && selectedJuz)
  const canSave = hasSelection && rows.length > 0 && !isLoading

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="flex flex-col gap-4 p-4 sm:gap-6 sm:p-6">
        <TeacherHeader mode="bulk" />

        <Card className="border-0 shadow-lg bg-white/90 backdrop-blur">
          <CardHeader className="space-y-2">
            <CardTitle className="flex items-center gap-2 text-slate-900">
              <Sparkles className="h-5 w-5 text-indigo-600" />
              Edit Massal Nilai dan Status Surah
            </CardTitle>
            <CardDescription>
              Pilih siswa, pilih juz, lalu kelola semua surah di juz itu sekaligus. Status merah artinya belum tuntas, hijau artinya tuntas.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <StudentSelection
              students={students}
              selectedStudent={selectedStudent}
              setSelectedStudent={setSelectedStudent}
              currentStudent={currentStudent}
            />

            <div className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2">
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-700">Pilih Juz</p>
                <Select value={selectedJuz} onValueChange={setSelectedJuz} disabled={!selectedStudent || isLoading}>
                  <SelectTrigger className="w-full bg-white">
                    <SelectValue placeholder="Pilih juz..." />
                  </SelectTrigger>
                  <SelectContent>
                    {JUZ_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        <div className="flex items-center justify-between gap-2 w-full">
                          <span>Juz {option}</span>
                          {completedJuzSet.has(option) && (
                            <Check className="h-4 w-4 text-emerald-600" />
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-3 gap-2 text-sm">
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-emerald-700">
                  <div className="text-xs uppercase tracking-wide">Tuntas</div>
                  <div className="text-lg font-semibold">{currentCounts.completed}</div>
                </div>
                <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-rose-700">
                  <div className="text-xs uppercase tracking-wide">Belum</div>
                  <div className="text-lg font-semibold">{currentCounts.remaining}</div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-700">
                  <div className="text-xs uppercase tracking-wide">Surah</div>
                  <div className="text-lg font-semibold">{rows.length}</div>
                </div>
              </div>
            </div>

            {currentStudent && (
              <div className="grid gap-3 rounded-xl border border-indigo-100 bg-indigo-50/50 p-4 text-sm sm:grid-cols-3">
                <div>
                  <div className="text-muted-foreground">Nama</div>
                  <div className="font-semibold text-slate-900">{currentStudent.name}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Kelas</div>
                  <div className="font-semibold text-slate-900">{currentStudent.class_level}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Juz Hafalan Saat Ini</div>
                  <div className="font-semibold text-slate-900">{currentStudent.current_hifz_in_juz || "-"}</div>
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm text-muted-foreground">
                {selectedJuz ? `Daftar surah untuk Juz ${selectedJuz}.` : "Pilih juz untuk memuat daftar surah."}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => setAllStatus("belum_tuntas")} disabled={!hasSelection || isLoading} className="cursor-pointer border-rose-200 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300">
                  Set Semua Belum Tuntas
                </Button>
                <Button variant="outline" onClick={() => setAllStatus("tuntas")} disabled={!hasSelection || isLoading} className="cursor-pointer border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300">
                  Set Semua Tuntas
                </Button>
                <Button onClick={handleSave} disabled={!canSave || isSaving} className="cursor-pointer bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700">
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
                </Button>
              </div>
            </div>

            {statusMessage && (
              <div className="rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-800">
                {statusMessage}
              </div>
            )}

            {hasSelection ? (
              <div className="rounded-xl border bg-white shadow-sm">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-20">Status</TableHead>
                      <TableHead className="min-w-56">Surah</TableHead>
                      <TableHead className="min-w-24">Ayat</TableHead>
                      <TableHead className="min-w-24">K</TableHead>
                      <TableHead className="min-w-24">F</TableHead>
                      <TableHead className="min-w-24">T</TableHead>
                      <TableHead className="min-w-32">Catatan</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row, index) => {
                      const isTuntas = row.completionStatus === "tuntas"

                      return (
                        <TableRow key={row.rowKey}>
                          <TableCell className="align-top">
                            <div className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-medium ${statusChipClass(row.completionStatus)}`}>
                              {isTuntas ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Circle className="h-3.5 w-3.5" />}
                              {isTuntas ? "Tuntas" : "Belum"}
                            </div>
                          </TableCell>
                          <TableCell className="align-top">
                            <div className="space-y-2">
                              <div className="text-sm font-semibold text-slate-900">
                                {index + 1}. {row.surah}
                              </div>
                              <Select value={row.completionStatus} onValueChange={(value) => updateRow(row.rowKey, "completionStatus", value)}>
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="tuntas">Tuntas</SelectItem>
                                  <SelectItem value="belum_tuntas">Belum tuntas</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </TableCell>
                          <TableCell className="align-top">
                            <Input
                              type="number"
                              min={1}
                              value={row.ayat}
                              onChange={(event) => updateRow(row.rowKey, "ayat", event.target.value)}
                              placeholder="Ayat"
                            />
                          </TableCell>
                          <TableCell className="align-top">
                            <Input
                              type="number"
                              min={1}
                              max={50}
                              value={row.kelancaran}
                              onChange={(event) => updateRow(row.rowKey, "kelancaran", event.target.value)}
                              placeholder="K"
                            />
                          </TableCell>
                          <TableCell className="align-top">
                            <Input
                              type="number"
                              min={1}
                              max={15}
                              value={row.fashohah}
                              onChange={(event) => updateRow(row.rowKey, "fashohah", event.target.value)}
                              placeholder="F"
                            />
                          </TableCell>
                          <TableCell className="align-top">
                            <Input
                              type="number"
                              min={1}
                              max={15}
                              value={row.tajwid}
                              onChange={(event) => updateRow(row.rowKey, "tajwid", event.target.value)}
                              placeholder="T"
                            />
                          </TableCell>
                          <TableCell className="align-top">
                            <Input
                              value={row.notes}
                              onChange={(event) => updateRow(row.rowKey, "notes", event.target.value)}
                              placeholder="Opsional"
                            />
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center text-sm text-muted-foreground">
                Pilih siswa lalu pilih juz untuk menampilkan semua surah di juz tersebut.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}