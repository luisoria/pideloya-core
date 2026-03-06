"use client"

import { useState } from "react"

interface ClientImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    fallbackSrc: string
}

export function ClientImage({ fallbackSrc, src, alt, ...props }: ClientImageProps) {
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
