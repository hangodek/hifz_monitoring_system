export interface User {
  id: number
  name: string
  username: string
  role: "admin" | "teacher" | "parent"
}

export interface Auth {
  user: User
}

export interface AppSettings {
  app_name: string
  app_subtitle: string
  institution_name: string | null
  logo_url: string | null
}

export interface PageProps {
  auth?: Auth
  app_settings: AppSettings
  flash?: {
    alert?: string
    notice?: string
  }
  [key: string]: any
}
