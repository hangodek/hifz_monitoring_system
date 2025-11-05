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
        <Card className="w-full max-w-sm border-gray-200/60 shadow-lg">
          <CardHeader>
            <CardTitle>Login to dashboard</CardTitle>
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
                  <Label htmlFor="username">Username</Label>
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
                    <Label htmlFor="password">Password</Label>
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
                  {processing ? 'Logging in...' : 'Login'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </SessionLayout>
    </>
  )
}