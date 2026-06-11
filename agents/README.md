# Agent Notes

이 문서는 에이전트가 `kyungyeon-techblog` 저장소를 수정할 때 먼저 확인할 운영 메모입니다.

## 보안

- 이 프로젝트는 공개 repository 입니다.
- 보안에 문제되는 내용은 절대 문서, 코드, 커밋, 예시 값에 넣지 않습니다.
- Notion page/database id, API token, GitHub token, 이메일 외 민감 개인정보, 내부 URL, 비공개 시스템 정보는 커밋하지 않습니다.
- `.env.local`, 로컬 캐시, 빌드 산출물에 포함된 민감값을 문서화하거나 그대로 복사하지 않습니다.
- 예시가 필요하면 `your-published-notion-page-id`, `example.com` 같은 placeholder 를 사용합니다.

## 프로젝트 메모

- Next.js 정적 export 기반 GitHub Pages 블로그입니다.
- 콘텐츠 원천은 공개 게시된 Notion 데이터베이스입니다.
- Notion Integration token 은 사용하지 않습니다.
- status 값은 `작성중`, `발행 완료` 두 가지를 기준으로 합니다.
- 운영 공개 목록은 `발행 완료`만 포함합니다.
- 로컬 미리보기는 `pnpm run notion:publish:local`로 실행하고, `작성중` 글까지 포함합니다.
- 공개 글 목록 확인은 `pnpm run notion:publish`를 사용합니다.
- 대표 도메인은 `https://kyungyeon.dev`입니다.
- `public/CNAME`은 `kyungyeon.dev`로 유지합니다.

## 작업 원칙

- DNS 현재 상태 조회나 검증은 사용자가 명시적으로 요청할 때만 합니다.
- 도메인 문서와 CNAME 설정은 `kyungyeon.dev` 기준으로 유지합니다.
- 실제 GitHub Pages Custom domain 설정과 DNS 레코드 설정은 저장소 밖의 작업입니다.
- 공개 저장소에 적합하지 않은 값이 필요하면 사용자에게 로컬/Secrets 설정으로 안내합니다.
