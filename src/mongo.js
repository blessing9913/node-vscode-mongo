// @ts-check

const { MongoClient, ServerApiVersion } = require('mongodb')

const dotenv = require('dotenv')

let path
switch (process.env.NODE_ENV) {
  case 'prod':
    path = `${__dirname}/../.env.prod`
    break
  case 'dev':
    path = `${__dirname}/../.env.dev`
    break
  default:
    path = `${__dirname}/../.env.dev`
}
dotenv.config({ path }) // path 설정

const { DB_URI, DB_NAME } = process.env

// const uri = `mongodb+srv://admin:${process.env.MONGO_PASSWORD}@cluster0.cpyqv.mongodb.net/?retryWrites=true&w=majority`
// const uri = DB_URI

const client = new MongoClient(DB_URI, {
  serverApi: ServerApiVersion.v1,
})

async function main() {
  await client.connect()

  const users = client.db(DB_NAME).collection('users')
  const cities = client.db(DB_NAME).collection('cities')

  // Reset: 실행할 때마다 collection을 비우도록 처리
  await users.deleteMany({})
  await cities.deleteMany({})

  // Init cities
  await cities.insertMany([
    {
      name: '서울',
      population: 1000,
    },
    {
      name: '부산',
      population: 350,
    },
  ])

  // Init users
  await users.insertMany([
    {
      name: 'Foo',
      birthYear: 2000,
      contacts: [
        // One to Many
        // [Mongo DB 의 한계]
        // 1. BSON(Binary JSON) - embed의 경우 Document의 Size는 16MB 이다.
        //    흔하지는 않지만 이 경우 별도 Collection으로 분리해야 함
        // 2. Document의 Depth는 100 level(Nesting: 중첩)을 넘지 않아야 한다.
        {
          type: 'phone',
          number: '+821011111111',
        },
        {
          type: 'home',
          number: '+8221111111',
        },
      ],
      // Many to Many(User & City) 관계일 경우 Collection을 따로 만들어줘야 함
      // city의 인구수 같은 값을 변경해야 할 경우, 모든 User를 돌면서 수정해야 하는데, 복잡하고 하나라도 놓질경우 Data의 일관성이 깨질 수 있음
      city: '서울',
    },
    {
      name: 'Bar',
      birthYear: 1995,
      contacts: [
        {
          type: 'phone',
          number: '+821022222222',
        },
        {
          type: 'home',
          number: '+8222222222',
        },
      ],
      city: '부산',
    },
    {
      name: 'Baz',
      birthYear: 1990,
      contacts: [
        {
          type: 'phone',
          number: '+821033333333',
        },
        {
          type: 'home',
          number: '+8223333333',
        },
      ],
      city: '부산',
    },
    {
      name: 'Poo',
      birthYear: 1993,
      contacts: [
        {
          type: 'phone',
          number: '+821044444444',
        },
        {
          type: 'home',
          number: '+8224444444',
        },
      ],
      city: '서울',
    },
  ])

  // users 안에 cities 합치는 작업
  const cursor = users.aggregate([
    {
      $lookup: {
        from: 'cities',
        localField: 'city',
        foreignField: 'name',
        as: 'city_info',
      },
    },
    // Filter
    {
      $match: {
        // $and | $or
        $and: [
          {
            'city_info.population': {
              $gte: 500,
            },
          },
          {
            birthYear: {
              $gte: 1995,
            },
          },
        ],
      },
    },
    // Count
    // {
    //   $count: 'num_users',
    // },
  ])

  // 삭제
  // await users.deleteOne({
  //   name: 'Poo',
  // })

  // 수정
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

  // return 값은 Cursor이며 비동기가 아님
  // 1. 조건, 정렬 사용 예시
  // const cursor = users.find(
  //   {
  //     // birthYear: 1995,
  //     birthYear: {
  //       // birthYear가 1990 이상
  //       $gte: 1990, // greate or equal
  //     },
  //   },
  //   {
  //     sort: {
  //       birthYear: 1, // -1: 내림차순, 1: 오름차순
  //     },
  //   }
  // )

  // 2. One to Many 구조의 Nesting된 값을 가져오는 사용 예시
  // const cursor = users.find({
  //   'contacts.type': 'home',
  // })

  // 3. May to May 구조
  // const cursor = users.find({

  // })

  await cursor.forEach(console.log)

  await client.close()
}

main()
