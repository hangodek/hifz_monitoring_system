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
  User,
  ArrowLeft,
  ChevronDown,
  BarChart3,
  Edit,
  Loader2,
} from "lucide-react"
import { router } from "@inertiajs/react"
import { AudioPlayer } from "@/components/AudioPlayer"
import axios from "axios"

// Student type definition matching database schema
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
  created_at: string
  updated_at: string
}

// Activity type from backend
interface Activity {
  id: number
  activity: string
  time: string
  type: string
  date: string
  created_at: string
  audio_url?: string | null
}

// Detailed activity type for modal
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

// Monthly progress data
interface MonthlyProgress {
  month: string
  completed: number
  is_projected?: boolean
}

// Grade distribution data
interface GradeDistribution {
  name: string
  value: number
  color: string
}

// Type distribution data
interface TypeDistribution {
  name: string
  value: number
  color: string
}

// Monthly activities data
interface MonthlyActivities {
  month: string
  revision: number
  memorization: number
}

// Generate daily submissions data for date range
const generateDailySubmissions = (startDate: Date, endDate: Date, activities: Activity[]) => {
  const data = []
  const currentDate = new Date(startDate)

  while (currentDate <= endDate) {
    const dateStr = format(currentDate, "yyyy-MM-dd")
    const dayActivities = activities.filter(activity => 
      activity.date === dateStr
    ).length

    data.push({
      date: format(currentDate, "dd/MM"),
      fullDate: dateStr,
      submissions: dayActivities,
    })
    currentDate.setDate(currentDate.getDate() + 1)
  }

  return data
}

// Student specific data
const getStudentData = (student: Student, all_activities: Activity[], startDate: Date, endDate: Date) => {
  if (!student) return null

  return {
    dailySubmissions: generateDailySubmissions(startDate, endDate, all_activities),
    recentActivities: all_activities,
  }
}

interface StudentShowProps {
  student: Student // The actual student data object from Rails controller
  recent_activities: Activity[] // Recent activities from backend (limited to 5)
  total_activities_count: number // Total count for "View All" button
  total_activities: number // Total count of activities
  monthly_progress: MonthlyProgress[] // Monthly progress data
  grade_distribution: GradeDistribution[] // Grade distribution data
  type_distribution: TypeDistribution[] // Activity type distribution data
  monthly_activities: MonthlyActivities[] // Monthly activities data
}

export default function StudentShow({ student, recent_activities, total_activities_count, total_activities, monthly_progress, grade_distribution, type_distribution, monthly_activities }: StudentShowProps) {
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), // 7 days ago
    to: new Date(),
  })
  
  const [allActivities, setAllActivities] = useState<DetailedActivity[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [isOpen, setIsOpen] = useState(false)

  const loadActivities = async (page: number = 1) => {
    setIsLoading(true)
    try {
      const response = await axios.get(`/students/${student.id}/activities_list`, {
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

  // Convert recent_activities to the format expected by generateDailySubmissions
  const formattedAllActivities = recent_activities.map(activity => ({
    id: activity.id,
    activity: activity.activity,
    time: activity.time,
    type: activity.type,
    date: activity.date,
    created_at: activity.created_at
  }))

  const studentData = student ? getStudentData(student, formattedAllActivities, dateRange.from, dateRange.to) : null

  // Calculate today's submissions using all activities, not just recent ones
  const todayStr = format(new Date(), "yyyy-MM-dd")
  const todaySubmissions = formattedAllActivities.filter(activity => activity.date === todayStr).length

  // Helper function to get avatar URL
  const getAvatarUrl = (avatar?: string): string => {
    if (!avatar) return "/placeholder.svg"
    
    // If avatar is already a full URL, use it
    if (avatar.startsWith('http')) return avatar
    
    // If avatar is a path starting with /, use it as is
    if (avatar.startsWith('/')) return avatar
    
    // If avatar looks like a Rails Active Storage signed ID or blob key
    if (avatar.includes('-') && avatar.length > 10) {
      return `/rails/active_storage/blobs/redirect/${avatar}/avatar`
    }
    
    // Fallback: try to construct Rails Active Storage URL
    return `/rails/active_storage/blobs/${avatar}`
  }

  if (!student) {
    return (
      <div className="min-h-screen bg-gray-50/50 flex items-center justify-center">
        <Card>
          <CardContent className="text-center py-12">
            <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Pelajar tidak dijumpai</h3>
            <p className="text-muted-foreground">Kembali ke senarai pelajar atau papan pemuka.</p>
            <div className="mt-4 flex gap-2 justify-center">
              <Button onClick={() => router.visit("/students")} className="cursor-pointer">Senarai Pelajar</Button>
              <Button variant="outline" onClick={() => router.visit("/dashboard")} className="cursor-pointer">
                Papan Pemuka
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="flex flex-col space-y-4 sm:space-y-6 p-4 sm:p-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Kemajuan {student?.name}</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Kemajuan hafalan dan butiran aktiviti pelajar</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:space-x-4 sm:gap-0">
            <Button
              variant="default"
              className="cursor-pointer bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              onClick={() => router.visit(`/students/${student.id}/edit`)}
            >
              <Edit className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Edit Pelajar</span>
              <span className="sm:hidden">Edit</span>
            </Button>
            <Button
              variant="outline"
              className="border-gray-200 hover:bg-gray-50 hover:text-gray-700 hover:border-gray-300 cursor-pointer"
              onClick={() => router.visit('/students')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Kembali ke Senarai Pelajar</span>
              <span className="sm:hidden">Kembali</span>
            </Button>
          </div>
        </div>

        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 shadow-lg">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
              <Avatar className="h-16 w-16 sm:h-16 sm:w-16">
                <AvatarImage src={getAvatarUrl(student.avatar)} alt={`${student.name}'s avatar`} />
                <AvatarFallback className="text-lg">
                  {student.name
                    .split(" ")
                    .map((n: string) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-center sm:text-left">
                <h2 className="text-xl sm:text-2xl font-bold">{student.name}</h2>
                <p className="text-muted-foreground">Sedang menghafal: {student.current_hifz_in_surah}</p>
                <p className="text-muted-foreground">Juz {student.current_hifz_in_juz} daripada 30 Juz</p>
                <div className="mt-2">
                  <div className="text-sm text-muted-foreground">{student.current_hifz_in_pages} muka surat dihafal</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Student detailed information card */}
        <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-blue-50/30 hover:shadow-xl transition-shadow duration-200">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl text-blue-900">
              <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              Butiran Pelajar
            </CardTitle>
            <CardDescription className="text-sm">Data lengkap dan maklumat hubungan</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label className="text-xs sm:text-sm font-medium text-muted-foreground">NISN</label>
                  <p className="text-sm sm:text-base mt-1">{student.nisn || '-'}</p>
                </div>
                <div>
                  <label className="text-xs sm:text-sm font-medium text-muted-foreground">No Induk</label>
                  <p className="text-sm sm:text-base mt-1">{student.student_number}</p>
                </div>
                <div>
                  <label className="text-xs sm:text-sm font-medium text-muted-foreground">Nama Penuh</label>
                  <p className="text-sm sm:text-base mt-1">{student.name}</p>
                </div>
                <div>
                  <label className="text-xs sm:text-sm font-medium text-muted-foreground">Jantina</label>
                  <p className="text-sm sm:text-base mt-1">{student.gender === 'male' ? 'Lelaki' : 'Perempuan'}</p>
                </div>
                <div>
                  <label className="text-xs sm:text-sm font-medium text-muted-foreground">Tempat, Tarikh Lahir</label>
                  <p className="text-sm sm:text-base mt-1">
                    {student.birth_place}, {student.birth_date}
                  </p>
                </div>
                <div>
                  <label className="text-xs sm:text-sm font-medium text-muted-foreground">Kelas</label>
                  <p className="text-sm sm:text-base mt-1">{student.class_level}</p>
                </div>
              </div>
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label className="text-xs sm:text-sm font-medium text-muted-foreground">Alamat</label>
                  <p className="text-sm sm:text-base mt-1">{student.address || 'Tidak diberikan'}</p>
                </div>
                <div>
                  <label className="text-xs sm:text-sm font-medium text-muted-foreground">Nama Bapa</label>
                  <p className="text-sm sm:text-base mt-1">{student.father_name}</p>
                </div>
                <div>
                  <label className="text-xs sm:text-sm font-medium text-muted-foreground">Nama Ibu</label>
                  <p className="text-sm sm:text-base mt-1">{student.mother_name}</p>
                </div>
                <div>
                  <label className="text-xs sm:text-sm font-medium text-muted-foreground">No HP Orang Tua</label>
                  <p className="text-sm sm:text-base mt-1">{student.parent_phone || 'Tidak diberikan'}</p>
                </div>
                <div>
                  <label className="text-xs sm:text-sm font-medium text-muted-foreground">Email</label>
                  <p className="text-sm sm:text-base mt-1">{student.email || 'Tidak diberikan'}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100/50 hover:shadow-xl transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-900">Penyerahan Hari Ini</CardTitle>
              <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center">
                <CalendarIcon className="h-4 w-4 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {todaySubmissions} <span className="text-lg font-normal text-green-700/70">Aktiviti</span>
              </div>
              <p className="text-xs text-green-700/70">Penyerahan hari ini</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100/50 hover:shadow-xl transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-900">Kemajuan Semasa</CardTitle>
              <div className="h-10 w-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{student?.current_hifz_in_surah}</div>
              <p className="text-xs text-purple-700/70">Juz {student?.current_hifz_in_juz || 0} • {student?.current_hifz_in_pages || 0} muka surat dihafal</p>
            </CardContent>
          </Card>
        </div>

        {/* Daily Submissions Chart - Full Width, Hidden on mobile */}
        <Card className="hidden md:block border-0 shadow-lg bg-gradient-to-br from-white to-cyan-50/30 hover:shadow-xl transition-shadow duration-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-cyan-900">
                  <div className="h-10 w-10 rounded-full bg-cyan-500/20 flex items-center justify-center">
                    <CalendarIcon className="h-5 w-5 text-cyan-600" />
                  </div>
                  Penyerahan Harian
                </CardTitle>
                <CardDescription>Penyerahan hafalan harian {student?.name}</CardDescription>
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="cursor-pointer border-gray-200/60">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    {format(dateRange.from, "dd MMM", { locale: id })} -{" "}
                    {format(dateRange.to, "dd MMM", { locale: id })}
                    <ChevronDown className="h-4 w-4 ml-2" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 border-gray-200/60" align="end">
                  <div className="p-4 space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Tarikh Mula</label>
                      <Calendar
                        mode="single"
                        selected={dateRange.from}
                        onSelect={(date) => date && setDateRange((prev) => ({ ...prev, from: date }))}
                        locale={id}
                        className="border-gray-200/60"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Tarikh Akhir</label>
                      <Calendar
                        mode="single"
                        selected={dateRange.to}
                        onSelect={(date) => date && setDateRange((prev) => ({ ...prev, to: date }))}
                        locale={id}
                        className="border-gray-200/60"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="cursor-pointer border-gray-200/60"
                        onClick={() =>
                          setDateRange({
                            from: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
                            to: new Date(),
                          })
                        }
                      >
                        7 Days
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="cursor-pointer border-gray-200/60"
                        onClick={() =>
                          setDateRange({
                            from: new Date(Date.now() - 29 * 24 * 60 * 60 * 1000),
                            to: new Date(),
                          })
                        }
                      >
                        30 Days
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={studentData?.dailySubmissions}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="submissions" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Progress Chart - Hidden on mobile */}
        <Card className="hidden md:block border-0 shadow-lg bg-gradient-to-br from-white to-emerald-50/30 hover:shadow-xl transition-shadow duration-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-emerald-900">
              <div className="h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
              </div>
              Monthly Progress & Projection
            </CardTitle>
            <CardDescription>
              {student?.name}'s Quran memorization progress (3 months history + 3 months projection)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthly_progress}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="month" />
                <YAxis domain={[0, 30]} />
                <Tooltip 
                  formatter={(value, name, props) => {
                    const isProjected = props?.payload?.is_projected
                    return [`${value} Juz${isProjected ? ' (projected)' : ''}`, name]
                  }}
                  labelFormatter={(label) => `Month: ${label}`}
                />
                <Legend />
                {/* Actual Progress Line */}
                <Line 
                  type="monotone" 
                  dataKey={(entry) => !entry.is_projected ? entry.completed : null}
                  stroke="#10b981" 
                  strokeWidth={3} 
                  name="Actual Progress"
                  dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2 }}
                  connectNulls={true}
                />
                {/* Projected Progress Line */}
                <Line 
                  type="monotone" 
                  dataKey={(entry) => entry.is_projected ? entry.completed : null}
                  stroke="#3b82f6" 
                  strokeWidth={3} 
                  strokeDasharray="8 4"
                  name="Projected Progress"
                  dot={{ fill: '#60a5fa', strokeWidth: 2, r: 4, stroke: '#3b82f6' }}
                  activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
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
            <div className="mt-4 flex items-center justify-center gap-6 text-sm text-muted-foreground">
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

        {/* Monthly Activities Chart - Hidden on mobile */}
        <Card className="hidden md:block border-0 shadow-lg bg-gradient-to-br from-white to-indigo-50/30 hover:shadow-xl transition-shadow duration-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-indigo-900">
              <div className="h-10 w-10 rounded-full bg-indigo-500/20 flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-indigo-600" />
              </div>
              Monthly Revision & Memorization Activities
            </CardTitle>
            <CardDescription>
              {student?.name}'s monthly activity breakdown - revision vs memorization
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthly_activities}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [`${value} activities`, name]}
                  labelFormatter={(label) => `Month: ${label}`}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="revision" 
                  stroke="#10b981" 
                  strokeWidth={3} 
                  name="Revision Activities"
                  dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="memorization" 
                  stroke="#3b82f6" 
                  strokeWidth={3} 
                  name="Memorization Activities"
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Pie Charts Section - Side by Side, Hidden on mobile */}
        <div className="hidden md:grid gap-6 md:grid-cols-2">
          {/* Activity Grade Distribution */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-amber-50/30 hover:shadow-xl transition-shadow duration-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-900">
                <div className="h-10 w-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                  <Award className="h-5 w-5 text-amber-600" />
                </div>
                Taburan Prestasi
              </CardTitle>
              <CardDescription>Kualiti aktiviti hafalan</CardDescription>
            </CardHeader>
            <CardContent>
              {grade_distribution && grade_distribution.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={grade_distribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {grade_distribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value, name) => [`${value} activities`, name]}
                      labelFormatter={(label) => `Grade: ${label}`}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-center">
                  <div>
                    <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Tiada data prestasi tersedia</p>
                    <p className="text-sm text-muted-foreground">Data akan muncul apabila aktiviti diberi gred</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Activity Type Distribution */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-teal-50/30 hover:shadow-xl transition-shadow duration-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-teal-900">
                <div className="h-10 w-10 rounded-full bg-teal-500/20 flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-teal-600" />
                </div>
                Jenis Aktiviti
              </CardTitle>
              <CardDescription>Imbangan hafalan vs murajaah</CardDescription>
            </CardHeader>
            <CardContent>
              {type_distribution && type_distribution.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={type_distribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={8}
                      dataKey="value"
                    >
                      {type_distribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value, name) => [`${value} aktiviti`, name]}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-center">
                  <div>
                    <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Tiada data aktiviti tersedia</p>
                    <p className="text-sm text-muted-foreground">Data akan muncul apabila aktiviti direkodkan</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Bottom Section */}
        <div className="grid gap-6 md:grid-cols-2">

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

          {/* Student Stats */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-violet-50/30 hover:shadow-xl transition-shadow duration-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-violet-900">
                <div className="h-10 w-10 rounded-full bg-violet-500/20 flex items-center justify-center">
                  <Target className="h-5 w-5 text-violet-600" />
                </div>
                Statistik Pelajar
              </CardTitle>
              <CardDescription>Ringkasan pencapaian {student?.name}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-lg font-bold text-purple-600 truncate">{student?.current_hifz_in_surah}</div>
                  <div className="text-sm text-muted-foreground">Surah Semasa</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{student?.current_hifz_in_juz}</div>
                  <div className="text-sm text-muted-foreground">Juz Semasa</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{student?.current_hifz_in_pages}</div>
                  <div className="text-sm text-muted-foreground">Halaman Semasa</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">{total_activities}</div>
                  <div className="text-sm text-muted-foreground">Jumlah Penyerahan</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activities */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-slate-50/30 hover:shadow-xl transition-shadow duration-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-slate-900">
                    <div className="h-10 w-10 rounded-full bg-indigo-500/20 flex items-center justify-center">
                      <Clock className="h-5 w-5 text-indigo-600" />
                    </div>
                    Aktiviti Terkini
                  </CardTitle>
                  <CardDescription>Aktiviti terkini {student?.name}</CardDescription>
                </div>
                {total_activities_count > 5 && (
                  <Dialog open={isOpen} onOpenChange={handleOpenChange}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="cursor-pointer border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700">
                        Lihat Semua ({total_activities_count})
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Semua Aktiviti - {student?.name}</DialogTitle>
                        <DialogDescription>
                          Sejarah lengkap aktiviti hafalan dan murajaah
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
                                <p className="text-sm font-medium">{activity.activity}</p>
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
                                `Load More (${total_activities_count - allActivities.length} remaining)`
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
              {recent_activities.map((activity) => (
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
                    <p className="text-xs sm:text-sm font-medium line-clamp-2">{activity.activity}</p>
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
              {recent_activities.length === 0 && (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Tiada aktiviti terkini dijumpai</p>
                  <p className="text-sm text-muted-foreground">Aktiviti akan muncul di sini apabila pelajar mula menghafal</p>
                </div>
              )}
              {total_activities_count > 5 && (
                <div className="text-center pt-4 border-t border-gray-200">
                  <p className="text-xs text-muted-foreground">
                    Menunjukkan 5 aktiviti terkini. 
                    <span className="font-medium"> {total_activities_count - 5} aktiviti lagi tersedia.</span>
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
