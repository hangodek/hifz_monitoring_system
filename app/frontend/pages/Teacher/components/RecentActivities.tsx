import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen } from "lucide-react"
import { AudioPlayer } from "@/components/AudioPlayer"

interface Student {
  id: string
  name: string
  class_level: string
  current_hifz_in_juz: string
}

interface ActivityType {
  value: string
  label: string
  icon: any
  color: string
}

interface Activity {
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
  audio_url?: string | null
  student: {
    id: string
    name: string
  }
}

interface RecentActivitiesProps {
  currentStudent: Student | undefined
  activityTypes: ActivityType[]
  recentActivities: Activity[]
}

const gradeLabels = {
  excellent: "Cemerlang",
  good: "Baik", 
  fair: "Sederhana",
  needs_improvement: "Perlu Diperbaiki"
}

const activityLabels = {
  memorization: "Hafalan",
  revision: "Murajaah"
}

export function RecentActivities({ currentStudent, activityTypes, recentActivities }: RecentActivitiesProps) {
  if (!currentStudent) {
    return null
  }

  // Filter activities for the current student and get the most recent 5
  const studentActivities = recentActivities
    .filter(activity => String(activity.student.id) === String(currentStudent.id))
    .slice(0, 5)

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return "Baru sahaja"
    if (diffInHours < 24) return `${diffInHours} jam yang lalu`
    
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays} hari yang lalu`
    
    return date.toLocaleDateString()
  }

  return (
    <Card className="border-gray-200/60 shadow-lg">
      <CardHeader>
        <CardTitle>Aktiviti Terkini</CardTitle>
        <CardDescription>{currentStudent.name}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {studentActivities.length === 0 ? (
          <p className="text-sm text-muted-foreground">Tiada aktiviti terkini dijumpai.</p>
        ) : (
          studentActivities.map((activity) => {
            const activityType = activityTypes.find((t) => t.value === activity.activity_type)
            
            // Build activity description
            let activityDescription = `${activityLabels[activity.activity_type as keyof typeof activityLabels]} ${activity.surah_from}${activity.surah_from !== activity.surah_to ? ` - ${activity.surah_to}` : ''}`
            
            // Add juz information for revision activities
            if (activity.activity_type === 'revision' && activity.juz_from && activity.juz_to) {
              activityDescription += `, Juz ${activity.juz_from}${activity.juz_from !== activity.juz_to ? `-${activity.juz_to}` : ''}`
            } else if (activity.juz) {
              activityDescription += `, Juz ${activity.juz}`
            }
            
            activityDescription += `, muka surat ${activity.page_from}-${activity.page_to}`
            
            return (
              <div key={activity.id} className="flex items-start space-x-2 sm:space-x-3">
                <div
                  className={`flex h-6 w-6 sm:h-8 sm:w-8 items-center justify-center rounded-full text-white text-xs flex-shrink-0 ${activityType?.color || 'bg-gray-500'}`}
                >
                  {activityType ? (
                    <activityType.icon className="h-3 w-3 sm:h-4 sm:w-4" />
                  ) : (
                    <BookOpen className="h-3 w-3 sm:h-4 sm:w-4" />
                  )}
                </div>
                <div className="flex-1 space-y-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium line-clamp-2" title={activityDescription}>
                    {activityDescription}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {gradeLabels[activity.activity_grade as keyof typeof gradeLabels]} • {formatTimeAgo(activity.created_at)}
                  </p>
                  {activity.notes && (
                    <p className="text-xs text-muted-foreground italic line-clamp-2" title={activity.notes}>
                      {activity.notes}
                    </p>
                  )}
                  {activity.audio_url && (
                    <div className="mt-1">
                      <AudioPlayer 
                        audioUrl={activity.audio_url} 
                        size="sm"
                        className="max-w-full"
                      />
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}
