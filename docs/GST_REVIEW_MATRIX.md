# GST calculation review matrix

This checklist separates automated regression coverage from professional tax review.
A passing test proves that the implementation matches the documented expectation; it
is not a substitute for advice from a Chartered Accountant or GST practitioner.

## Required fixtures

For every supported document type, verify a zero-rate, 5%, 12%, 18% and 28% case
where applicable:

- intrastate CGST + SGST
- Union Territory CGST + UTGST
- interstate IGST
- export with LUT and export with tax
- SEZ supply with and without payment of tax
- reverse charge
- tax-inclusive and tax-exclusive prices
- line discount and whole-document discount
- cess, round-off, TDS and TCS
- credit note and cancelled document
- bill of supply, composition invoice and delivery challan

## Evidence required before release

| Area | Automated evidence | Professional review |
| --- | --- | --- |
| Invoice totals | Exact taxable value, tax heads and net receivable | Sign-off on the applicable tax base |
| GSTR-1 | JSON/CSV fixture comparison | Portal import validation |
| GSTR-3B | Output tax and ITC fixture comparison | Return working-paper comparison |
| GSTR-2B | Matched, missing and mismatched supplier bills | Reconciliation sampling |
| e-Way Bill | Schema fixture and place-of-supply cases | Portal sandbox/import validation |
| TDS/TCS | Threshold and section regression cases | Section applicability sign-off |
| Rounding | Paise-boundary fixtures | Written rounding policy |

## Open policy decisions

The following behaviours must not be changed silently. Record the decision, reviewer,
date and supporting reference before changing code:

1. CGST section 52 TCS placement.
2. Odd-paisa CGST/SGST split.
3. Section 194Q and 206C(1H) threshold basis.
4. TCS treatment under reverse charge.
5. Whole-document discount treatment for GST.
6. Delivery-challan e-Way Bill tax-rate representation.

## Release rule

A tax-affecting pull request must include:

- a failing regression test that demonstrates the old behaviour;
- the corrected implementation;
- an exact expected-value fixture;
- screenshots or exported JSON/CSV when the UI/export changes;
- reviewer sign-off for any item listed under Open policy decisions.
