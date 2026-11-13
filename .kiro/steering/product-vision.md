# Tayovi Product Vision

## Project

- **Name:** Tayovi
- **Tagline:** Tailor your view
- **Brand line:** Tayovi: Tailor your view
- **Repository:** [taylor-made-labs/tayovi](https://github.com/taylor-made-labs/tayovi)
- **Kiroween category:** Skeleton Crew
- **Entry type:** Open-source template application and reusable foundation
- **Hackathon proof:** Two separately specified and developed example applications
- **Deadline:** December 4, 2026 at 2:00 PM Pacific
- **Starting point:** Fresh repository
- **Excluded dependency:** TailoredUI

## Purpose

Tayovi helps application builders let their end users personalize an application's interface through an in-app agent.

For the hackathon, Tayovi ships as a runnable template application, not only as an importable library. The template provides the reusable A2UI personalization contract, lifecycle, host seams, and example structure that another application builder can start from.

Two example applications must prove the template. Each example has its own steering, feature specs, development work, and acceptance evidence. Mira is the first example. The second example will be chosen and specified separately.

A later release may extract or package Tayovi as an importable library. That future option must not replace the hackathon's template-application deliverable.

## Core product thesis

A2UI does as much interface work as possible. It remains the format, catalog system, UI engine, renderer contract, binding model, action model, and standard validator.

Tayovi adds a thin, OpenAPI-inspired personalization contract around an application's A2UI definition. The comparison is about purpose: like OpenAPI makes an API contract machine-readable, Tayovi makes the application's personalization boundaries machine-readable. Tayovi does not reuse OpenAPI syntax and does not create another UI format.

The application builder publishes a Tayovi contract that references the A2UI catalogs and surfaces available for personalization. The contract adds only what A2UI does not already express for this product: application invariants, personalization policy, base-version identity, and the rules for creating a personal version.

An end user's agent forks that contract and iterates on the user's personal A2UI version. Standard A2UI continues to validate, bind, act, stream, and render wherever possible.

`browser-repos` is supporting tooling. It provides the user's workspace, branches, commits, diffs, history, and synchronization. It is not the product center and does not replace A2UI.

Mira is a minimal example and dogfood host. It exists only to prove Tayovi in a real app and help track suite work. Mira must not pull priority, scope, or polish away from the Tayovi submission.

Tayovi will use A2UI as the starting foundation for describing and rendering interfaces. It will extend A2UI for persistent end-user personalization rather than create a separate UI format. The project must verify the A2UI protocol and SDK versions it uses.

## Users

### Direct user: application builder

The application builder uses Tayovi to add safe interface personalization to an application.

### Indirect user: end user

The end user describes interface changes in natural language. Examples include rearranging information, changing layout, and improving readability.

## Core experience

The first tracer must show an end user:

1. requesting a personalization;
2. receiving a validated proposed version;
3. previewing it;
4. activating it without replacing the prior working version;
5. keeping it across visits;
6. reviewing its history; and
7. rolling back to the last-known-good UI version.

The first tracer is JSON-only and uses existing trusted A2UI component implementations. This is an initial scope boundary, not a limit on Tayovi's component model.

## Product requirements

- Personalization preferences persist.
- End users can review and undo changes.
- The hackathon deliverable runs as a template application.
- Two separately specified example applications prove the template.
- Application builders can define functionality and requirements that personalization must preserve.
- Requirement enforcement must not rely only on the agent.
- Interface customization must not change trusted application behavior.
- Interface customization must not overwrite business data.
- The first implementation stays focused.
- The foundation leaves room for reuse by other applications.

## Personalization boundary

- The application builder defines the invariants and policy that personalization must preserve.
- The Tayovi contract states protected behavior and the kinds of personal change the host supports.
- The end user's agent may propose and iterate within that contract.
- The agent cannot grant capabilities, redefine host policy, or expand the end user's rights.
- Each saved personal version belongs to one end user and one application surface or scope.
- Personal versions survive later visits.
- Authoritative application behavior and business data remain host-owned.

## Personalization workspace

- `browser-repos` is a required foundation dependency.
- Each end user can have separate component workspaces for multiple applications.
- A workspace may contain personal A2UI deltas, component definitions, reusable compositions, functions, permitted implementation artifacts, tests, capability requests and grants, preview evidence, and activation pointers.
- Application business data stays in its existing system and is not copied into the personalization workspace.
- Repository history supports review, last-known-good recovery, disable, and rollback.
- Exact files, branches, commits, and merge rules belong to Spec Builder and shared contracts.

## Related prior work

[`browser-repos`](https://github.com/taylor-made-labs/browser-repos) is existing prior work for browser-local Git repositories over IndexedDB. Tayovi will use it, while reviewing its current design against Tayovi's approved requirements.

## One component and catalog model

A2UI components are Tayovi's single model for personalization and extensibility. Tayovi does not add a separate plugin concept.

A personal version may contain new arrangements, reusable compositions, component definitions, functions, and permitted renderer implementations. These artifacts have different build and trust needs but remain parts of one A2UI catalog model.

The application builder publishes the base catalogs, trusted implementations, invariants, host integration contract, and capability policy. The user's agent forks and iterates on a personal version. A base update remains pinned until the personal version is reconciled, previewed, and activated.

The application builder chooses approval policy within this one model:

1. existing trusted implementations only, with missing components returned as requests;
2. agent-created implementations requiring builder review; or
3. agent-created implementations permitted through end-user approval within host policy.

A component may request capabilities, but a request never grants them. Host policy, the end user's existing rights, and authoritative service checks remain in control.

[`component-model.md`](component-model.md) is the canonical source for artifact types, capabilities, host integration, trust, activation, last-known-good recovery, disable, rollback, and future executable implementations.

## Trust and lifecycle requirements

- Component schemas, A2UI validity, and catalog registration do not establish executable-code safety.
- Components receive scoped data and mediated host actions instead of raw credentials or unrestricted backend access.
- Authoritative services independently enforce user, tenant, resource, and action permissions.
- Sensitive actions use host-owned confirmation flows. Generated content cannot establish consent.
- Changes are validated, tested when applicable, and previewed before activation.
- Activation preserves the current and last-known-good versions.
- Failed activation leaves the current view intact.
- Components can be disabled and rolled back without deleting history.
- Implementation or requested-capability changes trigger renewed policy checks.
- UI rollback does not undo completed business actions.
- Isolation is a host-selected design concern. An isolated runtime and narrow bridge are options, not a settled iframe requirement.

Sharing components with other end users remains a later, optional layer with separate trust, review, versioning, and removal rules.

## Invariant contract

- The A2UI catalog and its JSON Schemas are the primary machine-readable contract.
- Tayovi reuses A2UI component property rules, required fields, placement rules, data bindings, validation checks, function definitions, and caller permissions.
- Tayovi expresses additional application invariants through A2UI v1.0's namespaced `metadata.extensions` mechanism.
- Catalog-level extensions can describe rules for the whole application catalog.
- Surface-level extensions can describe rules for one interface surface.
- Component-level `@metadata.extensions` can mark required roles, protected bindings and actions, and non-removable capabilities.
- The Tayovi validator interprets its extension namespace before a customization can be applied.
- Standard A2UI validators continue checking the normal protocol and catalog rules.
- Validation failures return exact errors to the agent for another attempt.
- Tayovi adds extension meaning, not a separate UI format or parallel contract system.

## Example applications

The hackathon entry requires two example applications built from or integrated through the Tayovi template. They prove that the template is reusable across distinct hosts.

Mira is the first approved example. It is an open-source, Jira-like web application whose users personalize its look and information presentation through Tayovi. The team also uses Mira to dogfood suite work.

The second example remains unselected. Its product purpose, repository, scope, feature map, specs, development, and acceptance evidence will be approved separately. It must prove Tayovi without expanding the core template's scope.

Neither example application's domain behavior belongs inside Tayovi's core contract or lifecycle features.

[`example-app.md`](example-app.md) is the canonical source for the example-application rule, Mira's role, and the separate second example.

## Design constraint

Product requirements must be clarified before the technical design is settled.

## Decision queue

Product-owner questions and deferred technical questions are classified in [`question-triage.md`](question-triage.md). Do not ask implementation questions during vision alignment.
