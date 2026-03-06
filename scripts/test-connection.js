const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testConnection() {
  try {
    console.log('Testing database connection...')
    console.log('')
    
    // Test connection by querying user count
    const userCount = await prisma.user.count()
    console.log('✓ Database connection successful!')
    console.log(`✓ Found ${userCount} user(s) in database`)
    console.log('')
    console.log('Connection details:')
    const dbUrl = process.env.DATABASE_URL
    if (dbUrl) {
      const url = new URL(dbUrl.replace('mysql://', 'http://'))
      console.log(`  Host: ${url.hostname}`)
      console.log(`  Port: ${url.port}`)
      console.log(`  Database: ${url.pathname.replace('/', '')}`)
      console.log(`  SSL: ${url.search.includes('sslaccept') ? 'Enabled' : 'Disabled'}`)
    }
    console.log('')
    process.exit(0)
  } catch (error) {
    console.error('✗ Database connection failed!')
    console.error('')
    console.error('Error details:')
    console.error(error.message)
    console.error('')
    
    if (error.message.includes('certificate')) {
      console.error('SSL Certificate Error Detected!')
      console.error('')
      console.error('Try these solutions:')
      console.error('1. Make sure DATABASE_URL uses: ?sslaccept=accept_invalid_certs')
      console.error('2. Or try: ?sslaccept=strict (if you have CA certificate)')
      console.error('3. Download CA certificate from Aiven and configure it')
    }
    
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

testConnection()





