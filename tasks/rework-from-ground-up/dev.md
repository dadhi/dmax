## Development Guidelines (Living)

- Prefer **first principles** over stack best-practices by default.
- Keep design **performance-oriented from the start** (especially hot paths).
- Apply **semantic compression**: represent intent directly, remove glue/noise. See https://caseymuratori.com/blog_0015 on Semantic Compression.
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
