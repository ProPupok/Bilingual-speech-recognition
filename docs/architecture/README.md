# Architecture Documentation

This directory contains the maintained architecture documentation for the Bilingual Speech Recognition project.

The documentation describes the current delivered architecture of the product: a React/Vite frontend, a FastAPI backend, PostgreSQL metadata storage, local file storage for audio/transcript artifacts, and an ASR processing pipeline.

## Maintained architecture views

The maintained architecture views are stored under:

```text
docs/architecture/static-view/
docs/architecture/dynamic-view/
docs/architecture/deployment-view/
```

The diagrams are maintained as diagrams-as-code source files so they can be reviewed and updated together with the product code.

## Static view: component diagram

Source file:

```text
docs/architecture/static-view/component-diagram.mmd
```

Readable view file:

```text
docs/architecture/static-view/README.md
```

The component diagram shows the main structural parts of the system:

- React/Vite frontend
- FastAPI backend
- Authentication, audio, and admin API areas
- ASR processing pipeline
- PostgreSQL database
- Local file storage
- External ML/runtime dependencies used for transcription processing
- Researcher/corpus-manager and administrator users

The frontend communicates with the backend through HTTP REST API calls. Authenticated requests use bearer JWT tokens. The backend stores metadata in PostgreSQL and stores audio/transcript artifacts on the local filesystem.

### Coupling and cohesion

The current codebase has clear top-level separation between frontend, backend, database, file storage, and ASR processing. This supports cohesion because each major part has a clear responsibility.

The main coupling risk is in the backend, where API behavior, local file paths, database metadata, and pipeline execution are part of one deployment boundary. This is acceptable for the current MVP, but future growth may require a separate worker service or queue for long-running transcription jobs.

### Maintainability implications

The architecture is maintainable for the current project size because the main responsibilities are separated and the diagrams are stored as source files in the repository.

The design may become harder to maintain if audio storage grows, if many users process audio at the same time, or if the ASR pipeline gains more models and processing steps.

### Quality requirements supported or constrained

The structure supports QR-001 because protected audio access goes through backend authorization before files are returned.

The structure supports QR-002 and QR-003 because frontend quality checks and PR compliance checks can be verified independently in CI.

The structure constrains scalability and availability because the current deployment uses one backend application, local file storage, and a local PostgreSQL setup.

## Dynamic view: sequence diagrams

Source files:

```text
docs/architecture/dynamic-view/upload-and-transcription-sequence.mmd
docs/architecture/dynamic-view/authentication-sequence.mmd
```

Readable view file:

```text
docs/architecture/dynamic-view/README.md
```

The dynamic view describes important runtime interactions:

- user authentication
- audio upload
- background transcription processing
- transcript/status retrieval

These diagrams help explain how frontend requests, backend API endpoints, persistence, local file storage, and the ASR pipeline interact during normal product use.

## Deployment view: deployment diagram

Source file:

```text
docs/architecture/deployment-view/deployment-diagram.mmd
```

Readable view file:

```text
docs/architecture/deployment-view/README.md
```

The deployment view shows how the product is currently run:

- browser client
- React/Vite frontend
- FastAPI/Uvicorn backend
- PostgreSQL database
- local filesystem storage
- ASR model/runtime dependencies

This view helps reason about deployment boundaries, runtime dependencies, local storage assumptions, and operational risks.

## Architecture Decision Records

ADR files are stored under:

```text
docs/architecture/adr/
```

Maintained ADR files:

```text
docs/architecture/adr/ADR-001-authorize-protected-audio-access.md
docs/architecture/adr/ADR-002-enforce-frontend-build-and-lint-quality-gate.md
docs/architecture/adr/ADR-003-enforce-pr-compliance-check.md
```

The ADRs document important architecture decisions related to the current quality requirements:

- QR-001: Audio Files Confidentiality
- QR-002: Front-End Code and Build Quality
- QR-003: Pull Request Quality and Compliance Check

Each ADR is kept as a separate file with a stable ID, status, context, decision, consequences, tradeoffs, and related quality requirement.

## Maintenance rule

This architecture documentation is a maintained product artifact. It should be updated when the product architecture, deployment model, integrations, storage model, ASR pipeline, or important quality risks change.
