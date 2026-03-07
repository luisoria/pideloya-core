import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendAbandonedCartEmail } from '@/lib/mail'

export async function GET(req: Request) {
    // Basic security check for CRON jobs
    const { searchParams } = new URL(req.url)
    const key = searchParams.get('key')
    
    // In production, you would use process.env.CRON_SECRET
    if (process.env.NODE_ENV === 'production' && key !== process.env.CRON_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const now = new Date()
        
        // Fetch draft orders that haven't reached the final reminder level (4 reminders total)
        const abandonedOrders = await prisma.order.findMany({
            where: {
                status: 'DRAFT',
                reminderLevel: { lt: 4 }
            },
            include: {
                customer: {
                    select: {
                        name: true,
                        email: true
                    }
                }
            }
        })

        let sentCount = 0

        for (const order of abandonedOrders) {
            const hoursElapsed = (now.getTime() - order.createdAt.getTime()) / (1000 * 60 * 60)
            
            let targetLevel = 0
            
            // Logic based on requested intervals: 4h, 24h, 36h, 72h
            if (hoursElapsed >= 72) {
                targetLevel = 4
            } else if (hoursElapsed >= 36) {
                targetLevel = 3
            } else if (hoursElapsed >= 24) {
                targetLevel = 2
            } else if (hoursElapsed >= 4) {
                targetLevel = 1
            }

            // Only send if we are moving up a level
            if (targetLevel > order.reminderLevel) {
                console.log(`[ABANDONED CRON] Sending Level ${targetLevel} to ${order.customer.email} (Elapsed: ${hoursElapsed.toFixed(1)}h)`)
                
                await sendAbandonedCartEmail(order)
                
                await prisma.order.update({
                    where: { id: order.id },
                    data: { reminderLevel: targetLevel }
                })
                
                sentCount++
            }
        }

        return NextResponse.json({ 
            success: true, 
            processed: abandonedOrders.length, 
            emailsSent: sentCount 
        })

    } catch (error: any) {
        console.error('[CRON ERROR]', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
