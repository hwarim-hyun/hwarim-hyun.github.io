# hwarim-hyun.github.io

Personal research / engineering portfolio, built with [Astro](https://astro.build) and deployed to GitHub Pages.

## Structure

| Where | What |
| --- | --- |
| `src/data/profile.json` | 이름, 소개(LinkedIn 원문), 이메일, 링크, 메타태그 |
| `src/data/publications.json` | 논문 목록 (`selected: true` → 홈에 노출) |
| `src/data/news.json` | 홈 News 섹션 |
| `src/content/projects/*.md` | 프로젝트 (front-matter + 본문). `featured: true` → 홈 Featured Projects 에 노출. 기본 정렬은 `date` 최신순, `order: 1` 처럼 주면 그 항목들이 숫자 순으로 맨 앞에 옴. `metrics` 로 임팩트 숫자 표시 |
| `src/content/blog/*.md` | 노트/블로그 글. `draft: true` 면 빌드에서 제외 |
| `public/avatar.jpg` | 프로필 사진 |
| `public/files/cv.pdf` | CV PDF (파일을 넣으면 "Download PDF" 링크가 동작) |
| `src/data/README.md` | 각 JSON 의 필드 설명 |
| `src/site.config.ts` | 내비게이션 메뉴 (컨텐츠 아님). CV 는 `profile.json` 의 `links.cv` 를 그대로 씀 |
| `src/styles/global.css` | 색상 토큰 / 레이아웃. 라이트·다크 모드 지원 |

## Develop

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # → dist/
npm run preview
npx astro check  # type check
```

## Deploy

`main` 브랜치에 push 하면 `.github/workflows/deploy.yml` 이 빌드 후 GitHub Pages 에 배포합니다.

최초 1회: GitHub 레포 **Settings → Pages → Build and deployment → Source** 를 **GitHub Actions** 로 설정하세요.
