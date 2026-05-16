# AI PM 프로젝트 — 운영 규칙

## 핵심 원칙
- 프로젝트는 **단계적**으로 진행한다. 이전 단계 완료 확인 후 다음 단계로 진행한다.
- 작업 후 **즉시 배포하지 않는다.**
  모든 기능 구현 후 TC(테스트 케이스)를 먼저 작성하고, 코드 레벨 테스트를 수행한 뒤 결과를 리포팅한다.
  사용자가 직접 검증해야 할 항목은 `[사용자 검증 필요]` 태그로 명시한다.
- 산출물·UI·주석의 **기본 언어는 한국어**다.
- 작업 완료 시마다 `docs/project_log.md`를 업데이트한다.

## 이중 레이어 아키텍처 (중요)

`.claude/agents/*.md` 파일은 두 가지 역할을 동시에 수행한다:

**레이어 1 — Claude Code 개발 도구**
- YAML 프론트매터의 `description`으로 Claude Code가 개발 시 에이전트를 자동 라우팅
- `skills` 필드로 해당 스킬 파일의 내용을 에이전트 컨텍스트에 로드
- 에이전트는 다른 에이전트를 호출할 수 없음 (Claude Code 제약)

**레이어 2 — 프로덕션 앱의 system prompt 소스**
- `api/chat.js`가 `.md` 파일의 마크다운 바디를 Claude API system prompt로 로드
- YAML 프론트매터는 `gray-matter` 라이브러리로 분리해 제거
- 에이전트 파일을 수정하면 개발 도구와 프로덕션 동작 모두 변경됨

## API 보안 규칙

- `GEMINI_API_KEY` — 절대 클라이언트 코드에 사용 금지. `api/*.js` 서버 함수에서만 `process.env`로 접근
- `SUPABASE_SERVICE_ROLE_KEY` — 동일하게 서버 함수 전용
- `VITE_SUPABASE_ANON_KEY` — 클라이언트 안전 (Supabase RLS가 보호)
- `.env` 파일은 `.gitignore`에 포함되어 있으므로 절대 커밋하지 않는다

## 진행 단계 현황

| 단계 | 내용 | 상태 |
|------|------|------|
| 1 | 프로젝트 뼈대 생성 (설정 파일, Supabase 스키마) | 완료 |
| 2 | 에이전트 및 스킬 정의 (.claude/ 구성) | 완료 |
| 3 | 백엔드 API 함수 (api/) | 진행 중 |
| 4 | 프론트엔드 구현 (React + Vite) | 대기 |
| 5 | 로컬 테스트 (TC 작성 → 실행 → 리포트) | 대기 |
| 6 | GitHub 연동 및 Vercel 배포 | 대기 |

## 기술 스택

| 영역 | 기술 |
|------|------|
| 프론트엔드 | React 18, Vite 5, TailwindCSS |
| DB / BaaS | Supabase (MCP 연동, anon key는 클라이언트 안전) |
| AI | Google Gemini API (gemini-2.5-flash 전문가, gemini-2.0-flash 분류/eval) |
| 배포 | Vercel (api/*.js 서버리스 함수 자동 인식) |
| 소스관리 | GitHub |

## 에이전트 라우팅 규칙

| 에이전트 | 라우팅 키워드 | 사용 모델 |
|---------|-------------|---------|
| strategy-agent | OKR, 시장 분석, 경쟁사, go-to-market, 성장 전략 | gemini-2.5-flash |
| discovery-agent | 아이디어 검증, PRD, JTBD, 고객 문제, 디스커버리 | gemini-2.5-flash |
| execution-agent | 유저스토리, 인터뷰, UT, 백로그, 우선순위 | gemini-2.5-flash |
| eval-agent | (자동 호출만, 직접 라우팅 없음) | gemini-2.0-flash |

## Eval 품질 게이트

- eval-agent가 40점 만점으로 채점
- `total_score < 28` (70%): 피드백 포함 재생성 (최대 2회)
- `total_score >= 28`: 클라이언트로 스트리밍

## DB 스키마 개요

```
conversations (id, user_id, title, created_at, updated_at)
messages (id, conversation_id, role, content, agent_used, skills_used[], created_at)
evaluations (id, message_id, score_accuracy, score_expertise, score_completeness, score_language, total_score, feedback, evaluated_at)
knowledge_base (id, user_id, file_name, file_url, content_text, created_at)
```

## 환경변수 규칙

- 모든 환경변수는 `.env` 파일로 관리한다.
- `.env`는 절대 Git에 커밋하지 않는다 (`.gitignore` 필수 포함).
- `.env.example`로 필요한 키 목록을 문서화한다.
- API 키·비밀번호는 코드에 하드코딩 금지.
- `VITE_` 접두사 변수는 클라이언트 번들에 포함된다 — `ANTHROPIC_API_KEY`에는 절대 사용 금지.

## 테스트 케이스 (TC)

| TC ID | 테스트 항목 | 파일 |
|-------|-------------|------|
| TC-001 | Supabase 연결 확인 | tests/tc-001-supabase-connection.test.js |
| TC-002 | 메시지 저장·조회 | tests/tc-002-message-crud.test.js |
| TC-003 | 에이전트 호출 라우팅 | tests/tc-003-agent-routing.test.js |
| TC-004 | Eval 점수 계산 | tests/tc-004-eval-scoring.test.js |
| TC-005 | 파일 업로드 (KB) | tests/tc-005-file-upload.test.js |
| TC-006 | 답변 복사 버튼 | tests/tc-006-clipboard-copy.test.js |
