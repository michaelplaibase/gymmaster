import { redirect } from 'next/navigation'
import { isOnboarded } from '@/lib/data/profile'
import { OnboardingForm } from './OnboardingForm'

export const dynamic = 'force-dynamic'

export default function OnboardingPage() {
  if (isOnboarded()) redirect('/')
  return <OnboardingForm />
}
