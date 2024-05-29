#ifndef PL_UTILS_H
#define PL_UTILS_H
#include "assert.h"
#include "stdlib.h"

typedef enum {
    PL_INFO,
    PL_WARNING,
    PL_ERROR,
} Pl_Log_Level;

#ifdef PL_LOGGING
    void pl_log(Pl_Log_Level level, const char* fmt, ...);
    #define PL_LOG(level, fmt, ...) pl_log(level, fmt, __VA_ARGS__)
#else
    #define PL_LOG(level, fmt, ...)
#endif

#define PL_ASSERT(cond, fmt, ...)\
        do { \
            if (!(cond)) {\
                PL_LOG(PL_ERROR, fmt, __VA_ARGS__);\
                assert(cond);\
            }\
        } while (0)

#define PL_CLAMP(x, low, high)  (((x) > (high)) ? (high) : (((x) < (low)) ? (low) : (x)))

#endif // PL_LOG_H
