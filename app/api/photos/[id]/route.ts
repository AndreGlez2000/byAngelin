import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { supabase } from '@/lib/supabase'

type Params = { params: Promise<{ id: string }> }

export async function DELETE(_req: Request, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const photo = await db.clientPhoto.findUnique({ where: { id } })
  if (!photo) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await supabase.storage.from('client-photos').remove([photo.storageKey])
  await db.clientPhoto.delete({ where: { id } })

  return new NextResponse(null, { status: 204 })
}
