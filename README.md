# Eric's DevLog

Notion 데이터베이스를 CMS로 사용하는 Next.js 정적 기술 블로그입니다. 화면 디자인은 기존 `gatsby_blog`의 modern 블로그 디자인을 Next 컴포넌트/CSS로 옮겼습니다.

## Quick Start

```bash
pnpm install
pnpm run dev
```

Notion 글 목록과 로컬 미리보기는 아래 스크립트를 사용합니다.

```bash
pnpm run notion:publish       # 공개 상태 글만 확인
pnpm run notion:publish:local # 작성중 글까지 포함해 http://localhost:3000 실행
```

## Notion CMS

- Notion Integration token은 필요 없습니다.
- `notion-client` 비공식 public API를 사용하므로 Notion DB 페이지가 `Publish to web` 상태여야 합니다.
- Notion source ID는 `NOTION_PAGE_ID` 환경변수로 지정합니다. 공개 저장소에 ID를 커밋하지 않습니다.
- Full-page database는 DB ID도 동작하지만, inline database는 publish된 상위 페이지 ID를 사용해야 합니다.

로컬에서는 `.env.local`을 만들고 다음 값을 넣습니다.

```bash
NOTION_PAGE_ID=your-published-notion-page-id
```

GitHub Actions 배포에서는 저장소 `Settings → Secrets and variables → Actions → Repository secrets`에 `NOTION_PAGE_ID`를 추가합니다.

지원하는 속성명:

| 속성 | 타입 | Alias | 비고 |
| --- | --- | --- | --- |
| `title` | Title | 필수 | 글 제목 |
| `postNo` | Number/Text | `postNo`, `post_no`, `post no`, `post number`, `번호` | 있으면 URL이 `/posts/{postNo}/`가 됨 |
| `slug` | Text | `slug`, `url` | `postNo`가 비어 있으면 slug, title 순서로 생성 |
| `status` | Select | `status`, `상태` | `발행 완료`만 노출. `pnpm run notion:publish:local`에서는 `작성중` 글도 로컬 미리보기 가능 |
| `category` | Multi-select | `category`, `카테고리` | 홈 카테고리 필터 |
| `tags` | Multi-select | `tags`, `태그` | 검색/상세 태그 |
| `summary` | Text | `summary`, `description`, `요약` | 카드/SEO 설명 |
| `date` | Date | `date`, `published`, `발행일` | 최신순 정렬 |
| `thumbnail` | File | `thumbnail`, `cover`, `썸네일` | 카드/상세 커버 |
| `author` | Person | `author`, `authors`, `작성자` | 상세 메타 |
| `featured` | Checkbox | `featured`, `추천`, `pinned` | 홈 Featured 우선 노출 |

글 목록은 `postNo` 숫자 내림차순으로 정렬됩니다. `postNo`가 없는 글은 뒤로 밀리고, 그 안에서는 `date` 내림차순으로 정렬됩니다.

## Build

```bash
pnpm build
```

`next.config.js`의 `output: "export"` 설정에 따라 `out/`에 정적 사이트가 생성됩니다. `postbuild`에서 `feed.xml`, `atom.xml`, `sitemap.xml`도 함께 생성합니다.

## Deploy

`.github/workflows/deploy.yml`은 다음 트리거로 GitHub Pages 배포를 수행합니다.

- `main` push
- 수동 `workflow_dispatch`
- 30분마다 cron 재빌드

Notion에 새 글을 작성하고 `status = 발행 완료`로 바꾸면 다음 cron 빌드에서 정적 페이지가 새로 생성됩니다.

대표 도메인은 `https://kyungyeon.dev`입니다. `public/CNAME`에도 같은 도메인을 설정해두었습니다.
실제 연결 시 GitHub Pages의 Custom domain과 DNS를 별도로 설정합니다.
