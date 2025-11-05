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

interface RecentActivity {
  id: number
  student: string
  activity: string
  time: string
  type: string
  audio_url?: string | null
}

interface DetailedActivity {
  id: number
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
    <Card className="border-gray-200/60 shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Activities
            </CardTitle>
            <CardDescription>Student memorization activities in the last few hours</CardDescription>
          </div>
          {totalActivitiesCount > 5 && (
            <Dialog open={isOpen} onOpenChange={handleOpenChange}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="cursor-pointer border-gray-200/60">
                  View All ({totalActivitiesCount})
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>All Recent Activities</DialogTitle>
                  <DialogDescription>
                    Complete history of student memorization and revision activities
                  </DialogDescription>
                </DialogHeader>
                
                {isLoading && allActivities.length === 0 ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="space-y-4 mt-4">
                    {allActivities.map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-3 p-4 border border-gray-200 rounded-lg">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full text-white text-xs flex-shrink-0 ${
                          activity.type === "memorization"
                            ? "bg-blue-500"
                            : activity.type === "revision"
                              ? "bg-green-500"
                              : "bg-gray-500"
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
                            <p className="text-sm font-medium">{activity.student}</p>
                            <p className="text-xs text-muted-foreground">{activity.activity}</p>
                          </div>
                          <Badge variant={activity.grade === "Excellent" ? "default" : 
                                        activity.grade === "Good" ? "secondary" : 
                                        activity.grade === "Fair" ? "outline" : "destructive"}>
                            {activity.grade}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                          <div>
                            <span className="font-medium">Surah:</span> {activity.surah_from}
                            {activity.surah_from !== activity.surah_to && ` - ${activity.surah_to}`}
                          </div>
                          <div>
                            <span className="font-medium">Pages:</span> {activity.page_from}-{activity.page_to}
                          </div>
                          <div>
                            <span className="font-medium">Juz:</span> {activity.juz || 'N/A'}
                          </div>
                          <div>
                            <span className="font-medium">Time:</span> {activity.time}
                          </div>
                        </div>
                        {activity.notes && (
                          <div className="text-xs text-muted-foreground">
                            <span className="font-medium">Notes:</span> {activity.notes}
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
                            Loading...
                          </>
                        ) : (
                          `Load More (${totalActivitiesCount - allActivities.length} remaining)`
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
          <div key={activity.id} className="flex items-start space-x-3">
            <div
              className={`flex h-6 w-6 sm:h-8 sm:w-8 items-center justify-center rounded-full text-white text-xs flex-shrink-0 ${
                activity.type === "memorization"
                  ? "bg-blue-500"
                  : activity.type === "revision"
                    ? "bg-green-500"
                    : "bg-gray-500"
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
              <p className="text-xs sm:text-sm font-medium">{activity.student}</p>
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
            <p className="text-muted-foreground">No recent activities found</p>
            <p className="text-sm text-muted-foreground">Activities will appear here when students start memorizing</p>
          </div>
        )}
        {totalActivitiesCount > 5 && (
          <div className="text-center pt-4 border-t border-gray-200">
            <p className="text-xs text-muted-foreground">
              Showing 5 most recent activities. 
              <span className="font-medium"> {totalActivitiesCount - 5} more activities available.</span>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
