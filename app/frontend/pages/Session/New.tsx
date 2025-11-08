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
import matanLogo from "@/assets/matan_logo.jpeg"

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
          <img 
            src={matanLogo} 
            alt="MATAN Logo" 
            className="w-32 h-32 object-contain"
          />
          <Card className="w-full border-gray-200/60 shadow-lg">
            <CardHeader>
              <CardTitle className="text-center">Log Masuk ke Papan Pemuka</CardTitle>
            </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <div className="flex flex-col gap-6">
                {flash?.alert && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {flash.alert}
                    </AlertDescription>
                  </Alert>
                )}
                <div className="grid gap-2">
                  <Label htmlFor="username">Nama Pengguna</Label>
                  <Input
                    id="username"
                    type="text"
                    onChange={(e) => setData('username', e.target.value)}
                    value={data.username}
                    required
                    autoFocus
                  />
                </div>
                <div className="grid gap-2">
                  <div className="flex items-center">
                    <Label htmlFor="password">Kata Laluan</Label>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    onChange={(e) => setData('password', e.target.value)}
                    value={data.password}
                    required
                  />
                </div>
                <Button type="submit" className="w-full cursor-pointer" disabled={processing}>
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