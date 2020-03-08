import $ from 'transform-ts'
import { Query, QueryDocumentSnapshot } from '@google-cloud/firestore'
import firestore from './firestore'
import { postCollection, userCollection } from './collections'
import { fromPostJSON } from './transformers'
import { PostDoc } from './model'
import { tokenizeText } from './tokenize'
import { createRangeIndex } from './range'
import { Batch } from './batch'

async function* toStream<DocumentData>(query: Query<DocumentData>): AsyncIterable<QueryDocumentSnapshot<DocumentData>> {
  let q = query
  while (true) {
    const snapshot = await q.limit(500).get()
    const docs = snapshot.docs
    yield* docs
    if (docs.length < 500) break
    q = query.startAfter((docs[docs.length - 1].data() as any).id)
  }
}

async function* take<A>(src: AsyncIterable<A>, num: number): AsyncIterable<A> {
  for await (const item of src) {
    yield item
    if (--num < 0) break
  }
}

function reverse(src: string) {
  return [...src].reverse().join('')
}

async function main() {
  const v1Posts = firestore.collection('posts')
  const query = v1Posts.orderBy('id', 'desc')
  const batch = new Batch()
  const userIds = new Set<number>()
  console.log('start')
  const data = await query.get()
  for (const doc of data.docs) {
    const { postData } = $.obj({ postData: $.string }).transformOrThrow(doc.data())
    const [post, userDoc] = fromPostJSON.transformOrThrow(JSON.parse(postData))
    const postDoc: PostDoc = {
      ...post,
      originalJSON: postData,
      tokens: tokenizeText(post.text),
      idRange: createRangeIndex(post.id),
    }
    await batch.set(postCollection.doc(reverse(`${postDoc.id}`)), postDoc)
    if (!userIds.has(userDoc.id)) {
      await batch.set(userCollection.doc(reverse(`${userDoc.id}`)), userDoc)
      userIds.add(userDoc.id)
    }
    console.log(postDoc.id)
  }
  await batch.flush()
}

main().catch(e => console.error(e))
