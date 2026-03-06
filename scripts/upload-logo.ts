/*
  Usage (PowerShell):
  npx ts-node scripts/upload-logo.ts public/logo-B_tVnsiG.png

  Outputs a Cloudinary secure URL you can place in .env as LOGO_URL
*/
import { v2 as cloudinary } from 'cloudinary'
import path from 'path'

const file = process.argv[2]
if (!file) {
  console.error('Usage: ts-node scripts/upload-logo.ts <path-to-image>')
  process.exit(1)
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

async function main() {
  const upload = await cloudinary.uploader.upload(file, {
    folder: 'infinity-wave-branding',
    public_id: 'logo',
    overwrite: true,
    resource_type: 'image',
  })
  console.log('Uploaded:', upload.secure_url)
  console.log('Set LOGO_URL in .env to this value')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})


