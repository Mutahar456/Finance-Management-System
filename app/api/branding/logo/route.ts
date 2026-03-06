import { NextResponse } from "next/server"
import { v2 as cloudinary } from "cloudinary"

// Validate and trim Cloudinary credentials before configuring
const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim()
const apiKey = process.env.CLOUDINARY_API_KEY?.trim()
const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim()

if (!cloudName || !apiKey || !apiSecret) {
  console.error('Cloudinary credentials are not properly configured')
}

if (cloudName && apiKey && apiSecret) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  })
}

export async function POST(request: Request) {
  try {
    // Check if Cloudinary is properly configured
    if (!cloudName || !apiKey || !apiSecret) {
      return NextResponse.json(
        { error: 'Image upload service is not configured. Please check Cloudinary environment variables.' },
        { status: 503 }
      )
    }

    const body = await request.json().catch(() => ({} as any))
    const { imageBase64, imageUrl } = body as { imageBase64?: string; imageUrl?: string }
    if (!imageBase64 && !imageUrl) {
      return NextResponse.json({ error: "imageBase64 or imageUrl is required" }, { status: 400 })
    }

    const uploadResult = await cloudinary.uploader.upload(imageBase64 || imageUrl!, {
      folder: "infinity-wave-branding",
      public_id: "logo",
      overwrite: true,
      resource_type: "image",
    })

    return NextResponse.json({ url: uploadResult.secure_url })
  } catch (e: any) {
    console.error("Logo upload error:", e)
    const errorMessage = e?.message || 'Upload failed'
    const statusCode = e?.http_code === 401 ? 401 : 500
    return NextResponse.json(
      { 
        error: errorMessage, 
        details: e?.http_code === 401 
          ? 'Invalid Cloudinary credentials. Please check your CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET environment variables.' 
          : 'Upload failed' 
      },
      { status: statusCode }
    )
  }
}


