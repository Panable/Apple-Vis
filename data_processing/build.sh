#!/bin/sh

set -e

CC=cc
LIBS="-lc -lm -lncurses -lcjson"
CFLAGS="-Wall -Wextra -std=c11 -pedantic -ggdb"
SRC="src/main.c src/pl_utils.c"
MACROS="-DPL_LOGGING"

bear -- $CC $CFLAGS $MACROS -o build/process $SRC $LIBS
