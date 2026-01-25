export interface User {
  id: number
  name: string
  username: string
  role: "admin" | "teacher" | "parent"
}

export interface Auth {
  user: User
}

export interface PageProps {
  auth?: Auth
  flash?: {
    alert?: string
    notice?: string
  }
  [key: string]: any
}
