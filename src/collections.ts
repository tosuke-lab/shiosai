import { DocumentData, Timestamp } from '@google-cloud/firestore'
import $, { Transformer } from 'transform-ts'
import firestore from './firestore'
import { PostDoc, UserDoc } from './model'
import { timestampToMoment, fileTransformer, anyType } from './transformers'

const docToPost: Transformer<unknown, PostDoc> = $.obj({
  id: $.number,
  text: $.string,
  authorId: $.number,
  createdAt: timestampToMoment,
  updatedAt: timestampToMoment,
  application: $.obj({
    id: $.number,
    name: $.string,
    isAutomated: $.boolean,
  }),
  files: $.array(fileTransformer),
  inReplyToId: $.withDefault($.number, undefined),
  originalJSON: $.string,
  tokens: anyType, // perf
  idRange: anyType, // perf
  authorScreenName: $.string,
})

const docToUser: Transformer<unknown, UserDoc> = $.obj({
  id: $.number,
  name: $.string,
  screenName: $.string,
  postsCount: $.number,
  createdAt: timestampToMoment,
  updatedAt: timestampToMoment,
  avatarFile: $.optional(fileTransformer),
})

export const postCollection = firestore.collection('v2-posts').withConverter<PostDoc>({
  fromFirestore(data: DocumentData) {
    return docToPost.transformOrThrow(data)
  },
  toFirestore(model: PostDoc) {
    return {
      ...model,
      inReplyToId: model.inReplyToId ?? null,
    }
  },
})

export const userCollection = firestore.collection('users').withConverter<UserDoc>({
  fromFirestore(data: DocumentData) {
    return docToUser.transformOrThrow(data)
  },
  toFirestore(model: UserDoc) {
    return {
      ...model,
      avatarFile: model.avatarFile ?? null,
    }
  },
})
