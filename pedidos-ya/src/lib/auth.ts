import { cookies } from "next/headers"

export async function getSession() {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get("auth_session")?.value
    if (!sessionCookie) return null

    try {
        return JSON.parse(sessionCookie)
    } catch (e) {
        return null
    }
}
