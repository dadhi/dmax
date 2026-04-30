#!/usr/bin/env bash
set -euo pipefail

if [[ $# -gt 2 ]]; then
  echo "Usage: $0 [input-js] [output-js]" >&2
  exit 1
fi

INPUT="${1:-dmax.js}"
OUTPUT="${2:-}"

if [[ ! -f "$INPUT" ]]; then
  echo "Input file not found: $INPUT" >&2
  exit 1
fi

strip_file() {
  awk '
    BEGIN { in_header = 1 }
    {
      if (in_header) {
        if ($0 ~ /@js-check/) print
        if ($0 ~ /lib code starts here/) in_header = 0
        next
      }

      if (skip_fn) {
        if ($0 ~ /^    }[[:space:]]*$/) skip_fn = 0
        next
      }

      if (skip_async_assert_call) {
        if ($0 ~ /^    }\)[[:space:]]*;?[[:space:]]*$/) skip_async_assert_call = 0
        next
      }

      if (skip_async_chain) {
        if ($0 ~ /^    }\)[[:space:]]*;?[[:space:]]*$/) skip_async_chain = 0
        next
      }

      if ($0 ~ /^    function __[A-Za-z0-9_]+\(/) { skip_fn = 1; next }
      if ($0 ~ /^    (const|let|var) __[A-Za-z0-9_]+[[:space:]]*=/) next
      if ($0 ~ /^    __assert\(/) next
      if ($0 ~ /^    __asyncAssert\(/) { skip_async_assert_call = 1; next }
      if ($0 ~ /^    let _asyncChain[[:space:]]*=/) next
      if ($0 ~ /^    _asyncChain\.then\(/) { skip_async_chain = 1; next }
      if ($0 ~ /^    \/\/ ---- dAction async tests ----/) next
      if ($0 ~ /^    \/\/ Tests run sequentially to avoid concurrent __reset\(\) interference/) next
      if ($0 ~ /^    \/\/ Wait for all sequential async tests before signalling completion/) next

      print
    }
  ' "$INPUT"
}

if [[ -n "$OUTPUT" ]]; then
  strip_file > "$OUTPUT"
else
  strip_file
fi
