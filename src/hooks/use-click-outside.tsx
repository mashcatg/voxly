'use client'

import { useEffect, useState } from 'react'

export function useClickOutside(
  ref: React.RefObject<HTMLElement | null>,
  handler: () => void,
  excludeRefs: React.RefObject<HTMLElement | null>[] = []
) {
  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      // If the click was on the ref element or any of its children, do nothing
      if (ref.current && ref.current.contains(event.target as Node)) {
        return
      }

      // If the click was on any of the excluded elements or their children, do nothing
      if (excludeRefs.some(excludeRef => 
        excludeRef.current && excludeRef.current.contains(event.target as Node)
      )) {
        return
      }

      handler()
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [ref, handler, excludeRefs])
}

export function useMediaQuery(query: string) {
  const getMatches = (query: string): boolean => {
    // Prevents SSR issues
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches
    }
    return false
  }

  const [matches, setMatches] = useState(getMatches(query))

  function handleChange() {
    setMatches(getMatches(query))
  }

  useEffect(() => {
    const matchMedia = window.matchMedia(query)

    // Triggered at the first client-side load and if query changes
    handleChange()

    // Listen matchMedia
    if (matchMedia.addListener) {
      matchMedia.addListener(handleChange)
    } else {
      matchMedia.addEventListener('change', handleChange)
    }

    return () => {
      if (matchMedia.removeListener) {
        matchMedia.removeListener(handleChange)
      } else {
        matchMedia.removeEventListener('change', handleChange)
      }
    }
  }, [query])

  return matches
}