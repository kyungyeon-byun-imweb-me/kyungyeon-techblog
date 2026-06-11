// 공통 타입 정의. 화면에서 다루는 가공된 글 데이터는 TPost 입니다.

export type TPostStatus = "작성중" | "발행 완료"

export type TAuthor = {
  name: string
  // getStaticProps 는 undefined 직렬화 불가 → null 로 통일
  avatar: string | null
}

export type TPost = {
  id: string
  postNo: string | null
  slug: string
  title: string
  summary: string
  cover: string | null
  category: string[]
  tags: string[]
  authors: TAuthor[]
  date: string // ISO 8601
  status: TPostStatus
  featured: boolean
}
