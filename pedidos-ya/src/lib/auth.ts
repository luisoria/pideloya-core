import { cookies } from "next/headers"
import { SignJWT, jwtVerify } from "jose"

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "default_local_secret_change_me_in_prod")

export async function getSession() {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get("auth_session")?.value
    if (!sessionCookie) return null

    try {
        const { payload } = await jwtVerify(sessionCookie, SECRET)
        // Ensure standard claims exist
        if (!payload.sub || !payload.sessionId) return null
        return payload as any
    } catch (e) {
        return null
    }
}

export async function createSession(data: any) {
    const sessionId = crypto.randomUUID()
    
    const session = await new SignJWT({ ...data, sessionId })
        .setProtectedHeader({ alg: "HS256" })
        .setSubject(data.id.toString())
        .setJti(sessionId)
        .setIssuedAt()
        .setExpirationTime("2h")
        .sign(SECRET)

    const cookieStore = await cookies()
    cookieStore.set("auth_session", session, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: 7200 // 2 hours in seconds
    })
    return session
}

export async function deleteSession() {
    const cookieStore = await cookies()
    cookieStore.delete("auth_session")
}
