// @ts-check

const { MongoClient, ServerApiVersion } = require('mongodb')

const uri = `mongodb+srv://admin:${process.env.MONGO_PASSWORD}@cluster0.cpyqv.mongodb.net/?retryWrites=true&w=majority`

const client = new MongoClient(uri, {
  serverApi: ServerApiVersion.v1,
})

async function main() {
  await client.connect()

  const users = client.db('node_test').collection('users')

  // 실행할 때마다 collection을 비우도록 처리
  await users.deleteMany({})
  await users.insertMany([
    {
      name: 'Foo',
      birthYear: 2000,
    },
    {
      name: 'Bar',
      birthYear: 1995,
    },
    {
      name: 'Baz',
      birthYear: 1990,
    },
  ])

  // return 값은 Cursor이며 비동기가 아님
  const cursor = users.find({
    // birthYear: 1995,
    birthYear: {
      // birthYear가 1995 이상
      $gte: 1995, // greate or equal
    },
  })
  await cursor.forEach(console.log)

  // update
  // await users.updateOne(
  //   {
  //     name: 'Baz',
  //   },
  //   {
  //     $set: {
  //       name: 'Boo',
  //     },
  //   }
  // )

  await client.close()
}

main()
