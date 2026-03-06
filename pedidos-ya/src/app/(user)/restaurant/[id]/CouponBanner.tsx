"use client"

import { useState } from "react"
import { Tag, Copy, CheckCircle2 } from "lucide-react"

export function CouponBanner({ coupon }: { coupon: any }) {
    const [copied, setCopied] = useState(false)

    const handleCopy = () => {
        navigator.clipboard.writeText(coupon.code)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm relative overflow-hidden group">
            {/* Decoration */}
            <div className="absolute -right-6 -top-6 text-red-100 opacity-50 transform group-hover:scale-110 transition-transform duration-500">
                <Tag className="w-32 h-32" />
            </div>

            <div className="flex flex-row items-center gap-4 relative z-10 w-full sm:w-auto">
                <div className="bg-red-600 p-3 rounded-xl shadow-md shrink-0">
                    <Tag className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h3 className="text-red-900 font-black text-lg flex items-center gap-2 uppercase tracking-wide">
                        {coupon.description}
                    </h3>
                    <p className="text-red-700 font-medium text-sm mt-0.5">
                        Mínimo de compra: <span className="font-bold">${coupon.minOrderAmount}</span>
                    </p>
                </div>
            </div>

            <div className="relative z-10 w-full sm:w-auto flex flex-col items-stretch sm:items-end gap-1">
                <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest px-1">Usa este código:</span>
                <button
                    onClick={handleCopy}
                    className="flex flex-row items-center justify-between sm:justify-center gap-3 bg-white border-2 border-dashed border-red-300 hover:border-red-500 px-4 py-2 rounded-xl transition-all active:scale-95 group/btn"
                >
                    <span className="font-mono font-black text-lg tracking-wider text-red-700">{coupon.code}</span>
                    {copied ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : (
                        <Copy className="w-5 h-5 text-red-400 group-hover/btn:text-red-600 transition-colors" />
                    )}
                </button>
            </div>
        </div>
    )
}
