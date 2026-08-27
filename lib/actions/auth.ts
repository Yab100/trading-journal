'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const supabase = await createClient()

  const { error } =
    await supabase.auth.signInWithPassword({
      email,
      password,
    })

  if (error) {
    redirect(
      `/login?error=${encodeURIComponent(
        error.message
      )}`
    )
  }

  revalidatePath('/', 'layout')

  redirect('/trades')
}

export async function signup(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  let redirectPath: string | null = null

  try {
    const supabase = await createClient()

    const { error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      redirectPath = `/signup?error=${encodeURIComponent(error.message)}`
    } else {
      redirectPath = `/login?message=${encodeURIComponent('Check your email to confirm your account.')}`
    }
  } catch (err: unknown) {
    console.error('Signup Error:', err)
    redirectPath = `/signup?error=${encodeURIComponent('Could not connect to Supabase. Check your .env.local variables.')}`
  }

  if (redirectPath) {
    revalidatePath('/', 'layout')
    redirect(redirectPath)
  }
}

export async function signOut() {
  try {
    const supabase = await createClient()
    await supabase.auth.signOut()
  } catch (err) {
    console.error('SignOut Error:', err)
  }

  revalidatePath('/', 'layout')
  redirect('/login')
}