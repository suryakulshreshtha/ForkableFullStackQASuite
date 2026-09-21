# data-testid Requests

Running list of elements where semantic locators (role/label/text) are
ambiguous or unstable. Keep asks small and specific — batch a handful per
sprint rather than requesting a blanket sweep.

| Component / Page | Element | Why semantic locator fails | Requested testid | Status |
|---|---|---|---|---|
| _example_ | Icon-only delete button in table row | No accessible name, repeated per row | `data-testid="delete-row-{id}"` | Requested |

