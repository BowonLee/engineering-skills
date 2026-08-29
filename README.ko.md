# Bakeflow

[English](README.md) | 한국어

Bakeflow는 언어와 제품 방향이 서로 다른 프로젝트에서도 반복되는 개발 원칙, 아키텍처 검토, 문서화, 스펙-구현 일치성 검토를 균일하게 관리하기 위한 CLI입니다.

여기서 "균일함"은 모든 프로젝트가 같은 규칙을 그대로 따라야 한다는 뜻이 아닙니다. Bakeflow는 공통으로 반복되는 추상 스킬 구조를 제공하고, 각 프로젝트는 그 스킬을 자신의 아키텍처, ADR, 디자인 시스템, 개발 사양에 맞게 적용하고 발전시킵니다.

핵심 목적은 간단합니다.

- 프로젝트마다 반복해서 설명해야 하는 구현/리뷰 규칙을 스킬로 관리합니다.
- `engineering.yaml` manifest를 기준으로 필요한 스킬과 문서 위치를 선언합니다.
- 공통 스킬과 프로젝트 고유 컨텍스트를 분리합니다.
- 문서, ADR, 아키텍처, 스펙, 구현이 서로 어긋나는 drift를 발견하기 쉽게 만듭니다.
- Codex와 Claude Code가 읽을 수 있는 프로젝트 로컬 산출물을 생성합니다.
- `bakeflow doctor`로 설정이 정상인지 검증합니다.

자세한 사용법은 [docs/USAGE.ko.md](docs/USAGE.ko.md)를 보세요. 기본 스킬 설명은 [docs/SKILLS.ko.md](docs/SKILLS.ko.md)에 있습니다. 영어 문서는 [docs/USAGE.md](docs/USAGE.md)에 있습니다.

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

## 기본 스킬

Bakeflow의 기본 스킬은 특정 언어나 프레임워크가 아니라 대부분의 프로젝트에서 반복되는 엔지니어링 관리 문제를 다룹니다.

- `implementation-guidelines`: 아키텍처, ADR, 검증 기대치를 지키며 구현합니다.
- `clean-architecture-docs`: Clean Architecture 경계와 코드-문서 디렉토리 대응을 검증합니다.
- `code-review`: 변경 사항을 아키텍처, 문서, 테스트 증거 기준으로 리뷰합니다.
- `documentation-consistency`: 문서, ADR, 설계 노트, 구현이 서로 맞는지 확인합니다.
- `architecture-drift-review`: 구현이 문서화된 아키텍처와 의존 방향에서 벗어났는지 검토합니다.
- `spec-to-implementation-review`: 스펙, 수용 기준, 테스트, 구현 사이의 누락을 찾습니다.

## 프로젝트별 발전 방식

가져간 프로젝트는 `.engineering/registry/skills`에 복사된 기본 스킬을 출발점으로 사용할 수 있습니다.

권장 흐름:

1. 공통 스킬을 그대로 적용합니다.
2. 프로젝트의 `docs/architecture`, `docs/adr`, `docs/design-system`, `docs/specs`를 채웁니다.
3. 반복되는 프로젝트 고유 규칙은 프로젝트 내부 스킬이나 문서로 먼저 기록합니다.
4. 여러 기능에서 검증된 규칙만 공통 스킬 후보로 승격합니다.
5. 공통화할 수 없는 규칙은 프로젝트 컨텍스트로 남깁니다.

이 구조는 공통 원칙을 유지하면서도 프로젝트별 차이를 억지로 지우지 않기 위한 것입니다.

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
