# dmax

A tiny declarative web runtime driven by `data-*` attributes.

## Files

- `index.html` — current dev notebook (asserts + live examples)
- `dmax.js` — extracted runtime script loaded by `index.html`
- `index-wotking-slop.html` — previous `index.html` snapshot

## Runtime size

`dmax.js` (uncompressed, as of this change): **110,147 bytes**.

## Syntax used by current `index.html`

### Core directives

- `data-def` — define signal state
- `data-sub` — subscribe and update signals/props with expression results
- `data-sync` — signal/prop synchronization
- `data-class` — class toggling
- `data-disp` — show/hide elements
- `data-dump` — render array items via templates
- `data-get|post|put|patch|delete` — declarative HTTP actions

### Token grammar

- `:target` signal/prop targets
- `@trigger` signal/event/prop triggers
- `+input` action inputs
- `^mod` modifiers (timing/guards/options)
- `!name` negation in applicable places

### Example

```html
<div data-def='{"count":0,"active":true}'></div>

<button data-sub:count@.click="dm.count + 1">+1</button>
<span data-sub:.@count="dm.count"></span>

<input data-sync:user.name>
<div data-class+active+!inactive@active="dm.active"></div>

<button data-get^busy.post-loading^err.post-error^code.post-code:post-result@.click="'https://jsonplaceholder.typicode.com/posts/1'">
  Load
</button>
<strong data-disp:.@post-loading="dm.postLoading">Loading…</strong>
<span data-sub:.@post-error="dm.postError"></span>
<span data-sub:.@post-code="dm.postCode"></span>
```

`^busy.post-loading^err.post-error^code.post-code` reuses modifier syntax for action status signals instead of special positional parsing, and lets each action expose independent loading/error/code indicators.

## Compression question

Yes — you can compress `dmax.js` without Node/npm libraries.

Examples:

```bash
gzip -k -9 dmax.js
brotli -k -q 11 dmax.js
```

Then serve compressed assets with `Content-Encoding: gzip` or `br`.
