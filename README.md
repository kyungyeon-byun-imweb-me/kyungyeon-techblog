# Eric's DevLog

Notion 데이터베이스를 CMS로 사용하는 Next.js 정적 기술 블로그입니다. 화면 디자인은 기존 `gatsby_blog`의 modern 블로그 디자인을 Next 컴포넌트/CSS로 옮겼습니다.

## Quick Start

```bash
pnpm install
pnpm run dev
```

## Notion CMS

- Notion Integration token은 필요 없습니다.
- `notion-client` 비공식 public API를 사용하므로 Notion DB 페이지가 `Publish to web` 상태여야 합니다.
- DB ID는 `site.config.js`의 `notion.databaseId` 또는 `NOTION_DATABASE_ID` 환경변수로 지정합니다.

지원하는 속성명:

| 속성 | 타입 | Alias | 비고 |
| --- | --- | --- | --- |
| `title` | Title | 필수 | 글 제목 |
| `slug` | Text | `slug`, `url` | 비어 있으면 제목으로 생성 |
| `status` | Select | `status`, `상태` | `Public` 또는 `공개`만 노출 |
| `category` | Multi-select | `category`, `카테고리` | 홈 카테고리 필터 |
| `tags` | Multi-select | `tags`, `태그` | 검색/상세 태그 |
| `summary` | Text | `summary`, `description`, `요약` | 카드/SEO 설명 |
| `date` | Date | `date`, `published`, `발행일` | 최신순 정렬 |
| `thumbnail` | File | `thumbnail`, `cover`, `썸네일` | 카드/상세 커버 |
| `author` | Person | `author`, `authors`, `작성자` | 상세 메타 |
| `featured` | Checkbox | `featured`, `추천`, `pinned` | 홈 Featured 우선 노출 |

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

Notion에 새 글을 작성하고 `status = Public`으로 바꾸면 다음 cron 빌드에서 정적 페이지가 새로 생성됩니다.

운영 도메인은 `https://kyungyeon.dev`입니다.
