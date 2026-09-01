# Engineering Skills & Agent Context System

## 1. 문서 목적

이 문서는 여러 개발 프로젝트에서 공통으로 재사용할 수 있는 **AI Agent용 Engineering Skill 관리 체계**를 설계하고 구현하기 위한 초기 아키텍처 문서이다.

이 시스템의 목적은 특정 Agent Harness(Codex, Claude Code, OMC, OMX 등)에 종속되지 않고 다음과 같은 조직/개인 개발 지식을 중앙에서 관리하고 여러 프로젝트에서 재사용하는 것이다.

- Figma → Code 구현 절차
- Design System 적용 규칙
- 시스템 아키텍처 설계 및 변경 절차
- ADR(Architecture Decision Record) 작성 규칙
- 애플리케이션 개발 규칙
- Code Review 기준
- 테스트 및 검증 방법
- 프로젝트 문서 참조 및 갱신 절차

핵심 원칙은 다음과 같다.

- 공통 Skill은 특정 프로그래밍 언어, UI Framework, Backend Framework에 종속되지 않는다.
- 언어/Framework별 규칙이 필요하다면 별도의 선택적 확장 Skill로 분리한다.
- "균일함"은 동일한 구현 규칙을 강제한다는 뜻이 아니라, 여러 프로젝트에서 반복되는 검토 구조와 판단 순서를 공통화한다는 뜻이다.
- 프로젝트별 세부 규칙은 프로젝트의 architecture, ADR, design-system, specs 문서에서 발전시키고, 여러 프로젝트에서 반복 검증된 규칙만 공통 Skill로 승격한다.

> 공통 Engineering Knowledge의 원형은 패키지/저장소에서 관리한다.  
> 적용 프로젝트는 어떤 Skill을 사용할지 선언하고, Bakeflow가 프로젝트 로컬 registry/cache/generated 영역에 실행 가능한 사본과 인덱스를 준비한다.  
> 프로젝트에서 수정해야 하는 것은 generated 산출물이 아니라 프로젝트 컨텍스트 문서와 프로젝트 고유 Skill/Extension이다.

## 1.1 현재 구현 기준

현재 구현체의 이름은 `bakeflow`이며 npm 패키지 `@bakerleebb/bakeflow`로 배포한다.

구현된 실행 모델:

```text
npx @bakerleebb/bakeflow setup all
        ↓
engineering.yaml 생성 또는 사용
        ↓
.engineering/registry/skills 에 기본 Skill 복사
        ↓
.engineering/cache 에 선언된 Skill 동기화
        ↓
.engineering/generated 에 Agent Context Index 생성
        ↓
.codex/skills 또는 .claude/skills 에 Agent별 Skill 설치
        ↓
bakeflow doctor 로 검증
```

현재 기본 Skill:

```text
feature-design
architecture-design
adr-authoring
system-diagram
implementation-guidelines
clean-architecture-docs
code-review
documentation-consistency
architecture-drift-review
spec-to-implementation-review
```

이 열 개 Skill은 특정 언어/프레임워크 지식이 아니라 기능 설계, 아키텍처 설계, 결정 기록, 다이어그램, 구현 방향, Clean Architecture 문서 대응, 리뷰, 문서 일치성, 아키텍처 drift, 스펙-구현 정합성처럼 대부분의 개발 프로젝트에서 반복되는 관리 구조를 다룬다.

---

# 2. 전체 개념

전체 구조는 다음 세 가지 요소로 구성한다.

```text
1. engineering-skills
   공통 Engineering Knowledge 저장소

2. engineering.yaml
   프로젝트가 사용할 Skill을 선언하는 Manifest

3. bakeflow CLI / Resolver
   Manifest와 Skill 저장소를 연결하고 Agent 실행환경에 노출
```

npm 생태계에 비유하면 다음과 같다.

| 일반 개발 생태계 | Engineering Skills |
|---|---|
| npm registry | engineering-skills |
| npm / pnpm / npx | bakeflow CLI / Resolver |
| package cache | .engineering/cache |
| application | 실제 개발 프로젝트 |

---

# 3. 시스템 목표

이 프로젝트가 해결해야 하는 핵심 문제는 다음과 같다.

## 3.1 Skill의 프로젝트 종속 방지

다음과 같이 각 프로젝트에 동일 Skill을 복사하지 않는다.

```text
project-a/skills/
project-b/skills/
project-c/skills/
```

이 방식은 시간이 지나면서 Skill이 서로 다르게 변경되는 Drift 문제가 발생한다.

대신 중앙에서 관리한다.

```text
                  engineering-skills
                         │
              ┌──────────┼──────────┐
              │          │          │
          Project A  Project B  Project C
```

---

## 3.2 Agent Harness 종속 방지

Skill 자체가 특정 Agent에 종속되어서는 안 된다.

```text
Engineering Skills
        │
        ▼
      Resolver
        │
   ┌────┼────┬─────┐
   ▼    ▼    ▼     ▼
Codex Claude OMC   OMX
```

Agent별 차이는 Adapter Layer에서 처리한다.

---

## 3.3 프로젝트 고유 정보와 공통 규칙 분리

공통 Skill에는 다음과 같은 내용을 작성한다.

```text
Figma 화면 구현 시:

1. 기존 Design System 확인
2. 기존 Component 검색
3. Semantic Token 우선 사용
4. 신규 Component 필요성 검토
5. Architecture 준수
6. 구현
7. Visual Validation
```

반면 프로젝트 고유 정보는 실제 프로젝트에 존재한다.

```text
Project A

Design System:
lib/core/design_system/

Button:
AppButton

Architecture:
presentation → application → domain → data
```

Agent 실행 시 두 정보를 결합한다.

```text
Common Skill
      +
Project Context
      +
Current Task
      ↓
Effective Agent Context
```

---

# 4. Repository 구성

초기에는 하나의 Git Repository에서 Skill과 CLI를 함께 관리하는 것을 권장한다.

```text
engineering-skills/
│
├── README.md
│
├── skills/
│   ├── feature-design/
│   │   ├── skill.yaml
│   │   └── SKILL.md
│   │
│   ├── architecture-design/
│   │   ├── skill.yaml
│   │   └── SKILL.md
│   │
│   ├── adr-authoring/
│   │   ├── skill.yaml
│   │   └── SKILL.md
│   │
│   ├── system-diagram/
│   │   ├── skill.yaml
│   │   └── SKILL.md
│   │
│   ├── implementation-guidelines/
│   │   ├── skill.yaml
│   │   └── SKILL.md
│   │
│   └── code-review/
│       ├── skill.yaml
│       └── SKILL.md
│
│   ├── documentation-consistency/
│   │   ├── skill.yaml
│   │   └── SKILL.md
│   │
│   ├── architecture-drift-review/
│   │   ├── skill.yaml
│   │   └── SKILL.md
│   │
│   └── spec-to-implementation-review/
│       ├── skill.yaml
│       └── SKILL.md
│
├── src/
│   ├── cli.js
│   ├── setup.js
│   ├── cache.js
│   ├── prepare.js
│   ├── claude.js
│   ├── doctor.js
│   └── discover.js
│
└── schemas/
    ├── engineering.schema.json
    └── skill.schema.json
```

`standards`, `templates`, 원격 registry, lockfile은 이후 확장 지점이다. 현재 MVP는 npm으로 배포되는 CLI와 패키지 내 `skills/`를 프로젝트 로컬 registry로 복사하는 방식을 사용한다.

---

# 5. Skill 기본 구조

각 Skill은 독립된 실행 지침 단위로 관리한다.

예:

```text
skills/
└── figma-to-code/
    ├── skill.yaml
    ├── SKILL.md
    └── references/
```

## 5.1 skill.yaml

Skill의 Metadata를 정의한다.

```yaml
name: figma-to-code
version: 0.1.0

description: >
  Figma 디자인을 기존 프로젝트의 Design System과
  Architecture 규칙에 맞춰 구현하기 위한 Skill.

tags:
  - figma
  - ui
  - frontend
  - design-system

requires:
  tools:
    - figma

project_context:
  recommended:
    - design_system
    - architecture
```

초기에는 복잡한 Dependency 기능을 넣지 않는다.

---

# 6. SKILL.md 작성 원칙

Skill에는 특정 프로젝트 이름이나 경로를 넣지 않는다.

좋은 예:

```markdown
# Figma To Code

## Objective

Figma 디자인을 기존 Design System 및 프로젝트 Architecture에 맞게 구현한다.

## Workflow

1. Figma 화면 구조를 분석한다.
2. 프로젝트의 Design System을 확인한다.
3. 기존 Component가 존재하는지 확인한다.
4. 기존 Component를 우선 재사용한다.
5. Color, Typography, Spacing은 가능한 Semantic Token을 사용한다.
6. 신규 Component가 필요한 경우 기존 규칙에 맞게 추가한다.
7. 프로젝트 Architecture를 준수하여 Feature를 구현한다.
8. 구현 결과와 Figma를 비교하여 검증한다.

## Anti Patterns

- Figma의 수치를 그대로 Hard Coding
- 기존 Component 탐색 없이 신규 Component 생성
- 프로젝트 Architecture 확인 없이 새로운 Layer 생성
```

나쁜 예:

```text
Project A에서는 AppPrimaryButton을 사용한다.

파일 위치:
lib/common/widgets/app_primary_button.dart
```

이 정보는 Project A 내부 문서에 있어야 한다.

---

# 7. 실제 프로젝트 구조

Skill을 사용하는 프로젝트는 다음과 같이 구성할 수 있다.

```text
my-project/
│
├── engineering.yaml
├── engineering.lock        # 향후 추가 가능
│
├── AGENTS.md
│
├── docs/
│   ├── architecture/
│   ├── adr/
│   ├── design-system/
│   └── specs/
│
├── lib/
└── ...
```

---

# 8. engineering.yaml

프로젝트에서 사용할 Engineering Skill을 선언한다.

초기 형태:

```yaml
version: 1

registry:
  type: local
  path: ./.engineering/registry

skills:
  feature-design: 0.1.0
  architecture-design: 0.1.0
  adr-authoring: 0.1.0
  system-diagram: 0.1.0
  implementation-guidelines: 0.1.0
  code-review: 0.1.0
  documentation-consistency: 0.1.0
  architecture-drift-review: 0.1.0
  spec-to-implementation-review: 0.1.0

context:
  architecture: ./docs/architecture
  adr: ./docs/adr
  design_system: ./docs/design-system
  specs: ./docs/specs
```

이 파일의 의미는 다음과 같다.

```text
이 프로젝트에서는

feature-design
architecture-design
adr-authoring
system-diagram
implementation-guidelines
code-review
documentation-consistency
architecture-drift-review
spec-to-implementation-review

Skill을 사용한다.

프로젝트 고유 Architecture는
./docs/architecture 에 있다.
프로젝트 고유 Feature Spec은
./docs/specs 에 있다.
```

---

# 9. Project Context

프로젝트 고유 Engineering Knowledge는 중앙 Skill 저장소에 넣지 않는다.

예:

```text
docs/

architecture/
  overview.md
  authentication.md
  messaging.md

adr/
  001-use-riverpod.md
  002-websocket-ownership.md

design-system/
  tokens.md
  components.md

specs/
  feature-a.md
  payment-flow.md
```

예를 들어:

```markdown
# Design System

## Components

Primary Button:
`AppButton.primary`

Location:
`lib/core/design_system/components/button.dart`

## Spacing

Use `AppSpacing`.

Raw spacing values should not be introduced without justification.
```

이런 문서는 Project Context에 속한다.

---

# 10. bakeflow CLI 역할

`bakeflow` CLI는 Agent Framework가 아니다.

주요 역할은 다음과 같다.

```text
engineering.yaml
       ↓
Skill Resolve
       ↓
Local Cache
       ↓
Project Context
       ↓
Agent Adapter
       ↓
Codex / Claude / OMC / OMX
```

현재 CLI는 다음 명령을 제공한다.

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

MVP에서 원격 registry와 interactive configure/apply는 의도적으로 제외한다.

---

# 11. bakeflow sync

`bakeflow sync`는 `engineering.yaml`에 선언된 Skill을 프로젝트 cache로 가져온다.

```bash
bakeflow sync
```

처리 과정:

```text
engineering.yaml 읽기
        ↓
필요 Skill 목록 확인
        ↓
Local Cache 확인
        ↓
프로젝트 로컬 registry에서 Skill 복사
        ↓
Cache 저장
```

Local Cache 예:

```text
.engineering/

cache/
├── implementation-guidelines/
│   └── 0.1.0/
├── documentation-consistency/
│   └── 0.1.0/
└── spec-to-implementation-review/
    └── 0.1.0/
```

기본 동작은 프로젝트 내부 `.engineering/cache`를 사용한다. `ENGINEERING_HOME`을 지정하면 다른 cache 위치를 사용할 수 있지만, npx 기반 적용에서는 프로젝트 로컬 cache가 기본이다.

---

# 12. bakeflow prepare

`bakeflow prepare`는 현재 프로젝트에서 Agent가 Skill을 참조할 수 있도록 환경을 준비한다.

예:

```bash
bakeflow prepare codex --install-skills
```

개념적인 결과:

```text
Project
    │
    ├── engineering.yaml
    │
    ├── Project Context
    │
    └── Generated Agent Context
               │
               ▼
          Codex / Claude
```

프로젝트 내부에는 생성 전용 디렉터리를 사용할 수 있다.

```text
.engineering/
└── generated/
    ├── skills/
    │   ├── implementation-guidelines
    │   └── documentation-consistency
    │
    └── context.md
```

Skill은 복사보다 Symlink를 우선 고려한다.

```text
project/.engineering/generated/skills/documentation-consistency
              ↓
project/.engineering/cache/documentation-consistency/0.1.0
```

생성 파일은 Git에 포함하지 않는다.

```gitignore
.engineering/generated/
```

---

# 13. Agent Context Index

`prepare` 과정에서 Agent가 참고해야 할 위치를 알려주는 Index 문서를 생성할 수 있다.

예:

```markdown
# Effective Engineering Context

## Active Skills

- implementation-guidelines@0.1.0
- documentation-consistency@0.1.0
- architecture-drift-review@0.1.0
- spec-to-implementation-review@0.1.0

## Project Architecture

Read:
`docs/architecture/`

## Design System

Read:
`docs/design-system/`

## ADR

Read:
`docs/adr/`
```

모든 Project 문서를 하나의 Prompt로 병합하지 않는다.

필요한 위치를 Agent에게 알려주는 Index 역할로 사용하는 것을 권장한다.

---

# 14. Adapter Layer

Agent Harness마다 Skill을 읽는 방식이 다를 수 있으므로 Adapter를 둔다.

```text
Resolver
   │
   ├── Codex Adapter
   ├── Claude Adapter
   ├── OMC Adapter
   └── OMX Adapter
```

CLI 구조 예:

```text
cli/

├── commands/
│   ├── sync
│   ├── prepare
│   └── doctor
│
├── manifest/
│   └── parser
│
├── resolver/
│   └── skill-resolver
│
├── registry/
│   └── git-registry
│
├── cache/
│   └── local-cache
│
└── adapters/
    ├── codex
    ├── claude
    ├── omc
    └── omx
```

CLI / Resolver의 구현 언어는 이 설계에서 고정하지 않는다. 핵심은 명령 인터페이스와 Manifest, Resolver, Cache, Adapter 간의 책임 분리이며, 실제 구현 언어는 운영 환경과 배포 방식에 따라 선택한다.

초기 MVP에서는 하나의 Adapter만 구현한다.

실제 사용하는 Agent 환경을 먼저 지원하고 이후 확장한다.

---

# 15. AGENTS.md 역할

`AGENTS.md`에 모든 Skill 내용을 복사하지 않는다.

AGENTS.md는 Bootstrap 역할만 수행한다.

예:

```markdown
# Engineering Context

This repository uses shared Engineering Skills.

Manifest:
`./engineering.yaml`

Project Architecture:
`./docs/architecture`

Architecture Decisions:
`./docs/adr`

Design System:
`./docs/design-system`

Generated Engineering Context:
`./.engineering/generated`
```

---

# 16. Skill 버전 관리

Skill은 일반 Package와 동일하게 버전 관리한다.

초기에는 Semantic Versioning을 권장한다.

```text
figma-to-code@0.1.0
figma-to-code@0.2.0
figma-to-code@1.0.0
```

프로젝트에서는 `latest`를 사용하지 않는다.

```yaml
skills:
  figma-to-code: 0.1.0
```

Agent의 행동이 Skill 변경에 따라 바뀔 수 있기 때문에 정확한 버전을 고정하는 것이 중요하다.

---

# 17. engineering.lock

여러 개발자와 CI 환경에서 동일한 Skill Revision을 사용해야 할 필요가 생기면 Lock File을 추가한다.

예:

```yaml
version: 1

skills:
  figma-to-code:
    version: 0.1.0
    revision: a8cd912

  implementation-guidelines:
    version: 0.1.0
    revision: f2d112a
```

초기 MVP에서는 생략 가능하다.

---

# 18. Git Repository를 Registry로 사용

초기에는 별도의 Registry Server를 만들지 않는다.

GitHub 또는 GitLab Repository 자체를 Skill Registry로 사용한다.

```text
engineering-skills.git

skills/
├── figma-to-code/
├── architecture-design/
├── implementation-guidelines/
└── code-review/
```

CLI가 Git Repository에서 Skill을 내려받고 Local Cache에 보관한다.

사용 규모가 커진 이후 다음 기능이 필요할 경우 별도의 Registry를 고려한다.

- Skill 검색
- Organization별 접근 제어
- Dependency Graph
- Compatibility 정보
- Skill 사용 통계
- Skill 승인/검증 Workflow
- 중앙 버전 배포

---

# 19. Skill Promotion Process

프로젝트에서 발견된 모든 규칙을 즉시 공통 Skill에 추가하지 않는다.

다음 Lifecycle을 권장한다.

```text
Project-specific Rule
        ↓
프로젝트에서 반복 사용
        ↓
여러 Feature에서 검증
        ↓
일반화 가능한지 검토
        ↓
Engineering Skill로 승격
        ↓
다른 프로젝트 적용
```

예:

```text
Project A에서 WebSocket reconnect 패턴 발견

↓

Project ADR 작성

↓

여러 Feature에서 검증

↓

특정 프로젝트에 종속된 요소 제거

↓

공통 Architecture Skill 또는 Reference로 승격
```

이 과정을 통해 Skill Hub가 프로젝트 특수 규칙으로 오염되는 것을 방지한다.

---


# 20. 코드 구조와 문서 구조의 대응 원칙

프로젝트의 `docs/` 구조는 실제 코드의 Clean Architecture 구조와 대응되어야 한다.

문서는 별도의 위키처럼 독립적으로 구성하는 것이 아니라, **코드베이스의 구조를 사람이 읽을 수 있는 형태로 투영한 Engineering Context**로 관리한다.

기본 구조는 다음과 같다.

```text
project/
│
├── core/
│   ├── ...
│   └── ...
│
├── feature/
│   ├── auth/
│   ├── profile/
│   ├── payment/
│   └── ...
│
└── docs/
    ├── core/
    │   ├── overview.md
    │   └── ...
    │
    └── feature/
        ├── auth/
        │   └── overview.md
        │
        ├── profile/
        │   └── overview.md
        │
        └── payment/
            └── overview.md
```

핵심 규칙은 다음과 같다.

```text
code/core      ↔ docs/core
code/feature   ↔ docs/feature
```

실제 코드의 최상위 경로 이름은 프로젝트마다 다를 수 있다.

예를 들어 다음 구조도 가능하다.

```text
src/core
src/feature

app/core
app/feature

modules/core
modules/feature
```

중요한 것은 실제 경로명이 아니라 **Core와 Feature의 논리적 구조가 문서 구조에 동일하게 표현되는 것**이다.

---

# 21. Feature 문서 관리 규칙

각 Feature는 독립된 문서 Context를 가져야 한다.

예:

```text
feature/
└── auth/
    ├── domain
    ├── application
    ├── data
    └── presentation

docs/
└── feature/
    └── auth/
        └── overview.md
```

`overview.md`에는 최소한 다음 정보를 표현할 수 있어야 한다.

```text
Feature 목적

주요 책임

외부 의존성

주요 Domain 개념

데이터 흐름

사용하는 Core 기능

관련 ADR

다른 Feature와의 관계

중요한 제약사항
```

Feature 문서는 구현 세부사항을 모두 나열하는 문서가 아니다.

Agent와 개발자가 Feature를 수정하기 전에 다음을 빠르게 판단할 수 있도록 하는 것이 목적이다.

```text
이 Feature는 무엇을 담당하는가?

어떤 영역을 수정해야 하는가?

어떤 영역을 수정하면 안 되는가?

어떤 다른 Feature/Core와 연결되어 있는가?

과거에 어떤 Architecture Decision이 있었는가?
```

---

# 22. Feature 내부 Subdomain 문서

하나의 Feature가 충분히 커지면 하나의 `overview.md`에 모든 내용을 넣지 않는다.

큰 Domain은 Subdomain 단위로 코드와 문서를 같이 분리한다.

예:

```text
feature/
└── commerce/
    ├── catalog/
    ├── cart/
    ├── order/
    └── payment/
```

문서도 동일한 구조를 따른다.

```text
docs/
└── feature/
    └── commerce/
        ├── overview.md
        │
        ├── catalog/
        │   └── overview.md
        │
        ├── cart/
        │   └── overview.md
        │
        ├── order/
        │   └── overview.md
        │
        └── payment/
            └── overview.md
```

즉 다음 관계를 유지한다.

```text
Feature
    ↓
Subdomain
    ↓
Code

와

Feature Documentation
    ↓
Subdomain Documentation
```

Subdomain 분리는 단순히 파일 수가 많다는 이유로 수행하지 않는다.

다음과 같이 별도의 Business Responsibility를 가진 경우 분리한다.

```text
독립적인 Domain Rule을 가짐

별도의 State / Lifecycle을 가짐

다른 Subdomain과 명확한 경계를 가짐

관련 Architecture Decision이 독립적으로 존재함

Agent가 전체 Feature Context 없이도 부분 작업을 수행할 필요가 있음
```

---

# 23. Core 문서 관리 규칙

`core`는 여러 Feature가 공통으로 사용하는 시스템 레벨의 기능을 표현한다.

예:

```text
core/
├── networking
├── persistence
├── authentication
├── design-system
├── observability
└── navigation
```

문서는 다음과 대응한다.

```text
docs/
└── core/
    ├── overview.md
    ├── networking/
    ├── persistence/
    ├── authentication/
    ├── design-system/
    ├── observability/
    └── navigation/
```

Core 문서에는 다음 정보가 중요하다.

```text
Core Component의 책임

Public Interface

사용 가능한 Feature

금지된 Dependency 방향

Lifecycle

Error Handling 규칙

확장 방법

관련 ADR
```

Feature 문서와 Core 문서의 경계를 명확히 유지한다.

```text
Feature Docs
→ Business / Product Capability 중심

Core Docs
→ Shared Technical Capability 중심
```

---

# 24. Agent의 Documentation Lifecycle

Agent는 문서를 단순 참고 자료로 읽는 것이 아니라 **작업 Lifecycle의 일부로 사용해야 한다.**

기본 Workflow는 다음과 같다.

```text
Task 입력
   ↓
영향 범위 탐색
   ↓
관련 Core / Feature / Subdomain 문서 확인
   ↓
관련 ADR 확인
   ↓
코드 확인
   ↓
작업 계획
   ↓
구현
   ↓
코드 변경과 문서 상태 비교
   ↓
필요한 문서 수정
   ↓
검증
   ↓
작업 완료
```

이를 작업 시점 기준으로 나누면 다음과 같다.

## 작업 전

Agent는 구현 전에 관련 문서를 먼저 탐색한다.

```text
1. 작업 대상 Feature 확인
2. docs/feature/<feature> 확인
3. Subdomain이 존재하면 해당 문서 확인
4. 관련 Core 문서 확인
5. 관련 ADR 확인
6. 실제 코드와 문서가 일치하는지 확인
```

문서와 코드가 이미 불일치하면 이를 인지한 상태에서 작업해야 한다.

---

## 작업 중

Agent는 기존 문서가 정의한 Architecture Boundary를 유지한다.

예:

```text
Feature 책임 변경 여부

새로운 Core Dependency 발생 여부

Subdomain Boundary 변경 여부

새로운 Public Interface 발생 여부

기존 ADR과 충돌 여부
```

Architecture 수준의 결정이 발생하면 단순 코드 변경으로 끝내지 않고 문서 또는 ADR 갱신 필요 여부를 판단한다.

---

## 작업 후

Agent는 완료 전에 코드와 문서를 다시 비교한다.

다음 변화가 있었다면 문서 갱신 대상이다.

```text
Feature 책임 변경

새로운 Subdomain 생성

Subdomain 제거/통합

Core Dependency 변경

주요 Data Flow 변경

Public Interface 변경

Architecture Boundary 변경

새로운 중요한 Decision 발생
```

즉 완료 조건은 단순히 다음이 아니다.

```text
Code Complete
```

권장 완료 조건은 다음이다.

```text
Code Complete
+
Documentation Synchronized
+
Architecture Consistent
```

---

# 25. Documentation Consistency Skill

위 규칙은 독립적인 Skill로 관리할 수 있다.

예:

```text
skills/
└── documentation-consistency/
    ├── skill.yaml
    ├── SKILL.md
    └── references/
        ├── feature-doc-rules.md
        ├── core-doc-rules.md
        └── subdomain-doc-rules.md
```

이 Skill의 책임은 다음과 같다.

```text
코드와 docs 구조 대응 확인

관련 문서 탐색

작업 전 문서 참조

작업 후 문서 동기화

Feature/Core/Subdomain 구조 변경 감지

관련 ADR 연결 확인
```

---

# 26. Clean Architecture Documentation Skill

Clean Architecture 자체와 문서 구조 대응은 `clean-architecture-docs` Skill로 분리해 관리한다.

예:

```text
skills/
└── clean-architecture-docs/
    ├── skill.yaml
    ├── SKILL.md
    └── references/
        ├── core.md
        ├── feature.md
        └── subdomain.md
```

주요 책임:

```text
Core / Feature Boundary 정의

Feature별 Documentation 요구

Subdomain 분리 기준

Dependency Direction 확인

Code ↔ Docs 구조 대응 검증
```

---

# 27. 단일 Skill과 Composite Skill

Skill은 반드시 하나의 거대한 문서로 만들 필요가 없다.

두 가지 구조를 모두 지원하는 것이 좋다.

## 단일 Skill

한 가지 명확한 책임을 가진다.

예:

```text
documentation-consistency
clean-architecture-docs
architecture-decision
figma-to-code
code-review
```

---

## Composite Skill

여러 하위 Skill을 하나의 Workflow로 조합한다.

예:

```text
feature-development
```

가 내부적으로 다음 Skill을 사용한다.

```text
feature-development
│
├── clean-architecture-docs
├── documentation-consistency
├── architecture-decision
├── implementation
└── code-review
```

실행 흐름은 다음처럼 정의할 수 있다.

```text
Feature Development

      ↓

clean-architecture-docs
      ↓
현재 Feature / Core / Subdomain Context 확인

      ↓

architecture-decision
      ↓
기존 ADR 확인 및 새로운 Decision 필요 여부 판단

      ↓

implementation
      ↓
코드 변경

      ↓

documentation-consistency
      ↓
코드와 docs 동기화

      ↓

code-review
      ↓
Architecture / Documentation / Implementation 검증
```

---

# 28. Composite Skill Manifest 예시

Composite Skill은 하위 Skill 의존성을 명시할 수 있다.

예:

```yaml
name: feature-development
version: 0.1.0

type: composite

skills:
  - clean-architecture-docs
  - architecture-decision
  - implementation
  - documentation-consistency
  - code-review
```

더 발전된 형태에서는 순서를 명시할 수도 있다.

```yaml
name: feature-development
version: 0.1.0

type: composite

workflow:
  - skill: clean-architecture-docs
    phase: pre

  - skill: architecture-decision
    phase: pre

  - skill: implementation
    phase: execute

  - skill: documentation-consistency
    phase: post

  - skill: code-review
    phase: verify
```

MVP에서는 Composite Skill을 실제 Workflow Engine으로 구현하지 않아도 된다.

초기에는 Composite Skill의 `SKILL.md`에서 하위 Skill을 참조하도록 구성하고, Resolver가 해당 Skill들을 함께 노출하는 방식으로 충분하다.

---

# 29. 권장 Skill 계층

초기에는 다음과 같이 작은 책임의 Skill과 Composite Skill을 구분한다.

```text
Atomic Skills

clean-architecture-docs
documentation-consistency
architecture-decision
figma-to-code
code-review
testing


Composite Skills

feature-development
architecture-change
figma-feature-implementation
```

예:

```text
figma-feature-implementation
│
├── figma-to-code
├── clean-architecture-docs
├── documentation-consistency
└── code-review
```

이 구조를 사용하면 동일한 `documentation-consistency` Skill을 Figma 구현, 일반 Feature 개발, Architecture 변경 등 여러 Workflow에서 재사용할 수 있다.

---

# 30. Project Manifest에서 Composite Skill 사용

프로젝트는 Atomic Skill을 전부 직접 선언할 필요가 없다.

예:

```yaml
skills:
  feature-development: 0.1.0
  figma-feature-implementation: 0.1.0
```

Resolver는 Composite Skill이 요구하는 하위 Skill을 함께 resolve한다.

개념적으로:

```text
engineering.yaml

feature-development
       ↓
Resolver
       ↓
clean-architecture-docs
architecture-decision
documentation-consistency
code-review
```

이 방식은 Skill 관리의 중복을 줄이고, 조직에서 표준 Feature Development Workflow를 정의하는 데 유리하다.

---

# 31. 문서 구조 예시

권장 Project Documentation 구조는 다음과 같다.

```text
docs/
│
├── architecture/
│   ├── overview.md
│   └── dependency-rules.md
│
├── adr/
│   ├── 001-*.md
│   └── 002-*.md
│
├── core/
│   ├── overview.md
│   ├── networking/
│   │   └── overview.md
│   ├── persistence/
│   │   └── overview.md
│   └── design-system/
│       └── overview.md
│
└── feature/
    ├── authentication/
    │   ├── overview.md
    │   └── session/
    │       └── overview.md
    │
    ├── profile/
    │   └── overview.md
    │
    └── commerce/
        ├── overview.md
        ├── catalog/
        │   └── overview.md
        ├── cart/
        │   └── overview.md
        └── order/
            └── overview.md
```

이 구조의 목적은 Agent가 저장소 전체를 무작정 탐색하지 않고 다음과 같이 Context를 좁혀갈 수 있게 하는 것이다.

```text
Task
 ↓
Feature
 ↓
Subdomain
 ↓
Related Core
 ↓
ADR
 ↓
Code
```

문서는 Agent의 탐색 범위를 줄이고 Architecture Boundary를 명확하게 만드는 **Context Index** 역할을 한다.

---



# 32. Base Skill과 Project Specialization

공통 Skill은 중앙 저장소에서 충분히 추상화된 **Base Skill** 형태로 관리한다.

중앙 Skill은 특정 프로젝트의 실제 경로, 모듈 이름, 구현체 이름, 내부 인프라 이름 등을 직접 알지 않는다.

예:

```text
Base Skill: clean-architecture-docs

- Feature 구조와 Feature 문서는 대응되어야 한다.
- Core 구조와 Core 문서는 대응되어야 한다.
- 큰 Feature는 Subdomain 단위로 문서를 분리할 수 있어야 한다.
- Agent는 작업 전 관련 문서를 확인해야 한다.
- 작업 후 코드와 문서를 동기화해야 한다.
```

이 원형 Skill은 여러 프로젝트에서 공통으로 재사용된다.

하지만 각 프로젝트에 적용된 Skill은 해당 프로젝트의 실제 구조와 규칙에 맞게 특화될 수 있어야 한다.

권장 모델은 다음과 같다.

```text
Base Skill
    +
Project Configuration
    +
Project Extension
    =
Effective Project Skill
```

이 방식은 중앙 Skill을 직접 수정하거나 복사하지 않고도 프로젝트 특화 규칙을 적용할 수 있게 한다.

---

# 33. Project Configuration

Project Configuration은 중앙 Skill의 추상 규칙을 실제 프로젝트 구조에 연결하기 위한 설정이다.

예:

```yaml
skills:
  clean-architecture-docs:
    version: 1.0.0

    config:
      source_root: src
      core_path: src/core
      feature_path: src/features

      docs:
        core_path: docs/core
        feature_path: docs/features

      conventions:
        feature_doc: overview.md
        subdomain_doc: overview.md
```

위 설정은 다음 의미를 가진다.

```text
Base Skill의 "Feature 영역"
→ src/features

Base Skill의 "Core 영역"
→ src/core

Base Skill의 "Feature 문서"
→ docs/features

Base Skill의 "Core 문서"
→ docs/core
```

즉 중앙 Skill은 실제 디렉터리 이름을 강제하지 않는다.

프로젝트는 자신에게 맞는 실제 경로를 선언한다.

이 구조를 통해 다음과 같은 서로 다른 프로젝트도 같은 Skill을 사용할 수 있다.

```text
Project A

src/core
src/features

docs/core
docs/features
```

```text
Project B

application/shared
application/modules

docs/shared
docs/modules
```

중앙 Skill은 두 프로젝트 모두에 동일하게 적용될 수 있어야 한다.

---

# 34. Project Extension

Project Configuration만으로 표현하기 어려운 프로젝트 고유 Engineering Rule은 Project Extension으로 관리한다.

예를 들어 중앙 Skill의 기본 규칙이 다음과 같다고 가정한다.

```text
Feature 변경 시 관련 Feature 문서를 동기화한다.
```

Project A에는 추가적으로 다음 규칙이 필요할 수 있다.

```text
결제 Feature를 변경할 경우
integration 문서를 반드시 확인한다.

외부 결제 연동의 Architecture Boundary가 변경될 경우
관련 ADR을 반드시 생성하거나 갱신한다.
```

이 규칙은 중앙 Skill에 추가하면 안 된다.

Project A에만 유효한 규칙이기 때문이다.

따라서 프로젝트 내부에 Extension을 둔다.

예:

```text
project-a/

engineering.yaml

.engineering/
└── overrides/
    ├── clean-architecture-docs.md
    └── feature-development.md
```

`.engineering/overrides/`는 프로젝트의 공식 Engineering Knowledge이므로 Git에 포함한다.

예:

```markdown
# clean-architecture-docs Extension

## Payment

`payment` Feature 변경 전 다음 문서를 확인한다.

- integration
- external-provider
- 관련 Architecture Decision

외부 Provider와의 Boundary가 변경되면 ADR을 생성하거나 갱신한다.
```

---

# 35. Generated Context와 Project Extension의 구분

`.engineering/` 내부에는 서로 성격이 다른 두 영역이 존재할 수 있다.

```text
.engineering/
├── overrides/
│   └── ...
│
└── generated/
    └── ...
```

두 디렉터리의 역할은 명확히 구분한다.

```text
overrides/
→ 프로젝트가 직접 소유하는 Engineering Knowledge
→ 사람이 수정
→ Git에 포함

generated/
→ Resolver가 생성한 Effective Context
→ 사람이 직접 수정하지 않음
→ Git에서 제외
```

예:

```gitignore
.engineering/generated/
```

하지만 다음은 Git에서 제외하면 안 된다.

```text
.engineering/overrides/
```

---

# 36. Effective Project Skill

Agent가 실제로 사용하는 Skill은 중앙 Base Skill 그 자체가 아니다.

Resolver는 다음 입력을 결합한다.

```text
Base Skill

+

Project Configuration

+

Project Extension

+

Project Context

↓

Effective Project Skill
```

예를 들어 Base Skill이 다음과 같다고 가정한다.

```text
Feature 코드와 Feature 문서는 대응되어야 한다.
Agent는 Feature 수정 전 관련 문서를 확인한다.
작업 후 문서를 동기화한다.
```

Project Configuration:

```text
feature path:
src/modules

feature docs:
docs/features
```

Project Extension:

```text
payment Feature 작업 시
integration 문서와 관련 ADR을 반드시 확인한다.
```

Resolver가 만든 Effective Rule은 개념적으로 다음과 같다.

```text
src/modules/payment 변경 전:

1. docs/features/payment 확인
2. payment integration 문서 확인
3. 관련 ADR 확인
4. 실제 코드 구조 확인

작업 후:

1. 코드 변경과 docs/features/payment 비교
2. Feature 책임 변경 여부 확인
3. Integration Boundary 변경 여부 확인
4. 필요한 문서 및 ADR 동기화
```

이 Effective Skill이 Agent에게 전달된다.

---

# 37. Resolver의 Specialization 책임

Resolver는 단순히 Skill 파일을 다운로드하는 역할을 넘어 다음 단계를 수행한다.

```text
engineering.yaml 읽기
        ↓
Base Skill Resolve
        ↓
Project Configuration 적용
        ↓
Project Extension 로드
        ↓
Project Context 연결
        ↓
Effective Skill 구성
        ↓
Agent Adapter로 전달
```

즉 Resolver는 **Skill Specialization Layer** 역할을 가진다.

하지만 Resolver가 프로젝트 규칙을 임의로 생성해서는 안 된다.

Resolver의 책임은 다음으로 제한한다.

```text
선언된 설정 적용

명시된 Extension 연결

관련 Project Context 경로 연결

Skill 간 Composition 처리

Agent가 사용할 Effective Context 생성
```

---

# 38. Skill 상속보다 Composition을 우선한다

Project Skill 특화를 객체지향적인 상속 구조처럼 만들지 않는 것을 권장한다.

예:

```text
ProjectPaymentSkill
extends CleanArchitectureSkill
extends DocumentationSkill
extends ReviewSkill
```

이 방식은 Override 우선순위와 충돌 규칙이 복잡해지기 쉽다.

대신 다음 모델을 사용한다.

```text
Base Skill
      │
      ├── Configuration
      ├── Extension
      └── Project Context
              ↓
       Effective Skill
```

Composite Skill 역시 동일한 원칙을 따른다.

예:

```text
feature-development

├── clean-architecture-docs
├── architecture-decision
├── implementation-guidelines
├── documentation-consistency
└── code-review
```

Project A에서는:

```yaml
skills:
  feature-development:
    version: 1.2.0

    config:
      require_docs_sync: true
      require_adr_on_boundary_change: true

    extensions:
      - .engineering/overrides/feature-development.md
```

처럼 특화한다.

즉 전체 모델은 다음과 같다.

```text
Atomic Base Skills
        ↓
Composition
        ↓
Composite Skill
        ↓
Project Configuration
        ↓
Project Extension
        ↓
Effective Project Skill
```

---

# 39. Project Skill 관리 원칙

Project Specialization에는 다음 원칙을 적용한다.

1. 중앙 Skill의 원형을 직접 복사하지 않는다.
2. 중앙 Skill을 프로젝트에서 직접 수정하지 않는다.
3. 실제 경로와 Naming은 Configuration으로 해결한다.
4. 프로젝트 고유 Policy는 Extension으로 해결한다.
5. Extension은 프로젝트 Repository에서 Git으로 관리한다.
6. Resolver 생성물은 `generated` 영역으로 분리한다.
7. Project Extension이 충분히 일반화되고 여러 프로젝트에서 반복되면 Base Skill로 승격을 검토한다.
8. Base Skill 변경이 Project Extension을 무효화하지 않는지 검증할 수 있어야 한다.

이 구조를 통해 다음 Lifecycle을 만든다.

```text
Base Skill
   ↓
Project Specialization
   ↓
실제 프로젝트에서 검증
   ↓
반복적으로 유효한 규칙 발견
   ↓
일반화
   ↓
Base Skill 개선
```

즉 중앙 Skill과 프로젝트 Skill은 일방향 배포 관계만 가지는 것이 아니라,
프로젝트에서 검증된 Engineering Knowledge가 다시 중앙 Skill로 승격될 수 있는 순환 구조를 가진다.

---



# 40. Project Initialization Interview

새 프로젝트에 Engineering Skills를 적용할 때 Resolver 또는 Agent가 프로젝트 구조를 임의로 추측해서는 안 된다.

특히 다음 항목을 Repository 구조만 보고 확정해서는 안 된다.

```text
Core 영역
Feature 영역
Subdomain 경계
문서 Root
Architecture 방식
Dependency Boundary
ADR 정책
Design System 위치
문서 동기화 범위
프로젝트 고유 규칙
```

Repository 분석 결과는 **질문을 만들기 위한 근거**로 사용할 수 있지만, 불명확한 구조를 사실로 확정하는 근거로 사용하지 않는다.

프로젝트 초기화는 다음 흐름을 따른다.

```text
Repository Scan
      ↓
Known / Unknown 분류
      ↓
Initialization Interview
      ↓
사용자 확인
      ↓
Project Configuration 생성
      ↓
Project Extension 초안 생성
      ↓
Preview
      ↓
사용자 승인
      ↓
단계별 적용
```

이 과정을 `Project Initialization Interview`라고 정의한다.

---

# 41. Interview First 원칙

초기화 과정의 핵심 원칙은 **Infer, then Confirm**이다.

Agent는 Repository에서 확인 가능한 사실은 수집할 수 있다.

예:

```text
src/features 디렉터리가 존재한다.
docs 디렉터리가 존재한다.
여러 Module이 동일한 Layer 구조를 가진다.
ADR로 보이는 문서가 존재한다.
```

하지만 다음과 같이 해석이 필요한 사항은 사용자에게 확인해야 한다.

```text
src/features가 공식 Feature Root인가?

shared와 core 중 어느 영역이 Core 역할인가?

payment/order를 각각 Feature로 볼 것인가,
commerce의 Subdomain으로 볼 것인가?

기존 docs를 유지할 것인가,
새 docs 구조로 점진적으로 이전할 것인가?

모든 Feature에 문서를 강제할 것인가?
```

즉:

```text
Repository Evidence
       ↓
Candidate Interpretation
       ↓
Interview
       ↓
Confirmed Configuration
```

구조를 따른다.

---

# 42. Deep Interview 방식

초기 Interview는 한 번에 수십 개 질문을 출력하는 설문 방식보다,
앞선 답변에 따라 다음 질문이 달라지는 단계형 Interview를 권장한다.

예:

```text
Q1. 현재 프로젝트에서 기능 단위를 구분하는 기준은 무엇인가?

        ↓

"src/modules 단위"

        ↓

Q2. modules 내부 항목은 모두 독립 Feature인가?

        ↓

"아니다. commerce는 큰 Domain이고
order/payment/cart가 하위 Domain이다."

        ↓

Q3. commerce를 Feature,
order/payment/cart를 Subdomain으로 관리할 것인가?

        ↓

확정
```

Agent는 이미 명확하게 확인된 내용을 반복해서 질문하지 않는다.

반대로 중요한 정보가 불명확한 상태에서는 임의의 기본값으로 확정하지 않는다.

---

# 43. Interview 대상

Initialization Interview는 필요한 Skill에 따라 질문 범위를 동적으로 구성한다.

예를 들어 `clean-architecture-docs`를 적용하려면 최소한 다음을 확인해야 한다.

```text
Source Root

Core 역할을 하는 영역

Feature 역할을 하는 영역

Feature 경계 기준

Subdomain 존재 여부 및 판단 기준

현재 docs 위치

Feature Docs 위치

Core Docs 위치

기존 문서 유지/이전 정책
```

`documentation-consistency`가 추가되면 다음을 추가 확인할 수 있다.

```text
어떤 변경을 문서 변경으로 간주하는가?

모든 코드 변경에 Sync를 수행하는가?

Architecture/Responsibility 변경만 Sync하는가?

문서 누락 시 Agent가 자동 생성할 수 있는가?

자동 수정 전 사용자 확인이 필요한가?
```

`architecture-decision` Skill이 추가되면 다음을 확인한다.

```text
ADR을 사용하는가?

ADR 위치는 어디인가?

어떤 변경을 Architecture Decision으로 판단하는가?

기존 ADR 수정과 신규 ADR 생성 기준은 무엇인가?
```

즉 Skill 자체가 **Initialization Questions / Required Configuration**을 정의할 수 있어야 한다.

---

# 44. Skill의 Initialization Contract

Base Skill은 자신을 프로젝트에 적용하기 위해 어떤 정보가 필요한지 선언할 수 있다.

개념적인 예:

```yaml
name: clean-architecture-docs
version: 1.0.0

initialization:
  required:
    - source_root
    - feature_path
    - core_path
    - docs.feature_path
    - docs.core_path

  discoverable:
    - source_root
    - feature_path
    - core_path

  confirm:
    - feature_boundary
    - subdomain_policy
    - docs_migration_policy
```

의미는 다음과 같다.

```text
required
→ Skill 적용을 위해 반드시 필요한 정보

discoverable
→ Repository Scan으로 후보를 찾을 수 있는 정보

confirm
→ 추측하지 않고 사용자 확인이 필요한 정보
```

실제 Manifest 규격은 구현 단계에서 변경될 수 있지만,
Skill이 자신의 초기화 요구사항을 선언한다는 원칙은 유지한다.

---

# 45. Confidence와 Confirmation

Repository Scan 결과에는 확정값과 후보값을 구분한다.

예:

```text
Observed:
src/features exists

Candidate:
feature_path = src/features

Confidence:
high

Status:
unconfirmed
```

Confidence가 높더라도 Architecture 의미를 가진 설정은 사용자 확인 없이 확정하지 않는 것을 기본으로 한다.

예:

```text
src/core 존재
→ Core 후보로 제안 가능

src/core 존재
→ 공식 Core Root라고 자동 확정
X
```

이 원칙은 기존 프로젝트에 잘못된 Architecture를 강제하는 것을 방지한다.

---

# 46. Initialization Preview

Interview가 끝나더라도 바로 Repository를 변경하지 않는다.

먼저 적용 예정 결과를 Preview한다.

예:

```text
Engineering Skills Initialization

Detected:
- Source root: src
- Feature root candidate: src/modules
- Existing docs: docs/

Confirmed:
- Core root: src/shared
- Feature root: src/modules
- commerce = Feature
- order/payment/cart = Subdomains

Will create/update:
- engineering.yaml
- docs/core/
- docs/feature/
- .engineering/overrides/

Will NOT modify:
- source code
- existing architecture
- existing docs without confirmation
```

사용자가 결과를 확인한 뒤 실제 적용한다.

---

# 47. 단계별 적용

Engineering Skills는 프로젝트 전체에 한 번에 적용할 필요가 없다.

특히 기존 프로젝트에서는 점진적 도입을 기본으로 지원해야 한다.

예를 들어 다음 단계로 적용할 수 있다.

```text
Stage 0
Discovery Only

Repository 분석
Interview
Configuration Preview

        ↓

Stage 1
Manifest Only

engineering.yaml 생성
Skill 연결
기존 코드/문서 변경 없음

        ↓

Stage 2
Documentation Mapping

docs/core
docs/feature

구조 정의

        ↓

Stage 3
Selected Feature Adoption

특정 Feature만 문서 대응

        ↓

Stage 4
Documentation Sync

Agent 작업 전/후
문서 Sync 적용

        ↓

Stage 5
Architecture Governance

ADR
Boundary Validation
Code Review 규칙 적용
```

사용자는 원하는 단계까지만 적용할 수 있어야 한다.

---

# 48. Feature 단위 점진 적용

큰 Legacy Project에서는 모든 Feature를 동시에 문서화하는 것이 비현실적일 수 있다.

따라서 적용 범위를 선언할 수 있어야 한다.

예:

```yaml
skills:
  clean-architecture-docs:
    version: 1.0.0

    adoption:
      mode: selective

      features:
        - authentication
        - payment
```

이 경우 Agent는 아직 Adoption 대상이 아닌 Feature에 대해 새로운 문서 구조를 강제하지 않는다.

개념적으로:

```text
authentication
✓ Managed

payment
✓ Managed

profile
○ Unmanaged

legacy-search
○ Unmanaged
```

이 상태를 명시적으로 관리할 수 있어야 한다.

---

# 49. Adoption State

프로젝트는 Skill별 적용 상태를 관리할 수 있다.

예:

```yaml
skills:
  clean-architecture-docs:
    version: 1.0.0

    adoption:
      stage: documentation-mapping
      mode: selective
```

향후 다음처럼 확장할 수 있다.

```text
discovered
configured
partially-adopted
managed
```

중요한 것은 Skill 적용 여부를 단순 Boolean으로 보지 않는 것이다.

```text
Skill Installed
true / false
```

보다는:

```text
Skill
  ↓
어느 범위까지 적용되었는가?
  ↓
어떤 Feature가 관리 대상인가?
  ↓
어떤 규칙이 활성화되었는가?
```

를 표현할 수 있어야 한다.

---

# 50. Initialization CLI 개념

CLI는 다음과 같은 초기화 흐름을 지원할 수 있다.

```text
eng init
```

실행:

```text
Repository Scan

↓

Interactive Interview

↓

Configuration Preview

↓

사용자 확인

↓

engineering.yaml 생성
```

단계별 실행도 가능하게 한다.

```text
eng init --discover
```

```text
분석만 수행
파일 변경 없음
```

```text
eng init --configure
```

```text
Interview 수행
Configuration 초안 생성
```

```text
eng apply
```

```text
승인된 Configuration 적용
```

구체적인 CLI 명령 이름은 구현 과정에서 변경할 수 있다.

중요한 것은 다음 상태를 분리하는 것이다.

```text
Discover
   ≠
Configure
   ≠
Apply
```

---

# 51. 기존 프로젝트와 신규 프로젝트

Interview 방식은 신규 프로젝트와 기존 프로젝트 모두 지원한다.

신규 프로젝트:

```text
Architecture가 아직 없음
        ↓
Agent가 선택지를 설명
        ↓
사용자가 결정
        ↓
Project Configuration 생성
```

기존 프로젝트:

```text
Architecture가 이미 존재
        ↓
Repository Scan
        ↓
현재 구조 후보 파악
        ↓
Interview로 실제 의도 확인
        ↓
현재 Architecture를 Configuration으로 표현
```

특히 기존 프로젝트에서는 Engineering Skills가 새로운 Architecture를 강제로 도입하는 도구가 되어서는 안 된다.

우선 목표는:

```text
현재 프로젝트의 실제 Engineering Model을
명시적인 Context로 표현하는 것
```

이다.

그 이후 Architecture 개선은 별도의 작업으로 수행한다.

---

# 52. Interview 결과의 저장

Interview 결과는 일회성 대화로 끝나면 안 된다.

확정된 내용은 프로젝트의 명시적 Configuration 또는 Extension으로 저장한다.

```text
Interview
   ↓
Confirmed Decision
   ↓
engineering.yaml
또는
.engineering/overrides/
또는
Project Docs / ADR
```

다음 실행에서 Agent는 이미 확정된 내용을 다시 질문하지 않는다.

새로운 질문은 다음 경우에만 발생한다.

```text
새로운 Skill 추가

기존 Skill의 필수 Configuration 변경

새로운 Feature Adoption

Architecture 구조 변경 감지

기존 Configuration과 Repository의 충돌 발견
```

즉 Interview 자체도 Project Engineering Knowledge를 구축하는 과정이다.

---

# 53. Initialization의 핵심 원칙

Project Initialization에는 다음 원칙을 적용한다.

1. **Architecture 의미를 가진 구조를 Repository 이름만 보고 확정하지 않는다.**
2. **Repository Scan은 추측의 근거가 아니라 Interview 후보 생성에 사용한다.**
3. **불명확한 사항은 사용자에게 질문한다.**
4. **이미 확인된 사항은 반복해서 질문하지 않는다.**
5. **Skill별 Required Configuration을 기반으로 질문한다.**
6. **Interview 결과를 Preview한 뒤 적용한다.**
7. **Discover / Configure / Apply 단계를 분리한다.**
8. **기존 프로젝트에서는 현재 Architecture를 우선 존중한다.**
9. **Skill은 프로젝트 전체가 아니라 Feature 단위로 점진 적용할 수 있다.**
10. **Interview 결과는 Manifest, Extension, Docs, ADR 등 지속 가능한 Project Knowledge로 저장한다.**


# 54. 초기 Skill 후보

초기에는 Skill 수를 크게 늘리지 않는다.

초기에는 작은 책임의 Atomic Skill과 이를 조합한 Composite Skill을 함께 설계한다.

우선순위가 높은 후보는 다음과 같다.

## figma-to-code

목적:

```text
Figma
  ↓
Design System 확인
  ↓
Existing Component Mapping
  ↓
Architecture 확인
  ↓
Implementation
  ↓
Visual Validation
```

---

## architecture-design

목적:

```text
Feature Requirement
      ↓
Existing Architecture 확인
      ↓
관련 ADR 확인
      ↓
기존 Pattern 적용 가능성 검토
      ↓
새로운 Decision 필요 여부 판단
      ↓
필요 시 ADR 작성
```

---

## implementation-guidelines

목적:

- 프로젝트 Architecture 준수
- Layer / Module 간 Dependency 규칙 준수
- 상태 및 데이터 흐름 규칙 준수
- 비동기 작업 및 동시성 처리 원칙
- Error Handling 규칙
- 공통 모듈 및 공통 컴포넌트 재사용 원칙
- 테스트 및 검증 기준

특정 언어나 프레임워크의 일반 지식을 담는 것이 아니라,
조직에서 공통으로 사용하는 구현 원칙과 제약사항만 작성한다.

---

## code-review

목적:

- Architecture violation 확인
- Design System violation 확인
- 중복 Component 확인
- Error Handling 확인
- 테스트 누락 확인
- 불필요한 Complexity 확인

---

# 55. MVP 구현 범위

처음부터 전체 플랫폼을 만들지 않는다.

## v0.1

구현 대상:

```text
engineering-skills Git Repository

+

engineering.yaml

+

bakeflow CLI / Resolver
  ├── sync
  └── prepare

+

Agent Adapter 1개
```

기능:

```text
Skill 중앙 관리
✓

프로젝트 Skill 선언
✓

Local Cache
✓

Agent Context 생성
✓

여러 프로젝트 공유
✓
```

아직 구현하지 않는 것:

```text
Skill 자동 선택
Skill Dependency
Registry Server
Web UI
Skill 검색
Skill 사용 통계
자동 Skill Promotion
복잡한 Multi-Agent orchestration
```

---

# 56. 향후 확장

실제 사용성이 검증된 이후 다음 순서로 확장한다.

```text
v0.2
Skill Version 관리 강화

v0.3
engineering.lock

v0.4
추가 Agent Adapter

v0.5
bakeflow doctor

v0.6
Skill Dependency

v0.7
Skill/Profile 기능

v0.8
Skill Router

v1.0
Registry Service
```

---

# 57. Profile 기능

여러 프로젝트가 동일 Skill 세트를 반복적으로 사용한다면 Profile 개념을 추가할 수 있다.

예:

```yaml
profile: application-standard@1.0.0
```

Profile 내부:

```yaml
skills:
  figma-to-code: 1.0.0
  implementation-guidelines: 1.2.0
  architecture-drift-review: 1.0.0
  code-review: 1.1.0
```

이렇게 하면 프로젝트마다 모든 Skill을 반복해서 선언할 필요가 없다.

Profile은 MVP 이후 도입한다.

---

# 58. 최종 실행 흐름

최종적으로 개발자가 경험하는 Workflow는 다음과 같다.

```text
1. 프로젝트 Clone

git clone project-a

        ↓

2. Skill 동기화

bakeflow sync

        ↓

3. Agent Context 준비

bakeflow prepare codex

        ↓

4. Agent 실행

codex

        ↓

5. 개발 요청

"Figma에 있는 프로필 화면을 구현해."

        ↓

6. Agent가 참조

- figma-to-code Skill
- implementation-guidelines Skill
- Project Design System
- Project Architecture
- 관련 ADR
- Figma

        ↓

7. 코드 구현

        ↓

8. 필요한 경우 Project Docs / ADR 업데이트
```

---

# 59. 핵심 설계 원칙 요약

이 시스템을 구현할 때 다음 원칙을 유지한다.

1. **프로젝트 초기화 시 Architecture를 임의로 확정하지 않고 Repository 분석과 사용자 확인을 거친다.**
2. **Skill은 프로젝트 전체에 일괄 적용하지 않고 단계 및 Feature 단위로 점진 적용할 수 있어야 한다.**
3. **Discover / Configure / Apply를 분리하고 실제 변경 전 Preview를 제공한다.**
4. **코드의 Core / Feature / Subdomain 구조와 docs 구조를 대응시킨다.**
5. **Agent는 작업 전 관련 문서를 확인하고 작업 후 코드와 문서를 동기화한다.**
6. **재사용 가능한 작은 Skill과 이를 조합하는 Composite Skill을 분리한다.**
7. **중앙 Skill은 Base Skill로 추상화하고 프로젝트에서는 Configuration과 Extension으로 특화한다.**
8. **프로젝트 고유 Extension은 Git으로 관리하고 Resolver 생성물은 Git에서 제외한다.**
9. **공통 Skill 원형과 Project Context를 분리한다.**
10. **Project는 사용할 Skill과 문서 위치를 Manifest로 선언한다.**
11. **Resolver가 Skill, Project Configuration, Extension, Context를 연결한다.**
12. **Agent별 차이는 Adapter에서 처리한다.**
13. **Skill은 버전 관리한다.**
14. **검증된 프로젝트 규칙만 공통 Skill로 승격한다.**
15. **일반적인 프로그래밍 지식은 Skill로 만들지 않는다.**
16. **MVP에서는 Registry Server나 Skill Router를 만들지 않는다.**
17. **현재 npm/npx 배포 모델에서는 공통 Skill 원형을 패키지에서 관리하고, 적용 프로젝트에는 로컬 registry/cache/generated 산출물을 만든다.**

---

# 60. 초기 개발 체크리스트

프로젝트 생성 후 다음 순서대로 진행한다.

```text
[x] engineering-skills Git Repository 생성

[x] skills/ 디렉터리 생성

[x] clean-architecture-docs Skill 작성

[x] documentation-consistency Skill 작성

[x] feature-design Skill 작성

[ ] feature-development Composite Skill 작성

[ ] figma-to-code Skill 작성

[x] architecture-design Skill 작성

[x] architecture-drift-review Skill 작성

[x] adr-authoring Skill 작성

[x] system-diagram Skill 작성

[x] implementation-guidelines Skill 작성

[x] code-review Skill 작성

[x] spec-to-implementation-review Skill 작성

[x] engineering.yaml 규격 정의

[ ] Skill Initialization Contract 규격 정의

[x] Repository Discovery 구현

[ ] Interactive Initialization Interview 설계

[ ] Initialization Preview 구현

[ ] Discover / Configure / Apply 단계 분리

[ ] Feature 단위 Adoption 상태 규격 정의

[x] bakeflow CLI / Resolver 프로젝트 생성

[x] YAML Parser 구현

[x] bakeflow sync 구현

[x] Local Cache 구현

[x] bakeflow prepare 구현

[x] Codex Adapter 구현

[x] Claude Code Adapter 구현

[ ] 실제 Project A에 engineering.yaml 추가

[ ] Project Context 문서 연결

[ ] Project Skill Configuration 규격 정의

[ ] .engineering/overrides 규칙 정의

[ ] Base Skill + Configuration + Extension 병합 구현

[ ] Effective Project Skill 생성 검증

[ ] docs/core ↔ core 구조 대응 검증

[ ] docs/feature ↔ feature 구조 대응 검증

[ ] Subdomain 문서화 규칙 검증

[ ] Agent 작업 전/후 Documentation Sync 검증

[ ] 실제 Agent 개발 Workflow 테스트

[ ] 불편한 지점을 기록하고 다음 버전 범위 결정
```

---

# 61. 이 프로젝트의 경계

이 프로젝트는 다음을 목표로 하지 않는다.

- 새로운 LLM 개발
- 새로운 Multi-Agent Harness 개발
- Codex/Claude Code 대체
- MCP 대체
- 일반적인 개발 문서 저장소 구축

이 프로젝트의 역할은 명확하다.

> **조직 또는 개인의 Engineering Knowledge를 재사용 가능한 Skill로 관리하고, 프로젝트 Context와 결합하여 다양한 AI Agent 개발환경에 안정적으로 제공하는 것.**

즉, 이 프로젝트의 핵심 자산은 Agent 자체가 아니라 **Engineering Knowledge와 그것을 전달하는 구조**이다.
