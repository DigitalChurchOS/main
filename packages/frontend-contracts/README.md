# Frontend Contract System

This package provides a production-ready Frontend Contract System sitting between backend/module data and the visual theme layers. It standardizes UI slots, defines strictly sanitised client-facing contracts, and prevents themes from bypassing entitlements or accessing private db models directly.

## Directory Structure
- `src/core/`: Core types for routing, forms, visibility, and analytics.
- `src/components/`: Normalized contract shapes for events, sermons, LMS, etc.
- `src/modules/`: Interface specs exposing widget tags and routes for all 25 modules.
- `src/mappers/`: Transform helpers sanitizing raw backend records.
- `src/registry/`: Registries for component contracts, slot definitions, and public forms.
- `src/validation/`: Security auditing utility checking for field leaks and correct interface compliance.
- `src/renderer/`: Slot rendering wrappers checking entitlements before active theme execution.

## Flow of Data
```
[Page Builder Output] ─> [Mappers] ─> [Theme Slot Renderer] ─> [Active Theme Adapter] ─> [HTML Output]
```

## Adding a New Component Contract
1. Add the interface declaration in `src/components/your-name.contract.ts`.
2. Register the component name inside `src/registry/component-contract-registry.ts`.
3. Add a matching ThemeSlotKey inside `src/core/theme-slot.types.ts`.
