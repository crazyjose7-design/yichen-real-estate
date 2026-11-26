# Modular workbench — V6.2.20 baseline

## Verified source of truth

- Repository: `crazyjose7-design/yichen-real-estate`
- Baseline branch: `fix/v6.2.20-print-layout-2026-11-27`
- Baseline commit: `67c6ca6ce63c8f2f7780d03ca96e0e95545f22d6`
- Baseline `index.html` blob: `003fd697a8e2afac3fac5bc43b5d394b52bdb802`
- `main` commit: `7e92ae22992b9b2536c0c53605c1a7b9ec96f9da`
- GitHub compare confirms baseline is 12 commits ahead of main and main is 0 commits ahead.
- The baseline includes eight externalized image parts under `assets/`; its image loader depends on these files. Do not deploy its HTML without the matching assets.

## Extracted modules

| File | Original inline script | Responsibility |
|---|---:|---|
| `modules/tax-engine.js` | #2 | Tax calculator definitions, inputs, calculation and results |
| `modules/mortgage-calculator.js` | #3 | Mortgage repayment and amortization schedule |
| `modules/land-efficiency.js` | #4 | Land efficiency, floor-area and residual-value calculations |
| `modules/tax-state-and-print.js` | #5 | Independent tax form state, snapshots and tax print orchestration |
| `modules/site-print-engine.js` | #6 | Full-document print page construction and page fitting |

These are verbatim extractions with only a provenance comment added. They are workbench source files, not yet wired into the live HTML. Existing script execution order and DOM dependencies must be preserved when bundling.

## Important integration constraints

1. Keep the six-page document-print structure and conditional insertion of completed mortgage, tax and land calculations.
2. Keep individual tax, mortgage and land print entry points independent.
3. Keep official site/base verification inputs in their existing location; do not move the block during extraction.
4. Preserve the eight image assets and the image loader path.
5. Keep a single-file `index.html` build output for mobile deployment, plus a ZIP containing the complete deployable directory.
6. Do not merge into `main` or deploy to Cloudflare until functional, calculation, print-layout and bundle checks pass.

## Current status

- [x] Compare main and V6.2.20 baseline.
- [x] Confirm baseline commit and asset dependencies.
- [x] Extract five functional modules without changing their behavior.
- [ ] Run automated JavaScript syntax checks.
- [ ] Build browser-level isolated test harnesses for each module.
- [ ] Verify calculation regression cases against the prior test records.
- [ ] Verify individual A4 print and six-section document print.
- [ ] Bundle and run whole-site regression.
- [ ] Produce single HTML and ZIP.
- [ ] Obtain deployment authorization and deploy.
