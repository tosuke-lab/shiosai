import firestore from './firestore'

export class Batch {
  private batch: FirebaseFirestore.WriteBatch
  private batchCount: number

  constructor() {
    this.batchCount = 0
    this.batch = firestore.batch()
  }

  async flush() {
    await this.batch.commit()
    this.batch = firestore.batch()
    this.batchCount = 0
  }

  async set<T>(doc: FirebaseFirestore.DocumentReference<T>, data: T) {
    this.batch.set(doc, data)
    if (++this.batchCount >= 500) {
      await this.flush()
    }
  }
}
