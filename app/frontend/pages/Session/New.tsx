import SessionLayout  from "@/pages/Layout/SessionLayout"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import React from "react"
import { useForm, usePage } from "@inertiajs/react"
import { AlertCircle } from "lucide-react"
import matanLogo from "@/assets/matan_logo.png"

export default function Session() {
  const { flash } = usePage().props as {
    flash?: {
      alert?: string
      notice?: string
    }
  }

  const { data, setData, post, processing } = useForm({
    username: '',
    password: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    post('/session')
  }

  return (
    <>
      <SessionLayout>
        <div className="flex flex-col items-center gap-6 w-full max-w-sm">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full blur-2xl opacity-20"></div>
            <img 
              src={matanLogo} 
              alt="MATAN Logo" 
              className="relative w-32 h-32 object-contain"
            />
          </div>
          <Card className="w-full border-0 shadow-2xl bg-gradient-to-br from-white to-blue-50/30">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-center text-2xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-bold">
                Log Masuk ke Papan Pemuka
              </CardTitle>
              <p className="text-center text-sm text-muted-foreground">Sistem Pengurusan Hifz MATAN</p>
            </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <div className="flex flex-col gap-6">
                {flash?.alert && (
                  <Alert variant="destructive" className="border-red-200 bg-red-50">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {flash.alert}
                    </AlertDescription>
                  </Alert>
                )}
                <div className="grid gap-2">
                  <Label htmlFor="username" className="text-gray-700 font-medium">Nama Pengguna</Label>
                  <Input
                    id="username"
                    type="text"
                    onChange={(e) => setData('username', e.target.value)}
                    value={data.username}
                    required
                    autoFocus
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div className="grid gap-2">
                  <div className="flex items-center">
                    <Label htmlFor="password" className="text-gray-700 font-medium">Kata Laluan</Label>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    onChange={(e) => setData('password', e.target.value)}
                    value={data.password}
                    required
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <Button type="submit" className="w-full cursor-pointer bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200" disabled={processing}>
                  {processing ? 'Sedang Log Masuk...' : 'Log Masuk'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
        </div>
      </SessionLayout>
    </>
  )
}