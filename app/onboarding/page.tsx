import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { isOnboarded } from '@/lib/data/profile'
import { OnboardingForm } from './OnboardingForm'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Player Setup',
  description: 'Set your bodyweight, sex and rest timer before your placements.',
}

export default function OnboardingPage() {
  if (isOnboarded()) redirect('/')
  return <OnboardingForm />
}
