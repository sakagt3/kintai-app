import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  // テストユーザーを作成または更新
  const user = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {
      password: 'password123', // ここに設定したいパスワードを書く
    },
    create: {
      email: 'test@example.com',
      name: 'テスト太郎',
      password: 'password123',
    },
  })

  console.log('User created or updated:', user)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })