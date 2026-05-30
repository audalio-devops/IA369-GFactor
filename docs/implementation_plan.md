# Implementation Plan - IA369 Operational Module

Development of the core Operational Module for the IA369 Factoring System, featuring a high-precision financial backend and a modern, brutalist frontend.

## User Review Required

> [!IMPORTANT]
> **Financial Precision**: All calculations will use `java.math.BigDecimal` with `RoundingMode.HALF_EVEN` to ensure accounting compliance.
> **Design Identity**: We are moving away from "Fintech Blue" to a **Brutalist Financial Matrix** style (Sharp edges, high contrast, technical grid).

## Proposed Changes

### [Backend] Shared & Models
#### [NEW] [ParametrosTaxas.java](file:///c:/Projetos/IA369-GFactor/backend/src/main/java/com/ia369/factoring/model/ParametrosTaxas.java)
Entity to store dynamic tax parameters (TaxaMensal, Advalorem, TarifaBoleto).

### [Backend] Services & Logic
#### [MODIFY] [PricingEngine.java](file:///c:/Projetos/IA369-GFactor/backend/src/main/java/com/ia369/factoring/service/PricingEngine.java)
- Integrate IOF Fixo (0.38%) and IOF Diário (0.0041%) calculations.
- Implement `CalendarService` for business day counting (Brazilian Holidays).

### [Frontend] Components & UI
#### [MODIFY] [SimuladorForm.jsx](file:///c:/Projetos/IA369-GFactor/frontend/src/components/SimuladorForm.jsx)
- Add IOF fields and display detailed tax breakdown.

## Verification Plan

### Automated Tests
- Unit tests for [PricingEngine](file:///c:/Projetos/IA369-GFactor/backend/src/main/java/com/ia369/factoring/service/PricingEngine.java#7-65) to verify `BigDecimal` precision.
- Mocked XML parsing tests for the frontend.

### Manual Verification
1. Open the simulator, input values, and verify real-time response accuracy.
2. Drag a sample XML and verify the preview grid data extraction.
