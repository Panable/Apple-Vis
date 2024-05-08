#!/bin/sh

set -xe

CC=cc
LIBS="-lc -lncurses -lcjson"
CFLAGS="-Wall -Wextra -std=c11 -pedantic -ggdb"

SRC="src/main.c"

bear -- $CC $CFLAGS -o build/process $SRC $LIBS
