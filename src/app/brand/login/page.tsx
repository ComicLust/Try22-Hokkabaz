import { Suspense } from 'react'
import BrandLoginClient from './BrandLoginClient'

export default function BrandLoginPage() {
  return (
    <Suspense>
      <BrandLoginClient />
    </Suspense>
  )
}