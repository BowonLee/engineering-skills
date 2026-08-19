# Bakeflow

[English](README.md) | 한국어

Bakeflow는 재사용 가능한 엔지니어링 스킬과 프로젝트 컨텍스트를 AI 코딩 에이전트가 읽을 수 있는 형태로 준비하는 CLI입니다.

핵심 목적은 간단합니다.

- 프로젝트마다 반복해서 설명해야 하는 구현/리뷰 규칙을 스킬로 관리합니다.
- `engineering.yaml` manifest를 기준으로 필요한 스킬과 문서 위치를 선언합니다.
- Codex와 Claude Code가 읽을 수 있는 프로젝트 로컬 산출물을 생성합니다.
- `bakeflow doctor`로 설정이 정상인지 검증합니다.

자세한 사용법은 [docs/USAGE.ko.md](docs/USAGE.ko.md)를 보세요. 영어 문서는 [docs/USAGE.md](docs/USAGE.md)에 있습니다.

## 빠른 시작

Codex용으로 설정:

```bash
npx --yes @bakerleebb/bakeflow setup --codex
```

Claude Code용으로 설정:

```bash
npx --yes @bakerleebb/bakeflow setup --claude
```

둘 다 설정:

```bash
npx --yes @bakerleebb/bakeflow setup all
```

배포된 패키지 확인:

```bash
npm view @bakerleebb/bakeflow version
npx --yes @bakerleebb/bakeflow --help
```

## 생성되는 파일

Codex 설정은 다음을 만듭니다.

```text
.engineering/generated/context.md
.engineering/generated/skills/
.codex/skills/
```

Claude Code 설정은 다음을 만듭니다.

```text
.engineering/generated/claude-context.md
.claude/CLAUDE.md
.claude/skills/
```

`setup` 명령은 기본적으로 `.engineering/cache`와 `.engineering/registry`를 프로젝트 내부에 만들고, 필요한 ignore 항목을 `.gitignore`에 추가합니다.

## 주요 명령

```bash
bakeflow setup --codex
bakeflow setup --claude
bakeflow setup all
bakeflow sync
bakeflow prepare codex --install-skills
bakeflow prepare claude
bakeflow doctor
```

## 패키지 포함물

npm 패키지에는 다음이 포함됩니다.

- CLI 소스: `src/`
- 기본 스킬: `skills/`
- 스키마: `schemas/`
- 영어 문서: `README.md`, `docs/USAGE.md`
- 한글 문서: `README.ko.md`, `docs/USAGE.ko.md`
- 설계 문서: `engineering-skills-architecture.md`

## 개발

```bash
npm install
npm test
npm run pack:check
```
