import * as admin from 'firebase-admin'
import { Timestamp } from '@google-cloud/firestore'
import $, { Transformer, ok } from 'transform-ts'
import { tokenize } from './util'

function createTokenMap(tokens: string[]): Record<string, boolean> {
  const result: Record<string, boolean> = {}
  for (const token of tokens) {
    result[token] = true
  }
  return result
}

function reverse(src: string): string {
  return [...src].reverse().join('')
}

export class EntryManager {
  private db = admin.firestore()
  private posts$ = this.db.collection('posts')
  private batch = this.db.batch()
  private batchCount = 0

  async add(postData: unknown): Promise<void> {
    const post = $.obj({
      id: $.number,
      text: $.string,
      user: $.obj({
        id: $.number,
        screenName: $.string,
      }),
      application: $.obj({
        isAutomated: $.boolean,
      }),
      createdAt: $.string.compose(new Transformer(str => ok(new Date(str)), date => ok(date.toISOString()))),
    }).transformOrThrow(postData)
    if (post.application.isAutomated) return

    const tokenMap = createTokenMap(tokenize(post.text))

    const entry = {
      id: post.id,
      text: post.text,
      tokens: tokenMap,
      userId: post.user.id,
      createdAt: Timestamp.fromDate(post.createdAt),
      postData: JSON.stringify(postData),
    }

    this.batch.set(this.posts$.doc(reverse(`${post.id}`)), entry)
    this.batchCount++
    if (this.batchCount === 100) {
      await this.flush()
    }
  }

  async flush() {
    await this.batch.commit()
    this.batchCount = 0
    this.batch = this.db.batch()
  }
}
