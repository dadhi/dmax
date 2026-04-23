## Development Guidelines (Living)

- Prefer **first principles** over stack best-practices by default.
- No pissimization by default - we have knowledge of the CPU, memory hierarchy, data structures, algorithms, programming language, so that we MUST select at least a GOOD over the EASY approach for the job.
- Keep design **performance-oriented from the start** (especially hot paths).
- Apply **semantic compression**: represent intent directly, remove glue/noise. See https://caseymuratori.com/blog_0015 on Semantic Compression. SC == compact code as zip, evaluate results, if there is win in size and no losing in performance and simplicity, then keep it, otherwise unzip.
- Solve problems inline and when it solved multiple time the same way, only then refactor using SC guidelines. If you working on the problem after applying the changes think if inlining will help to simplify the solution (e.g. less checks, less data preparation, etc.). Don't treat the function boundaries as a hard walls - those are fluent and can be created and removed based on SC guidelines
- Solve problems **piece by piece** with clear boundaries and invariants.
- **Validate/fail at the surface area** (parse/setup boundaries), not deep inside runtime loops.
- Treat assumptions as hypotheses: **test fast, falsify early**.
- Explore alternatives widely (including unconventional ones), then choose the simplest and performant option.
- Use **compact, collision-safe naming** in hot code.
- Minimize runtime allocation/closure churn; prefer setup-time normalization.
- Keep runtime dispatch small and predictable; avoid repeated reinterpretation of data.
- Apply learnings from the Data-Oriented and Array-Oriented design: prefer work on contiguous homogenous memory loved by CPU/cache.

---

## Do not

- Don't touch unrelated files and code to the task unless their in scope, have logical, performance, or other connection to current code
- Don't put the LLMs like comments stating the phase, spec, etc. currently in progress. Consider the comments a part of the code providing context and guidance on the complex code.
- Don't keep an old code around for the backward compatibility (unless it is explicitly asked). Consider current task as active work in progress with no yet a real user.

---

This file is intentionally a living document and should be refined as better patterns emerge.
