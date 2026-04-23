import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Users as UsersIcon, Shield, GraduationCap, UserCircle, Loader2, UserPlus, Pencil } from "lucide-react"
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

interface Student {
  id: number
  name: string
  class_level: string
}

interface UsersIndexProps {
  users: User[]
  available_roles: string[]
  current_filter?: string | null
  students: Student[]
}

const emptyForm = { name: "", username: "", password: "", password_confirmation: "", role: "teacher", student_id: "" }
const emptyEditForm = { name: "", username: "", password: "", password_confirmation: "", student_id: "" }

export default function UsersIndex({ users: initialUsers, available_roles, current_filter, students }: UsersIndexProps) {
  const [users, setUsers] = useState<User[]>(initialUsers)
  const [updatingUserId, setUpdatingUserId] = useState<number | null>(null)
  const [activeFilter, setActiveFilter] = useState<string | null>(current_filter || null)

  // Create user modal state
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createForm, setCreateForm] = useState(emptyForm)
  const [createErrors, setCreateErrors] = useState<string[]>([])
  const [isCreating, setIsCreating] = useState(false)

  // Edit user modal state
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [editForm, setEditForm] = useState(emptyEditForm)
  const [editErrors, setEditErrors] = useState<string[]>([])
  const [isEditing, setIsEditing] = useState(false)

  const handleFilter = (role: string | null) => {
    setActiveFilter(role)
    const url = role ? `/users?role=${role}` : '/users'
    router.visit(url, { preserveState: false, preserveScroll: true })
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin":   return <Shield className="h-4 w-4" />
      case "teacher": return <GraduationCap className="h-4 w-4" />
      default:        return <UserCircle className="h-4 w-4" />
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":   return "bg-red-100 text-red-800 border-red-200"
      case "teacher": return "bg-blue-100 text-blue-800 border-blue-200"
      case "parent":  return "bg-green-100 text-green-800 border-green-200"
      default:        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "admin":   return "Pengurus"
      case "teacher": return "Guru"
      case "parent":  return "Orang Tua"
      default:        return role
    }
  }

  const handleRoleChange = async (userId: number, newRole: string) => {
    setUpdatingUserId(userId)
    try {
      const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
      const response = await axios.patch(`/users/${userId}/update_role`, { role: newRole }, {
        headers: { 'X-CSRF-Token': csrfToken }
      })
      if (response.data.success) {
        setUsers(users.map(user => user.id === userId ? { ...user, role: newRole } : user))
      }
    } catch (error: any) {
      alert(error.response?.data?.errors?.join(", ") || "Gagal memperbarui role")
    } finally {
      setUpdatingUserId(null)
    }
  }

  const handleCreateUser = async () => {
    setCreateErrors([])
    if (!createForm.name.trim())     { setCreateErrors(["Nama tidak boleh kosong"]); return }
    if (!createForm.username.trim()) { setCreateErrors(["Username tidak boleh kosong"]); return }
    if (!createForm.password)        { setCreateErrors(["Password tidak boleh kosong"]); return }
    if (createForm.password !== createForm.password_confirmation) {
      setCreateErrors(["Password dan konfirmasi password tidak cocok"]); return
    }
    if (createForm.role === "parent" && !createForm.student_id) {
      setCreateErrors(["Pilih siswa yang terhubung dengan akun orang tua ini"]); return
    }

    setIsCreating(true)
    try {
      const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
      const response = await axios.post('/users', { user: createForm }, {
        headers: { 'X-CSRF-Token': csrfToken }
      })
      if (response.data.success) {
        setUsers([response.data.user, ...users])
        setShowCreateModal(false)
        setCreateForm(emptyForm)
      }
    } catch (error: any) {
      setCreateErrors(error.response?.data?.errors || ["Gagal membuat pengguna"])
    } finally {
      setIsCreating(false)
    }
  }

  const closeModal = () => {
    setShowCreateModal(false)
    setCreateForm(emptyForm)
    setCreateErrors([])
  }

  const openEditModal = (user: User) => {
    setEditingUser(user)
    setEditForm({ name: user.name, username: user.username, password: "", password_confirmation: "", student_id: user.student_id ?? "" })
    setEditErrors([])
    setShowEditModal(true)
  }

  const closeEditModal = () => {
    setShowEditModal(false)
    setEditingUser(null)
    setEditForm(emptyEditForm)
    setEditErrors([])
  }

  const handleEditUser = async () => {
    setEditErrors([])
    if (!editForm.name.trim())     { setEditErrors(["Nama tidak boleh kosong"]); return }
    if (!editForm.username.trim()) { setEditErrors(["Username tidak boleh kosong"]); return }
    if (editForm.password && editForm.password !== editForm.password_confirmation) {
      setEditErrors(["Password baru dan konfirmasi tidak cocok"]); return
    }
    if (editForm.password && editForm.password.length < 6) {
      setEditErrors(["Password minimal 6 karakter"]); return
    }

    setIsEditing(true)
    try {
      const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
      const payload: Record<string, string> = {
        name: editForm.name,
        username: editForm.username,
      }
      if (editForm.password) {
        payload.password = editForm.password
        payload.password_confirmation = editForm.password_confirmation
      }
      if (editingUser?.role === "parent") payload.student_id = editForm.student_id

      const response = await axios.patch(`/users/${editingUser!.id}`, { user: payload }, {
        headers: { 'X-CSRF-Token': csrfToken }
      })
      if (response.data.success) {
        setUsers(users.map(u => u.id === editingUser!.id ? { ...u, ...response.data.user } : u))
        closeEditModal()
      }
    } catch (error: any) {
      setEditErrors(error.response?.data?.errors || ["Gagal memperbarui pengguna"])
    } finally {
      setIsEditing(false)
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
          <div className="flex gap-2 flex-col sm:flex-row">
            <Button
              id="btn-create-user"
              onClick={() => setShowCreateModal(true)}
              className="cursor-pointer gap-2"
            >
              <UserPlus className="h-4 w-4" />
              Buat Pengguna
            </Button>
            <Button variant="outline" onClick={() => router.visit('/dashboard')} className="cursor-pointer">
              Kembali ke Dashboard
            </Button>
          </div>
        </div>

        {/* Filter Buttons */}
        <Card className="border-0 shadow-md">
          <CardContent className="">
            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
              <Button variant={activeFilter === null ? "default" : "outline"} onClick={() => handleFilter(null)} className="cursor-pointer w-full sm:w-auto">
                <UsersIcon className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Semua ({initialUsers.length})</span>
                <span className="sm:hidden">Semua</span>
              </Button>
              <Button variant={activeFilter === "admin" ? "default" : "outline"} onClick={() => handleFilter("admin")} className={activeFilter === "admin" ? "cursor-pointer w-full sm:w-auto" : "cursor-pointer w-full sm:w-auto hover:bg-accent hover:text-accent-foreground"}>
                <Shield className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Pengurus ({initialUsers.filter(u => u.role === "admin").length})</span>
                <span className="sm:hidden">Pengurus</span>
              </Button>
              <Button variant={activeFilter === "teacher" ? "default" : "outline"} onClick={() => handleFilter("teacher")} className={activeFilter === "teacher" ? "cursor-pointer w-full sm:w-auto" : "cursor-pointer w-full sm:w-auto hover:bg-accent hover:text-accent-foreground"}>
                <GraduationCap className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Guru ({initialUsers.filter(u => u.role === "teacher").length})</span>
                <span className="sm:hidden">Guru</span>
              </Button>
              <Button variant={activeFilter === "parent" ? "default" : "outline"} onClick={() => handleFilter("parent")} className={activeFilter === "parent" ? "cursor-pointer w-full sm:w-auto" : "cursor-pointer w-full sm:w-auto hover:bg-accent hover:text-accent-foreground"}>
                <UserCircle className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Orang Tua ({initialUsers.filter(u => u.role === "parent").length})</span>
                <span className="sm:hidden">Orang Tua</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50 to-red-100/50 hover:shadow-xl transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-red-900">Pengurus</CardTitle>
              <div className="h-10 w-10 rounded-full bg-red-500/20 flex items-center justify-center">
                <Shield className="h-5 w-5 text-red-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {users.filter(u => u.role === "admin").length}
                <span className="text-lg font-normal text-red-500"> Akun</span>
              </div>
              <p className="text-xs text-red-700/70 mt-1">Administrator sistem</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100/50 hover:shadow-xl transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-900">Guru</CardTitle>
              <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                <GraduationCap className="h-5 w-5 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {users.filter(u => u.role === "teacher").length}
                <span className="text-lg font-normal text-blue-500"> Akun</span>
              </div>
              <p className="text-xs text-blue-700/70 mt-1">Tenaga pengajar</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100/50 hover:shadow-xl transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-900">Orang Tua</CardTitle>
              <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center">
                <UserCircle className="h-5 w-5 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {users.filter(u => u.role === "parent").length}
                <span className="text-lg font-normal text-green-500"> Akun</span>
              </div>
              <p className="text-xs text-green-700/70 mt-1">Orang tua siswa</p>
            </CardContent>
          </Card>
        </div>

        {/* Users Table */}
        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UsersIcon className="h-5 w-5" />
              Daftar Pengguna
            </CardTitle>
            <CardDescription>Jumlah {users.length} pengguna dalam sistem</CardDescription>
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
                            <span className="font-medium">@{user.username}</span>
                            <span className="text-xs text-muted-foreground">ID: {user.id}</span>
                          </div>
                        </TableCell>
                        <TableCell><span className="font-medium">{user.name}</span></TableCell>
                        <TableCell><span className="text-sm">{user.email || "-"}</span></TableCell>
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
                        <TableCell><span className="text-sm">{user.created_at}</span></TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="cursor-pointer h-8 w-8 p-0"
                              onClick={() => openEditModal(user)}
                              title="Edit pengguna"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Select
                              value={user.role}
                              onValueChange={(value) => handleRoleChange(user.id, value)}
                              disabled={updatingUserId === user.id}
                            >
                              <SelectTrigger className="w-[140px] cursor-pointer">
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
                          </div>
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

      {/* ─── Create User Modal ─────────────────────────────────────────── */}
      <Dialog open={showCreateModal} onOpenChange={(open) => { if (!open) closeModal(); else setShowCreateModal(true) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Buat Pengguna Baru
            </DialogTitle>
            <DialogDescription>
              Isi form berikut untuk membuat akun pengguna baru.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {createErrors.length > 0 && (
              <div className="border border-destructive/30 bg-destructive/5 rounded-md p-3 space-y-1">
                {createErrors.map((err, i) => (
                  <p key={i} className="text-sm text-destructive">• {err}</p>
                ))}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="create-name">Nama Lengkap</Label>
              <Input
                id="create-name"
                placeholder="Contoh: Ahmad Fauzi"
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-username">Username</Label>
              <Input
                id="create-username"
                placeholder="Contoh: ahmad_fauzi"
                value={createForm.username}
                onChange={(e) => setCreateForm({ ...createForm, username: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-role">Role / Status</Label>
              <Select value={createForm.role} onValueChange={(v) => setCreateForm({ ...createForm, role: v, student_id: "" })}>
                <SelectTrigger id="create-role" className="cursor-pointer">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin" className="cursor-pointer">
                    <div className="flex items-center gap-2"><Shield className="h-4 w-4" /> Pengurus (Admin)</div>
                  </SelectItem>
                  <SelectItem value="teacher" className="cursor-pointer">
                    <div className="flex items-center gap-2"><GraduationCap className="h-4 w-4" /> Guru</div>
                  </SelectItem>
                  <SelectItem value="parent" className="cursor-pointer">
                    <div className="flex items-center gap-2"><UserCircle className="h-4 w-4" /> Orang Tua</div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Student picker — only shown when role is parent */}
            {createForm.role === "parent" && (
              <div className="space-y-2">
                <Label htmlFor="create-student">Siswa yang Ditautkan</Label>
                <Select
                  value={createForm.student_id}
                  onValueChange={(v) => setCreateForm({ ...createForm, student_id: v })}
                >
                  <SelectTrigger id="create-student" className="cursor-pointer">
                    <SelectValue placeholder="Pilih siswa..." />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map((s) => (
                      <SelectItem key={s.id} value={String(s.id)} className="cursor-pointer">
                        <span className="font-medium">{s.name}</span>
                        <span className="text-muted-foreground ml-1 text-xs">({s.class_level})</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Akun orang tua ini akan dapat memantau progress hafalan siswa yang dipilih.
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="create-password">Password</Label>
              <Input
                id="create-password"
                type="password"
                placeholder="Minimal 12 karakter"
                value={createForm.password}
                onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-password-confirm">Konfirmasi Password</Label>
              <Input
                id="create-password-confirm"
                type="password"
                placeholder="Ulangi password"
                value={createForm.password_confirmation}
                onChange={(e) => setCreateForm({ ...createForm, password_confirmation: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={closeModal} className="cursor-pointer" disabled={isCreating}>
              Batal
            </Button>
            <Button
              id="btn-submit-create-user"
              onClick={handleCreateUser}
              disabled={isCreating}
              className="cursor-pointer gap-2"
            >
              {isCreating
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Menyimpan...</>
                : <><UserPlus className="h-4 w-4" /> Buat Pengguna</>
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* ─── Edit User Modal ─────────────────────────────────────────── */}
      <Dialog open={showEditModal} onOpenChange={(open) => { if (!open) closeEditModal() }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5" />
              Edit Pengguna
            </DialogTitle>
            <DialogDescription>
              Ubah nama, username, atau password untuk <strong>{editingUser?.name}</strong>.
              Kosongkan kolom password jika tidak ingin mengubahnya.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {editErrors.length > 0 && (
              <div className="border border-destructive/30 bg-destructive/5 rounded-md p-3 space-y-1">
                {editErrors.map((err, i) => (
                  <p key={i} className="text-sm text-destructive">• {err}</p>
                ))}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="edit-name">Nama Lengkap</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-username">Username</Label>
              <Input
                id="edit-username"
                value={editForm.username}
                onChange={(e) => setEditForm({ ...editForm, username: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
              />
            </div>

            {/* Student picker — only for parent role */}
            {editingUser?.role === "parent" && (
              <div className="space-y-2">
                <Label htmlFor="edit-student">Siswa yang Ditautkan</Label>
                <Select
                  value={editForm.student_id}
                  onValueChange={(v) => setEditForm({ ...editForm, student_id: v })}
                >
                  <SelectTrigger id="edit-student" className="cursor-pointer">
                    <SelectValue placeholder="Pilih siswa..." />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map((s) => (
                      <SelectItem key={s.id} value={String(s.id)} className="cursor-pointer">
                        <span className="font-medium">{s.name}</span>
                        <span className="text-muted-foreground ml-1 text-xs">({s.class_level})</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="edit-password">Password Baru <span className="text-muted-foreground text-xs">(kosongkan jika tidak diubah)</span></Label>
              <Input
                id="edit-password"
                type="password"
                placeholder="••••••••"
                value={editForm.password}
                onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
              />
            </div>

            {editForm.password && (
              <div className="space-y-2">
                <Label htmlFor="edit-password-confirm">Konfirmasi Password Baru</Label>
                <Input
                  id="edit-password-confirm"
                  type="password"
                  placeholder="Ulangi password baru"
                  value={editForm.password_confirmation}
                  onChange={(e) => setEditForm({ ...editForm, password_confirmation: e.target.value })}
                />
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={closeEditModal} className="cursor-pointer" disabled={isEditing}>
              Batal
            </Button>
            <Button onClick={handleEditUser} disabled={isEditing} className="cursor-pointer gap-2">
              {isEditing
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Menyimpan...</>
                : <><Pencil className="h-4 w-4" /> Simpan Perubahan</>
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
