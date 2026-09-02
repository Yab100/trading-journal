'use server'

import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type CreateStrategyInput = {
  name: string
  description?: string
}

export async function getStrategies() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return []

  return prisma.strategy.findMany({
    where: {
      userId: user.id,
    },
    include: {
      _count: {
        select: {
          trades: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })
}

export async function createStrategy(input: CreateStrategyInput) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return {
        success: false,
        error: 'Not authenticated',
      }
    }

    await prisma.strategy.create({
      data: {
        name: input.name,
        description: input.description,
        userId: user.id,
      },
    })

    revalidatePath('/strategies')

    return {
      success: true,
    }
  } catch (error) {
    console.error(error)

    return {
      success: false,
      error: 'Failed to create strategy.',
    }
  }
}

export async function updateStrategy(
  id: string,
  input: CreateStrategyInput
) {
  try {
    await prisma.strategy.update({
      where: {
        id,
      },
      data: {
        name: input.name,
        description: input.description,
      },
    })

    revalidatePath('/strategies')

    return {
      success: true,
    }
  } catch (error) {
    console.error(error)

    return {
      success: false,
      error: 'Failed to update strategy.',
    }
  }
}

export async function deleteStrategy(id: string) {
  try {
    await prisma.strategy.delete({
      where: {
        id,
      },
    })

    revalidatePath('/strategies')

    return {
      success: true,
    }
  } catch (error) {
    console.error(error)

    return {
      success: false,
      error: 'Failed to delete strategy.',
    }
  }
}