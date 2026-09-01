# Bakeflow 사용법

[English](USAGE.md) | 한국어

Bakeflow는 프로젝트의 엔지니어링 스킬과 컨텍스트 문서를 에이전트별 형식으로 준비하는 CLI입니다.

## 기본 개념

흐름은 다음과 같습니다.

```text
engineering.yaml
  -> bakeflow sync
  -> .engineering/cache
  -> bakeflow prepare codex 또는 bakeflow prepare claude
  -> .engineering/generated/*
  -> .codex/skills 또는 .claude/skills
```

`engineering.yaml`은 프로젝트 manifest입니다. 어떤 스킬을 사용할지, 프로젝트 문서가 어디에 있는지 선언합니다.

Bakeflow의 목적은 모든 프로젝트를 동일하게 만드는 것이 아니라, 공통적으로 반복되는 엔지니어링 검토 구조를 제공하고 프로젝트별 세부 규칙은 각 프로젝트의 문서와 스킬에서 발전시키는 것입니다.

## npx 한 줄 설정

Codex용:

```bash
npx --yes @bakerleebb/bakeflow setup --codex
```

Claude Code용:

```bash
npx --yes @bakerleebb/bakeflow setup --claude
```

둘 다:

```bash
npx --yes @bakerleebb/bakeflow setup all
```

이 명령은 다음을 자동 처리합니다.

- `engineering.yaml`이 없으면 생성
- `.engineering/registry`에 기본 스킬 복사
- `.engineering/cache`를 프로젝트 로컬 캐시로 사용
- `docs/architecture`, `docs/adr`, `docs/design-system`, `docs/specs` 생성
- 스킬 동기화
- Codex 또는 Claude Code용 산출물 생성
- `bakeflow doctor` 실행
- `.gitignore`에 생성물/캐시 경로 추가

## 생성 파일

공통:

```text
.engineering/
├── cache/
├── generated/
└── registry/
```

Codex:

```text
.engineering/generated/context.md
.codex/skills/
```

Claude Code:

```text
.engineering/generated/claude-context.md
.claude/CLAUDE.md
.claude/skills/
```

## 기존 프로젝트에 적용

프로젝트 루트에서 실행합니다.
`/path/to/project`는 예시 경로이므로 실제 프로젝트 경로로 바꿔야 합니다.

```bash
cd /path/to/project
npx --yes @bakerleebb/bakeflow setup all
```

설정 후 Codex에는 이렇게 지시하면 됩니다.

```text
Read .engineering/generated/context.md first.
Use the relevant generated skills and project context files for this task.
```

Claude Code는 `.claude/CLAUDE.md`와 `.claude/skills/`를 자동으로 읽을 수 있습니다. Bakeflow는 `.claude/CLAUDE.md`에 관리 블록을 추가합니다.

## 명령어

```bash
bakeflow setup --codex
bakeflow setup --claude
bakeflow setup all
bakeflow init --discover
bakeflow sync
bakeflow prepare codex --install-skills
bakeflow prepare claude
bakeflow doctor
```

## 기본 스킬과 적용 대상

```text
feature-design                 기능 요청과 스펙을 구현 가능한 설계로 분해
architecture-design            시스템, 모듈, 기능 아키텍처 설계
adr-authoring                  아키텍처 결정 기록 작성
system-diagram                 Mermaid/C4 스타일 구조 다이어그램
implementation-guidelines       구현 방향, 아키텍처, 검증 기준
clean-architecture-docs         Clean Architecture와 코드-문서 구조 대응
code-review                     코드 리뷰 기준
documentation-consistency       문서와 구현의 일치성
architecture-drift-review       아키텍처 drift 검토
spec-to-implementation-review   스펙, 테스트, 구현의 일치성
```

프로젝트별로 다른 세부 규칙은 `docs/architecture`, `docs/adr`, `docs/design-system`, `docs/specs`에 기록합니다. 여러 프로젝트에서 반복 검증된 규칙만 공통 스킬로 승격하는 것이 권장 흐름입니다.

각 스킬의 목적, 실행 흐름, 피해야 할 패턴은 [기본 스킬 문서](SKILLS.ko.md)에 정리되어 있습니다.

## 패키지 확인

npm에 배포된 패키지를 확인합니다.

```bash
npm view @bakerleebb/bakeflow name version bin files --json
npx --yes @bakerleebb/bakeflow --help
```

패키지 tarball에 문서가 포함되는지 확인합니다.

```bash
npm pack @bakerleebb/bakeflow --dry-run
```

로컬 개발 중에는 다음을 사용합니다.

```bash
npm test
npm run pack:check
```

## 현재 한계

현재 지원 범위:

- local registry
- Codex adapter
- Claude Code adapter
- 프로젝트 로컬 스킬 설치
- 기본 구현/리뷰 스킬

아직 남은 확장:

- Git registry resolution
- lockfile
- 스킬 의존성 해석
- OMC/OMX adapter
