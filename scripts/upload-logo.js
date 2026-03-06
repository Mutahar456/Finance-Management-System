/*
  Usage (PowerShell):
  node scripts/upload-logo.js public/logo-B_tVnsiG.png
*/
require('dotenv').config()
const path = require('path')
const { v2: cloudinary } = require('cloudinary')

const file = process.argv[2]
if (!file) {
  console.error('Usage: node scripts/upload-logo.js <path-to-image>')
  process.exit(1)
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

async function main() {
  try {
    const upload = await cloudinary.uploader.upload(file, {
      folder: 'infinity-wave-branding',
      public_id: 'logo',
      overwrite: true,
      resource_type: 'image',
    })
    console.log('Uploaded:', upload.secure_url)
    console.log('Add to .env as:')
    console.log('LOGO_URL="' + upload.secure_url + '"')
  } catch (e) {
    console.error('Upload failed:', e?.message || e)
    process.exit(1)
  }
}

main()


