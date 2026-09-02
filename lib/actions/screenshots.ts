'use server'

import { revalidatePath } from 'next/cache'

import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

export interface UploadScreenshotInput {
  tradeId: string
  file: File
  phase?: 'ENTRY' | 'EXIT'
  timeframe?: string
}

export async function uploadScreenshot(input: UploadScreenshotInput) {
  try {
    const supabase = await createClient()

    const extension = input.file.name.split('.').pop()
    const fileName = `${crypto.randomUUID()}.${extension}`
    const filePath = `${input.tradeId}/${fileName}`

    const { error } = await supabase.storage
      .from('trade-screenshots')
      .upload(filePath, input.file, {
        upsert: false,
      })
      console.log('Storage upload error:', error)

    if (error) {
      return {
        success: false,
        error: error.message,
      }
    }
    console.log('Creating database record...')
    await prisma.tradeScreenshot.create({
      data: {
        tradeId: input.tradeId,
        phase: input.phase,
        timeframe: input.timeframe?.trim() || null,
        url: filePath, // Store storage path, not a public URL
      },
    })
    console.log('Database record created')

    revalidatePath(`/trades/${input.tradeId}`)

    return {
      success: true,
    }
  } catch (error) {
    console.error(error)

    return {
      success: false,
      error: 'Failed to upload screenshot.',
    }
  }
}

export async function getTradeScreenshots(tradeId: string) {
  return prisma.tradeScreenshot.findMany({
    where: {
      tradeId,
    },
    orderBy: {
      createdAt: 'asc',
    },
  })
}

export async function getScreenshotUrl(path: string) {
  const supabase = await createClient()

  const { data, error } = await supabase.storage
    .from('trade-screenshots')
    .createSignedUrl(path, 60 * 60) // 1 hour

  if (error) {
    return null
  }

  return data.signedUrl
}

export async function deleteScreenshot(id: string) {
  try {
    const screenshot = await prisma.tradeScreenshot.findUnique({
      where: {
        id,
      },
    })

    if (!screenshot) {
      return {
        success: false,
        error: 'Screenshot not found.',
      }
    }

    const supabase = await createClient()

    const { error } = await supabase.storage
      .from('trade-screenshots')
      .remove([screenshot.url])

    if (error) {
      return {
        success: false,
        error: error.message,
      }
    }

    await prisma.tradeScreenshot.delete({
      where: {
        id,
      },
    })

    revalidatePath(`/trades/${screenshot.tradeId}`)

    return {
      success: true,
    }
  } catch (error) {
    console.error(error)

    return {
      success: false,
      error: 'Failed to delete screenshot.',
    }
  }
}