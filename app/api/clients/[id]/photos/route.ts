import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { supabase } from '@/lib/supabase'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: clientId } = await params

  const photos = await db.clientPhoto.findMany({
    where: { clientId },
    include: { appointment: { select: { id: true, service: true, date: true } } },
    orderBy: { createdAt: 'desc' },
  })

  const photosWithUrls = await Promise.all(
    photos.map(async (photo) => {
      const { data } = await supabase.storage
        .from('client-photos')
        .createSignedUrl(photo.storageKey, 3600)
      return {
        id: photo.id,
        url: data?.signedUrl ?? null,
        createdAt: photo.createdAt,
        appointmentId: photo.appointmentId,
        service: photo.appointment?.service ?? null,
        date: photo.appointment?.date ?? null,
      }
    })
  )

  const groupMap = new Map<string | null, typeof photosWithUrls>()
  for (const p of photosWithUrls) {
    const key = p.appointmentId ?? null
    if (!groupMap.has(key)) groupMap.set(key, [])
    groupMap.get(key)!.push(p)
  }

  const appointmentGroups = Array.from(groupMap.entries())
    .filter(([key]) => key !== null)
    .map(([appointmentId, groupPhotos]) => ({
      appointmentId,
      service: groupPhotos[0].service,
      date: groupPhotos[0].date,
      photos: groupPhotos,
    }))
    .sort((a, b) => new Date(b.date!).getTime() - new Date(a.date!).getTime())

  const unlinkedPhotos = groupMap.get(null) ?? []
  const groups = unlinkedPhotos.length > 0
    ? [...appointmentGroups, { appointmentId: null, service: null, date: null, photos: unlinkedPhotos }]
    : appointmentGroups

  return NextResponse.json({ groups, allPhotos: photosWithUrls })
}

export async function POST(req: Request, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: clientId } = await params
  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const appointmentId = (formData.get('appointmentId') as string | null) || null

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  if (!file.type.startsWith('image/')) return NextResponse.json({ error: 'File must be an image' }, { status: 400 })
  if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: 'File too large' }, { status: 400 })

  if (appointmentId) {
    const appt = await db.appointment.findUnique({ where: { id: appointmentId } })
    if (!appt || appt.clientId !== clientId) {
      return NextResponse.json({ error: 'Invalid appointmentId' }, { status: 400 })
    }
  }

  const photoId = crypto.randomUUID()
  const storageKey = `${clientId}/${photoId}.webp`

  const bytes = await file.arrayBuffer()
  const { error: uploadError } = await supabase.storage
    .from('client-photos')
    .upload(storageKey, bytes, { contentType: 'image/webp', upsert: false })

  if (uploadError) return NextResponse.json({ error: 'Upload failed' }, { status: 500 })

  try {
    const photo = await db.clientPhoto.create({
      data: { id: photoId, clientId, appointmentId, storageKey },
    })
    const { data: signedData } = await supabase.storage
      .from('client-photos')
      .createSignedUrl(storageKey, 3600)
    return NextResponse.json({ id: photo.id, signedUrl: signedData?.signedUrl ?? null }, { status: 201 })
  } catch {
    await supabase.storage.from('client-photos').remove([storageKey])
    return NextResponse.json({ error: 'Failed to save photo record' }, { status: 500 })
  }
}
