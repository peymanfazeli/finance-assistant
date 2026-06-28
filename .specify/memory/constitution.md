# Project Constitution

## Core Principles

### 1. Offline First

The application must work entirely offline.

All user data, reports, charts, and analytics are stored and generated locally.

Internet access must never be required for the core functionality.

---

### 2. Simplicity First

Every feature must solve a real user problem.

Avoid unnecessary complexity.

If a feature does not provide clear value, it should not be included in Version 1.

---

### 3. Data-Driven Design

The application exists to analyze financial data.

Every screen should help users understand their financial information through clear statistics, reports, and visualizations.

---

### 4. Import Before Manual Entry

Excel and CSV import are first-class features.

Manual transaction entry is supported but should not be the primary workflow.

The application should be able to import financial data from user-provided spreadsheets with minimal configuration.

---

### 5. Meaningful Visualization

Whenever financial data can be understood more easily through charts, the application should provide appropriate visualizations.

Charts must be clear, interactive, and easy to understand.

---

### 6. Bilingual Support

The application must fully support:

* English (LTR)
* Persian (RTL)

Language switching should be seamless.

All layouts must correctly adapt to RTL and LTR.

---

### 7. Modern User Experience

The interface should be clean, minimal, responsive, and visually appealing.

Prioritize readability and ease of use over decorative elements.

---

### 8. Local Data Ownership

Users own their data.

No user data should be transmitted externally.

No cloud dependency exists in Version 1.

---

### 9. Extensible Architecture

The codebase should be modular and easy to extend.

Future features such as cloud synchronization, recurring transactions, and AI insights should be possible without major architectural changes.

---

### 10. Exportability

Every important report should be exportable.

Supported export formats include:

* PDF
* Excel (.xlsx)
* CSV

Exports should preserve tables and charts whenever practical.

---

### 11. Flexible Data Model

The application must not depend on a single Excel template.

Users should be able to import different Excel structures by mapping spreadsheet columns to transaction fields during the import process.

## Governance

- Constitution supersedes all other practices
- Every feature spec and plan must reference and comply with relevant constitution principles
- Amendments require documentation, approval, and migration plan
- Complexity must be justified against the Simplicity First principle

**Version**: 1.0.0 | **Ratified**: 2026-06-27
