import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Save } from "lucide-react"
import { router } from "@inertiajs/react"
import { AudioRecorder } from "./AudioRecorder"
import { useState } from "react"

interface ActivityType {
  value: string
  label: string
  color: string
}

interface ActivityDetails {
  surahFrom: string
  surahTo: string
  pageFrom: string
  pageTo: string
  juz: string
  notes: string
  evaluation: string
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

// Map frontend evaluation values to backend enum values
const evaluationMapping = {
  excellent: 'excellent',
  good: 'good', 
  fair: 'fair',
  needs_improvement: 'needs_improvement'
}

export function ActivityForm({
  activityType,
  setActivityType,
  activityTypes,
  surahList,
  activityDetails,
  setActivityDetails,
  handleSaveActivity,
  selectedStudent,
  currentStudent,
}: ActivityFormProps) {
  
  // Audio recording state
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  
  const calculateNewProgress = () => {
    if (!activityDetails.juz || !activityDetails.pageTo) return null;
    
    const juz = parseInt(activityDetails.juz);
    const pageTo = parseInt(activityDetails.pageTo);
    
    // For memorization activities, the new progress is simply the page they completed up to
    return { newJuz: juz, newPages: pageTo };
  };

  const validateMemorizationProgress = () => {
    if (activityType !== 'memorization' || !currentStudent) return true;
    
    const newProgress = calculateNewProgress();
    if (!newProgress) return true;
    
    const currentJuz = parseInt(currentStudent.current_hifz_in_juz) || 0;
    const currentPages = parseInt(currentStudent.current_hifz_in_pages) || 0;
    const { newJuz, newPages } = newProgress;
    
    // New progress must be greater than current progress
    if (newJuz < currentJuz || (newJuz === currentJuz && newPages <= currentPages)) {
      return false;
    }
    
    return true;
  };
  
  const handleSubmit = () => {
    if (!selectedStudent || !activityType || !activityDetails.surahFrom || !activityDetails.surahTo || !activityDetails.pageFrom || !activityDetails.pageTo) {
      alert('Sila lengkapkan semua ruangan yang diperlukan');
      return;
    }

    if (!validateMemorizationProgress()) {
      alert('Kemajuan hafalan baharu mestilah lebih tinggi daripada kemajuan semasa');
      return;
    }

    const newProgress = calculateNewProgress();

    const activityData = {
      activity_type: activityType,
      activity_grade: evaluationMapping[activityDetails.evaluation as keyof typeof evaluationMapping] || 'excellent',
      surah_from: activityDetails.surahFrom,
      surah_to: activityDetails.surahTo,
      page_from: parseInt(activityDetails.pageFrom),
      page_to: parseInt(activityDetails.pageTo),
      juz: activityDetails.juz ? parseInt(activityDetails.juz) : null,
      notes: activityDetails.notes || '',
      new_hifz_juz: activityType === 'memorization' && newProgress ? newProgress.newJuz : null,
      new_hifz_pages: activityType === 'memorization' && newProgress ? newProgress.newPages : null,
      new_hifz_surah: activityType === 'memorization' ? activityDetails.surahTo : null
    };

    // Create FormData if audio is present, otherwise use regular data
    let submitData;
    if (audioBlob) {
      const formData = new FormData();
      
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

    router.post(`/students/${selectedStudent}/activities`, submitData, {
      onSuccess: () => {
        // Reset form
        setActivityDetails({
          surahFrom: "",
          surahTo: "",
          pageFrom: "",
          pageTo: "",
          juz: "",
          notes: "",
          evaluation: "",
        });
        setActivityType("");
        setAudioBlob(null);
        // Also call the original handler for any additional local actions
        handleSaveActivity();
      },
      onError: (errors) => {
        console.error('Failed to save activity:', errors);
        alert('Gagal menyimpan aktiviti. Sila cuba lagi.');
      }
    });
  };

  return (
    <Card className="border-gray-200/60 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Tambah Aktiviti
        </CardTitle>
        <CardDescription>Rekod aktiviti pelajar</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Jenis Aktiviti</Label>
          <Select value={activityType} onValueChange={setActivityType}>
            <SelectTrigger className="border-gray-200/60 cursor-pointer">
              <SelectValue placeholder="Pilih jenis aktiviti..." />
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

        {activityType && (
          <>
            {(activityType === "memorization" ||
              activityType === "revision" ||
              activityType === "evaluation") && (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label className="text-xs sm:text-sm">Surah Dari <span className="text-red-500">*</span></Label>
                    <Select
                      value={activityDetails.surahFrom}
                      onValueChange={(value) => setActivityDetails((prev) => ({ ...prev, surahFrom: value }))}
                    >
                      <SelectTrigger className="border-gray-200/60 cursor-pointer">
                        <SelectValue placeholder="Pilih surah..." />
                      </SelectTrigger>
                      <SelectContent className="border-gray-200/60">
                        {surahList.map((surah, index) => (
                          <SelectItem key={index} value={surah} className="cursor-pointer">
                            {index + 1}. {surah}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs sm:text-sm">Surah Hingga <span className="text-red-500">*</span></Label>
                    <Select
                      value={activityDetails.surahTo}
                      onValueChange={(value) => setActivityDetails((prev) => ({ ...prev, surahTo: value }))}
                    >
                      <SelectTrigger className="border-gray-200/60 cursor-pointer">
                        <SelectValue placeholder="Pilih surah..." />
                      </SelectTrigger>
                      <SelectContent className="border-gray-200/60">
                        {surahList.map((surah, index) => (
                          <SelectItem key={index} value={surah} className="cursor-pointer">
                            {index + 1}. {surah}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label className="text-xs sm:text-sm">Muka Surat Dari <span className="text-red-500">*</span></Label>
                    <Input
                      type="number"
                      placeholder="1"
                      value={activityDetails.pageFrom}
                      onChange={(e) => setActivityDetails((prev) => ({ ...prev, pageFrom: e.target.value }))}
                      className="border-gray-200/60 text-sm"
                      min="1"
                      max="604"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs sm:text-sm">Muka Surat Hingga <span className="text-red-500">*</span></Label>
                    <Input
                      type="number"
                      placeholder="20"
                      value={activityDetails.pageTo}
                      onChange={(e) => setActivityDetails((prev) => ({ ...prev, pageTo: e.target.value }))}
                      className="border-gray-200/60 text-sm"
                      min="1"
                      max="604"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Juz {activityType === "memorization" && <span className="text-red-500">*</span>}</Label>
                  <Select
                    value={activityDetails.juz}
                    onValueChange={(value) => setActivityDetails((prev) => ({ ...prev, juz: value }))}
                  >
                    <SelectTrigger className="border-gray-200/60">
                      <SelectValue placeholder="Pilih juz..." />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 30 }, (_, i) => (
                        <SelectItem key={i + 1} value={(i + 1).toString()} className="cursor-pointer">
                          Juz {i + 1}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {activityType === "memorization" && currentStudent && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Kemajuan Semasa: {currentStudent.current_hifz_in_surah}, Juz {currentStudent.current_hifz_in_juz}, {currentStudent.current_hifz_in_pages} muka surat
                    </Label>
                    {activityDetails.juz && activityDetails.pageTo && (() => {
                      const newProgress = calculateNewProgress();
                      return newProgress ? (
                        <div className="text-sm text-muted-foreground">
                          Kemajuan baharu: {activityDetails.surahTo}, Juz {newProgress.newJuz}, {newProgress.newPages} muka surat
                        </div>
                      ) : null;
                    })()}
                  </div>
                )}
              </>
            )}

            <div className="space-y-2">
              <Label>Catatan</Label>
              <Textarea
                placeholder="Tambah catatan mengenai aktiviti ini..."
                value={activityDetails.notes}
                onChange={(e) => setActivityDetails((prev) => ({ ...prev, notes: e.target.value }))}
                className="border-gray-200/60"
              />
            </div>

            {/* Audio Recording Component */}
            <AudioRecorder
              onAudioRecorded={setAudioBlob}
              disabled={!selectedStudent || !activityType}
            />

            <div className="space-y-2">
              <Label>Penilaian <span className="text-red-500">*</span></Label>
              <Select
                value={activityDetails.evaluation}
                onValueChange={(value) => setActivityDetails((prev) => ({ ...prev, evaluation: value }))}
              >
                <SelectTrigger className="border-gray-200/60 cursor-pointer">
                  <SelectValue placeholder="Pilih penilaian..." />
                </SelectTrigger>
                <SelectContent className="border-gray-200/60">
                  <SelectItem value="excellent" className="cursor-pointer">Cemerlang</SelectItem>
                  <SelectItem value="good" className="cursor-pointer">Baik</SelectItem>
                  <SelectItem value="fair" className="cursor-pointer">Sederhana</SelectItem>
                  <SelectItem value="needs_improvement" className="cursor-pointer">Perlu Diperbaiki</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={handleSubmit} 
              className="w-full cursor-pointer text-sm sm:text-base"
              disabled={
                !selectedStudent || 
                !activityType || 
                !activityDetails.surahFrom || 
                !activityDetails.surahTo || 
                !activityDetails.pageFrom || 
                !activityDetails.pageTo || 
                !activityDetails.evaluation ||
                (activityType === 'memorization' && !activityDetails.juz) ||
                !validateMemorizationProgress()
              }
            >
              <Save className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Simpan Aktiviti</span>
              <span className="sm:hidden">Simpan</span>
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  )
}
