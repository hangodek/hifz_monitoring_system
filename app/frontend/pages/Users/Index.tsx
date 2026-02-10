import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
import { Users as UsersIcon, Shield, GraduationCap, UserCircle, Loader2 } from "lucide-react"
import axios from "axios"
import { router } from "@inertiajs/react"

interface User {
  id: number
  username: string
  name: string
  email: string
  role: string
  student_name: string | null
  student_id: string | null
  created_at: string
}

interface UsersIndexProps {
  users: User[]
  available_roles: string[]
  current_filter?: string | null
}

export default function UsersIndex({ users: initialUsers, available_roles, current_filter }: UsersIndexProps) {
  const [users, setUsers] = useState<User[]>(initialUsers)
  const [updatingUserId, setUpdatingUserId] = useState<number | null>(null)
  const [activeFilter, setActiveFilter] = useState<string | null>(current_filter || null)

  const handleFilter = (role: string | null) => {
    setActiveFilter(role)
    const url = role ? `/users?role=${role}` : '/users'
    router.visit(url, {
      preserveState: false,
      preserveScroll: true
    })
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin":
        return <Shield className="h-4 w-4" />
      case "teacher":
        return <GraduationCap className="h-4 w-4" />
      case "parent":
        return <UserCircle className="h-4 w-4" />
      default:
        return <UserCircle className="h-4 w-4" />
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800 border-red-200"
      case "teacher":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "parent":
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "admin":
        return "Pengurus"
      case "teacher":
        return "Guru"
      case "parent":
        return "Orang Tua"
      default:
        return role
    }
  }

  const handleRoleChange = async (userId: number, newRole: string) => {
    setUpdatingUserId(userId)
    
    try {
      const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
      const response = await axios.patch(`/users/${userId}/update_role`, {
        role: newRole
      }, {
        headers: {
          'X-CSRF-Token': csrfToken
        }
      })

      if (response.data.success) {
        // Update local state
        setUsers(users.map(user => 
          user.id === userId 
            ? { ...user, role: newRole }
            : user
        ))
        
        // Show success message (you can add toast notification here)
        console.log(response.data.message)
      }
    } catch (error: any) {
      console.error("Error updating role:", error)
      alert(error.response?.data?.errors?.join(", ") || "Gagal memperbarui role")
    } finally {
      setUpdatingUserId(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="flex flex-col space-y-4 sm:space-y-6 p-4 sm:p-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Manajemen Pengguna</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Kelola role dan akses pengguna sistem</p>
          </div>
          <Button
            variant="outline"
            onClick={() => router.visit('/dashboard')}
            className="cursor-pointer w-full sm:w-auto"
          >
            Kembali ke Dashboard
          </Button>
        </div>

        {/* Filter Buttons */}
        <Card className="border-0 shadow-md">
          <CardContent className="">
            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
              <Button
                variant={activeFilter === null ? "default" : "outline"}
                onClick={() => handleFilter(null)}
                className="cursor-pointer w-full sm:w-auto"
              >
                <UsersIcon className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Semua ({initialUsers.length})</span>
                <span className="sm:hidden">Semua</span>
              </Button>
              <Button
                variant={activeFilter === "admin" ? "default" : "outline"}
                onClick={() => handleFilter("admin")}
                className={activeFilter === "admin" ? "cursor-pointer w-full sm:w-auto" : "cursor-pointer w-full sm:w-auto border-red-200 hover:bg-red-50 hover:text-red-700"}
              >
                <Shield className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Pengurus ({initialUsers.filter(u => u.role === "admin").length})</span>
                <span className="sm:hidden">Pengurus</span>
              </Button>
              <Button
                variant={activeFilter === "teacher" ? "default" : "outline"}
                onClick={() => handleFilter("teacher")}
                className={activeFilter === "teacher" ? "cursor-pointer w-full sm:w-auto" : "cursor-pointer w-full sm:w-auto border-blue-200 hover:bg-blue-50 hover:text-blue-700"}
              >
                <GraduationCap className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Guru ({initialUsers.filter(u => u.role === "teacher").length})</span>
                <span className="sm:hidden">Guru</span>
              </Button>
              <Button
                variant={activeFilter === "parent" ? "default" : "outline"}
                onClick={() => handleFilter("parent")}
                className={activeFilter === "parent" ? "cursor-pointer w-full sm:w-auto" : "cursor-pointer w-full sm:w-auto border-green-200 hover:bg-green-50 hover:text-green-700"}
              >
                <UserCircle className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Orang Tua ({initialUsers.filter(u => u.role === "parent").length})</span>
                <span className="sm:hidden">Orang Tua</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-0 shadow-md bg-gradient-to-br from-red-50 to-red-100/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-red-900">Pengurus</CardTitle>
              <Shield className="h-5 w-5 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {users.filter(u => u.role === "admin").length}
              </div>
              <p className="text-xs text-red-700/70">Administrator sistem</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50 to-blue-100/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-900">Guru</CardTitle>
              <GraduationCap className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {users.filter(u => u.role === "teacher").length}
              </div>
              <p className="text-xs text-blue-700/70">Tenaga pengajar</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-gradient-to-br from-green-50 to-green-100/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-900">Orang Tua</CardTitle>
              <UserCircle className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {users.filter(u => u.role === "parent").length}
              </div>
              <p className="text-xs text-green-700/70">Orang tua siswa</p>
            </CardContent>
          </Card>
        </div>

        {/* Users Table */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-full bg-indigo-500/20 flex items-center justify-center">
                <UsersIcon className="h-5 w-5 text-indigo-600" />
              </div>
              Daftar Pengguna
            </CardTitle>
            <CardDescription>
              Jumlah {users.length} pengguna dalam sistem
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">No</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Nama</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Siswa</TableHead>
                    <TableHead>Tanggal Daftar</TableHead>
                    <TableHead className="text-right">Tindakan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        <UsersIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">Tidak ada pengguna ditemukan</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user, index) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{index + 1}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium text-blue-600">@{user.username}</span>
                            <span className="text-xs text-muted-foreground">ID: {user.id}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">{user.name}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{user.email}</span>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${getRoleBadgeColor(user.role)} flex items-center gap-1 w-fit`}>
                            {getRoleIcon(user.role)}
                            {getRoleLabel(user.role)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {user.student_name ? (
                            <div className="flex flex-col">
                              <span className="text-sm font-medium">{user.student_name}</span>
                              <span className="text-xs text-muted-foreground">ID: {user.student_id}</span>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{user.created_at}</span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Select
                            value={user.role}
                            onValueChange={(value) => handleRoleChange(user.id, value)}
                            disabled={updatingUserId === user.id}
                          >
                            <SelectTrigger className="w-[180px] cursor-pointer">
                              {updatingUserId === user.id ? (
                                <div className="flex items-center gap-2">
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                  <span>Memperbarui...</span>
                                </div>
                              ) : (
                                <SelectValue placeholder="Pilih role" />
                              )}
                            </SelectTrigger>
                            <SelectContent>
                              {available_roles.map((role) => (
                                <SelectItem key={role} value={role} className="cursor-pointer">
                                  <div className="flex items-center gap-2">
                                    {getRoleIcon(role)}
                                    {getRoleLabel(role)}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
