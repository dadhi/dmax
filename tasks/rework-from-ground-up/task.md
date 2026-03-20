# Task

## Initial

I am working on rebuilding the noize and non-consistent @/index.html impl from the ground up in @/index-dev-wip.html. 
I am going function by function adding the inline tests (for now).
At the moment I am working on dSub. Could you please complete this work.

## Next001 - 20260305-01

Things I do not like:
- SPEC_TIMEOUT.slice(1) - we need to do as minimal as possible by initial design. So we need to probably change SPEC_ constants to remove '_'.
- applyTrigMods is big and case by case. Can we rethink it from the first principles and semantic compression?
- We are owning this code and if we check some prerequisites early and avoid double check later, e.g. do we need `if (!root) return undefined` in the `getSignalVal`.
- Use compact names, avoid clashes with js keywords like using `base`. Prefer short names or well decoded shorting.
- Avoid closures, data-copying, etc. to provide the max-performance. We may utilize anything for it from the system-level or game design like passing input data with static fn, keep the dto to minimum, split structs fields to separate arrays, etc. But do not get overboard, the simplicity should be in balance.

## Next002 - 20260319-01

Now I have the dev approach in @/tasks\rework-from-ground-up\dev.md.
Plan and results are tracked in @/tasks\rework-from-ground-up\result.md
The file under development is the @/index-dev-wip.html which is forked from the @/index-dev.html 
and the old end-to-end working but badly developed and with older syntax is @/index.html 
(new changes  are tracked in the @/README.md section 'Future Version @WIP')

The next task is look into `applyTrigMods` helper function and optimize/compact it, and `assert` it separately.

## Next003 - 20260319-01

For easy visual/tool separation please prefix all assert related helpers with `assert_`.
Please apply this renaming to all assert ONLY helpers. If the helper is used in the actual business logic, do not touch it. 
Later I want a simple tool e.g. in bash, to strip all `assert` and `assert_` starting functions, variable from the code. 
Btw, please add the prefix to the global constants and variables used ONLY by the asserts as well.
