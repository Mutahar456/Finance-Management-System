import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import * as readline from 'readline'

const prisma = new PrismaClient()

// Generate secure random password
function generatePassword(length: number = 16): string {
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

// Readline interface for user input
function askQuestion(query: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  return new Promise((resolve) => {
    rl.question(query, (answer) => {
      rl.close()
      resolve(answer)
    })
  })
}

async function main() {
  console.log('========================================')
  console.log('Admin User Creation/Update Tool')
  console.log('========================================')
  console.log('')

  try {
    // Get email
    const email = await askQuestion('Enter admin email: ')
    if (!email || !email.includes('@')) {
      console.error('Invalid email address')
      process.exit(1)
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      console.log(`\nUser with email ${email} already exists.`)
      const update = await askQuestion('Do you want to update the password? (y/n): ')
      
      if (update.toLowerCase() !== 'y') {
        console.log('Operation cancelled.')
        process.exit(0)
      }

      // Update existing user
      const generate = await askQuestion('Generate new password? (y/n): ')
      let password: string

      if (generate.toLowerCase() === 'y') {
        password = generatePassword(16)
        console.log(`\nGenerated password: ${password}`)
      } else {
        password = await askQuestion('Enter new password (min 6 characters): ')
        if (password.length < 6) {
          console.error('Password must be at least 6 characters')
          process.exit(1)
        }
      }

      const hashedPassword = await bcrypt.hash(password, 10)
      
      // Update user to admin if not already
      await prisma.user.update({
        where: { email },
        data: {
          password: hashedPassword,
          role: 'ADMIN',
          isActive: true,
        },
      })

      console.log('\n✓ Admin password updated successfully!')
      console.log(`Email: ${email}`)
      console.log(`Password: ${password}`)
      console.log('Role: ADMIN')
    } else {
      // Create new admin user
      const name = await askQuestion('Enter admin name: ')
      if (!name || name.trim().length === 0) {
        console.error('Name is required')
        process.exit(1)
      }

      const generate = await askQuestion('Generate secure password? (y/n): ')
      let password: string

      if (generate.toLowerCase() === 'y') {
        password = generatePassword(16)
        console.log(`\nGenerated password: ${password}`)
      } else {
        password = await askQuestion('Enter password (min 6 characters): ')
        if (password.length < 6) {
          console.error('Password must be at least 6 characters')
          process.exit(1)
        }
      }

      const hashedPassword = await bcrypt.hash(password, 10)

      await prisma.user.create({
        data: {
          email,
          name: name.trim(),
          password: hashedPassword,
          role: 'ADMIN',
          isActive: true,
        },
      })

      console.log('\n✓ Admin user created successfully!')
      console.log(`Email: ${email}`)
      console.log(`Name: ${name}`)
      console.log(`Password: ${password}`)
      console.log('Role: ADMIN')
    }

    console.log('\n⚠️  Please save these credentials securely!')
  } catch (error) {
    console.error('\n✗ Error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()





