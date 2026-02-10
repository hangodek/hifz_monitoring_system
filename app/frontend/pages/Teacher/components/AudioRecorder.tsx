import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  Mic, 
  Play, 
  Pause, 
  Square, 
  Trash2,
  Upload
} from "lucide-react"

interface AudioRecorderProps {
  onAudioRecorded: (audioBlob: Blob | null) => void
  disabled?: boolean
}

export function AudioRecorder({ onAudioRecorded, disabled = false }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [hasRecording, setHasRecording] = useState(false)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const intervalRef = useRef<number | null>(null)
  const chunksRef = useRef<Blob[]>([])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl)
      }
    }
  }, [audioUrl])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      })
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      })
      
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm;codecs=opus' })
        setHasRecording(true)
        
        // Create URL for playback
        if (audioUrl) {
          URL.revokeObjectURL(audioUrl)
        }
        const url = URL.createObjectURL(blob)
        setAudioUrl(url)
        
        // Notify parent component
        onAudioRecorded(blob)
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start(100) // Collect data every 100ms
      setIsRecording(true)
      setRecordingTime(0)

      // Start timing
      intervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)

    } catch (error) {
      console.error('Error starting recording:', error)
      alert('Tidak dapat mengakses mikrofon. Sila semak kebenaran.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }

  const playRecording = () => {
    if (audioUrl && audioRef.current) {
      audioRef.current.play()
      setIsPlaying(true)
    }
  }

  const pauseRecording = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      setIsPlaying(false)
    }
  }

  const deleteRecording = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl)
    }
    setAudioUrl(null)
    setHasRecording(false)
    setRecordingTime(0)
    setIsPlaying(false)
    onAudioRecorded(null)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <Card className="border-0 shadow-md bg-gradient-to-br from-white to-rose-50/30">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-rose-500/20 flex items-center justify-center">
              <Mic className="h-4 w-4 text-rose-600" />
            </div>
            <span className="text-sm font-medium text-rose-900">Rekaman Audio (Opsional)</span>
          </div>
          {hasRecording && (
            <Badge variant="secondary" className="text-xs">
              <Upload className="h-3 w-3 mr-1" />
              Siap untuk diunggah
            </Badge>
          )}
        </div>

        {!hasRecording ? (
          <div className="space-y-3">
            <div className="flex items-center justify-center">
              <Button
                onClick={isRecording ? stopRecording : startRecording}
                disabled={disabled}
                variant={isRecording ? "destructive" : "default"}
                size="lg"
                className={`cursor-pointer ${!isRecording ? 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700' : ''}`}
              >
                {isRecording ? (
                  <>
                    <Square className="h-4 w-4 mr-2" />
                    Hentikan Rekaman
                  </>
                ) : (
                  <>
                    <Mic className="h-4 w-4 mr-2" />
                    Mulai Rekam
                  </>
                )}
              </Button>
            </div>
            
            {isRecording && (
              <div className="space-y-2">
                <div className="flex items-center justify-center">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-muted-foreground">
                      Merekam... {formatTime(recordingTime)}
                    </span>
                  </div>
                </div>
                <Progress value={(recordingTime % 60) * (100/60)} className="h-2" />
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Rekaman: {formatTime(recordingTime)}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  onClick={isPlaying ? pauseRecording : playRecording}
                  variant="outline"
                  size="sm"
                  className="cursor-pointer"
                >
                  {isPlaying ? (
                    <Pause className="h-3 w-3" />
                  ) : (
                    <Play className="h-3 w-3" />
                  )}
                </Button>
                <Button
                  onClick={deleteRecording}
                  variant="outline"
                  size="sm"
                  className="cursor-pointer text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
            
            {audioUrl && (
              <audio
                ref={audioRef}
                src={audioUrl}
                onEnded={() => setIsPlaying(false)}
                className="hidden"
              />
            )}
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          Rekam bacaan siswa untuk penilaian kualitas dan referensi masa depan.
        </p>
      </CardContent>
    </Card>
  )
}
