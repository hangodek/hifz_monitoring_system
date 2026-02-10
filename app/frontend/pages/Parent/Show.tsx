"use client"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts"
import {
  BookOpen,
  CalendarIcon,
  TrendingUp,
  Award,
  Clock,
  Target,
  Star,
  ChevronDown,
  BarChart3,
  Loader2,
} from "lucide-react"
import { AudioPlayer } from "@/components/AudioPlayer"
import { ParentHeader } from "./components"
import axios from "axios"

// Student type definition
interface Student {
  id: string
  nisn?: string
  student_number: string
  name: string
  current_hifz_in_juz: string
  current_hifz_in_pages: string
  current_hifz_in_surah: string
  avatar?: string
  class_level: string
  phone?: string
  email?: string
  status: string
  gender: string
  birth_place: string
  birth_date: string
  address?: string
  father_name: string
  mother_name: string
  parent_phone?: string
}

interface Activity {
  id: number
  activity: string
  time: string
  type: string
  date: string
  created_at: string
  audio_url?: string | null
}

interface DetailedActivity {
  id: number
  activity: string
  time: string
  type: string
  date: string
  created_at: string
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

interface MonthlyProgress {
  month: string
  completed: number
  is_projected?: boolean
}

interface GradeDistribution {
  name: string
  value: number
  color: string
}

interface TypeDistribution {
  name: string
  value: number
  color: string
}

interface MonthlyActivities {
  month: string
  revision: number
  memorization: number
}

interface ParentShowProps {
  student: Student
  recent_activities: Activity[]
  total_activities_count: number
  total_activities: number
  monthly_progress: MonthlyProgress[]
  grade_distribution: GradeDistribution[]
  type_distribution: TypeDistribution[]
  monthly_activities: MonthlyActivities[]
}

export default function ParentShow({
  student,
  recent_activities,
  total_activities_count,
  total_activities,
  monthly_progress,
  grade_distribution,
  type_distribution,
  monthly_activities,
}: ParentShowProps) {
  const [selectedActivity, setSelectedActivity] = useState<DetailedActivity | null>(null)
  const [isActivityDialogOpen, setIsActivityDialogOpen] = useState(false)
  const [allActivities, setAllActivities] = useState<DetailedActivity[]>([])
  const [isLoadingActivities, setIsLoadingActivities] = useState(false)
  const [hasLoadedAll, setHasLoadedAll] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const handleViewAllActivities = async () => {
    if (hasLoadedAll) {
      setIsActivityDialogOpen(true)
      return
    }

    setIsLoadingActivities(true)
    try {
      const response = await axios.get(`/parent/activities_list?page=1&per_page=50`)
      setAllActivities(response.data.activities)
      setCurrentPage(response.data.current_page)
      setTotalPages(response.data.total_pages)
      setHasLoadedAll(true)
      setIsActivityDialogOpen(true)
    } catch (error) {
      console.error("Error loading activities:", error)
    } finally {
      setIsLoadingActivities(false)
    }
  }

  const loadMoreActivities = async () => {
    if (currentPage >= totalPages) return

    setIsLoadingActivities(true)
    try {
      const nextPage = currentPage + 1
      const response = await axios.get(`/parent/activities_list?page=${nextPage}&per_page=50`)
      setAllActivities(prev => [...prev, ...response.data.activities])
      setCurrentPage(response.data.current_page)
    } catch (error) {
      console.error("Error loading more activities:", error)
    } finally {
      setIsLoadingActivities(false)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 border-green-200"
      case "inactive":
        return "bg-gray-100 text-gray-800 border-gray-200"
      case "graduated":
        return "bg-blue-100 text-blue-800 border-blue-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getGenderText = (gender: string) => {
    return gender === "male" ? "Lelaki" : "Perempuan"
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return format(date, "dd MMMM yyyy", { locale: id })
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="flex flex-col space-y-4 sm:space-y-6 p-4 sm:p-6">
        {/* Header with only logout button */}
        <ParentHeader studentName={student.name} />

        {/* Student Profile Card */}
        <Card className="border-blue-100 shadow-lg">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start sm:items-center">
              <Avatar className="h-20 w-20 sm:h-24 sm:w-24 border-4 border-blue-50">
                <AvatarImage src={student.avatar} alt={student.name} />
                <AvatarFallback className="text-lg sm:text-xl bg-gradient-to-br from-blue-400 to-purple-500 text-white">
                  {getInitials(student.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                  <CardTitle className="text-2xl sm:text-3xl">{student.name}</CardTitle>
                  <Badge className={`${getStatusColor(student.status)} w-fit`}>
                    {student.status === "active" ? "Aktif" : student.status === "graduated" ? "Tamat" : "Tidak Aktif"}
                  </Badge>
                </div>
                <CardDescription className="text-base">
                  Kelas {student.class_level} • {getGenderText(student.gender)}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Current Progress */}
              <div className="flex items-start gap-3 p-3 sm:p-4 bg-blue-50 rounded-lg border border-blue-100">
                <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-blue-100">
                  <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">Juz Semasa</p>
                  <p className="text-lg sm:text-2xl font-bold text-blue-600">{student.current_hifz_in_juz}</p>
                </div>
              </div>

              {/* Current Surah */}
              <div className="flex items-start gap-3 p-3 sm:p-4 bg-purple-50 rounded-lg border border-purple-100">
                <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-purple-100">
                  <Star className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">Surah Semasa</p>
                  <p className="text-base sm:text-lg font-bold text-purple-600">{student.current_hifz_in_surah}</p>
                </div>
              </div>

              {/* Current Pages */}
              <div className="flex items-start gap-3 p-3 sm:p-4 bg-green-50 rounded-lg border border-green-100">
                <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-green-100">
                  <Target className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">Muka Surat</p>
                  <p className="text-lg sm:text-2xl font-bold text-green-600">{student.current_hifz_in_pages}</p>
                </div>
              </div>

              {/* Total Activities */}
              <div className="flex items-start gap-3 p-3 sm:p-4 bg-orange-50 rounded-lg border border-orange-100">
                <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-orange-100">
                  <Award className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">Jumlah Aktiviti</p>
                  <p className="text-lg sm:text-2xl font-bold text-orange-600">{total_activities}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Charts Section - Hidden on mobile */}
        <div className="hidden md:grid md:grid-cols-2 gap-4 sm:gap-6">
          {/* Monthly Progress Chart */}
          <Card className="border-purple-100 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-purple-600" />
                Kemajuan Bulanan (Juz)
              </CardTitle>
              <CardDescription>Perkembangan hafalan dalam 7 bulan (3 bulan lepas, bulan ini, 3 bulan akan datang)</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthly_progress}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
                  <XAxis 
                    dataKey="month" 
                    className="text-xs"
                    tick={{ fill: '#6b7280' }}
                  />
                  <YAxis 
                    className="text-xs"
                    tick={{ fill: '#6b7280' }}
                    domain={[0, 30]}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.5rem'
                    }}
                    formatter={(value, name, props) => {
                      const isProjected = props?.payload?.is_projected
                      return [`${value} Juz${isProjected ? ' (unjuran)' : ''}`, name]
                    }}
                  />
                  <Legend />
                  {/* Actual Progress Line */}
                  <Line 
                    type="monotone" 
                    dataKey={(entry) => !entry.is_projected ? entry.completed : null}
                    stroke="#10b981" 
                    strokeWidth={2}
                    dot={{ fill: '#10b981', r: 4 }}
                    activeDot={{ r: 6 }}
                    name="Kemajuan Sebenar"
                    connectNulls={true}
                  />
                  {/* Projected Progress Line */}
                  <Line 
                    type="monotone" 
                    dataKey={(entry) => entry.is_projected ? entry.completed : null}
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    strokeDasharray="8 4"
                    dot={{ fill: '#60a5fa', r: 4, stroke: '#3b82f6' }}
                    activeDot={{ r: 6 }}
                    name="Unjuran Kemajuan"
                    connectNulls={true}
                  />
                  {/* Bridge line to connect actual to projected */}
                  <Line 
                    type="monotone" 
                    dataKey="completed"
                    stroke="#6b7280" 
                    strokeWidth={1} 
                    strokeDasharray="2 2"
                    dot={false}
                    activeDot={false}
                    name=""
                  />
                </LineChart>
              </ResponsiveContainer>
              <div className="mt-4 flex items-center justify-center gap-6 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-0.5 bg-green-500"></div>
                  <span>Kemajuan Sebenar</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-0.5 bg-blue-500" style={{borderTop: '2px dashed #3b82f6', backgroundColor: 'transparent'}}></div>
                  <span>Unjuran Kemajuan</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Monthly Activities Chart */}
          <Card className="border-blue-100 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                Aktiviti Bulanan
              </CardTitle>
              <CardDescription>Jumlah hafalan dan murajaah dalam 6 bulan terakhir</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthly_activities}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
                  <XAxis 
                    dataKey="month" 
                    className="text-xs"
                    tick={{ fill: '#6b7280' }}
                  />
                  <YAxis 
                    className="text-xs"
                    tick={{ fill: '#6b7280' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.5rem'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="memorization" fill="#3b82f6" name="Hafalan" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="revision" fill="#10b981" name="Murajaah" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Grade Distribution Chart */}
          {grade_distribution.length > 0 && (
            <Card className="border-green-100 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-green-600" />
                  Taburan Gred
                </CardTitle>
                <CardDescription>Prestasi keseluruhan</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={grade_distribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {grade_distribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Type Distribution Chart */}
          {type_distribution.length > 0 && (
            <Card className="border-orange-100 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-orange-600" />
                  Jenis Aktiviti
                </CardTitle>
                <CardDescription>Pembahagian hafalan vs murajaah</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={type_distribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {type_distribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Mobile Chart Notice */}
        <div className="md:hidden">
          <Card className="border-blue-200/60 bg-blue-50/30 shadow-md">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                  <BarChart3 className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-800">Carta Tersedia pada Skrin Lebih Besar</p>
                  <p className="text-xs text-blue-600">Lihat analitik terperinci dan carta kemajuan pada tablet atau desktop</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activities */}
        <Card className="border-gray-200 shadow-md">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <div className="h-10 w-10 rounded-full bg-indigo-500/20 flex items-center justify-center">
                      <Clock className="h-5 w-5 text-indigo-600" />
                    </div>
                    Aktiviti Terkini
                </CardTitle>
                <CardDescription>5 aktiviti hafalan terkini</CardDescription>
              </div>
              <Button
                variant="outline"
                className="border-blue-200 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 w-full sm:w-auto cursor-pointer"
                onClick={handleViewAllActivities}
                disabled={isLoadingActivities}
              >
                {isLoadingActivities ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Memuatkan...
                  </>
                ) : (
                  <>
                    Lihat Semua Aktiviti ({total_activities_count})
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recent_activities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors gap-3"
                >
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full text-white ${
                      activity.type === "memorization" 
                        ? "bg-gradient-to-br from-orange-400 to-orange-600 shadow-sm" 
                        : "bg-gradient-to-br from-green-400 to-green-600 shadow-sm"
                    }`}>
                      {activity.type === "memorization" ? (
                        <BookOpen className="h-5 w-5" />
                      ) : (
                        <Star className="h-5 w-5" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 break-words">{activity.activity}</p>
                      <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                    </div>
                  </div>
                  {activity.audio_url && (
                    <div className="sm:ml-4">
                      <AudioPlayer audioUrl={activity.audio_url} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* All Activities Dialog */}
        <Dialog open={isActivityDialogOpen} onOpenChange={setIsActivityDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>Semua Aktiviti Hafalan</DialogTitle>
              <DialogDescription>
                Senarai lengkap aktiviti hafalan ({total_activities_count} aktiviti)
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto space-y-3 pr-2">
              {allActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start space-x-3 p-4 border-0 bg-gradient-to-r from-white to-slate-50 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200"
                >
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
                      <p className="text-sm font-medium">{activity.activity}</p>
                      {activity.grade && (
                        <Badge variant={activity.grade === "Cemerlang" ? "default" : 
                                      activity.grade === "Baik" ? "secondary" : 
                                      activity.grade === "Sederhana" ? "outline" : "destructive"}>
                          {activity.grade}
                        </Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                      <div>
                        <span className="font-medium">Surah:</span> {activity.surah_from}
                        {activity.surah_from !== activity.surah_to && ` - ${activity.surah_to}`}
                      </div>
                      <div>
                        <span className="font-medium">Muka Surat:</span> {activity.page_from}-{activity.page_to}
                      </div>
                      <div>
                        <span className="font-medium">Juz:</span>{' '}
                        {activity.type === 'revision' && activity.juz_from && activity.juz_to 
                          ? `${activity.juz_from}${activity.juz_from !== activity.juz_to ? `-${activity.juz_to}` : ''}`
                          : activity.juz || 'T/A'}
                      </div>
                      <div>
                        <span className="font-medium">Masa:</span> {activity.time}
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
                    variant="outline"
                    onClick={loadMoreActivities}
                    disabled={isLoadingActivities}
                    className="cursor-pointer"
                  >
                    {isLoadingActivities ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Memuatkan...
                      </>
                    ) : (
                      "Muat Lebih Banyak"
                    )}
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
