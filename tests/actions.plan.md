# Actions Testing Plan

Goal: Validate declarative `data-*` actions (GET/POST/PUT/PATCH/DELETE) against a public JSON API (jsonplaceholder.typicode.com) in a reproducible, minimal way.

Notes:
- First iteration supports only JSON (`^json`); responses parsed as JSON and written into signals.
- Tests should avoid mutating server data (jsonplaceholder accepts POST but doesn't persist; safe for testing).

Manual / Integration test steps:

1. GET test
- Load the page in a browser or headless environment.
- Click the `Load post #1` button (attribute: `data-get:postResult?busy,err@.click="https://jsonplaceholder.typicode.com/posts/1"`).
- Expectations:
  - Signal `postResult` becomes populated with a JSON object containing `id: 1`.
  - `busy` signal toggles true during request and false afterwards.
  - `err` remains `null` on success.

2. POST test
- Fill the `New post title` input and click `Create post` (attribute: `data-post+ #newTitle.value:createdPost?busy,err@.click=...`).
- Expectations:
  - `createdPost` signal receives returned JSON (created resource stub).
  - `busy` toggles during request; `err` is null on success.

3. Error handling
- Point an action to an invalid URL (e.g., https://jsonplaceholder.typicode.com/404) and verify `err` is set and `busy` is false afterwards.

4. Interval/delay trigger
- Add a temporary action using `@_interval.1000` and verify repeated requests occur and `postResult` updates each interval.

Automation ideas:
- Use Node.js + Playwright or Puppeteer to open the `index.html` in a headless browser and interact with buttons/inputs, then assert signals via `window.__getState()`.
- Example test steps in script:
  - Launch headless browser and open `http://127.0.0.1:8002/` (served by `python -m http.server` or similar).
  - Click `#loadPost` and wait for `window.__getState().postResult` to be non-empty.
  - Assert shape and fields (e.g., has `id`, `title`).
  - For POST, set input value via DOM, click create, wait for `createdPost` signal.

Security / Reliability:
- Tests depend on external service (jsonplaceholder). For CI, consider a lightweight mock server (e.g., `json-server` or a small Express mock) to avoid flakiness.

Acceptance criteria:
- Actions perform fetch with JSON parsing and write to target signals.
- Busy and error state signals update as specified.
- Examples in the demo page function in a real browser.


*** End of plan
