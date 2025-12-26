# Requirements

## Perf instructions

Approach the solution as a performance engineer who know how V8 works, how js ds are layed in memory, s
who know cost of gc, closures and objects, who knows that inlining is the great technique, who know data oriented and array programming.

Balance performance and code size. Example: having a single global (compiled) regexp to parse most of the attribute name may be better instead of writing the char-by-char parser in 50locs, even if it slightly faster.



## data-def (sign)

## data-sub

 data-sub(:(signal|#.prop))*((@(signal|#.event))(__mod(.val)?)*)*='js exp'

- ':signal' - zero, one or many signals; represents target for the right js expr assignment; example for-bar.baz

- ':#.prop' zero, one, or many element props; represents target for the right js exp: example :#.value for the element where data-sub is defined, :#some-el-id.style.color is nested prop on the elem with id #some-elem, :# is the default target prop of the el where data-sub defined, eg value, checked, selectedOptions, textContent, :#my-input the default prop of the elem with id #my-elem

- if zero targets is specified then the js expr will be evaluated for its side effect data-sub#='alert(1)' raises alert each time the default prop of the defined el changes, data-sub@foo='bar.baz = 3' - changes bar.baz on the foo change.

- @signal - zero, one or many subscriptions/triggers on the signal change; data-set@foo@bar.baz

- @#.event - zero, one or many html events; example @#.click for the el where data-sub is defined, @#elem-id.mouseover is the event of @#elem-id; @# is the default event of the el: input, change. If triggered then not not null event is available in js expr; @#window.event and @#document.event for window and document events respectively. There are also two sintetic events without elem: interval and delay

- if no event or signal trigger is specified then js exp is evaluated once on element and its result assigned to all target, if no targets then exp id evaluated for its sideeffects, example data-sub='console.log(42)' - side effect, data-sub:#='42' - assign '42' default el prop; data-sub:#my-input:foo:#.style.width='42' - assign '42' to #my-input default prop, also to foo signal, also to current elem style.width.

- triggers mods are __immediate (default for @signal), __notimmediate (default for @#.),

__once, __debounce.numOfMs, __throttle.numOfMs,

__prevent (for preventing default behavior)

### Parser Notes

- : denotes start of target (signal or prop)

-- if next char is # then it is prop otherwise signal

--- if signal, read untill : or @ the name of the signal. Signal may be nested, so each . will denote of the signal name in the nested chain. Signal name cannot be empty -> error.

--- if prop, then read until . or : or @ the id of prop elem. If its empty then it is current element, otherwise it is id of element. If we read . then read the prop name until the : or @. Property name can be nested (style.color) each new . denote the end of the prop in the nested chain.

If we do not read the . after elem name and found : or @ instead, then the property is default for this element. The case with empty elem and no prop is valid @# and denotes current element with default prop.

- similar @ denotes start of trigger (signal or event). Property cannot be a trigger, the found name we consider an event -> error if not found.

-- if the next char is # it is event otherwise a signal

--- if it is signal we read its name until __ or : or @. The name can be nested chain delim by . If the name ends on __ next we read a mod name and possible value after the dot. We read the mod (collecting its name and value) until next mod __ or : or @.

--- if it is event read its element id until __ or . or : or @ The id may be empty (curr elem), maybe window or document, othrwise an id of the elem. If we found . then read event name (may be chained with .) untill __ or : or @. Event name may empty (but not for window or document -> error) meaning the default event. If the next was __ then read the mods as above the same as mods for signals. The empty id and event is valid @# meaning default event of the curr elem.

## data-sync

A sugar consisting of 0, 1 or 2 targets with the same grammar as in data-sub for targets but with optional mods from triggers (because those are targets and triggers at the same time)

- 2 targets may be signals or props means that target is writable and the other target changed (signal changed or prop elem default event raised) then the first target (signal or prop) will be set to the value of the first, and vice versa. If that target is not writable then it won't be set (the update should be ignored). Infinite loop of updates should be prevented by comparing that value is not changed and preventing update).

- If one the targets is signal, then the should be updated immediatly when the elem with data-sync loaded (unless __noimmediate is specified).

- If single target is specified, this means the second target will be default prop/default event of the current element.

- No targets is the valid case if the curr element has a name attr, then this nsme will be used for signal.

## Perf Note

Do not use regexp, array includes and split. Use indexof and string iteration to find token boundaries. It is fine to use indexof multiple times for different chars (as we do not have indexofany). But remember that indexof is heavily optimized by v8.


## data-class


## data-disp


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
? is action state targets with mods: busy (default), done, ok, err, code
^ control options signal object { headers: {}, retry: {}, cancel: {}, etc. @TBD}, or a special names started with . : usual values of content-type header like json, js, html, sse; cache-control no-cash value (default for sse) .no-cache, etc. TBD
@ action triggers: signal or event with more interedting mods: and.boolean-signal-name,

data-put...

data-patch...

data-delete...





2.1. Events now start with @ instead of on-. We are saving the 2 symbols.
2.2. Action syntax
- Basis are data-get, -post, -put, -patch, -delete
- Multiple input params (signals) start with : , eg. :post-id:foo.bar.baz
The input param mods __uri to pass as uri (default for get, delete), __body (default for post, put, patch), __header.name to pass as header wuth the name. Special params are form! and file! with exclamation form.
- Single output parameter starts with :+, eg :+posts. Mods are __merge (default), __replace, __append (for array), __prepend (for array).
- Multiple action state info is starts with :?, eg :?fetching. Mods are __busy (default), __done, __ok, __err,  __code, __all (all of the former).
- Options starts with :^, eg. :^get-options. The signals is object like this { headers: {}, timeout, retry cancellation, ...} We may TBD all except headers. Multiple options possible. The special names are: json!, html!, sse!, js! corresponding to the Content-Type header; no-cache! for cache control. We may add others in TBD. 
- Normally action ends with event, eg. @click__prevent, @delay-1000, @interval-500, @change-foo__true @change-bar-baz__eq.0, etc. (TBD)
- Action value contain url
