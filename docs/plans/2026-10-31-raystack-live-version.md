# RayStack page: live version label (Quick)

Current: `resources/js/Pages/RayStack.tsx` hard-codes `RayStack v0.6.5`, so every release
needs a page PR.

Expected:

- `/raystack` passes a `version` prop holding the `tag_name` of the latest release at
  `api.github.com/repos/HarunRRayhan/RayStack/releases/latest`, when it looks like `vX.Y.Z`.
- The page shows `RayStack <version> · Open source, MIT`.
- The tag is cached under `raystack.github.version` for an hour. A failed fetch or an odd tag
  is cached as `false` for 5 minutes, and the page then shows the built-in `v0.6.5`.

Must stay unchanged:

- The star count prop, its cache key, TTLs and its tests.
- `/raystack` never waits on GitHub longer than the existing 2s timeout per call, and never
  errors when GitHub is down.
- SEO metadata in the first HTML response.
