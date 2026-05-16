# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial scaffolding: React 19 + Vite 7 + TS strict + Tailwind 4 + Module Federation host.
- Auth flow: email/password login, TOTP 2FA, in-memory JWT with silent refresh, idle step-up rule (NFR-7.4).
- App shell: 240/56px collapsible sidebar, top bar with theme toggle and profile menu, responsive guard below 1024px.
- Role-based route guard (`RequireAuth`) covering all MVP admin sections (KYC, disputes, finance, ops, users, audit).
- Keyboard navigation: `[` toggles sidebar; `g` + nav letter jumps to a section.
- CI: GitHub Actions running typecheck, lint, test, build.

[T-web-001]: https://alsirat.atlassian.net/browse/JEEB-93
