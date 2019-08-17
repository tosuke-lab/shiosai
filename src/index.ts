import * as admin from 'firebase-admin'
import axios, { AxiosResponse } from 'axios'
import $ from 'transform-ts'
import { FieldPath } from '@google-cloud/firestore'
import { tokenize } from './util'
import { EntryManager } from './save'

const { SEA_ACCESS_TOKEN, SEA_API_ROOT } = $.obj({
  SEA_ACCESS_TOKEN: $.string,
  SEA_API_ROOT: $.string,
}).transformOrThrow(process.env)

admin.initializeApp()

const db = admin.firestore()

const sinceId = 0

async function* fetch(sinceId: number): AsyncIterable<unknown> {
  let maxId: string | undefined = undefined
  while (true) {
    const r: AxiosResponse = await axios.get('v1/timelines/public', {
      baseURL: SEA_API_ROOT,
      headers: {
        Authorization: `Bearer ${SEA_ACCESS_TOKEN}`,
      },
      params: {
        maxId,
        sinceId,
        count: 100,
      },
    })
    if (!Array.isArray(r.data)) return
    console.log(r.data[0].id, r.data.length)
    yield* r.data
    if (r.data.length < 100) return
    maxId = r.data[99].id
  }
}

async function add() {
  const entryManager = new EntryManager()
  for await (const postData of fetch(sinceId)) {
    await entryManager.add(postData)
  }
  await entryManager.flush()
}

async function query(q: string) {
  const tokens = tokenize(q)

  let query: FirebaseFirestore.Query = db.collection('posts')
  for (const token of tokens) {
    query = query.where(new FieldPath('tokens', token), '==', true)
  }

  const result = await query.get()
  const posts = result.docs.map(doc => doc.data())

  for (const post of posts) {
    const d = JSON.parse(post.postData)
    console.log(d.user.screenName, d.text)
  }
}

async function main() {
  // await add()
  // await query('ツイート')
}

main().catch(err => {
  console.error(err)
})
