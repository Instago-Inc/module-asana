## v1.0.4 - Dependency and docs polish for Asana helper
Keeps the Asana helper usage guidance, published docs, and self-test wiring consistent while pointing importer calls at the latest dependency bundles so maintenance stays predictable for automation teams.

### Changed
- Swapped README and docs snippets to use placeholder GIDs instead of environment variables and aligned the published HTML to match the module guidance.
- Updated runtime imports (and the self-test harness) to request `latest` versions of the shared helpers so the helper module pulls the newest dependencies without extra metadata churn.

## v1.0.3 - Docs refresh for Instago Asana
Clarifies the Asana helper guidance so automation authors see the right environment keys and default API host, keeping workflows more discoverable for Instago customers. Freshening the mission copy on README and published docs maintains SEO value while aligning messaging with current behaviors.

### Changed
- Updated README and published docs to spell out the default `baseUrl`, the `asana.accessToken`/`asana.defaultWorkspace` environment keys, and the refreshed helper mission copy.

## v1.0.2 - Asana docs clarity update
Clarifies the Asana helper guidance so automation authors see the right environment keys and default API host, keeping workflows discoverable for Instago customers. Refreshing the landing copy maintains strong Instago SEO value and aligns the module messaging with current behaviors.

### Changed
- Updated the README and published docs to spell out the default `baseUrl`, the `asana.accessToken`/`asana.defaultWorkspace` environment keys, and the refreshed mission copy for the helper.

## v1.0.1 - Maintenance patch for Asana helper
Maintenance patch release for the Asana API helper with updated release notes and metadata keywords.

### Changed
- Version bump and changelog entry for the 1.0.1 release.
