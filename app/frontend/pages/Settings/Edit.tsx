import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, Image as ImageIcon, Type, CheckCircle2 } from "lucide-react"
import { router, usePage } from "@inertiajs/react"

interface AppSetting {
  id: number
  app_name: string
  app_subtitle: string
  institution_name: string | null
  logo_url: string
  has_logo: boolean
}

interface SettingsEditProps {
  setting: AppSetting
  errors?: string[]
}

export default function SettingsEdit({ setting: initialSetting, errors }: SettingsEditProps) {
  const { flash } = usePage().props as {
    flash?: {
      notice?: string
      alert?: string
    }
  }
  
  const [setting, setSetting] = useState(initialSetting)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setLogoFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const formData = new FormData()
    formData.append('app_setting[app_name]', setting.app_name)
    formData.append('app_setting[app_subtitle]', setting.app_subtitle)
    formData.append('app_setting[institution_name]', setting.institution_name || '')
    
    if (logoFile) {
      formData.append('app_setting[logo]', logoFile)
    }

    router.patch('/settings', formData, {
      forceFormData: true,
      preserveScroll: true,
      onFinish: () => setIsSubmitting(false),
      onSuccess: () => {
        setLogoFile(null)
        setLogoPreview(null)
      }
    })
  }

  const currentLogoUrl = logoPreview || setting.logo_url

  return (
    <div className="container mx-auto py-6 px-4 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          Pengaturan Aplikasi
        </h1>
        <p className="text-muted-foreground mt-1">
          Kelola pengaturan dan tampilan aplikasi Anda
        </p>
      </div>

      {flash?.notice && (
        <Alert className="mb-6 border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            {flash.notice}
          </AlertDescription>
        </Alert>
      )}

      {errors && errors.length > 0 && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>
            <ul className="list-disc list-inside">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Logo Section */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-blue-50/30 hover:shadow-xl transition-shadow duration-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Logo Institusi
              </CardTitle>
              <CardDescription>
                Upload logo institusi Anda (PNG, JPG, atau SVG, maks 5MB)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-6">
                <div className="relative">
                  <div className="w-32 h-32 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-gray-50">
                    {currentLogoUrl ? (
                      <img
                        src={currentLogoUrl}
                        alt="Logo Preview"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <ImageIcon className="h-12 w-12 text-gray-400" />
                    )}
                  </div>
                </div>
                <div className="flex-1">
                  <Label htmlFor="logo" className="cursor-pointer">
                    <div className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors w-fit">
                      <Upload className="h-4 w-4" />
                      {setting.has_logo ? 'Ganti Logo' : 'Upload Logo'}
                    </div>
                    <Input
                      id="logo"
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/svg+xml"
                      onChange={handleLogoChange}
                      className="hidden"
                    />
                  </Label>
                  {logoFile && (
                    <p className="text-sm text-green-600 mt-2">
                      File dipilih: {logoFile.name}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Application Info Section */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-green-50/30 hover:shadow-xl transition-shadow duration-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Type className="h-5 w-5" />
                Informasi Aplikasi
              </CardTitle>
              <CardDescription>
                Sesuaikan nama dan deskripsi aplikasi
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="app_name">Nama Aplikasi</Label>
                <Input
                  id="app_name"
                  type="text"
                  value={setting.app_name}
                  onChange={(e) => setSetting({ ...setting, app_name: e.target.value })}
                  placeholder="Sistem Manajemen Hifz"
                  required
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="app_subtitle">Subtitle Aplikasi</Label>
                <Input
                  id="app_subtitle"
                  type="text"
                  value={setting.app_subtitle}
                  onChange={(e) => setSetting({ ...setting, app_subtitle: e.target.value })}
                  placeholder="Sistem Monitoring Hafalan"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="institution_name">Nama Institusi</Label>
                <Input
                  id="institution_name"
                  type="text"
                  value={setting.institution_name || ''}
                  onChange={(e) => setSetting({ ...setting, institution_name: e.target.value })}
                  placeholder="Contoh: Ma'had MATAN, Universitas Islam, dll"
                />
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.visit('/dashboard')}
              className="cursor-pointer"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Menyimpan...
                </>
              ) : (
                'Simpan Pengaturan'
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
