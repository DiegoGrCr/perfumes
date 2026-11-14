'use client'

import { useLayoutEffect } from 'react'

/** Resets the window scroll to the top when mounted (used by loading screens). */
export default function ScrollToTop() {
  useLayoutEffect(() => {
    if (!window.location.hash) window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [])
  return null
}
