# Admin Dashboard Organization Implementation Plan

> **For agentic workers:** Use `superpowers:executing-plans` to work through this checklist. This worktree already has uncommitted changes from the first implementation pass; audit and refine them in place.

**Goal:** Make the admin dashboard easy to scan by grouping related tools, giving bio links a nested home, adding one general analytics entry point, and allowing the sidebar to close and reopen.

**Architecture:** Keep the existing Laravel and Inertia routes for the detailed bio and short link reports. Add one admin-only analytics overview that queries 30-day click totals and the existing all-time blog view count. Keep navigation in the shared authenticated layout so every admin screen gets the same hierarchy; persist the desktop sidebar choice in local storage and retain the mobile drawer.

**Tech Stack:** Laravel routes and feature tests, Inertia React, TypeScript, Tailwind, Lucide, Vite.

**Source brief:** User request in this conversation: organize repeated bio link and analytics links, give bio links a section with submenus, provide general analytics, and make the sidebar openable and collapsible.

## Constraints and acceptance

- Keep existing admin URLs working; this is navigation and overview work, not a data migration.
- `Bio page` is one expandable group with management, its report, and the public page. `Short links` has management and its report. Other links sit under Overview, Content, Consultations, or Account.
- The general Analytics page must display real, clearly labeled 30-day click totals and the available all-time blog view total. Bio and short clicks remain separate because one journey can trigger both.
- The desktop sidebar opens and closes from the header and remembers the choice. The mobile drawer opens, navigates, and closes as before. Keyboard users can identify and operate every control.
- Remove dashboard shortcuts that do not lead to the named destination.
- Run relevant PHPUnit tests and `npm run build`. Use the project `local-verify` browser workflow if available, otherwise record the browser-verification gap accurately. Do not claim deployment.

## File map

- `resources/js/Layouts/AuthenticatedLayout.tsx`: navigation groups, submenu state, desktop collapse, mobile drawer.
- `resources/js/Pages/Admin/Analytics.tsx`: general analytics overview UI.
- `routes/web.php`: admin-only analytics route and summary queries.
- `resources/js/Pages/Dashboard.tsx`: dashboard shortcuts.
- `tests/Feature/AdminPanelTest.php`: analytics access and summary contract.

## Task list

### Task 1: Audit the current navigation and route map

- [x] Enumerate every admin destination and identify repeated, misplaced, or dead-end entries.
- [x] Check active states for index, create, edit, and analytics routes.
- [x] Confirm the first-pass diff changes only the intended files and document any corrections below.

### Task 2: Build the navigation hierarchy

- [x] Keep Dashboard and general Analytics under Overview.
- [x] Make Bio page expandable with Bio links, Bio analytics, and View public page; make Short links expandable with management and its report.
- [x] Place Media and Newsletter under Content, consultation tools under Consultations, and API keys and Profile under Account.
- [x] Ensure the current child is highlighted and its group opens on direct navigation.

### Task 3: Make the sidebar operable

- [x] Add a labeled desktop control to collapse and reopen the sidebar.
- [x] Persist that choice safely across page visits without server rendering errors.
- [x] Keep the mobile drawer functional and check submenu keyboard semantics and focus visibility in code.

### Task 4: Add general analytics

- [x] Add an admin-only `/admin/analytics` route returning 30-day bio and short link click counts, link counts, and the all-time blog view total.
- [x] Make each page metric state its time window clearly and link to both detailed reports and the blog publishing dashboard.
- [x] Test guest denial and seeded counts, including a click older than the reporting window and a stored blog view count.

### Task 5: Clean dashboard shortcuts

- [x] Remove any shortcut that redirects back to Dashboard or uses a misleading label.
- [x] Point shortcuts to Analytics, Bio links, Short links, and Media.

### Task 6: Verify and review

- [x] Run `vendor/bin/phpunit tests/Feature/AdminPanelTest.php tests/Feature/BioLinkAnalyticsTest.php tests/Feature/ShortLinkTest.php --no-progress` (30 tests, 117 assertions).
- [x] Run `npm run build` and `git diff --check` (both passed).
- [x] Review the final diff for route order, click-count meaning, desktop/mobile behavior, and accidental scope changes.
- [x] Use an isolated local SQLite database and browser session to check desktop, mobile, analytics navigation, collapse persistence, and mobile drawer navigation.

## Execution notes

- The original `View All Posts` shortcut targeted `/admin`, which redirects to Dashboard. It now targets a useful destination through the revised shortcut list.
- A bio link can create a short link automatically, so the overview reports each click type separately and does not combine them into a total.
- Blog views are stored as all-time counts per post. The overview labels this period separately from the last-30-days link clicks.
- The project `local-verify` skill was unavailable, so the visual check used the available Playwright browser against a temporary SQLite database. It covered desktop and mobile behavior; the mobile drawer initially reported a missing accessible title and description, which were added to the sheet.
- After that fix, the browser console reported zero errors or warnings. The local server and temporary SQLite database were stopped and removed. No deployment was performed.

## Review focus

- Opening a bio create or edit route should keep Bio page expanded and Bio links highlighted.
- Opening a short link create or edit route should keep Short links expanded and Manage links highlighted.
- Collapsing the desktop sidebar must leave a visible control to reopen it.
- The analytics totals must exclude clicks outside the 30-day window and must not sum overlapping bio and short tracking paths.
- The mobile drawer must not inherit the desktop hidden state.
