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
  surah: string
  ayatFrom: string
  ayatTo: string
  notes: string
  kelancaran: string // K (1-50)
  fashohah: string  // F (1-15)
  tajwid: string    // T (1-5)
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
    // For memorization, use juzTo and pageTo
    if (activityType === 'memorization' && activityDetails.juzTo && activityDetails.pageTo) {
      const juzTo = parseInt(activityDetails.juzTo);
      const pageTo = parseInt(activityDetails.pageTo);
      return { newJuz: juzTo, newPages: pageTo };
    }
    
    return null;
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
    if (!selectedStudent || !activityType || !activityDetails.surah || !activityDetails.ayatFrom || !activityDetails.ayatTo) {
      alert('Silakan lengkapi semua kolom yang diperlukan');
      return;
    }

    const activityData = {
      activity_type: activityType,
      surah: activityDetails.surah,
      ayat_from: parseInt(activityDetails.ayatFrom),
      ayat_to: parseInt(activityDetails.ayatTo),
      notes: activityDetails.notes || '',
      kelancaran: parseInt(activityDetails.kelancaran) || null,
      fashohah: parseInt(activityDetails.fashohah) || null,
      tajwid: parseInt(activityDetails.tajwid) || null,
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
          surah: "",
          ayatFrom: "",
          ayatTo: "",
          notes: "",
          kelancaran: "",
          fashohah: "",
          tajwid: "",
        });
        setActivityType("");
        setAudioBlob(null);
        // Also call the original handler for any additional local actions
        handleSaveActivity();
      },
      onError: (errors) => {
        console.error('Failed to save activity:', errors);
        alert('Gagal menyimpan aktivitas. Silakan coba lagi.');
      }
    });
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

        {activityType && (
          <>
            {(activityType === "memorization" ||
              activityType === "revision" ||
              activityType === "evaluation") && (
              <>
                <div className="space-y-2">
                  <Label className="text-xs sm:text-sm">Surah <span className="text-red-500">*</span></Label>
                  <Select
                    value={activityDetails.surah}
                    onValueChange={(value) => setActivityDetails((prev) => ({ ...prev, surah: value }))}
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
              </>
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

            {/* Audio Recording Component */}
            <AudioRecorder
              onAudioRecorded={setAudioBlob}
              disabled={!selectedStudent || !activityType}
            />

            <div className="space-y-2">
              <Label>Penilaian</Label>
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="kelancaran" className="text-xs font-medium">K (1-50)</Label>
                  <Input
                    id="kelancaran"
                    type="number"
                    placeholder="1-50"
                    value={activityDetails.kelancaran}
                    onChange={(e) => setActivityDetails((prev) => ({ ...prev, kelancaran: e.target.value }))}
                    className="border-gray-200/60 text-sm"
                    min="1" max="50"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="fashohah" className="text-xs font-medium">F (1-15)</Label>
                  <Input
                    id="fashohah"
                    type="number"
                    placeholder="1-15"
                    value={activityDetails.fashohah}
                    onChange={(e) => setActivityDetails((prev) => ({ ...prev, fashohah: e.target.value }))}
                    className="border-gray-200/60 text-sm"
                    min="1" max="15"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="tajwid" className="text-xs font-medium">T (1-5)</Label>
                  <Input
                    id="tajwid"
                    type="number"
                    placeholder="1-5"
                    value={activityDetails.tajwid}
                    onChange={(e) => setActivityDetails((prev) => ({ ...prev, tajwid: e.target.value }))}
                    className="border-gray-200/60 text-sm"
                    min="1" max="5"
                  />
                </div>
              </div>
            </div>

            <Button 
              onClick={handleSubmit} 
              className="w-full cursor-pointer text-sm sm:text-base bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              disabled={
                !selectedStudent || 
                !activityType || 
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
