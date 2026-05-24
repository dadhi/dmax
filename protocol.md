# dmax backend protocol

dmax does not require a backend SDK.

The backend contract is intentionally small:
- serve normal HTML for page loads
- serve JSON, text, HTML, or SSE for actions
- when streaming, emit plain `text/event-stream` frames
- use stable documented event names and payload shapes

If you know how normal `data-m-ex` / `data-m-get` / `data-m-post` wiring works, the backend side should feel like the same thing: small, explicit, and regular.

## Content types

Typical response modes:
- `application/json` for `^json`
- `text/plain` for `^text`
- `text/html` for `^html`
- `text/event-stream` for `^sse`

For SSE, send at least:

```http
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive
```

## SSE event names

dmax consumes these public SSE event names:
- `dm-signals`
- `dm-elements`

You may emit one, the other, or both in the same stream.

## `dm-signals`

Patch signals with one event.

```text
event: dm-signals
data: {"count":1,"user":{"name":"Ada"}}

```

Semantics:
- payload must be JSON
- patching follows JSON Merge Patch style
- object fields merge shallow/deep by normal merge-patch rules
- `null` removes a field
- existing signal roots are updated in place

Example:

```text
event: dm-signals
data: {"feed":{"items":[1,2,3]},"req":{"busy":false}}

```

## `dm-elements`

Patch DOM by selector.

```text
event: dm-elements
data: {"selector":"#list","html":"<ul><li>A</li></ul>","mode":"inner"}

```

Payload fields:
- `selector`: CSS selector string
- `html`: HTML string
- `mode`: one of:
  - `outer`
  - `inner`
  - `replace`
  - `remove`
  - `before`
  - `after`
  - `append`
  - `prepend`

Notes:
- `outer` morphs the matched element itself
- `inner` morphs children only
- `replace` replaces the matched node
- `remove` ignores `html`
- relative modes insert around or inside each match

Examples:

```text
event: dm-elements
data: {"selector":"#status","html":"<span id=\"status\">ok</span>","mode":"outer"}

```

```text
event: dm-elements
data: {"selector":"#rows","html":"<tr><td>new</td></tr>","mode":"append"}

```

### Fat page morph

For a whole-page refresh that should preserve as much live DOM state as possible, send one large `outer` morph against a stable page root.

Client markup:

```html
<main id="app-shell">...</main>
```

SSE frame:

```text
event: dm-elements
data: {"selector":"#app-shell","mode":"outer","html":"<main id=\"app-shell\">...full new page body...</main>"}

```

Use this when the server already knows the next full page shape and you want one coarse morph instead of many small patches.

### OOB-style side patches

If the main response is one large morph but a few extra targets should update separately, emit more `dm-elements` events after it.

```text
event: dm-elements
data: {"selector":"#app-shell","mode":"outer","html":"<main id=\"app-shell\">...full new page body...</main>"}

event: dm-elements
data: {"selector":"#toast","mode":"outer","html":"<aside id=\"toast\">saved</aside>"}

event: dm-elements
data: {"selector":"head title","mode":"outer","html":"<title>Orders · saved</title>"}

```

This gives the same practical effect people often want from OOB updates:
- one main page/body morph
- a few separately targeted patches
- no special backend SDK layer

A common pattern is:
1. patch status signals with `dm-signals`
2. morph the main page root with `dm-elements`
3. patch small side targets with extra `dm-elements`

## Streaming both kinds together

A stream may interleave signal and DOM work:

```text
event: dm-signals
data: {"req":{"busy":true}}

event: dm-elements
data: {"selector":"#spinner","html":"<div id=\"spinner\">Loading…</div>","mode":"outer"}

event: dm-signals
data: {"items":[{"id":1,"title":"A"}],"req":{"busy":false,"complete":true}}

```

This is often enough. No SDK is required.

## Recommended action conventions

### Return JSON when
- the client mainly needs signal updates
- the response is data-first
- `data-m-...^json` is already the natural fit

### Return HTML when
- the server already renders the fragment
- DOM shape is the main output
- you want `^html` morphing/replacement

### Return SSE when
- work completes in steps
- you want mixed signal + HTML updates
- long-running or incremental responses matter

## Request-side conventions

dmax actions already provide a compact request contract:
- `+x` adds named inputs
- `^send-all` sends all signals
- `^url.x` forces values into the query string
- `^body.x` forces values into the body
- `^header.x` copies values into headers
- `^hs.sig` copies a header object
- `^auth.sig` sets authorization
- `^stat.sig` exposes grouped lifecycle state on the client

That means the backend can stay plain. It only needs to read normal HTTP inputs.

## Minimal SSE writers

### Nushell

```nu
def sse [event: string, data: any] {
  [
    $"event: ($event)"
    $"data: (($data | to json -r))"
    ""
    ""
  ] | str join "\n"
}
```

### Node

```js
const sse = (res, event, data) => {
  res.write(`event: ${event}\n`)
  res.write(`data: ${JSON.stringify(data)}\n\n`)
}
```

### Go

```go
func sse(w http.ResponseWriter, event string, v any) {
	b, _ := json.Marshal(v)
	fmt.Fprintf(w, "event: %s\n", event)
	fmt.Fprintf(w, "data: %s\n\n", b)
	if f, ok := w.(http.Flusher); ok { f.Flush() }
}
```

### .NET 10 single-file minimal API

```csharp
using System.Text.Json;

var app = WebApplication.CreateSlimBuilder(args).Build();

app.MapGet("/stream", async (HttpContext ctx) =>
{
    ctx.Response.Headers.ContentType = "text/event-stream";
    ctx.Response.Headers.CacheControl = "no-cache";

    static Task Sse(HttpResponse res, string ev, object data, CancellationToken ct) =>
        res.WriteAsync($"event: {ev}\ndata: {JsonSerializer.Serialize(data)}\n\n", ct);

    await Sse(ctx.Response, "dm-signals", new { count = 1, req = new { busy = true } }, ctx.RequestAborted);
    await ctx.Response.Body.FlushAsync(ctx.RequestAborted);

    await Task.Delay(250, ctx.RequestAborted);

    await Sse(ctx.Response, "dm-elements", new { selector = "#status", html = "<span id=\"status\">ok</span>", mode = "outer" }, ctx.RequestAborted);
    await ctx.Response.Body.FlushAsync(ctx.RequestAborted);
});

app.Run();
```

### Rust

```rust
use serde::Serialize;

fn sse<T: Serialize>(event: &str, data: &T) -> String {
    format!("event: {}\ndata: {}\n\n", event, serde_json::to_string(data).unwrap())
}
```

Example `axum` handler:

```rust
use axum::{response::Sse, response::sse::Event};
use futures::stream;
use serde_json::json;
use std::{convert::Infallible, time::Duration};
use tokio_stream::StreamExt;

async fn stream_dm() -> Sse<impl futures::Stream<Item = Result<Event, Infallible>>> {
    let items = vec![
        Ok(Event::default().event("dm-signals").data(json!({"req":{"busy":true}}).to_string())),
        Ok(Event::default().event("dm-elements").data(json!({
            "selector":"#status",
            "html":"<span id=\"status\">ok</span>",
            "mode":"outer"
        }).to_string())),
    ];
    Sse::new(stream::iter(items).throttle(Duration::from_millis(250)))
}
```

### Python

```python
import json

def sse(event, data):
    return f"event: {event}\ndata: {json.dumps(data)}\n\n"
```

## What dmax intentionally does not need

These are intentionally outside the core backend contract:
- a required server SDK
- framework-specific response builders
- server-issued arbitrary client JS execution hooks
- hidden transport conventions beyond normal HTTP and SSE

The bias is:
- keep the wire obvious
- keep the runtime responsible for client behavior
- keep the backend free to be plain HTML/JSON/SSE

## Practical checklist

For a dmax backend, you usually only need:
1. normal HTML routes
2. normal JSON or HTML action endpoints
3. optional SSE endpoints emitting `dm-signals` and/or `dm-elements`
4. correct `Content-Type`
5. stable selectors and stable signal names

That is the whole protocol surface for most apps.
