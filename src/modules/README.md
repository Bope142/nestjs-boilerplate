# Domain Modules

This folder contains the domain modules of the modular monolith. Modules are grouped by business capability, not by technical layer.

Each module owns its controllers, services, DTOs, and persistence boundaries. Shared infrastructure lives outside `src/modules`.
