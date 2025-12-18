# Implementation Spec: Active AI Partner

## 1. Objective
Transform the `AiService` from a passive "suggestions" engine into an **Active Operational Partner**. The system must be able to map natural language intents (e.g., "Block site 31") to authorized API executions while maintaining a strict privacy-core.

---

## 2. Core Architecture: The "Safe-Action Pipeline"

The implementation should follow a 4-step execution pipeline:

1.  **Identity & Role Injection**: Capture who is talking (Role + ID).
2.  **Privacy Redaction**: Use `AiPrivacyService` to strip PII before external LLM calls.
3.  **Intent Analysis (Action Mapping)**: Map text to specific service tools (Blocked Sites, Pricing V2).
4.  **RBAC Guard**: Enforce permissions *after* AI intent mapping but *before* physical execution.
5.  **Analytic Reasoning Layer**: Evaluate the *impact* of a requested change. If a decision seems sub-optimal (e.g., lowering rates during high demand), provide a cautionary "Why" before confirming.
6.  **Deep-Linking Hook**: Provide direct evidence-links to dashboard pages or reports when answering data questions.
7.  **Virtual Expert Personas**: Specialized sub-prompts for Revenue, Marketing, Accounting, Operations, and Hospitality roles.

---

## 3. Tool Definition (Capabilities)
The Agent should implement these core AI-to-Service hooks:

| Action | Required Role | Backend Hook |
| :--- | :--- | :--- |
| **Block Site** | Staff / Admin | `MaintenanceService.createBlock` |
| **Shift Pricing** | Admin / SuperAdmin | `PricingV2Service.updateRateRule` |
| **Guest Look-up** | Staff | `GuestsService.findOne` (Privacy filtered) |
| **Support Assist** | Guest / Staff | `SupportService.semanticSearch` |
| **Financial Audit** | Admin | `LedgerService.findAnomalies` |
| **Market Strategy** | Staff / Admin | `MarketingService.draftPlaybook` |
| **Ops Optimizer** | Staff / Admin | `MaintenanceService.suggestSchedule` |
| **Safety Audit** | Admin | `IncidentsService.summarizeRisks` |

---

## 4. Operational Guardrails
- **Confirmation Cycle:** For sensitive "Admin" actions (price shifts), the AI must return a "Drafted Rule" with an **Impact Summary** and a "Why" for caution if applicable. It requires manual dual-factor approval in the UI.
- **Evidence-Links:** When answering "How are my cabins?", the response must include a direct link (e.g., `[View Details](/dashboard/cabins)`) to the source data.
- **Privacy First:** LLM prompts must NEVER see raw Guest Names, Emails, or Phones. Use `[GUEST_1]` tokens and de-tokenize only on the server-side callback.

---

## 5. Implementation Prompt for the Next Agent
> "Build an 'Active Partner' layer for the AI Service. 
> 1. Update the `AiService.copilot` method to support authenticated user context. 
> 2. Create a 'PermissionRegistry' that maps `UserRole` to allowed AI actions. 
> 3. Implement the `AiPrivacyService` as a pre-processor for all LLM prompts. 
> 4. Use OpenAI Function Calling (Tools) to map user intents (e.g., 'Block site 12') to the `MaintenanceService`. 
> 5. **Intelligence & Caution**: Add a reasoning step where the AI evaluates price changes against current occupancy. If a user asks to drop prices during high occupancy, the AI should warn them and explain why it's a risk.
> 6. **Data Evidence**: Ensure data-related answers (e.g., 'How are my cabins?') include deep-links to the corresponding dashboard page.
> 7. **Virtual Personas**: Configure the AI to adopt specialized expert mindsets (Revenue, Marketing, Accounting, Operations, Hospitality, Compliance) when the context matches those areas.
> 8. **Privacy & RBAC**: Ensure that if a GUEST asks to change a price, the system returns a polite denial instead of a tool call. Use the `AiPrivacyService` tokenization for all guest-facing data."

---
*Created Dec 18, 2025.*
