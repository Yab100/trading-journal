'use server'

import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export interface PsychologyData {
  discipline_rating: number // 1 to 5
  execution_rating: number  // 1 to 5
  emotions: string[]        // e.g. ['FOMO', 'Disciplined', 'Revenge Trade']
  notes?: string
}

async function getCurrentUserId() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    throw new Error('User not authenticated')
  }

  return user.id
}

/**
 * Update mindset & execution ratings for a specific trade
 */
export async function updateTradePsychology(tradeId: string, data: PsychologyData) {
  try {
    const userId = await getCurrentUserId()

    const result = await prisma.trade.updateMany({
      where: {
        id: tradeId,
        userId,
      },
      data: {
        discipline_rating: data.discipline_rating,
        execution_rating: data.execution_rating,
        emotions: data.emotions,
        notes: data.notes ?? null,
      },
    })

    if (result.count === 0) {
      return { success: false, error: 'Trade not found.' }
    }

    revalidatePath('/psychology')
    revalidatePath('/trades')

    return { success: true }
  } catch (err) {
    console.error('Server Action Error:', err)
    return { success: false, error: 'Failed to save psychology log.' }
  }
}