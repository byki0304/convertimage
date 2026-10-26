# 업무용 프로그램 개발 표준 세부 기획서 (convertimage)

**버전:** 1.4  
**기준 제품:** convertimage (컨버트이미지)  
**작성 기준일:** 2026-10-26  
**적용 범위:** Next.js (React/Node.js) 웹 App, Firebase Auth & Firestore, GitHub, Vercel Deployment, Client-side Canvas/WASM Image Processing.  
**기본 기준:** 버전 1.3의 개발 표준 서식을 바탕으로, `convertimage` 미니게임 이미지 포맷 변환 프로젝트의 전체 요구사항과 비주얼 테마('케데헌' 애니메이션 바이브), 기술 스택(Node.js/Next.js/Flutter/Three.js 검토 결과), 반응형 UX, GIF 프레임 판별 로직, i18n, 개발 에이전트 비교 판단 결과를 종합 반영하여 재작성한 세부 기획서.  
**코드 기본 언어:** 필드명, 함수명, 변수명, 파일명, DB 컬렉션/필드, API 경로, 오류 코드, 이벤트 코드는 **100% 영문(English)**으로 구현한다. 화면에 노출되는 UX 텍스트(메뉴, 버튼, 메시지, 설명 등)는 **한국어(Default), English, Japanese** 3개 언어로 세팅하며 즉시 전환 스위처를 제공한다.  

---

## 1.3에서 1.4로 변경 및 확정한 기본값

1. **프로젝트 목적 및 명칭**: 프로젝트명을 `convertimage`로 확정한다. 미니게임 개발 시 리소스 손실 없는 고품질 이미지 포맷 상호 변환(JPG, PNG, WebP, AVIF, GIF, BMP)을 최우선 목적으로 한다.
2. **GIF 동영상/이미지 판별 및 프레임 추출 로직**:
   - GIF 파일 업로드 시 프레임 수(Frame Count)를 즉시 분석한다.
   - **단일 프레임 (정적 이미지)**: 원본 그대로 타겟 포맷으로 변환.
   - **다중 프레임 (동영상/애니메이션)**: 첫 번째 프레임(Frame 0)의 픽셀 데이터를 추출하여 타겟 포맷으로 변환.
3. **일괄 업로드 및 다운로드 규격**:
   - 1회 최대 20개 파일까지 일괄 업로드 및 동시 변환 지원.
   - 업로드 시 UI 상에서 5개 단위 그룹화/슬라이딩 페이지네이션 리스트로 세련되게 표현.
   - 변환 후 다운로드 시 원본 파일명 유지(확장자만 자동 변경) 및 기존 다운로드 경로 구조와 동일 유지.
4. **반응형 3개 프레임 레이아웃 (딜레이 없는 초속 전환)**:
   - **데스크톱 (`w >= 1024px`)**: Left Sidebar + Top/Center Tab 디자인.
   - **모바일 세로 (`w < 1024px`, Portrait)**: Top Header + Bottom Navigation 디자인.
   - **모바일 가로 (`w < 1024px`, Landscape)**: Top Header (컴팩트) + Bottom Navigation 디자인.
   - 모든 화면 프레임에서 **Drag & Drop**과 **파일 선택 버튼 업로드**를 동시에 지원.
5. **화면 및 인증 전환 흐름**:
   - `인터로 (6초 애니메이션 비디오)` -> `로그인 선택 화면 (이메일/휴대폰/구글/회원가입/비회원)` -> `로그인 화면` -> `첫 화면 (PNG 변환 메뉴 최우선 노출)`.
6. **비주얼 테마 컨셉 ('케데헌' 애니메이션 바이브)**:
   - 캐릭터 일러스트 없이, 배경/아이콘/버튼/Fixtures에 다크 옵시디언 베이스(`#0B0C10`), 네온 시안(`#00F0FF`), 비비드 마젠타(`#FF0055`), 일렉트릭 퍼플(`#9D00FF`) 발광(Glow) 및 글래스모피즘(`backdrop-filter: blur(12px)`) 스타일링 적용.
7. **기술 스택 확정 (Next.js 조합)**:
   - Node.js, Next.js, Flutter, Three.js 등을 종합 비교 검토한 결과, 웹 브라우저 Canvas/WASM 이미지 변환 성능, Vercel 배포 최적화, 반응형 DOM 스타일링, i18n 처리에 가장 우수한 **Next.js (React 19 / App Router) + Tailwind CSS + Framer Motion + Firebase** 조합을 최종 선택.
8. **개발 에이전트 확정**:
   - Anti-Gravity vs Cursor 비교 검토 결과, 프론트엔드 UI 인터랙션, Canvas/WASM 디버깅, 실시간 프리뷰 피드백 루프에 독보적인 **Cursor**를 최종 개발 에이전트로 선정.

---

## 공통 고정 정책

1. **클라이언트 중심 이미지 변환 및 서버 검증**:
   - 대용량 이미지 처리의 속도와 대역폭 절약을 위해 이미지 변환 처리는 브라우저 Canvas API 및 WASM 모듈을 활용하여 클라이언트 측에서 1차 수행한다.
   - 회원 자격, 일별 변환 집계, 파일 업로드 감사 로그 및 계정 관리는 Firebase Auth & Firestore (Node.js 백엔드)에서 확정한다.
2. **서버-클라이언트 상태 일치**: 서버 응답 실패 시 이전 상태와 오류 이유를 즉시 명확하게 노출한다.
3. **주 저장소 및 인증**: Firebase Auth (Google OAuth, Email/Password, Phone Auth) 및 Firestore DB를 사용한다.
4. **비밀 정보 관리**: API 키, OAuth Client Secret, Service Account Key 등은 소스 코드 및 클라이언트에 직접 작성하지 않으며, Vercel 환경 변수(`ENV`) 및 Firebase Security Rules로 관리한다.
5. **i18n 다국어 표준**:
   - 소스코드 및 데이터베이스 항목은 100% 영문(English) 작성.
   - 사용자 UX 화면 텍스트는 한국어(Default), English, Japanese 3개 언어를 지원한다 (`ko`, `en`, `ja`).
6. **배포 파이프라인**: GitHub `main` 브랜치 푸시 시 Vercel 자동 빌드 및 배포.

---

## 0. 문서 정보

| ID | 구분 | 항목 | 기입 상세 내용 |
|---|---|---|---|
| B-00-01 | 필수 | 프로그램명 (영문 / 한글) | **convertimage / 컨버트이미지** (화면 로고: `convertimage`) |
| B-00-02 | 필수 | 문서 버전 / 날짜 | **1.4 / 2026-10-26** |
| B-00-03 | 필수 | 한 줄 약속 | 미니게임 리소스 제작에 필요한 이미지 포맷을 손실 없이 빠르고 스타일리시하게 변환하는 웹 앱 |
| B-00-04 | 기본 | 플랫폼 | 웹 PWA / Responsive Web (데스크톱, 모바일 세로, 모바일 가로 3개 프레임 초속 전환) |
| B-00-05 | 기본 | 클라이언트 | Next.js (React 19, App Router), Tailwind CSS, Framer Motion, HTML5 Canvas API |
| B-00-06 | 기본 | 서버 / 백엔드 | Node.js (Vercel Serverless / Firebase Cloud Functions nodejs20, 리전 `asia-northeast3`) |
| B-00-07 | 필수 | 주 저장소 및 인증 | Firebase Auth, Firestore Database, Firebase Cloud Storage |
| B-00-08 | 기본 | 버전 관리 및 배포 | GitHub Repository (`convertimage`) -> Vercel Deployment |
| B-00-09 | 필수 | MVP 범위 | PNG/JPG/WebP/AVIF/GIF/BMP 상호 변환, GIF 1프레임/다중프레임 판별, 최대 20개 일괄 변환, 3개 프레임 UI, '케데헌' 네온 테마, 3개 국어 i18n |
| B-00-10 | 필수 | 고정 정책 예외 | 클라이언트 사이드 변환 중심 구조로 서버 트래픽 및 변환 딜레이 최소화 |

---

## 1. 아이디어 및 핵심 동작

### 핵심 시나리오
미니게임 개발자 및 디자이너가 단일 또는 다량(최대 20개)의 그래픽 자산(JPG, PNG, WebP, AVIF, GIF, BMP)을 업로드하면, 원본 품질 손실 없이 원하는 포맷으로 즉시 변환하여 원본 파일명 그대로 일괄 다운로드한다.

### 메인 UX 흐름 (Screen Flow)
1. **Intro Screen**: 6초간 재생되는 스타일리시한 애니메이션 비디오 인트로 (Skip 버튼 제공).
2. **Login Selection Screen**: 로그인 옵션 제공 (`[Google 로그인]`, `[이메일 로그인]`, `[휴대폰 로그인]`, `[회원가입]`, `[계정 없이 사용(Guest)]`).
3. **Login / Register Screen**: 인증 절차 진행.
4. **Main Converter Screen**: 로그인 성공 시 즉시 진입. **[PNG로 변환] 메뉴가 최우선 기본 탭**으로 활성화됨.

| ID | 구분 | 항목 | 기입 상세 내용 |
|---|---|---|---|
| B-01-01 | 필수 | 사용 상황 | 개발자가 게임용 이미지를 업로드하고 원하는 포맷(PNG 우선)을 선택하여 손실 없이 일괄 변환 |
| B-01-02 | 필수 | 첫 화면 안내 문장 | `이미지 파일을 드래그하거나 선택하세요. 게임 개발용 이미지 포맷을 손실 없이 변환합니다.` |
| B-01-03 | 필수 | 변환 성공 문장 | `변환이 완료되었습니다. (N개의 파일)` / `복사/다운로드 되었습니다.` |
| B-01-04 | 필수 | 데이터 없음 문장 | `변환할 이미지 파일이 없습니다. 여기에 파일을 끌어다 놓으세요.` |
| B-01-05 | 필수 | 비회원 / 회원 권한 | 비회원: 1회 최대 20개 변환 가능, 브라우저 로컬 세션 보존.<br>회원: 히스토리 저장 및 개인 설정(기본 변환 포맷, i18n 언어) Firestore 동기화. |

### 핵심 동작 명세
- **만들기/변환 (포함)**: 이미지 파일 1개~20개 업로드 및 포맷 변환 실행.
- **목록 보기 (포함)**: 업로드된 파일 리스트 (5개 단위 슬라이드/페이지네이션 표현).
- **지우기 (포함)**: 업로드 목록 개별/전체 삭제.
- **다운로드 (포함)**: 개별 다운로드 및 JSZip 활용 20개 일괄 ZIP 다운로드.
- **검색/공개 공유 (해당 없음)**: 게임 자산 변환 도구이므로 공개 피드 및 파일 검색은 제외.

---

## 2. 브랜드 및 비주얼 테마 ('케데헌' 애니메이션 바이브)

캐릭터 일러스트 없이 '케데헌' 애니메이션의 강렬하고 스타일리시한 비주얼 바이브를 UI/UX 요소에 그래픽적으로 반영한다.

### 비주얼 구성 요소
* **컬러 팔레트 (Color Palette)**:
  * **Background Base**: 딥 다크 나이트 / 옵시디언 (`#0B0C10`, `#12131C`)
  * **Accent & Glow**: 네온 시안 (`#00F0FF`), 비비드 마젠타/핑크 (`#FF0055`), 일렉트릭 퍼플 (`#9D00FF`)
  * **Surface / Container**: 반투명 다크 글래스모피즘 (`#161824` / `backdrop-filter: blur(12px)`)
  * **Text & Stroke**: 네온 발광 텍스트, 반투명 시안/퍼플 테두리 스트로크
* **배경 & 텍스처 (Background & Texture)**:
  * 은은하게 일렁이는 네온 오로라 및 에너제틱 포털 그래디언트 애니메이션 배경.
  * 사이버/다크판타지 격자(Grid) 패턴과 미세한 빛 입자(Particle) 레이어.
* **UI Fixtures & Drag-and-Drop Zone**:
  * 파일 마우스 진입(Drag Enter) 시 드롭존 테두리에 네온 에너지 파동(Glow Pulse)이 활성화되는 액티브 인터랙션.
* **버튼 & 아이콘 (Buttons & Icons)**:
  * **Buttons**: 네온 엣지 라이팅 + 클릭/호버 시 에너지 펄스 효과 (Framer Motion keyframes).
  * **Icons**: 단순 선형 아이콘이 아닌, 네온 튜브 라인아트 형태의 발광 SVG 아이콘 세트 (`web/brand/icons/`).

---

## 3. 기술 스택 검토, 선택 및 폴더 구조

### 기술 스택 후보 종합 비교 검토

| 기술 스택 | 장점 | 단점 | `convertimage` 적합도 판단 |
| :--- | :--- | :--- | :--- |
| **Next.js (React)** | • Vercel 배포에 100% 최적화<br>• 브라우저 Canvas/WASM 제어가 매우 자유로움<br>• Tailwind CSS, Framer Motion 등 네온 UI 구현 용이<br>• SSR/SSG 및 i18n 라이브러리 ecosystem 우수 | • 순수 React 대비 서버 컴포넌트 이해 필요 | **[최종 선택]** 브라우저 이미지 변환, 반응형 UI, i18n, Vercel 배포 최적에 가장 부합함 |
| **Node.js (Express/Nest)** | • 서버 사이드 `sharp` 라이브러리로 대용량 변환 가능 | • 서버 CPU/대역폭 비용 증가<br>• 클라이언트 프론트엔드 UI를 별도로 구성해야 함 | **[보조 활용]** Firebase Cloud Functions 백엔드 API용으로 활용 |
| **Flutter (Web)** | • 크로스 플랫폼(모바일/데스크톱 앱 확장) 용이 | • HTML Canvas/WASM 패키지 생태계 제한<br>• Web 패키지 용량이 크고, SEO 및 Vercel DOM CSS 세밀 제어가 어려움 | **[미선택]** Web UI 반응형 초속 전환 및 Canvas 미세 제어에 다소 불리함 |
| **Three.js** | • 3D 그래픽 및 화려한 3D 배경 연출에 뛰어남 | • 2D 이미지 포맷 변환 도구에는 과도한 번들 용량 및 성능 오버헤드 유발 | **[미선택]** 2D Canvas 및 Framer Motion CSS로 충분히 분위기 연출 가능 |

### 최종 확정 기술 스택
- **Framework**: Next.js 15+ (React 19, App Router)
- **Styling & Motion**: Tailwind CSS v4, Framer Motion (네온/글로우 인터랙션)
- **Image Engine**: Client Browser HTML5 Canvas API, `gifuct-js` (GIF 프레임 추출), `sharp-wasm` / `libavif` (AVIF/WebP 폴백), `JSZip`
- **Backend & Auth**: Firebase Auth, Firestore, Firebase Cloud Storage
- **Deployment & CI/CD**: GitHub Main Branch -> Vercel Auto-Deployment

---

## 4. 화면 및 반응형 레이아웃 흐름

### 화면 구성 명세
1. **Intro Screen (`/intro`)**: 6초 비디오 인트로 재생 및 네온 글래스 스킵 버튼.
2. **Auth Screen (`/auth`)**:
   - 로그인 수단: Google OAuth, Email/Password, Phone Auth (`+82` 기본), Guest Mode.
   - 네온 카드 패널 디자인.
3. **Main Screen (`/`)**:
   - **기본 최우선 탭**: **[PNG로 변환 (Convert to PNG)]**.
   - 서브 포맷 탭: JPG, WebP, AVIF, GIF, BMP.

### 반응형 3개 프레임 세팅 (Ultra-Fast Responsive Switching)

| 프레임 구분 | 화면 조건 | 레이아웃 구조 | 특징 및 UX 요소 |
| :--- | :--- | :--- | :--- |
| **데스크톱 (Desktop)** | `w >= 1024px` | **Left Sidebar + Top/Center Tab** | • 좌측 사이드바: 최근 변환 기록, 빠른 설정, i18n 언어 스위처<br>• 중앙: 메인 DropZone 및 5개 단위 그룹화 리스트<br>• 우측 상단: `[마이페이지] [로그아웃]` |
| **모바일 세로 (Mobile Portrait)** | `w < 1024px` & Portrait | **Top Header + Bottom Navigation Bar** | • 상단 헤더: `convertimage` 네온 로고 + 언어 스위처<br>• 하단 네비게이션(높이 64px): `[변환 홈] [히스토리] [마이페이지]`<br>• 터치 친화적 콤팩트 DropZone |
| **모바일 가로 (Mobile Landscape)** | `w < 1024px` & Landscape | **Top Header (Compact) + Bottom Navigation Bar** | • 상단 헤더(슬림 높이): 로고와 주요 변환 버튼 한 줄 배치<br>• 하단 네비게이션(높이 56px)<br>• 화면 가로 수평 공간을 활용한 2열 변환 리스트 |

---

## 5. 조작 및 파일 변환 세부 스펙

| ID | 구분 | 항목 | 기입 상세 내용 |
|---|---|---|---|
| B-05-01 | 필수 | 변환 파일 지원 | **JPG, PNG, WebP, AVIF, GIF, BMP** 상호 변환 지원 |
| B-05-02 | 필수 | 파일 수량 규격 | **1개 ~ 최대 20개** 동시 업로드 및 일괄 변환 가능 |
| B-05-03 | 필수 | UI 리스트 그룹화 | 업로드 시 파일 카드가 세로로 추가되며, **5개 단위 페이지네이션/슬라이드** 그룹으로 표현 |
| B-05-04 | 필수 | 파일 업로드 방식 | 모든 화면 프레임에서 **Drag & Drop** 및 **파일 선택 버튼** 동시 지원 |
| B-05-05 | 필수 | 파일명 및 저장 위치 | • 변환 완료 후 **원본 파일명 유지 (확장자만 변환 포맷으로 교체)**<br>• 다운로드 위치는 원본 업로드 경로/브라우저 기본 다운로드 위치와 동일 유지 |

---

## 6. GIF 특수 판별 및 포맷 변환 핵심 로직

### GIF 처리 알고리즘 (GIF Special Logic)
1. **업로드 감지**: 확장자가 `.gif`인 파일 입출력 시 GIF Binary Header 및 Graphic Control Extension 분석.
2. **프레임 개수(Frame Count) 검사**:
   - `gifuct-js` / Canvas ImageDecoder API를 통해 GIF 내 Frame 수를 카운트.
3. **분기 처리**:
   - **Case A: Frame Count = 1 (정적 이미지)**
     - 일반 이미지와 동일하게 Canvas에 드로잉 후 대상 포맷(`image/png`, `image/webp` 등)으로 변환.
   - **Case B: Frame Count > 1 (동영상/애니메이션 GIF)**
     - GIF의 **첫 번째 프레임(Frame 0)** 픽셀 데이터만 추출.
     - 추출된 Frame 0을 Canvas 메모리 표면에 렌더링 후 선택된 포맷으로 변환 및 손실 없이 저장.

---

## 7. 다국어 (i18n) 설정 기준

* **소스 코드 작성 원칙**: 모든 변수, 함수명, 클래스명, 파일명, 주석, DB 필드명은 **100% 영문(English)**으로 작성한다.
* **사용자 화면 (UX) 언어 세팅**:
  * 지원 언어: **한국어 (Korean, Default)**, **영어 (English)**, **일본어 (Japanese)**.
  * 전환 스위처: UI 우측 상단/사이드바에 `[Ko / En / Ja]` 버튼을 배치하여 클릭 즉시 전체 UI 문구 실시간 변경.
  * i18n 리소스 키 구조:
    * `menu_png`: 한국어 "PNG로 변환" / English "Convert to PNG" / Japanese "PNG Convert"
    * `dropzone_msg`: 한국어 "이미지 파일을 여기에 드래그하세요" / English "Drag & drop image files here"
    * `btn_download_all`: 한국어 "전체 일괄 다운로드" / English "Download All"

---

## 8. 브랜드 자산 프롬프트 명세 ('케데헌' 스타일 7종)

| 용도 | 파일 경로 | 이미지 설명 및 '케데헌' 네온 비주얼 스펙 |
|---|---|---|
| **데스크톱 아이콘** | `public/assets/brand/icons/desktop/icon-512.png` | 딥 옵시디언 배경 중심, 네온 시안과 마젠타 라이닝이 발광하는 3D 변환 렌즈 아이콘. |
| **모바일 아이콘** | `public/assets/brand/icons/mobile/maskable-512.png` | 원형 마스크 안쪽 78% 영역에 선명하게 들어오는 발광 `c` 알파벳 에너제틱 마크. |
| **썸네일 스틸** | `public/assets/brand/thumbnails/still/thumbnail.png` | 1280x720. 다크 그래디언트 오로라 배경 위 네온 글래스 패널과 포맷 변환 시각 효과. |
| **썸네일 GIF** | `public/assets/brand/thumbnails/gif/thumbnail.gif` | 640x360 3초 루프. 이미지가 네온 포털을 통과하며 PNG로 손실 없이 순식간에 변환되는 연출. |
| **데이터 없음** | `public/assets/brand/states/empty/empty.png` | 960x540. 은은한 네온 서클이 일렁이는 빈 글래스모피즘 드롭존 패널. |
| **변환 완료** | `public/assets/brand/states/success/success.png` | 960x540. 시안/마젠타 에너지가 폭발하듯 피어오르는 완료 체크 마크 연출. |
| **오류 발생** | `public/assets/brand/states/error/error.png` | 960x540. 네온 테두리가 균열되며 붉은 글리치 효과가 감도는 경고 상태 표출. |

---

## 9. AI 코딩 에이전트 선정 및 평가

### Anti-Gravity vs Cursor 비교 분석

| 비교 항목 | Anti-Gravity (Google Agent Framework) | Cursor (AI-Native IDE) |
| :--- | :--- | :--- |
| **주요 특징** | • 자율적 백그라운드 에이전트 루프<br>• 복잡한 멀티 스텝 백엔드 타스크 자동화 특화 | • VS Code 포크 기반 AI Native IDE<br>• `@Codebase`를 통한 프로젝트 전체 맥락 파악<br>• Composer 기반 실시간 멀티 파일 수정 및 inline diff |
| **프론트엔드 / UI 개발** | • 터미널/CLI 스크립트 실행에는 강하나 UI visual feedback loop가 상대적으로 느림 | • Tailwind CSS, Framer Motion, Next.js 반응형 UI 및 Canvas 디버깅에 최고 성능<br>• 실시간 UI 프리뷰와 연동된 피드백 속도 최상 |
| **i18n & 코딩 규칙 준수** | • 가이드 준수 가능하나 세부 프론트엔드 스타일 교정에 추가 조율 필요 | • 영문 코드 규칙, i18n JSON 매핑, TypeScript 타입 추론 적용이 즉각적이고 정확함 |

### 최종 선정 결론: **Cursor**
`convertimage` 프로젝트는 **Next.js 반응형 UI, '케데헌' 스타일의 세밀한 Tailwind 네온 CSS, Canvas API를 이용한 GIF 프레임 추출, Drag & Drop 인터랙션, 3개 국어 i18n 처리** 등 **프론트엔드 세부 구현과 신속한 피드백 루프가 핵심**이므로, **Cursor**를 전담 개발 에이전트로 최종 선정한다.

---

## 10. 결론 및 개발 로드맵 (Next Steps)

1. **Repository & Hosting Setup**: GitHub 리포지토리 생성 및 Vercel 연동.
2. **Cursor Project Prompting**: 본 기획서를 Cursor `@Codebase` 맥락으로 등록.
3. **Core Development**:
   - `tailwind.config.ts`에 '케데헌' 네온 컬러/키프레임 등록.
   - GIF Frame 0 추출 및 Canvas 변환 커스텀 훅 (`useImageConverter`) 구현.
   - 반응형 3개 프레임 및 i18n (`ko`, `en`, `ja`) 연동.
4. **Testing & Vercel Deployment**: 20개 일괄 변환 및 Vercel 프로덕션 배포 완료.
