import { useEffect, useRef, useState } from "react"
import { withBasePath } from "@/lib/utils/withBasePath"

type CoverImageProps = {
  src?: string | null
  alt: string
  title: string
  className?: string
}

export default function CoverImage({ src, alt, title, className }: CoverImageProps) {
  const [failed, setFailed] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)
  const imageSrc = !src || failed ? withBasePath("/thumb/default.png") : src

  useEffect(() => {
    setFailed(false)
  }, [src])

  useEffect(() => {
    const img = imgRef.current
    if (img && img.complete && img.naturalWidth === 0) setFailed(true)
  }, [imageSrc])

  // eslint-disable-next-line @next/next/no-img-element
  return (
    <img
      ref={imgRef}
      src={imageSrc}
      alt={alt || title}
      className={className}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  )
}
