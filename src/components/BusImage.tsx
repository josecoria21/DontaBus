import { useState } from 'react'
import { getBusImageUrl } from '../lib/busImage'

interface Props {
  routeNum: string
  alt: string
  className?: string
}

export function BusImage({ routeNum, alt, className = '' }: Props) {
  const [failed, setFailed] = useState(false)
  const [loaded, setLoaded] = useState(false)

  if (failed) return null

  return (
    <img
      src={getBusImageUrl(routeNum)}
      alt={alt}
      className={`object-cover transition-opacity duration-200 ${loaded ? 'opacity-100' : 'opacity-0'} ${className}`}
      loading="lazy"
      onError={() => setFailed(true)}
      onLoad={() => setLoaded(true)}
    />
  )
}
