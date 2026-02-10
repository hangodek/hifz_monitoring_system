import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  BookOpen,
  Clock,
  Target,
  Star,
  Loader2,
} from "lucide-react"
import { AudioPlayer } from "@/components/AudioPlayer"
import { useState } from "react"
import axios from "axios"
import { Link } from "@inertiajs/react"

interface RecentActivity {
  id: number
  student_id: string
  student: string
  activity: string
  time: string
  type: string
  audio_url?: string | null
}

interface DetailedActivity {
  id: number
  student_id: string
  student: string
  activity: string
  time: string
  type: string
  grade: string
  surah_from: string
  surah_to: string
  page_from: number
  page_to: number
  juz: number
  juz_from?: number | null
  juz_to?: number | null
  notes?: string
  audio_url?: string | null
}

interface RecentActivitiesProps {
  activities: RecentActivity[]
  totalActivitiesCount: number
}

export function RecentActivities({ activities, totalActivitiesCount }: RecentActivitiesProps) {
  const [allActivities, setAllActivities] = useState<DetailedActivity[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [isOpen, setIsOpen] = useState(false)

  const loadActivities = async (page: number = 1) => {
    setIsLoading(true)
    try {
      const response = await axios.get('/dashboard/activities', {
        params: { page, per_page: 50 }
      })
      
      if (page === 1) {
        setAllActivities(response.data.activities)
      } else {
        setAllActivities(prev => [...prev, ...response.data.activities])
      }
      
      setCurrentPage(response.data.current_page)
      setTotalPages(response.data.total_pages)
    } catch (error) {
      console.error('Failed to load activities:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (open && allActivities.length === 0) {
      loadActivities(1)
    }
  }

  const handleLoadMore = () => {
    if (currentPage < totalPages) {
      loadActivities(currentPage + 1)
    }
  }
  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-slate-50/30 hover:shadow-xl transition-shadow duration-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-slate-800">
              <div className="h-10 w-10 rounded-full bg-indigo-500/20 flex items-center justify-center">
                <Clock className="h-5 w-5 text-indigo-600" />
              </div>
              Aktivitas Terkini
            </CardTitle>
            <CardDescription>Aktivitas hafalan siswa dalam beberapa jam terakhir</CardDescription>
          </div>
          {totalActivitiesCount > 5 && (
            <Dialog open={isOpen} onOpenChange={handleOpenChange}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="cursor-pointer border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700">
                  Lihat Semua ({totalActivitiesCount})
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Semua Aktivitas Terkini</DialogTitle>
                  <DialogDescription>
                    Riwayat lengkap aktivitas hafalan dan muraja'ah siswa
                  </DialogDescription>
                </DialogHeader>
                
                {isLoading && allActivities.length === 0 ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="space-y-4 mt-4">
                    {allActivities.map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-3 p-4 border-0 bg-gradient-to-r from-white to-slate-50 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full text-white text-xs flex-shrink-0 ${
                          activity.type === "memorization"
                            ? "bg-gradient-to-br from-orange-400 to-orange-600 shadow-sm"
                            : activity.type === "revision"
                              ? "bg-gradient-to-br from-green-400 to-green-600 shadow-sm"
                              : "bg-gradient-to-br from-gray-400 to-gray-600 shadow-sm"
                        }`}
                      >
                        {activity.type === "memorization" ? (
                          <BookOpen className="h-4 w-4" />
                        ) : activity.type === "revision" ? (
                          <Star className="h-4 w-4" />
                        ) : (
                          <Target className="h-4 w-4" />
                        )}
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <Link 
                              href={`/students/${activity.student_id}`}
                              className="text-sm font-medium hover:underline hover:text-blue-600 cursor-pointer"
                            >
                              {activity.student}
                            </Link>
                            <p className="text-xs text-muted-foreground">{activity.activity}</p>
                          </div>
                          <Badge variant={activity.grade === "Cemerlang" ? "default" : 
                                        activity.grade === "Baik" ? "secondary" : 
                                        activity.grade === "Sederhana" ? "outline" : "destructive"}>
                            {activity.grade}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                          <div>
                            <span className="font-medium">Surah:</span> {activity.surah_from}
                            {activity.surah_from !== activity.surah_to && ` - ${activity.surah_to}`}
                          </div>
                          <div>
                            <span className="font-medium">Halaman:</span> {activity.page_from}-{activity.page_to}
                          </div>
                          <div>
                            <span className="font-medium">Juz:</span>{' '}
                            {activity.type === 'revision' && activity.juz_from && activity.juz_to 
                              ? `${activity.juz_from}${activity.juz_from !== activity.juz_to ? `-${activity.juz_to}` : ''}`
                              : activity.juz || 'T/A'}
                          </div>
                          <div>
                            <span className="font-medium">Waktu:</span> {activity.time}
                          </div>
                        </div>
                        {activity.notes && (
                          <div className="text-xs text-muted-foreground">
                            <span className="font-medium">Catatan:</span> {activity.notes}
                          </div>
                        )}
                        {activity.audio_url && (
                          <div className="mt-2">
                            <AudioPlayer 
                              audioUrl={activity.audio_url} 
                              size="sm"
                              className="max-w-full"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {currentPage < totalPages && (
                    <div className="flex justify-center pt-4">
                      <Button 
                        onClick={handleLoadMore} 
                        disabled={isLoading}
                        variant="outline"
                        className="cursor-pointer"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Memuatkan...
                          </>
                        ) : (
                          `Muatkan Lagi (${totalActivitiesCount - allActivities.length} lagi)`
                        )}
                      </Button>
                    </div>
                  )}
                </div>
                )}
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4">
        {activities.map((activity) => (
          <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-slate-50 transition-colors duration-200">
            <div
              className={`flex h-6 w-6 sm:h-8 sm:w-8 items-center justify-center rounded-full text-white text-xs flex-shrink-0 ${
                activity.type === "memorization"
                  ? "bg-gradient-to-br from-orange-400 to-orange-600 shadow-sm"
                  : activity.type === "revision"
                    ? "bg-gradient-to-br from-green-400 to-green-600 shadow-sm"
                    : "bg-gradient-to-br from-gray-400 to-gray-600 shadow-sm"
              }`}
            >
              {activity.type === "memorization" ? (
                <BookOpen className="h-3 w-3 sm:h-4 sm:w-4" />
              ) : activity.type === "revision" ? (
                <Star className="h-3 w-3 sm:h-4 sm:w-4" />
              ) : (
                <Target className="h-3 w-3 sm:h-4 sm:w-4" />
              )}
            </div>
            <div className="flex-1 space-y-1 min-w-0">
              <Link 
                href={`/students/${activity.student_id}`}
                className="text-xs sm:text-sm font-medium hover:underline hover:text-blue-600 cursor-pointer block"
              >
                {activity.student}
              </Link>
              <p className="text-xs text-muted-foreground line-clamp-2">{activity.activity}</p>
              <p className="text-xs text-muted-foreground">{activity.time}</p>
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
        ))}
        {activities.length === 0 && (
          <div className="text-center py-8">
            <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Tidak ada aktivitas terkini ditemukan</p>
            <p className="text-sm text-muted-foreground">Aktivitas akan muncul di sini ketika siswa mulai menghafal</p>
          </div>
        )}
        {totalActivitiesCount > 5 && (
          <div className="text-center pt-4 border-t border-gray-200">
            <p className="text-xs text-muted-foreground">
              Menunjukkan 5 aktivitas terkini. 
              <span className="font-medium"> {totalActivitiesCount - 5} aktivitas lagi tersedia.</span>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
