#include "pl_utils.h"
#include <stdio.h>
#include <assert.h>
#include <stdarg.h>

#define KNRM  "\x1B[0m"
#define KRED  "\x1B[31m"
#define KGRN  "\x1B[32m"
#define KYEL  "\x1B[33m"
#define KBLU  "\x1B[34m"
#define KMAG  "\x1B[35m"
#define KCYN  "\x1B[36m"
#define KWHT  "\x1B[37m"

void pl_log(Pl_Log_Level level, const char* fmt, ...)
{
    switch (level) {
        case PL_INFO:
            fprintf(stderr, "%s[INFO] %s", KGRN, KNRM);
            break;

        case PL_WARNING:
            fprintf(stderr, "%s[WARNING] %s", KYEL, KNRM);
            break;

        case PL_ERROR:
            fprintf(stderr, "%s[ERROR] %s", KRED, KNRM);
            break;

        default:
        assert(0 && "Unreachable");
    }

    va_list args;
    va_start(args, fmt);
    vfprintf(stderr, fmt, args);
    va_end(args);
    fprintf(stderr, "\n");
}

void* pl_malloc(size_t size)
{
    void* ptr = malloc(size);
    PL_ASSERT(ptr, "%s", "Failure to allocate memory!? -> https://downloadmoreram.com/");
    return ptr;
}
