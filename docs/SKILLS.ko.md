# Bakeflow 기본 스킬 문서

이 문서는 `@bakerleebb/bakeflow` 패키지에 포함된 기본 스킬을 한국어로 정리한 문서입니다.

Bakeflow의 스킬은 특정 언어나 프레임워크의 구현법을 강제하지 않습니다. 여러 프로젝트에서 반복되는 개발 방향, 아키텍처 검토, 문서화, 스펙-구현 일치성 검토를 같은 구조로 수행하도록 돕는 공통 지침입니다.

## 공통 전제

스킬을 적용하는 에이전트는 먼저 프로젝트에 생성된 컨텍스트 인덱스를 읽습니다.

```text
Codex: .engineering/generated/context.md
Claude Code: .engineering/generated/claude-context.md
```

그 다음 현재 작업에 필요한 스킬과 프로젝트 문서를 선택해 읽습니다. 모든 문서를 한 번에 합치는 것이 아니라, 작업에 필요한 문서와 스킬을 정확히 찾아 읽게 하는 것이 목적입니다.

프로젝트별 세부 규칙은 다음 위치에 두는 것을 권장합니다.

```text
docs/architecture     아키텍처와 경계
docs/adr              의사결정 기록
docs/design-system    디자인 시스템과 UI 규칙
docs/specs            기능 스펙과 수용 기준
```

## 전체 요약

| 스킬 | 목적 | 주로 읽는 프로젝트 문서 |
| --- | --- | --- |
| `feature-design` | 기능 요청과 스펙을 구현 가능한 설계 단위로 분해합니다. | `architecture`, `adr`, `design_system`, `specs` |
| `architecture-design` | 시스템, 모듈, 기능의 아키텍처 대안과 선택안을 설계합니다. | `architecture`, `adr`, `specs` |
| `adr-authoring` | 아키텍처 결정의 배경, 대안, 결과, 검증 기준을 ADR로 기록합니다. | `architecture`, `adr`, `specs` |
| `system-diagram` | 아키텍처와 흐름을 Mermaid/C4 스타일 다이어그램으로 표현합니다. | `architecture`, `adr`, `specs` |
| `implementation-guidelines` | 구현 방향, 재사용, 의존 경계, 검증 기준을 맞춥니다. | `architecture`, `adr` |
| `clean-architecture-docs` | Clean Architecture 경계와 코드-문서 디렉토리 대응을 검증합니다. | `architecture`, `adr`, `specs` |
| `code-review` | 변경 사항의 행동, 아키텍처, 테스트, 문서 리스크를 리뷰합니다. | `architecture`, `adr`, `design_system` |
| `documentation-consistency` | 문서, ADR, 설계 노트, 구현이 서로 맞는지 확인합니다. | `architecture`, `adr`, `design_system`, `specs` |
| `architecture-drift-review` | 구현이 문서화된 아키텍처와 의존 방향에서 벗어났는지 검토합니다. | `architecture`, `adr`, `design_system` |
| `spec-to-implementation-review` | 스펙, 수용 기준, 테스트, 구현 사이의 누락을 찾습니다. | `architecture`, `adr`, `specs` |

## `feature-design`

기능 요청이나 스펙을 구현 가능한 설계 단위로 바꾸는 스킬입니다. 기능 경계, 사용자 흐름, 데이터/API/state 변경, 테스트, 문서 업데이트를 한 번에 정리합니다.

사용 시점:

- 사용자 요청이나 feature spec을 구현 작업으로 분해할 때
- 기능 경계, module, subdomain 영향을 먼저 정리해야 할 때
- UI, API, 데이터, 상태 변화가 같은 동작을 함께 바꿀 때
- 구현 전에 테스트와 문서 업데이트 범위를 정해야 할 때

실행 흐름:

1. 생성된 컨텍스트 인덱스를 읽습니다.
2. 원본 요청, feature spec, acceptance criteria, issue, PR 설명을 찾습니다.
3. 목표, non-goal, 사용자-facing 동작, edge case, 호환성 제약, 성공 기준을 추출합니다.
4. 영향을 받는 feature, module, subdomain 경계와 재사용할 기존 패턴을 찾습니다.
5. 사용자 흐름, 데이터 흐름, API 계약, 상태 전이, 오류 처리, migration 필요 여부를 설계합니다.
6. `architecture-design` 또는 `adr-authoring`이 필요한 아키텍처 결정을 표시합니다.
7. 단위, 통합, e2e, visual, accessibility, migration, 운영 검증 중 필요한 테스트를 정합니다.
8. specs, architecture, ADR, design-system, release note 업데이트를 나열합니다.

피해야 할 패턴:

- acceptance criteria 추출 없이 기능 요청을 바로 구현 가능한 것으로 보는 것
- UI, API, 데이터 변경을 서로 독립적으로 설계하는 것
- 제품 또는 아키텍처 결정을 기록하지 않고 범위를 넓히는 것
- 문서와 테스트 없는 구현 handoff를 만드는 것

## `architecture-design`

현재 프로젝트 증거와 제약을 기반으로 시스템, 모듈, 기능의 아키텍처를 설계하는 스킬입니다. 단일 정답을 바로 제시하기보다 선택지와 tradeoff를 분명히 합니다.

사용 시점:

- 새 시스템, 모듈, 기능의 구조를 설계할 때
- 기존 경계, 레이어, 의존 방향을 바꿀 가능성이 있을 때
- 여러 아키텍처 대안 중 하나를 선택해야 할 때
- 구현 전에 migration, rollout, validation 전략을 정해야 할 때

실행 흐름:

1. 생성된 컨텍스트 인덱스를 읽습니다.
2. 설계 대상, 범위, non-goal, 제약, acceptance criteria를 확인합니다.
3. 기존 architecture docs, ADR, specs, 대표 코드 경로를 읽습니다.
4. 현재 레이어, 모듈, 소유권, 의존 방향, 데이터 흐름, 통합 지점, 저장소 경계를 매핑합니다.
5. 중요한 결정이면 두 개 이상의 가능한 선택지를 만듭니다.
6. 단순성, 경계 보존, 테스트 가능성, migration risk, 성능, 보안, 운영성을 기준으로 비교합니다.
7. 권장 아키텍처와 경계, 의존 방향, 데이터/control flow, 실패 처리, rollout 방식을 설명합니다.
8. 필요한 문서, ADR, specs, diagrams, tests, validation commands를 정리합니다.

피해야 할 패턴:

- 프로젝트의 현재 아키텍처를 읽기 전에 일반론으로 설계하는 것
- 경계, 소유권, tradeoff 없이 다이어그램만 만드는 것
- decision driver 없이 선택안을 고르는 것
- ADR 필요 여부를 남기지 않는 것

## `adr-authoring`

아키텍처 결정이 일회성 설명으로 사라지지 않도록 ADR로 기록하는 스킬입니다. 결정 배경, 대안, 결과, 구현 영향, 검증 기준을 함께 남깁니다.

사용 시점:

- 아키텍처 경계, 의존 방향, 저장소, 통신 방식, migration 전략이 바뀔 때
- 여러 선택지 중 하나를 선택한 이유를 기록해야 할 때
- 구현 후 우발적 drift를 정당화하지 않고 의도된 결정으로 남겨야 할 때
- 기존 ADR을 supersede하거나 deprecate해야 할 때

실행 흐름:

1. 생성된 컨텍스트 인덱스를 읽습니다.
2. 기존 ADR 번호, status, 작성 관례를 확인합니다.
3. 기록할 결정이 routine implementation detail이 아니라 architecture decision인지 확인합니다.
4. context, constraints, decision drivers, alternatives, decision을 작성합니다.
5. benefit, cost, risk, migration impact, compatibility impact, future constraint를 결과로 남깁니다.
6. 영향을 받는 코드 경계, specs, tests, docs, rollout 작업을 연결합니다.
7. unresolved question과 accepted assumption을 분리합니다.

피해야 할 패턴:

- 구현 후 accidental drift를 정당화하기 위해 ADR을 쓰는 것
- 선택된 안만 기록하고 대안과 tradeoff를 누락하는 것
- 독립적인 여러 결정을 하나의 ADR에 섞는 것
- verification과 implementation impact를 빼는 것

## `system-diagram`

프로젝트 증거를 바탕으로 현재 또는 제안된 아키텍처를 Mermaid/C4 스타일 다이어그램으로 표현하는 스킬입니다. 설계 판단 자체보다는 구조를 읽기 쉽게 보여주는 데 집중합니다.

사용 시점:

- 현재 시스템 구조를 설명해야 할 때
- 제안된 설계를 문서나 ADR에 시각적으로 연결할 때
- 데이터 흐름, 의존 방향, 외부 시스템 연동을 명확히 해야 할 때
- migration 전후 구조를 구분해 보여줘야 할 때

실행 흐름:

1. 생성된 컨텍스트 인덱스를 읽습니다.
2. 다이어그램 목적을 정합니다. 예: current state, proposed design, migration, integration, dependency, deployment.
3. 관련 architecture docs, ADR, specs, code path를 확인합니다.
4. context, container, component, sequence, data flow, dependency, deployment 중 가장 작은 유용한 수준을 고릅니다.
5. 별도 관례가 없다면 Mermaid markdown을 우선 사용합니다.
6. boundary, ownership, external system, protocol, storage, dependency/data flow 방향을 표시합니다.
7. current state와 proposed state를 명확히 구분합니다.
8. 관련 문서 경로에 저장하거나 갱신하고, architecture docs 또는 ADR에서 링크합니다.

피해야 할 패턴:

- repo evidence 없이 추측으로 다이어그램을 그리는 것
- 모든 시스템 세부사항을 하나의 거대한 다이어그램에 넣는 것
- 방향, 소유권, 경계 라벨을 생략하는 것
- current와 proposed를 구분하지 않는 것

## `implementation-guidelines`

현재 프로젝트의 아키텍처, ADR, 의존 경계, 검증 기대치를 지키면서 변경을 구현하도록 돕는 스킬입니다.

사용 시점:

- 새 기능을 구현할 때
- 기존 동작을 수정할 때
- 코드 구조를 바꾸기 전에 프로젝트의 경계와 기존 패턴을 확인해야 할 때
- 새 추상화, 새 레이어, 새 유틸리티를 추가해도 되는지 판단해야 할 때

실행 흐름:

1. 생성된 컨텍스트 인덱스를 읽습니다.
2. 관련 아키텍처 문서와 ADR을 확인합니다.
3. 기존 모듈, 유틸리티, 패턴을 먼저 찾습니다.
4. 의존 방향이 문서화된 구조와 맞는지 확인합니다.
5. 변경 범위를 작고 검증 가능하게 유지합니다.
6. 변경된 동작에 대한 집중 테스트를 추가하거나 갱신합니다.
7. 변경을 증명할 수 있는 최소 검증을 실행합니다.

피해야 할 패턴:

- 기존 아키텍처 확인 없이 새 레이어를 만드는 것
- 공통 로직을 기존 유틸리티 대신 복사해 늘리는 것
- generated context를 프로젝트 원본 문서처럼 취급하는 것
- 동작을 바꾸고도 검증을 생략하는 것

## `clean-architecture-docs`

프로젝트가 문서화된 Clean Architecture 구조를 따르는지, 그리고 코드베이스의 논리적 경계가 문서 디렉토리에도 대응되어 있는지 검증하는 스킬입니다.

이 스킬은 모든 프로젝트에 `core/`와 `feature/`라는 이름을 강제하지 않습니다. 프로젝트가 사용하는 실제 용어와 구조를 먼저 확인하고, 그 구조가 문서에 같은 논리 경계로 표현되어 있는지를 봅니다.

사용 시점:

- 프로젝트에 Clean Architecture 준수 규칙을 적용할 때
- 새 feature, module, package, subdomain이 추가됐을 때
- 코드 디렉토리 구조와 문서 디렉토리 구조가 어긋났는지 확인할 때
- 의존 방향이나 레이어 경계 변경이 문서화됐는지 확인할 때

실행 흐름:

1. 생성된 컨텍스트 인덱스를 읽습니다.
2. 프로젝트의 아키텍처 루트를 찾습니다. 예: `core`, `feature`, `module`, `domain`, `application`, `infrastructure`, `presentation`, `adapter`.
3. 실제 경로 이름만 보지 말고 코드베이스의 논리적 경계를 먼저 매핑합니다.
4. 같은 논리 경계가 문서 디렉토리에 존재하는지 확인합니다.
5. 변경된 feature, module, subdomain마다 대응 문서가 있는지 확인합니다.
6. 의존 방향이 프로젝트의 Clean Architecture 규칙과 맞는지 확인합니다.
7. 누락을 코드 경계 누락, 문서 경계 누락, 오래된 문서, 의도된 구조 차이로 분류합니다.
8. 코드 경로, 기대 문서 경로, 관련 규칙, 최소 수리 방법을 함께 보고합니다.

대표적인 대응 예:

```text
code/core             -> docs/core
code/feature/<name>   -> docs/feature/<name>
src/domain            -> docs/domain
src/application       -> docs/application
src/infrastructure    -> docs/infrastructure
modules/<name>        -> docs/modules/<name>
packages/<name>       -> docs/packages/<name>
```

피해야 할 패턴:

- 동등한 Clean Architecture 용어를 쓰는 프로젝트에 `core/`, `feature/` 이름을 강제하는 것
- 아키텍처 책임 설명 없이 파일 구조만 기계적으로 복제한 문서 폴더를 만드는 것
- 새 feature, module, subdomain, dependency direction이 생겼는데 문서 누락을 가볍게 보는 것
- 우발적 architecture drift를 결정 기록 없이 문서에 맞춰 정당화하는 것

## `code-review`

코드 변경을 프로젝트 아키텍처, 문서화된 결정, 품질 기대치, 테스트 증거 기준으로 리뷰하는 스킬입니다.

사용 시점:

- PR 또는 로컬 변경을 리뷰할 때
- 구현이 끝난 뒤 병합 전 위험을 찾을 때
- 테스트가 변경된 동작을 충분히 증명하는지 확인할 때
- 문서나 ADR 업데이트가 필요한지 판단할 때

실행 흐름:

1. 변경된 동작과 건드린 경계를 식별합니다.
2. 구현이 기존 아키텍처와 의존 규칙을 따르는지 확인합니다.
3. 기존 컴포넌트, 유틸리티, 패턴을 적절히 재사용했는지 확인합니다.
4. 테스트가 변경 동작과 주요 회귀 가능성을 커버하는지 확인합니다.
5. 문서나 ADR 업데이트 필요 여부를 확인합니다.
6. 파일 참조를 포함해 심각도 순서로 findings를 보고합니다.

피해야 할 패턴:

- 행동 또는 아키텍처 리스크보다 스타일 코멘트를 우선하는 것
- 검증 증거 없이 변경을 승인하는 것
- 동작이 바뀌었는데 테스트 누락을 가볍게 보는 것

## `documentation-consistency`

프로젝트 문서, 아키텍처 노트, ADR, 디자인 시스템 노트, 실제 구현 동작이 서로 맞는지 확인하는 스킬입니다.

사용 시점:

- 구현은 바뀌었지만 문서가 그대로인지 확인할 때
- 문서가 말하는 구조와 실제 코드가 다른지 확인할 때
- 새 동작에 ADR, 아키텍처 문서, 디자인 시스템 문서, 기능 스펙 갱신이 필요한지 판단할 때
- 오래된 문서를 정리하거나 문서 기준으로 구현 누락을 찾을 때

실행 흐름:

1. 생성된 컨텍스트 인덱스를 읽습니다.
2. 변경된 동작을 설명하거나 소유하는 문서를 찾습니다.
3. 문서의 주장과 현재 코드, 생성물, 테스트, 사용자-facing 동작을 비교합니다.
4. 오래된 문서와 누락된 구현을 분리해 판단합니다.
5. 새 동작에 ADR, 아키텍처 노트, 디자인 시스템 노트, 기능 스펙 업데이트가 필요한지 확인합니다.
6. 불일치 항목을 파일 참조와 함께 보고하고, 가장 작은 수리 방법을 제시합니다.

피해야 할 패턴:

- 구현 확인 없이 문서가 항상 맞다고 가정하는 것
- 우연히 생긴 동작을 의도된 동작인지 확인하지 않고 문서에 맞추는 것
- 작은 ADR이나 노트로 충분한데 대규모 문서 재작성으로 키우는 것
- generated context를 원본 프로젝트 문서 대신 사용하는 것

## `architecture-drift-review`

구현이 프로젝트의 문서화된 아키텍처, 의존 방향, 소유 경계, 디자인 시스템 사용 규칙에서 벗어났는지 검토하는 스킬입니다.

사용 시점:

- 새 import, 새 레이어, 새 데이터 흐름이 생겼을 때
- 기능 구현 중 경계가 흐려졌는지 확인할 때
- 의도된 아키텍처 변화인지 우발적 drift인지 분리해야 할 때
- 아키텍처 변경이 ADR 또는 문서 업데이트 없이 들어갔는지 확인할 때

실행 흐름:

1. 생성된 컨텍스트 인덱스를 읽습니다.
2. 변경 파일에 적용되는 아키텍처 문서, ADR, 소유 경계, 의존 방향을 찾습니다.
3. 새 import, 레이어, 컴포넌트, 데이터 흐름, 빌드 단계, 생성 파일이 경계를 바꿨는지 확인합니다.
4. 각 drift를 의도된 변경, 우발적 변경, 문서화되지 않은 변경, 무해한 차이로 분류합니다.
5. 의도된 drift라면 ADR 또는 아키텍처 문서 업데이트를 요구합니다.
6. 우발적 drift라면 문서화된 경계를 회복하는 가장 작은 코드 변경을 제안합니다.
7. 리스크 순서로 findings를 보고하고 위반된 규칙 또는 누락된 결정 기록을 명시합니다.

피해야 할 패턴:

- 문서화된 경계와 연결하지 않고 모든 차이를 drift로 부르는 것
- 의도된 아키텍처 진화를 막고 결정 기록을 요구하지 않는 것
- 의존 방향이나 소유권 문제를 남긴 채 증상만 고치는 것
- 재사용이나 삭제로 충분한데 새 추상화를 추가하는 것

## `spec-to-implementation-review`

기능 스펙, 요구사항, 수용 기준, 테스트, 구현 동작이 서로 맞는지 검증하는 스킬입니다.

사용 시점:

- 기능 구현이 스펙을 모두 만족하는지 확인할 때
- 수용 기준별 테스트 증거가 있는지 확인할 때
- 구현은 끝났지만 스펙의 non-goal, edge case, 호환성 조건을 놓쳤는지 점검할 때
- PR 설명, 이슈, 사용자 요청과 실제 변경 사이의 차이를 찾을 때

실행 흐름:

1. 생성된 컨텍스트 인덱스를 읽습니다.
2. 관련 스펙, 이슈, PR 설명, 사용자 요청, 수용 기준을 찾습니다.
3. 필수 동작, non-goal, edge case, 검증 기대치를 추출합니다.
4. 각 요구사항을 구현과 비교합니다.
5. 테스트가 필수 동작과 주요 회귀 가능성을 증명하는지 확인합니다.
6. 스펙이 요구하는 문서, ADR, 마이그레이션, 릴리스 노트 누락 여부를 확인합니다.
7. 요구사항, 구현 증거, 테스트 증거, 수리 방법 형태로 gap을 보고합니다.

피해야 할 패턴:

- 코드가 있다는 이유로 구현 완료를 증명했다고 보는 것
- 테스트가 수용 기준에 매핑되지 않는데 충분하다고 보는 것
- 제품 또는 아키텍처 결정을 명시하지 않고 스펙 밖으로 범위를 넓히는 것
- non-goal과 호환성 제약을 무시하는 것

## 스킬 조합 예시

새 기능 구현:

```text
feature-design
  -> architecture-design
  -> adr-authoring
  -> system-diagram
  -> implementation-guidelines
  -> clean-architecture-docs
  -> spec-to-implementation-review
  -> documentation-consistency
  -> code-review
```

작은 변경이라면 `architecture-design`, `adr-authoring`, `system-diagram`은 필요한 경우에만 사용합니다.

아키텍처에 영향이 있는 변경:

```text
architecture-design
  -> adr-authoring
  -> system-diagram
  -> implementation-guidelines
  -> clean-architecture-docs
  -> architecture-drift-review
  -> documentation-consistency
  -> code-review
```

문서 정리 또는 감사:

```text
documentation-consistency
  -> clean-architecture-docs
  -> architecture-drift-review
  -> spec-to-implementation-review
```

## 프로젝트에서 스킬을 발전시키는 방식

기본 스킬은 출발점입니다. 프로젝트별 세부 규칙은 바로 공통 스킬에 넣지 말고, 먼저 해당 프로젝트의 문서나 로컬 스킬로 관리합니다.

권장 흐름:

1. 기본 스킬을 그대로 적용합니다.
2. 프로젝트 고유 규칙은 `docs/architecture`, `docs/adr`, `docs/design-system`, `docs/specs`에 기록합니다.
3. 여러 기능에서 반복 검증된 규칙만 공통 스킬 후보로 올립니다.
4. 특정 프로젝트에만 필요한 규칙은 프로젝트 컨텍스트로 남깁니다.

이 방식은 프로젝트 간 검토 구조를 균일하게 유지하면서도, 각 프로젝트의 언어, 프레임워크, 제품 방향 차이를 지우지 않기 위한 구조입니다.
