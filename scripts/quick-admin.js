const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

// Generate secure random password
function generatePassword(length = 16) {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const lowercase = 'abcdefghijklmnopqrstuvwxyz'
  const numbers = '0123456789'
  const symbols = '!@#$%^&*'
  const all = uppercase + lowercase + numbers + symbols
  
  let password = ''
  // Ensure at least one of each type
  password += uppercase[Math.floor(Math.random() * uppercase.length)]
  password += lowercase[Math.floor(Math.random() * lowercase.length)]
  password += numbers[Math.floor(Math.random() * numbers.length)]
  password += symbols[Math.floor(Math.random() * symbols.length)]
  
  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += all[Math.floor(Math.random() * all.length)]
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('')
}

async function main() {
  const args = process.argv.slice(2)
  const email = args[0] || 'admin@example.com'
  const name = args[1] || 'Admin User'

  console.log('========================================')
  console.log('Creating/Updating Admin User')
  console.log('========================================')
  console.log('')

  try {
    const password = generatePassword(16)
    const hashedPassword = await bcrypt.hash(password, 10)

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      // Update existing user
      await prisma.user.update({
        where: { email },
        data: {
          password: hashedPassword,
          role: 'ADMIN',
          isActive: true,
        },
      })

      console.log('✓ Admin password updated successfully!')
    } else {
      // Create new admin user
      await prisma.user.create({
        data: {
          email,
          name,
          password: hashedPassword,
          role: 'ADMIN',
          isActive: true,
        },
      })

      console.log('✓ Admin user created successfully!')
    }

    console.log('')
    console.log('Admin Credentials:')
    console.log('==================')
    console.log(`Email:    ${email}`)
    console.log(`Name:     ${name}`)
    console.log(`Password: ${password}`)
    console.log(`Role:     ADMIN`)
    console.log('')
    console.log('⚠️  Please save these credentials securely!')
    console.log('')
  } catch (error) {
    console.error('✗ Error:', error.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()





