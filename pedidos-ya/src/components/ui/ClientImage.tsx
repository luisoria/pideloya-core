"use client"

import { useState } from "react"

interface ClientImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    fallbackSrc?: string
}

export function ClientImage({ fallbackSrc = "https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=800&q=80", src, alt, ...props }: ClientImageProps) {
    const [imgSrc, setImgSrc] = useState(src || fallbackSrc)

    return (
        <img
            {...props}
            src={imgSrc}
            alt={alt}
            onError={() => {
                if (imgSrc !== fallbackSrc) {
                    setImgSrc(fallbackSrc)
                }
            }}
        />
    )
}
