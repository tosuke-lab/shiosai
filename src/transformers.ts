import $, { Transformer, ValidationError, ValidationTypeError, ok, error, isOk, isError } from 'transform-ts'
import { Timestamp } from '@google-cloud/firestore'
import moment, { Moment } from 'moment'
import { File, UserDoc, PostDoc } from './model'

export const record = <K extends keyof any, V>(key: Transformer<unknown, K>, value: Transformer<unknown, V>) => {
  const entry = $.tuple(key, value)
  return Transformer.from<unknown, Record<keyof any, V>>(obj => {
    if (typeof obj !== 'object' || obj === null)
      return error(ValidationError.from(new ValidationTypeError('object', typeof obj)))
    const entries = Object.entries(obj)
      .map(e => entry.transform(e))
      .filter(isOk)
      .map(v => v.value)
    return ok(Object.fromEntries<V>(entries))
  })
}

export const branch = <T, A, B>(fa: Transformer<T, A>, fb: Transformer<T, B>) =>
  Transformer.from<T, [A, B]>(x => {
    const ra = fa.transform(x)
    const rb = fb.transform(x)
    if (isError(ra) || isError(rb)) {
      return error(...(isError(ra) ? ra.errors : []), ...(isError(rb) ? rb.errors : []))
    }
    return ok([ra.value, rb.value])
  })

export const timestampToMoment = $.instanceOf(Timestamp).compose(
  Transformer.from<Timestamp, Moment>(ts => ok(moment(ts.toMillis()))),
)

export const iso8601ToMoment = $.string.compose(
  Transformer.from<string, Moment>(str => ok(moment.utc(str))),
)

export const fileTransformer: Transformer<unknown, File> = $.obj({
  id: $.number,
  name: $.string,
  type: $.string,
  variants: $.array(
    $.obj({
      id: $.number,
      score: $.number,
      extension: $.string,
      type: $.string,
      size: $.number,
      url: $.string,
      mime: $.string,
    }),
  ),
})

export const fromPostJSON = $.obj({
  id: $.number,
  text: $.string,
  user: $.obj({
    id: $.number,
    name: $.string,
    screenName: $.string,
    postsCount: $.number,
    createdAt: iso8601ToMoment,
    updatedAt: iso8601ToMoment,
    avatarFile: $.optional($.nullable(fileTransformer)),
  }),
  application: $.obj({
    id: $.number,
    name: $.string,
    isAutomated: $.boolean,
  }),
  createdAt: iso8601ToMoment,
  updatedAt: iso8601ToMoment,
  files: $.array(fileTransformer),
  inReplyToId: $.optional($.nullable($.number)),
}).compose(
  branch(
    Transformer.from(post =>
      ok<Pick<PostDoc, Exclude<keyof PostDoc, 'tokens' | 'idRange' | 'originalJSON'>>>({
        id: post.id,
        text: post.text,
        authorId: post.user.id,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        application: post.application,
        files: post.files,
        inReplyToId: post.inReplyToId ?? undefined,
        authorScreenName: post.user.screenName,
      }),
    ),
    Transformer.from(({ user }) =>
      ok<UserDoc>({
        ...user,
        avatarFile: user.avatarFile ?? undefined,
      }),
    ),
  ),
)

export const trueLiteral = Transformer.from<unknown, true>(u =>
  u === true ? ok(true) : error(ValidationError.from(new ValidationTypeError('true', typeof u))),
)

export const anyType = Transformer.from<unknown, any>(u => ok(u))
