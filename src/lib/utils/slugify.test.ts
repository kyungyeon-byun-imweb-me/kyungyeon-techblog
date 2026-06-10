import { describe, it, expect } from "vitest"
import { slugify } from "./slugify"

describe("slugify", () => {
  it("공백을 하이픈으로, 대문자를 소문자로 바꾼다", () => {
    expect(slugify("Hello World")).toBe("hello-world")
  })
  it("특수문자를 제거한다", () => {
    expect(slugify("Next.js & React!")).toBe("nextjs-react")
  })
  it("한글은 보존한다", () => {
    expect(slugify("기술 블로그")).toBe("기술-블로그")
  })
  it("앞뒤 하이픈과 중복 하이픈을 정리한다", () => {
    expect(slugify("  --foo---bar--  ")).toBe("foo-bar")
  })
  it("빈 문자열은 빈 문자열", () => {
    expect(slugify("")).toBe("")
  })
})
