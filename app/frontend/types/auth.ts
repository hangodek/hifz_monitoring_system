export interface User {
  id: number
  name: string
  username: string
  role: "pengurus" | "guru" | "orang_tua"
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
}
