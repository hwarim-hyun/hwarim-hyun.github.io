import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

const projects = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),          // 카드에 보이는 한두 문장
    date: z.coerce.date(),        // 정렬 기준: 최신순 (보통 종료/발표 시점)
    period: z.string().optional(),// 표시용 기간 e.g. "2025 — Present"
    org: z.string().optional(),   // 소속/맥락 e.g. "NAVER · AI Safety Center"
    orgs: z.array(z.string()).default([]), // 상세 페이지 소속 소개에 추가할 단체 (orgs.json 키) e.g. ["Google Summer of Code"]
    role: z.string().optional(),  // 역할 e.g. "Lead engineer"
    tags: z.array(z.string()).default([]),
    // 카드에 크게 보이는 임팩트 지표 (2~3개 권장)
    metrics: z.array(z.object({ value: z.string(), label: z.string() })).default([]),
    // 상세 페이지 상단 버튼. icon: web | slides | video | paper | code | external
    links: z.array(z.object({
      label: z.string(),
      href: z.string().url(),
      icon: z.enum(['web', 'slides', 'video', 'paper', 'code', 'external']).optional(),
    })).default([]),
    // 카드 썸네일 (public/ 기준 경로). thumbnail 은 프로젝트 목록의 16:9 칸용 (e.g. 1600×900),
    // thumbnailTall 은 홈 Featured 의 세로 칸용 (3:4, e.g. 900×1200). tall 이 없으면 thumbnail 을 대신 씀. 둘 다 없으면 빈 자리
    thumbnail: z.string().optional(),
    thumbnailTall: z.string().optional(),
    thumbnailPosition: z.string().default('center 50%'), // 칸 안에서 보이는 위치 (CSS object-position)
    featured: z.boolean().default(false),
    // 수동 정렬 knob. 지정한 항목은 이 숫자 오름차순으로 앞에 오고, 나머지는 date 최신순으로 뒤에 옵니다.
    order: z.number().optional(),
  }),
});

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

// Outside of Work 앨범. 홈에는 cover + title 만, /life/<id> 에서 photos 전체를 보여줍니다.
const albums = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/albums' }),
  schema: z.object({
    title: z.string(),
    summary: z.string().optional(),   // 앨범 페이지 상단 한 줄
    cover: z.string(),                // 홈 카드 대표 이미지 (public/ 기준 경로)
    coverPosition: z.string().default('center 50%'), // 카드 안에서 보이는 위치 (CSS object-position). 세로 사진은 값을 키우면 아래쪽이 보임
    photos: z.array(z.object({ src: z.string(), caption: z.string().optional() })).default([]),
    date: z.coerce.date().optional(), // 정렬(최신순). 없으면 order/제목 순
    order: z.number().optional(),     // 수동 정렬 knob (프로젝트와 같은 규칙)
    hidden: z.boolean().default(false), // true 면 홈에서 숨김 (커버 준비 전 등)
  }),
});

export const collections = { projects, blog, albums };
