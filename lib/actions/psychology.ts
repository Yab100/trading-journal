'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface PsychologyData {
  discipline_rating: number // 1 to 5
  execution_rating: number  // 1 to 5
  emotions: string[]        // e.g. ['FOMO', 'Disciplined', 'Revenge Trade']
  notes?: string
}

/**
 * Update mindset & execution ratings for a specific trade
 */
export async function updateTradePsychology(tradeId: string, data: PsychologyData) {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('trades')
      .update({
        discipline_rating: data.discipline_rating,
        execution_rating: data.execution_rating,
        emotions: data.emotions,
        notes: data.notes,
      })
      .eq('id', tradeId)

    if (error) {
      console.error('Supabase Psychology Update Error:', error.message)
      return { success: false, error: error.message }
    }

    revalidatePath('/psychology')
    revalidatePath('/trades')

    return { success: true }
  } catch (err) {
    console.error('Server Action Error:', err)
    return { success: false, error: 'Failed to save psychology log.' }
  }
}