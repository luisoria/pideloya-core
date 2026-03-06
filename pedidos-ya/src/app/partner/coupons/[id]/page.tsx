import { getCouponAnalytics } from "@/app/actions/coupons"
import { redirect } from "next/navigation"
import { CouponDetailClient } from "./CouponDetailClient"

export default async function CouponDetailPage({ params }: { params: { id: string } }) {
    const data: any = await getCouponAnalytics(params.id)

    if (data.error || !data.coupon) {
        redirect("/partner/coupons")
    }

    return (
        <div className="bg-gray-50 min-h-screen pb-12">
            <CouponDetailClient coupon={data.coupon} totalDiscounted={data.totalDiscounted} />
        </div>
    )
}
