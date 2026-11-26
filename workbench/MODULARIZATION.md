# V6.2.21 Modular Workbench

This branch is an isolated work branch based on `fix/v6.2.20-print-layout-2026-11-27`.
It does not change the production `main` branch.

## Delivery rule

- Keep the currently working site as the integration baseline.
- Build and validate modules independently before integrating.
- Final delivery must include a self-contained deployable `index.html` and a ZIP backup.
- Do not publish to production until the integrated build passes the acceptance checklist.

## Module boundaries

| Module | Responsibility | Depends on |
|---|---|---|
| site-shell | Existing page structure, navigation, responsive layout, shared styles | none |
| mortgage | Mortgage calculator inputs, calculation, result rendering | shared formatters |
| land-efficiency | Land area/FAR/building efficiency calculations and result rendering | shared formatters |
| tax-land-value | Land value increment tax scenarios and explanatory output | official parameter data |
| tax-house-old | Old-system house/property transaction income tax | official parameter data |
| print-engine | Six-section full-document print, individual calculator print buttons, A4 portrait fitting | module print adapters |
| validation | Reference cases, boundary cases, regression checks | calculation modules |
| deployment | Build assembly, single-file packaging, ZIP, release checklist | all accepted modules |

## Integration contract

1. Each module must expose one namespaced initializer and must not create global variables outside the agreed namespace.
2. Calculation functions must be pure where practical: inputs in, structured result out; DOM rendering is separate.
3. Formatters and shared numeric helpers must have one canonical implementation.
4. Print adapters must identify only their own result region; the print engine owns page sizing, scaling, page breaks, and cleanup.
5. A module is accepted only after its own functional tests and print tests pass.
6. Integration must preserve the existing user-facing field names, labels, defaults, and behavior unless a separately approved correction requires a change.
7. The final build is assembled into one `index.html`; source modules and test fixtures remain in the workbench folder for maintainability.

## Work order

1. Inventory the V6.2.20 baseline and freeze a checksum/commit reference.
2. Extract and validate low-coupling shared formatters and UI helpers.
3. Isolate mortgage, land-efficiency, and print adapters independently.
4. Isolate tax modules and verify against the retained reference cases.
5. Integrate accepted modules and run cross-module regression tests.
6. Run final mobile, A4 print/PDF, and deployment verification.

## Acceptance checklist

- [ ] No calculator output changes unexpectedly.
- [ ] Mortgage print contains only the mortgage calculator region.
- [ ] Tax print button is directly below the tax estimate and exports only the tax region.
- [ ] Land-efficiency print behavior remains consistent with its specified A4 portrait layout.
- [ ] Full-document print follows the six requested sections; completed calculator results are included as additional pages only when present.
- [ ] Each designated section fits one portrait A4 page without clipping or unreadably small text.
- [ ] No print controls, navigation, or unrelated sections appear in calculator-only print.
- [ ] Mobile layout and input interactions pass.
- [ ] Integrated single-file build and ZIP are both reproducible.
- [ ] Production deployment is verified separately from GitHub commit/CI success.
