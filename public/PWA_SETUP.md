# PWA Icons Setup Guide

## Required Icons

Your PWA needs the following icon files in the `/public` directory:

- `icon-192x192.png` (192x192 pixels)
- `icon-256x256.png` (256x256 pixels)
- `icon-384x384.png` (384x384 pixels)
- `icon-512x512.png` (512x512 pixels)

## How to Generate Icons

1. **Create a base icon** (recommended size: 512x512px) with your logo/branding
2. **Use an online tool** to generate all sizes:
   - https://realfavicongenerator.net/
   - https://www.pwabuilder.com/imageGenerator
   - https://favicon.io/favicon-generator/

3. **Or use ImageMagick** (command line):
   ```bash
   convert your-icon.png -resize 192x192 icon-192x192.png
   convert your-icon.png -resize 256x256 icon-256x256.png
   convert your-icon.png -resize 384x384 icon-384x384.png
   convert your-icon.png -resize 512x512 icon-512x512.png
   ```

## Icon Requirements

- **Format**: PNG
- **Shape**: Square (1:1 aspect ratio)
- **Background**: Transparent or solid color
- **Content**: Should be recognizable at small sizes
- **Maskable**: Icons should work well when masked (rounded corners)

## Temporary Solution

Until you add proper icons, the app will work but may show a default icon when installed. You can use your existing logo (`logo-B_tVnsiG.png`) as a starting point.

## Testing

After adding icons:
1. Build the app: `npm run build`
2. Test installation on:
   - **Chrome/Edge Desktop**: Look for install button in address bar
   - **Chrome Mobile**: "Add to Home Screen" prompt
   - **Safari iOS**: Share → Add to Home Screen




