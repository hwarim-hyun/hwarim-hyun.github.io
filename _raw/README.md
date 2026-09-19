# _raw — 원본 자료 드롭 폴더 (git 에 올라가지 않음)

사이트에 반영할 원본 자료를 여기에 그냥 넣어두면 됩니다. 형식은 자유입니다.
여기 있는 파일을 바탕으로 src/data/*.yaml, src/content/**, public/** 를 채웁니다.

권장 배치:

_raw/
├── cv.pdf                # 최신 CV. 그대로 public/files/cv.pdf 로 복사됨
├── cv.md | cv.txt        # 또는 텍스트 형태의 경력/학력/스킬 (→ src/data/cv.yaml)
├── photo.jpg             # 프로필 사진 원본 (→ public/avatar.png, 정방형으로 크롭)
├── publications.bib      # BibTeX (Google Scholar 내보내기 등) (→ src/data/publications.yaml)
├── papers/               # 논문 PDF (→ public/files/papers/)
├── projects/             # 프로젝트별 메모/README/스크린샷 (→ src/content/projects/*.md)
├── notes/                # 블로그로 올릴 글 초안 (→ src/content/blog/*.md)
└── about.md              # 자기소개, 링크(Scholar/LinkedIn/X 등) (→ src/site.config.ts)
