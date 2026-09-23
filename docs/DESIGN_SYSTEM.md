# Prism Design System v0.1

이 문서는 확정된 Stitch Prototype을 Prism의 구현 기준으로 정리한 문서입니다.

## Direction

**Tactile Soft-Pop + Digital Pet Nostalgia (Tamagotchi-chic)**

Prism은 전통적인 운세 사이트보다, 세 명의 작은 Companion과 함께 나를 알아가는 따뜻한 디지털 펫 경험에 가깝게 디자인합니다.

### Companion

- 모디: 사주 / Peach
- 스텔라: 점성술 / Lavender
- 피코: 수비학 / Mint

## Core Colors

- Canvas: `#FFFDF9`
- Canvas Muted: `#FDF7F2`
- Surface: `#FFFFFF`
- Border: `#F3E8E1`
- Primary Text: `#5A4E4D`
- Muted Text: `#8C7E7C`

### Saju / Modi

- Main: `#FF9E80`
- Tint: `#FFEDE6`
- Dark: `#944930`

### Astrology / Stella

- Main: `#9C8EB9`
- Tint: `#F3EFFF`
- Dark: `#645880`

### Numerology / Pico

- Main: `#6AA595`
- Tint: `#EBF6F2`
- Dark: `#2D685A`

## Typography

- Primary: Plus Jakarta Sans
- Korean fallback: Pretendard / Apple SD Gothic Neo / Noto Sans KR
- Heavy, friendly headings
- Body copy remains highly readable and conversational

## Layout

- Mobile First
- Core shell max-width: 480px
- Desktop: centered companion shell on warm ambient background
- Result analytics can later expand up to 840px if required
- 8px-based visual rhythm

## Shape Language

- Hyper-rounded cards
- Pill chips
- Marshmallow buttons
- Soft mechanical button depth
- Avoid sharp dashboard-style containers

## Signature Components

- Tamagotchi Companion Pod
- Three Fairy Spectrum
- Fairy Dialogue Bubble
- Squishy CTA
- Cross Analysis Dialogue
- Observation Diary
- Detailed Reading Unlock Card

## Prototype Rule

현재 Landing → Loading → Quick Result는 **UI Prototype**입니다.

실제 사주·점성술·수비학 계산 결과를 연결하기 전까지:
- 화면의 해석 문구는 Mock으로 취급합니다.
- 실제 분석 결과라고 표시하지 않습니다.
- 출생시간이 없는 Quick Reading에서 시간 의존 데이터를 보여주지 않습니다.

## Product Scope Adjustments from Stitch

Stitch 원안 중 MVP 정책과 충돌하는 부분은 구현에서 조정합니다.

- 음력: UI에서 비활성/후속 범위로 표시
- 출생시간: Landing에서 받지 않고 Detailed Reading에서 추가
- 상승궁/하우스: Quick Loading 및 Quick Result에서 제외
- 오늘의 운세/포춘쿠키: MVP 제외
- 공유/저장: 실제 기능은 관련 Spec 이후 구현
