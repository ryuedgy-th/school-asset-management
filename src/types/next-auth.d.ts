import { DefaultSession } from "next-auth"
import { Role, Department } from "@prisma/client"

declare module "next-auth" {
    interface Session {
        user: {
            id: string
            role: string
            userRole?: Role | null
            userDepartment?: Department | null
        } & DefaultSession["user"]
    }

    interface User {
        role: string
        userRole?: Role | null
        userDepartment?: Department | null
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        userId?: string
        role?: string
    }
}
