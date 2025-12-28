# Requirements

## Perf instructions

Approach the solution as a performance engineer who know how V8 works, how js ds are layed in memory, s
who know cost of gc, closures and objects, who knows that inlining is the great technique, who know data oriented and array programming, who knows what use and to use from the standard lib in hot path.

Balance performance and code size. 
Example 1: having a single global (compiled) regexp to parse most of the attribute name may be better instead of writing the char-by-char parser in 50locs, even if it slightly faster.

Example 2: using indexof may be faste the loop over string and compare because internally it is heavy optimized with simd and such. But using forEach or includes with lambda is not good on smalm arrays because of the lambda alloc cost. 


## data-def (sign)

data-def:foo-signal='0'

data-def:bars='[]'

data-def:baz.bor.boo   has a null value

same as
data-def='{"foo": 0, "bars":[], "baz":{"bor":{"boo": null}}}'



## data-sub

 data-sub(:(signal|:.prop|:#id.prop))*((@(signal|@.event|@#id.event|@!w.event))(__mod(.val)?)*)*='js exp'

 - `:signal` - zero, one or many signals; represents target for the right-hand JS expression assignment (e.g. `:user`, `:user.name`).

 - `:.prop` zero, one, or many element properties on the current element; represents target for the right-hand expression: example `:.value` for the current element's value, `:.style.color` for current element style properties. Use `:.` as the current-element default prop.

 - `:#id.prop` zero, one, or many element props by id; example `:#some-el-id.style.color` refers to the nested property on the element with id `some-el-id`. `:#id` is the default prop of the element with that id.

 - If zero targets are specified then the JS expression will be evaluated for its side effect. Example: `data-sub:.='console.log(1)'` evaluates on the current element's default event, `data-sub@user='foo.bar = 3'` runs on `user` signal change.

 - `@signal` - zero, one or many subscriptions/triggers on signal changes (e.g. `@count`, `@user.name`).

 - `@.event` - zero, one or many DOM events on the current element (e.g. `@.click`, `@.input`).
   - `@#id.event` targets an element by id's event (e.g. `@#btn.click`).
   - Special global/document/window events use the `!` prefix: `@!w.resize` (window), `@!d.visibilitychange` (document).
   - Synthetic timing triggers remain supported via `@!interval.ms` or `@!delay.ms`.

 - If no event or signal trigger is specified then the JS expression is evaluated once during init and/or when the relevant default event occurs; if no targets are provided the expression is evaluated for side effects only.

 - Trigger modifiers: `__immediate` (default for `@signal`), `__notimmediate` (default for `@.event`), `__once`, `__debounce.ms`, `__throttle.ms`, `__prevent` (preventDefault).

### Parser Notes (updated tokens)

 - `:` denotes start of a target (signal or prop).

   - If the next char is `.` then it is a property on the current element (e.g. `:.value`).
   - If the next char is `#` then it is an element-by-id reference (e.g. `:#my-id.prop`).
   - Otherwise it's a signal name (e.g. `:user.name`).

 - `@` denotes start of a trigger (signal or event).

   - If followed by `!` then it's a special/global target (`!w`/`!d`/`!f`), e.g. `@!w.resize`.
   - If followed by `.` it's a current-element event (`@.click`).
   - If followed by `#` it's an element-by-id event (`@#btn.click`).
   - Otherwise it's a signal trigger (`@count`).

 - Mods follow a double underscore prefix `__` and may include a dot-delimited value (e.g. `__debounce.200`). Mods can be chained.

 - Property and signal names are expected in kebab-case or snake_case in attributes and are converted to camelCase when accessed in JS expressions (e.g. `font-size` → `fontSize`).

 - Errors (invalid tokens, missing elements, malformed expressions) should be reported clearly to the console with attribute + element context.

For concrete attribute examples consult the demo runtime in `index.html` and the TL;DR in `README.md`.

## data-sync

A sugar consisting of 0, 1 or 2 targets with the same grammar as in data-sub for targets but with optional mods from triggers (because those are targets and triggers at the same time)

- 2 targets may be signals or props means that target is writable and the other target changed (signal changed or prop elem default event raised) then the first target (signal or prop) will be set to the value of the first, and vice versa. If that target is not writable then it won't be set (the update should be ignored). Infinite loop of updates should be prevented by comparing that value is not changed and preventing update).

- If one the targets is signal, then the should be updated immediatly when the elem with data-sync loaded (unless __noimmediate is specified).

- If single target is specified, this means the second target will be default prop/default event of the current element.

- No targets is the valid case if the curr element has a name attr, then this nsme will be used for signal.


## data-class

data-class.foo.bar@baz='baz + boo.fix > 42'
data-class.greeting@foo__5
data-class:.green-button.-gray-button@is-done@#el-id.load

where:
  .class-to-add
  .-class-to-remove

@is-done is a signal trigger
@#el-id.load is an event trigger

data-class:.foo.bar@baz='baz + boo.fix > 42'
  (expression value interpreted as boolean)

data-class:.greeting@foo__5
data-class:.showtime@cool-factor__notimmediate__gt.42__and.baz.boo.bee

## data-disp

basically the same as data-class but instead of adding or removing classes it hides or displays the element
data-disp@is-foo
data-disp@!is-complete@in-flight
data-disp:#cool-elem@is-cool.for-sure

Same as data-class, but instead of adding/removing classes, it hides or displays the element (display: none).


## data-iter

data-iter:posts$post$i.pid#p-tpl@some-additionsl-signal-not-only-posts@#.click

where #p-tpl is template tag, example

---
<template p-tpl>
  <li>post <span data-$pid/>: <p data-$post></p> </li>
</template>
```

where default bindings for item and idx are it and i, eg data-$it and data-$i

@TBD key for reconciliation eg $key.post.key


## data-get

### Examples

data-get:foo@#.click='`url?${el.value}`'
same as data-get:foo=...

data-get:#.value@#='url'
same as data-get@#='url'
same as data-get='url'

data-post:bar.baz+p-id__uri+#pelem.value?is-p-fetching?p-fetch-code__code@mouseover__delay.300__and.is-foo^.json=
where:
: target signal for post response json with mods: merge, replace, append, prepend (last 2 for arrays))
+ req input params with mods: uri( default for get and delete), body (default for post, put, patch)
? is action state targets with mods: busy (default), done, ok, err, code, all (object containing all)
^ control options signal object { headers: {}, retry: {}, cancel: {}, etc. @TBD}, or a special names started with . : usual values of content-type header like json, js, html, sse; cache-control no-cache value (default for sse) .no-cache, etc. TBD
@ action triggers: signal or event with more interedting mods: and.boolean-signal-name,

data-put...

data-patch...

data-delete...

