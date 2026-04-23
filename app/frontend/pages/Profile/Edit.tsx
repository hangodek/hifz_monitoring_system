import { useState } from "react"
import { router } from "@inertiajs/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { User, KeyRound, CheckCircle2, AlertCircle, ArrowLeft } from "lucide-react"

interface CurrentUser {
  id: number
  name: string
  username: string
  role: string
}

interface ProfileEditProps {
  current_user: CurrentUser
}

export default function ProfileEdit({ current_user }: ProfileEditProps) {
  const [name, setName] = useState(current_user.name)
  const [username, setUsername] = useState(current_user.username)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [errors, setErrors] = useState<string[]>([])

  const roleLabel: Record<string, string> = {
    admin: "Pengurus",
    teacher: "Guru",
    parent: "Orang Tua",
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSuccess(null)
    setErrors([])

    router.patch(
      "/profile",
      {
        name,
        username,
        current_password: currentPassword,
        password: newPassword,
        password_confirmation: confirmPassword,
      },
      {
        preserveScroll: true,
        onSuccess: (page) => {
          const flash = (page.props as { flash?: { notice?: string } }).flash
          setSuccess(flash?.notice || "Profil berhasil diperbarui")
          setCurrentPassword("")
          setNewPassword("")
          setConfirmPassword("")
          setIsSubmitting(false)
        },
        onError: (errs) => {
          // Inertia validation errors arrive as object
          const messages = Object.values(errs).flat() as string[]
          setErrors(messages)
          setIsSubmitting(false)
        },
      }
    )
  }

  // Also handle JSON response errors (our controller returns JSON)
  const handleFetch = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSuccess(null)
    setErrors([])

    fetch("/profile", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": document.querySelector('meta[name="csrf-token"]')?.getAttribute("content") || "",
        "X-Inertia": "true",
        Accept: "application/json",
      },
      body: JSON.stringify({
        name,
        username,
        current_password: currentPassword,
        password: newPassword,
        password_confirmation: confirmPassword,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setSuccess(data.message || "Profil berhasil diperbarui")
          setCurrentPassword("")
          setNewPassword("")
          setConfirmPassword("")
        } else {
          setErrors(data.errors || ["Terjadi kesalahan"])
        }
      })
      .catch(() => setErrors(["Terjadi kesalahan koneksi"]))
      .finally(() => setIsSubmitting(false))
  }

  const backPath = current_user.role === "teacher" ? "/teachers" : current_user.role === "parent" ? "/parent" : "/dashboard"

  return (
    <div className="container mx-auto py-6 px-4 max-w-lg">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.visit(backPath)} className="cursor-pointer -ml-2">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Kembali
        </Button>
      </div>

      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-2xl font-bold">Profil Saya</h1>
          <Badge variant="secondary">{roleLabel[current_user.role] ?? current_user.role}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">Kelola informasi akun dan keamanan login Anda</p>
      </div>

      {success && (
        <Alert className="mb-5">
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {errors.length > 0 && (
        <Alert variant="destructive" className="mb-5">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-disc list-inside space-y-0.5">
              {errors.map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleFetch} className="space-y-5">
        {/* Info Dasar */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="h-4 w-4" />
              Informasi Akun
            </CardTitle>
            <CardDescription className="text-xs">Nama tampilan dan username untuk login</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-1.5">
              <Label htmlFor="name">Nama Lengkap</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nama lengkap"
                required
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="username"
                required
              />
              <p className="text-xs text-muted-foreground">Digunakan untuk login</p>
            </div>
          </CardContent>
        </Card>

        {/* Ubah Password */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <KeyRound className="h-4 w-4" />
              Ubah Password
            </CardTitle>
            <CardDescription className="text-xs">Kosongkan jika tidak ingin mengubah password</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-1.5">
              <Label htmlFor="current_password">Password Saat Ini</Label>
              <Input
                id="current_password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>
            <Separator />
            <div className="grid gap-1.5">
              <Label htmlFor="new_password">Password Baru</Label>
              <Input
                id="new_password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
                autoComplete="new-password"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="confirm_password">Konfirmasi Password Baru</Label>
              <Input
                id="confirm_password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ulangi password baru"
                autoComplete="new-password"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting} className="cursor-pointer min-w-32">
            {isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
          </Button>
        </div>
      </form>
    </div>
  )
}
