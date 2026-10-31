# Domain recipes (modules and what "good or bad" means)

The page skeleton never changes. Choose modules and the *meaning of the good/borderline/worrying table* per domain.

## Quantitative, code, data science, ML, statistics, math
Modules: code cells with real outputs, hand calculations that reproduce library numbers, sliders for parameters, residual or distribution charts, confusion matrices, verification table.
Good/bad table: model metrics (R², accuracy, AIC), diagnostics (VIF, p-values, convergence), data-quality thresholds.
Watch: leakage, scaling, default-parameter changes between library versions.

## Finance and investment banking (example: an IB course)
Typical units: financial statements (IS, BS, CF and how they link), accounting adjustments, valuation (comps, precedents, DCF, WACC, terminal value), LBO, M&A (accretion/dilution, merger model), capital markets (equity and debt, bonds, yield, duration), pitch books and process, Excel modeling standards, regulation and ethics.
Modules:
- **Statement walkthrough**: a small company's three statements side by side, with the *links* highlighted (net income to retained earnings, D&A, working capital, cash).
- **Worked example with every number**: DCF (free cash flow build, discount factors, terminal value, EV to equity bridge), WACC, LBO returns (sources and uses, debt schedule, IRR, MOIC), accretion/dilution, bond price and yield, duration, option payoffs.
- **Interactive calculators**: WACC inputs, terminal growth versus exit multiple, sensitivity tables (two-way), bond price versus yield, LBO leverage versus IRR. Recompute in JS from inputs; show the formula next to each result.
- **Diagrams**: deal structure, capital structure waterfall, process timeline, football-field chart (ranges), flow of cash between statements.
- **Compare tables**: comps versus precedents; EV versus equity value; levered versus unlevered FCF; accretive versus dilutive; IFRS versus US GAAP when the course mentions both.
- **Checklists**: due diligence, model audit (balance sheet balances, cash ties out, circularity), pitch book QC.
- **Common mistakes**: mismatched periods, EV versus equity multiples, double counting, mixing nominal and real, sign errors in the cash flow, using book instead of market weights in WACC.
Good/bad table examples: margins by industry, leverage (Debt/EBITDA), coverage (EBITDA/interest), growth versus terminal growth cap, WACC range, IRR hurdles, multiples versus peers. Mark each threshold as "מהקורס", "כלל אצבע" or "תלוי תעשייה".
Vocabulary: always add the English term (EBITDA, free cash flow, enterprise value, accretion/dilution, LBO, MOIC, IRR, comparables, precedent transactions, football field, CIM, teaser, term sheet).
Verification: balance sheet balances, cash ties, EV bridge sums, IRR reproduces from the cash flows, totals foot.
Disclaimer: study material, not investment advice; date the assumptions and cite the framework (GAAP/IFRS, regulator).

## Accounting and audit
Modules: journal-entry walkthroughs (T-accounts), statement impact table (which statement changes how), reconciliation checklist, controls and risk matrix, standards comparison (IFRS vs GAAP). Good/bad: ratios, materiality thresholds, control deficiency classes. Verification: debits equal credits, rollforwards tie.

## Law and compliance
Modules: case or scenario cards (facts, issue, rule, application, conclusion), statute map (who may do what, thresholds, deadlines), decision tree, compare table of regimes. Good/bad: tests and standards (met / borderline / not met), with citations. State jurisdiction and date. Not legal advice.

## Medicine, nursing, pharmacology
Modules: mechanism diagrams, clinical case scenarios, dose calculators with units shown, reference-range tables (normal / borderline / abnormal), red-flag checklist, differential comparison table. Always give units and source guideline and date. Not medical advice.

## Engineering, physics, chemistry
Modules: derivation with every step, worked examples with units, parameter sliders and plots, unit-consistency checks, tolerance tables, failure-mode table. Verification: dimensional analysis and limiting cases.

## Languages and humanities
Modules: vocabulary cards with usage and pitfalls, grammar rule plus contrast table, timeline, concept map, source-based argument map (claim, evidence, counterargument), quote handling (short, attributed). Good/bad table becomes "strong / weak argument or usage" criteria.

## Business, strategy, product
Modules: framework cards (when to use, inputs, output, common misuse), worked case with numbers (unit economics, CAC/LTV, pricing), decision matrix, metric ranges by stage or industry.

## Certifications and exams
Add: syllabus map with weights, "likely exam trap" boxes, formula sheet, self-check questions per station with hidden answers, spaced-review list.
