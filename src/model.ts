import { Moment } from 'moment'

export type Tokens = Record<string, true>

// Range[`${n}`] = Value >>> n (n = 0,1,...,31)
export type Range = Record<string, number>

// /v2-posts/{reverse(id)}
export interface PostDoc {
  id: number
  text: string
  authorId: number
  createdAt: Moment
  updatedAt: Moment
  application: {
    id: number
    name: string
    isAutomated: boolean
  }
  files: readonly File[]
  inReplyToId?: number
  originalJSON: string
  // For Searching
  tokens: Tokens
  idRange: Range
  authorScreenName: string
}

// /users/{reverse(id)}
export interface UserDoc {
  id: number
  name: string
  screenName: string
  postsCount: number
  createdAt: Moment
  updatedAt: Moment
  avatarFile?: File
}

export interface File {
  id: number
  name: string
  type: string
  variants: readonly FileVariant[]
}

export interface FileVariant {
  id: number
  score: number
  extension: string
  type: string
  size: number
  url: string
  mime: string
}
