import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { AudioRecorder } from "./AudioRecorder"
import { Check, Plus, Save } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { JUZ_OPTIONS, JUZ_SURAH_MAP } from "@/lib/quran"

interface ActivityType {
  value: string
  label: string
  color: string
}

interface ActivityDetails {
  surah: string
  ayatFrom: string
  ayatTo: string
  notes: string
  kelancaran: string // K (1-50)
  fashohah: string  // F (1-15)
  tajwid: string    // T (1-15)
  completionStatus: string
}

interface ActivityFormProps {
  activityType: string
  setActivityType: (value: string) => void
  activityTypes: ActivityType[]
  surahList: string[]
  activityDetails: ActivityDetails
  setActivityDetails: (details: ActivityDetails | ((prev: ActivityDetails) => ActivityDetails)) => void
  handleSaveActivity: () => void
  selectedStudent: string
  currentStudent?: {
    id: string
    name: string
    class_level: string
    current_hifz_in_juz: string
    current_hifz_in_pages: string
    current_hifz_in_surah: string
  }
}

interface StudentActivity {
  surah: string
  juz: number | null
  ayat_from: number | null
  ayat_to: number | null
  completion_status?: string | null
  created_at: string
}

export function ActivityForm({
  activityType,
  setActivityType,
  activityTypes,
  activityDetails,
  setActivityDetails,
  handleSaveActivity,
  selectedStudent,
  currentStudent,
}: ActivityFormProps) {
  
  // Audio recording state
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [selectedJuz, setSelectedJuz] = useState<string>("");
  const [studentActivities, setStudentActivities] = useState<StudentActivity[]>([])

  const filteredSurahList = useMemo(() => {
    if (!selectedJuz) return []
    return JUZ_SURAH_MAP[selectedJuz] || []
  }, [selectedJuz])

  const completedSurahs = useMemo(() => {
    const completed = new Set<string>()
    const activitiesForJuz = studentActivities.filter((activity) => String(activity.juz ?? "") === selectedJuz)
    activitiesForJuz.forEach((activity) => {
      if (activity.surah && activity.completion_status === "tuntas") completed.add(activity.surah)
    })
    return completed
  }, [studentActivities, selectedJuz])

  useEffect(() => {
    if (!currentStudent?.id) {
      setStudentActivities([])
      return
    }

    const fetchStudentActivities = async () => {
      try {
        const response = await fetch(`/teachers/student_activities?student_id=${currentStudent.id}`)
        const data = await response.json()
        setStudentActivities(data.activities || [])
      } catch (error) {
        console.error('Failed to load student activities:', error)
        setStudentActivities([])
      }
    }

    fetchStudentActivities()
  }, [currentStudent?.id])

  useEffect(() => {
    if (!selectedJuz) {
      return
    }

    const defaultSurah = JUZ_SURAH_MAP[selectedJuz]?.[0] || ""
    const defaultStatus = completedSurahs.has(defaultSurah) ? "tuntas" : "belum_tuntas"
    setActivityDetails((prev) => ({ ...prev, surah: defaultSurah, completionStatus: defaultStatus }))
  }, [completedSurahs, selectedJuz, setActivityDetails])

  const normalizeScoreInput = (value: string, min: number, max: number) => {
    if (value === "") return ""
    const parsed = parseInt(value)
    if (Number.isNaN(parsed)) return ""
    return String(Math.min(Math.max(parsed, min), max))
  }
  
  const handleSubmit = async () => {
    if (!selectedStudent || !selectedJuz || !activityType || !activityDetails.surah || !activityDetails.ayatFrom || !activityDetails.ayatTo) {
      alert('Silakan lengkapi semua kolom yang diperlukan');
      return;
    }

    const ayatFrom = parseInt(activityDetails.ayatFrom)
    const ayatTo = parseInt(activityDetails.ayatTo)
    if (Number.isNaN(ayatFrom) || Number.isNaN(ayatTo) || ayatFrom < 1 || ayatTo < ayatFrom) {
      alert('Rentang ayat tidak valid. Pastikan Ayat Hingga lebih besar atau sama dengan Ayat Dari.');
      return;
    }

    const kelancaran = parseInt(activityDetails.kelancaran) || 25
    const fashohah = parseInt(activityDetails.fashohah) || 8
    const tajwid = parseInt(activityDetails.tajwid) || 8

    if (kelancaran < 1 || kelancaran > 50) {
      alert('Nilai K (Kelancaran) harus di antara 1 sampai 50.');
      return;
    }
    if (fashohah < 1 || fashohah > 15) {
      alert('Nilai F (Fashohah) harus di antara 1 sampai 15.');
      return;
    }
    if (tajwid < 1 || tajwid > 15) {
      alert('Nilai T (Tajwid) harus di antara 1 sampai 15.');
      return;
    }

    const activityData = {
      activity_type: activityType,
      juz: parseInt(selectedJuz),
      surah: activityDetails.surah,
      ayat_from: ayatFrom,
      ayat_to: ayatTo,
      notes: activityDetails.notes || '',
      kelancaran: kelancaran,
      fashohah: fashohah,
      tajwid: tajwid,
      completion_status: activityDetails.completionStatus,
    };

    // Create FormData if audio is present, otherwise use regular data
    let submitData;
    if (audioBlob) {
      const formData = new FormData();
      
      // Add CSRF token if available
      const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
      if (csrfToken) {
        formData.append('authenticity_token', csrfToken);
      }
      
      // Add all activity fields
      Object.entries(activityData).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          formData.append(`activity[${key}]`, value.toString());
        }
      });
      
      // Add audio file
      formData.append('activity[audio]', audioBlob, 'recording.webm');
      submitData = formData;
    } else {
      submitData = { activity: activityData };
    }

    try {
      console.log('Submitting activity:', activityData);
      
      const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
      const response = await fetch(`/students/${selectedStudent}/activities`, {
        method: 'POST',
        headers: {
          ...(!(submitData instanceof FormData) && { 'Content-Type': 'application/json' }),
          ...(csrfToken && { 'X-CSRF-Token': csrfToken })
        },
        body: submitData instanceof FormData ? submitData : JSON.stringify(submitData)
      });

      const raw = await response.text();
      let data: { message?: string } = {}
      try {
        data = raw ? JSON.parse(raw) : {}
      } catch {
        data = { message: "Respons server tidak valid. Coba refresh halaman." }
      }
      
      if (!response.ok) {
        const errorMessage = data.message || 'Gagal menyimpan aktivitas. Silakan coba lagi.';
        console.error('Failed to save activity:', errorMessage);
        alert(errorMessage);
        return;
      }

      console.log('Activity saved successfully:', data);
      
      // Reset form
      setActivityDetails({
        surah: "",
        ayatFrom: "",
        ayatTo: "",
        notes: "",
        kelancaran: "",
        fashohah: "",
        tajwid: "",
        completionStatus: "belum_tuntas",
      });
      setSelectedJuz("");
      setActivityType("");
      setAudioBlob(null);
      
      // Call the original handler for any additional local actions
      handleSaveActivity();
      
      alert('Aktivitas berhasil disimpan!');
    } catch (error) {
      console.error('Error submitting activity:', error);
      alert('Gagal menyimpan aktivitas. Silakan coba lagi.');
    }
  };

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
          <Label>Jenis Aktivitas</Label>
          <Select value={activityType} onValueChange={setActivityType}>
            <SelectTrigger className="border-indigo-200 hover:border-indigo-300 cursor-pointer">
              <SelectValue placeholder="Pilih jenis aktivitas..." />
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

        <div className="space-y-2">
          <Label className="text-xs sm:text-sm">Juz <span className="text-red-500">*</span></Label>
          <Select
            value={selectedJuz}
            onValueChange={(value) => {
              setSelectedJuz(value)
              setActivityDetails((prev) => ({
                ...prev,
                surah: JUZ_SURAH_MAP[value]?.[0] || "",
              }))
            }}
          >
            <SelectTrigger className="border-gray-200/60 cursor-pointer">
              <SelectValue placeholder="Pilih juz..." />
            </SelectTrigger>
            <SelectContent className="border-gray-200/60 max-h-[280px]">
              {JUZ_OPTIONS.map((juz) => (
                <SelectItem key={juz} value={juz} className="cursor-pointer">
                  Juz {juz}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {activityType && (
          <>
            {selectedJuz && (
              <div className="space-y-2">
                <Label className="text-xs sm:text-sm">Surah <span className="text-red-500">*</span></Label>
                <Select
                  value={activityDetails.surah}
                  onValueChange={(value) => {
                    const nextStatus = completedSurahs.has(value) ? "tuntas" : "belum_tuntas"
                    setActivityDetails((prev) => ({ ...prev, surah: value, completionStatus: nextStatus }))
                  }}
                >
                  <SelectTrigger className="border-gray-200/60 cursor-pointer">
                    <SelectValue placeholder="Pilih surah..." />
                  </SelectTrigger>
                  <SelectContent className="border-gray-200/60">
                    {filteredSurahList.map((surah, index) => {
                      const isCompleted = completedSurahs.has(surah)
                      return (
                        <SelectItem key={`${selectedJuz}-${surah}`} value={surah} className="cursor-pointer">
                          <div className="flex items-center gap-2">
                            <span>{index + 1}. {surah}</span>
                            {isCompleted && <Check className="h-4 w-4 text-emerald-600" />}
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>
            )}

            {activityDetails.surah && selectedJuz && (
              <div className={[
                "rounded-2xl border p-4 shadow-[0_0_0_1px_rgba(148,163,184,0.12),0_10px_30px_-18px_rgba(15,23,42,0.35)] space-y-4 transition-all",
                activityDetails.completionStatus === "tuntas"
                  ? "border-emerald-400/80 bg-white/95 ring-1 ring-emerald-300/50"
                  : "border-rose-400/80 bg-white/95 ring-1 ring-rose-300/50"
              ].join(" ")}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{activityDetails.surah}</p>
                  </div>
                  <div className={[
                    "rounded-full px-3 py-1 text-xs font-semibold border",
                    activityDetails.completionStatus === "tuntas"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-rose-200 bg-rose-50 text-rose-700"
                  ].join(" ")}
                  >
                    {activityDetails.completionStatus === "tuntas" ? "Tuntas" : "Belum tuntas"}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs sm:text-sm">Status <span className="text-red-500">*</span></Label>
                  <Select
                    value={activityDetails.completionStatus}
                    onValueChange={(value) => setActivityDetails((prev) => ({ ...prev, completionStatus: value }))}
                  >
                    <SelectTrigger className={[
                      "cursor-pointer border",
                      activityDetails.completionStatus === "tuntas"
                        ? "border-emerald-400 text-emerald-700 shadow-[0_0_0_1px_rgba(16,185,129,0.18),0_0_24px_rgba(16,185,129,0.22)]"
                        : "border-rose-400 text-rose-700 shadow-[0_0_0_1px_rgba(244,63,94,0.18),0_0_24px_rgba(244,63,94,0.22)]"
                    ].join(" ")}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-gray-200/60">
                      <SelectItem value="tuntas" className="cursor-pointer">Tuntas</SelectItem>
                      <SelectItem value="belum_tuntas" className="cursor-pointer">Belum tuntas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label className="text-xs sm:text-sm">Ayat Dari <span className="text-red-500">*</span></Label>
                    <Input
                      type="number"
                      placeholder="1"
                      value={activityDetails.ayatFrom}
                      onChange={(e) => setActivityDetails((prev) => ({ ...prev, ayatFrom: e.target.value }))}
                      className="border-gray-200/60 text-sm"
                      min="1"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs sm:text-sm">Ayat Hingga <span className="text-red-500">*</span></Label>
                    <Input
                      type="number"
                      placeholder="7"
                      value={activityDetails.ayatTo}
                      onChange={(e) => setActivityDetails((prev) => ({ ...prev, ayatTo: e.target.value }))}
                      className="border-gray-200/60 text-sm"
                      min="1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs sm:text-sm">Penilaian</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <Label htmlFor="kelancaran" className="text-[11px] font-medium">K (1-50)</Label>
                      <Input
                        id="kelancaran"
                        type="number"
                        placeholder="1-50"
                        value={activityDetails.kelancaran}
                        onChange={(e) => setActivityDetails((prev) => ({ ...prev, kelancaran: normalizeScoreInput(e.target.value, 1, 50) }))}
                        className="border-gray-200/60 text-sm"
                        min="1" max="50"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="fashohah" className="text-[11px] font-medium">F (1-15)</Label>
                      <Input
                        id="fashohah"
                        type="number"
                        placeholder="1-15"
                        value={activityDetails.fashohah}
                        onChange={(e) => setActivityDetails((prev) => ({ ...prev, fashohah: normalizeScoreInput(e.target.value, 1, 15) }))}
                        className="border-gray-200/60 text-sm"
                        min="1" max="15"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="tajwid" className="text-[11px] font-medium">T (1-15)</Label>
                      <Input
                        id="tajwid"
                        type="number"
                        placeholder="1-15"
                        value={activityDetails.tajwid}
                        onChange={(e) => setActivityDetails((prev) => ({ ...prev, tajwid: normalizeScoreInput(e.target.value, 1, 15) }))}
                        className="border-gray-200/60 text-sm"
                        min="1" max="15"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Catatan</Label>
              <Textarea
                placeholder="Tambah catatan mengenai aktivitas ini..."
                value={activityDetails.notes}
                onChange={(e) => setActivityDetails((prev) => ({ ...prev, notes: e.target.value }))}
                className="border-gray-200/60"
              />
            </div>

            <AudioRecorder
              onAudioRecorded={setAudioBlob}
              disabled={!selectedStudent || !activityType}
            />

            <Button 
              onClick={handleSubmit} 
              className="w-full cursor-pointer text-sm sm:text-base bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              disabled={
                !selectedStudent || 
                !activityType || 
                !selectedJuz ||
                !activityDetails.surah || 
                !activityDetails.ayatFrom || 
                !activityDetails.ayatTo
              }
            >
              <Save className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Simpan Aktivitas</span>
              <span className="sm:hidden">Simpan</span>
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  )
}
