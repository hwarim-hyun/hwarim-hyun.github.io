# src/data — 사이트 컨텐츠 (JSON)

페이지 코드(`src/pages`, `src/components`)는 여기 있는 JSON 만 읽습니다. 내용을 바꿀 때 코드를 건드릴 필요가 없습니다.
문자열 안에서는 인라인 마크다운(`**굵게**`, `[텍스트](url)`)과 이모지를 쓸 수 있고, `\n` 은 줄바꿈이 됩니다.

| 파일 | 쓰이는 곳 | 필드 |
| --- | --- | --- |
| `profile.json` | 홈 히어로, 헤더, 푸터, 메타태그 | `name`, `nameKo`, `displayName`, `tagline`(인라인 마크다운 링크 가능), `location`, `email`, `avatar`, `intro[]`, `introFold`(앞에서 몇 문단까지 보이고 나머지는 Read more 로 접을지), `skills[]`(소개 아래 대표 기술 태그), `keywords`(긴 키워드 줄, Read more 안에 표시), `links{github,linkedin,orcid,scholar,twitter,cv}`, `seo{title,description}` |
| `highlights.json` | 홈 Highlights (비어 있으면 섹션 숨김) | `["문장"]` 또는 `[{ text }]` |
| `news.json` | 홈 News (최신 5개), News 페이지 (전체, 연도별) | `[{ date: "YYYY-MM-DD", text, links?: [{ label, href, icon? }] }]` — 본문에는 링크를 넣지 않고 `links` 로 분리, icon 은 web/paper/video/slides/code/external |
| `publications.json` | Publications, 홈 Selected Publications | `[{ title, authors[], venue, year, type, selected, award?, abstract?, links{pdf,arxiv,doi,code,project,slides,poster,video} }]` |

- `links` 나 배열을 비우면(`""` 또는 `[]`) 해당 링크/섹션은 렌더되지 않습니다.
- `publications.json` 의 `authors` 에서 `profile.json` 의 `name`/`nameKo` 와 일치하는 이름은 자동으로 굵게 표시됩니다.
- 프로젝트 front-matter 의 `links` 는 상세 페이지 상단에 아이콘 버튼으로 표시됩니다: `{ label, href, icon }`, icon 은 `web` `slides` `video` `paper` `code` `external` 중 하나.
- **Outside of Work 앨범**은 `src/content/albums/<slug>.md` 입니다. 홈에는 `cover` 와 `title` 만 카드로 보이고 상세 페이지는 없습니다. front-matter: `title`, `cover`(4:3 권장, public/ 기준 경로), `coverPosition`(카드 초점, 기본 `center 50%`), `order`(정렬), `hidden: true`(커버 준비 전 숨김). 사진 원본은 `_raw/photos/<slug>/` 에 보관합니다.
- 프로젝트와 노트는 본문이 길어서 JSON 이 아니라 `src/content/projects/*.md`, `src/content/blog/*.md` 의 front-matter + 마크다운입니다.
