import { getPartnerData } from "@/app/partner/actions"
import { redirect } from "next/navigation"
import { CouponWizard } from "./CouponWizard"

export default async function CreateCouponPage() {
    // We use getPartnerData to get the restaurant and its products
    const data: any = await getPartnerData()

    if (data.error || !data.restaurant) {
        redirect("/partner")
    }

    return (
        <div className="bg-gray-50 min-h-screen pb-12">
            <CouponWizard products={data.restaurant.products} />
        </div>
    )
}
