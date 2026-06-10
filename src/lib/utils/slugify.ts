// 한글/공백/특수문자가 섞인 제목을 URL friendly 한 slug 로 변환합니다.
// 한글은 그대로 두고(브라우저에서 인코딩됨) 공백/특수문자만 제거합니다.
export const slugify = (input: string): string => {
  if (!input) return ""
  return input
    .toString()
    .normalize("NFKC")
    .toLowerCase()
    .trim()
    .replace(/[\s　]+/g, "-")
    .replace(/[^\p{L}\p{N}-]+/gu, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
}
