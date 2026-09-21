// ─────────────────────────────────────────────────────────────
// 사이트 설정. 사람에 대한 내용(이름, 소개, 링크 등)은 전부
// src/data/profile.json 에 있고, 여기는 내비게이션 같은 사이트 구조만 둡니다.
// ─────────────────────────────────────────────────────────────
import profile from './data/profile.json';

export const PROFILE = profile;

export const SITE = {
  name: profile.name,
  nameKo: profile.nameKo,
  title: profile.seo.title,
  description: profile.seo.description,
  // 마크다운 링크를 뺀 순수 텍스트 (CV 페이지, 메타태그용)
  tagline: profile.tagline.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1'),
  location: profile.location,
  email: profile.email,
  links: profile.links,
  nav: [
    { href: '/', label: 'About' },
    { href: '/projects', label: 'Projects' },
    { href: '/publications', label: 'Publications' },
    { href: '/news', label: 'News' },
    // Notes(/blog)는 글이 생기면 다시 넣기: { href: '/blog', label: 'Notes' }
    { href: profile.links.cv, label: 'CV', external: true },
  ],
};
