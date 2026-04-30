#!/bin/sh
set -eu

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT_DIR="$(mktemp -d "${TMPDIR:-/tmp}/dmax-strip-test.XXXXXX")"
OUT_FILE="$OUT_DIR/dmax.prod.js"

trap 'rm -rf "$OUT_DIR"' 0

"$ROOT/tools/strip-dmax-tests.sh" "$ROOT/dmax.js" "$OUT_FILE"

test -s "$OUT_FILE"

if grep -q "__assert(" "$OUT_FILE"; then
  echo "Expected stripped file to not contain __assert calls" >&2
  exit 1
fi

if grep -q "__asyncAssert(" "$OUT_FILE"; then
  echo "Expected stripped file to not contain __asyncAssert calls" >&2
  exit 1
fi

if grep -q "function __t" "$OUT_FILE"; then
  echo "Expected stripped file to not contain inline __t* test functions" >&2
  exit 1
fi

grep -q "function dAction(" "$OUT_FILE"
grep -q "function dDump(" "$OUT_FILE"
grep -q "function morph(" "$OUT_FILE"
