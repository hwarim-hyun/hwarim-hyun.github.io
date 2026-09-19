import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),          // 카드에 보이는 한두 문장
    date: z.coerce.date(),        // 정렬 기준: 최신순 (보통 종료/발표 시점)
    period: z.string().optional(),// 표시용 기간 e.g. "2025 — Present"
    org: z.string().optional(),   // 소속/맥락 e.g. "NAVER · AI Safety Center"
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
    photos: z.array(z.object({ src: z.string(), caption: z.string().optional() })).default([]),
    date: z.coerce.date().optional(), // 정렬(최신순). 없으면 order/제목 순
    order: z.number().optional(),     // 수동 정렬 knob (프로젝트와 같은 규칙)
  }),
});

export const collections = { projects, blog, albums };
