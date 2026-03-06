import { NextResponse } from "next/server"
import { v2 as cloudinary } from "cloudinary"

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    // Get Cloudinary credentials
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim() || 'dudgqptv4'
    const apiKey = process.env.CLOUDINARY_API_KEY?.trim() || ''
    const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim() || ''

    if (!apiKey || !apiSecret) {
      return NextResponse.json(
        { error: 'Cloudinary not configured. Please set environment variables in Vercel.' },
        { status: 500 }
      )
    }

    // Configure Cloudinary
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    })

    // Get file from form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Convert to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Upload to Cloudinary using base64 (simplest method)
    const base64 = buffer.toString('base64')
    const dataURI = `data:${file.type};base64,${base64}`

    const result = await cloudinary.uploader.upload(dataURI, {
      folder: 'infinity-wave/inventory',
      resource_type: 'auto',
    })

    return NextResponse.json({ url: result.secure_url })
  } catch (error: any) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { 
        error: error.message || 'Upload failed',
        details: 'Check Vercel logs for more details'
      },
      { status: 500 }
    )
  }
}


