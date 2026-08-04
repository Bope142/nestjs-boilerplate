# Database

This folder will contain future database integration for PostgreSQL using Drizzle ORM.

Migrations are immutable after production deployment and must be reviewed carefully. Production should use a deployment-safe migration command, while development may use local migration generation and application after review.

Seeds must be deterministic where possible. Financial migrations require extra review. Database transactions must protect critical write workflows, especially financial operations.
