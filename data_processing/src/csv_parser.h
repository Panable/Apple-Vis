// INCLUDE
#pragma once

extern char* strdup(const char*);
#include <stdlib.h>
#include <stdio.h>
#include <assert.h>
#include <string.h>
#include <stdbool.h>

// DECLARATIONS
typedef struct CSV {
    char** field_name;
    size_t num_lines;
    size_t num_fields;
    char*** lines;
} CSV;

char* file_to_buffer(const char* file_name);
void count_lines_in_file(const char* file_name, 
        size_t* num_lines, 
        size_t* longest_line_length);

void csv_free(CSV* csv);
void populate_fields(char* line, size_t line_index, CSV* csv);
void populate_field_names(const char* line, CSV* csv);
CSV* ParseCSV(const char* file_name);
char* get_field(CSV* csv, size_t line, const char* name);
int get_column_index(CSV* csv, const char* name);
int search_field(CSV* csv, const char* search_name, const char* column_name);
void remove_row(CSV* csv, size_t line);
void csv_dump(CSV* csv);

// FOR TESTING -> LSP BREAKS
#define CSV_PARSER_IMPLEMENTATION

// IMPLEMENTATIONS
#ifdef CSV_PARSER_IMPLEMENTATION

char* file_to_buffer(const char* file_name)
{
    FILE* file = fopen(file_name, "r");
    assert(file);

    fseek(file, 0, SEEK_END);
    long size = ftell(file);
    fseek(file, 0, SEEK_SET);


    char* buffer = malloc(size + 1);


    fread(buffer, 1, size, file);
    fclose(file);
    return buffer;
}

void count_lines_in_file(const char* file_name,
                             size_t* num_lines,
                             size_t* longest_line_length)
{
    *num_lines = 0;
    *longest_line_length = 0;

    FILE* file = fopen(file_name, "r");

    size_t current_length = 0;
    while(!feof(file)) {
        char ch = fgetc(file);
        if (ch == '\n') {
            *longest_line_length = 
                current_length > *longest_line_length ? 
                current_length : *longest_line_length;
            current_length = 0;
            (*num_lines)++;
        }
        else
            current_length++;
    }
}

void csv_free(CSV* csv)
{
    for (size_t i = 0; i < csv->num_lines; i++) {
        for (size_t j = 0; j < csv->num_fields; j++)
            free(csv->lines[i][j]);
        free(csv->lines[i]);
    }

    for (size_t i = 0; i < csv->num_fields; i++) {
        free(csv->field_name[i]);
    }

    free(csv->lines);
    free(csv->field_name);
    free(csv);
}

void populate_fields(char* line, size_t line_index, CSV* csv)
{
    const char* tok;
    
    size_t element = 0;
    for (tok = strtok(line, ","); tok && *tok; tok = strtok(NULL, ",\n")) {
        assert(line_index < csv->num_lines);
        assert(element < csv->num_fields);
        csv->lines[line_index][element] = strdup(tok);
        element++;
    }
}

void populate_field_names(const char* line, CSV* csv)
{
    size_t num_fields = 0;
    const char* tok;

    size_t longest_field_name = 0;

    char* copy = strdup(line);
    // get num_fields
    for (tok = strtok(copy, ","); tok && *tok; tok = strtok(NULL, ",\n")) {
        size_t cur_tok_len = strlen(tok);

        if (cur_tok_len > longest_field_name)
            longest_field_name = cur_tok_len;

        num_fields++;
    }

    free(copy);

    csv->num_fields = num_fields;
    csv->field_name = malloc(sizeof(char*) * csv->num_fields);
    //printf("\nnum fields is %zu, longest token length is %zu\n", num_fields, longest_field_name);

    copy = strdup(line);
    // initialize fields in CSV
    size_t i = 0;
    for (tok = strtok(copy, ","); tok && *tok; tok = strtok(NULL, ",\n")) {
        //printf("%s\n", tok);
        char* field = strdup(tok);
        csv->field_name[i] = field;
        i++;
    }

    free(copy);
    csv->lines = malloc(csv->num_lines * sizeof(char***));

    for (size_t i = 0; i < csv->num_lines; i++) {
        csv->lines[i] = malloc(csv->num_fields * sizeof(char**));
    }
}


CSV* ParseCSV(const char* file_name)
{
    size_t num_lines;
    size_t longest_line_length;

    count_lines_in_file(file_name, &num_lines, &longest_line_length);
    printf("number of lines is: %zu, longest line is %zu in total csv\n",
            num_lines, longest_line_length);

    FILE* stream = fopen(file_name, "r");
    char line[++longest_line_length];

    CSV* csv = malloc(sizeof(CSV));
    csv->num_lines = num_lines - 1; // we dont care about the first line (col_names);
    
    size_t line_index = 0;
    while (fgets(line, 1024, stream))
    {
        if (!csv->field_name) {
            populate_field_names(line, csv);
        } else {
            populate_fields(line, line_index, csv);
            line_index++;
        }
    }
    return csv;
}

int get_column_index(CSV* csv, const char* name) {

    for (int i = 0; i < (int)csv->num_fields; i++) {
        int result = strcmp(csv->field_name[i], name);
        if (result == 0) return i;
    }

    return -1;
}

// returns line number
int search_field(CSV* csv, const char* search_name, const char* column_name)
{
    int raw_col_index = get_column_index(csv, column_name);
    if (raw_col_index == -1) 
        return -1;

    size_t col_index = (int) raw_col_index;

    for (size_t i = 0; i < csv->num_lines; i++) {
       if (strcmp(csv->lines[i][col_index], search_name) == 0)
           return (int) i;
    }
    return -1;
}

char* get_field(CSV* csv, size_t line, const char* name)
{
    int raw_col_index = get_column_index(csv, name);
    if (raw_col_index == -1) 
        return "";

    size_t col_index = (size_t) raw_col_index;
    assert(col_index < csv->num_fields);
    
    return csv->lines[line][col_index];
}

void remove_row(CSV* csv, size_t line)
{
    // Check out of bounds.
    assert(line < csv->num_lines);
    
    
    // last element
    bool last_element = line == csv->num_lines - 1;

    // dont need to move memory, if it is last element, just free.
    if (!last_element) {
        memmove(csv->lines + line, csv->lines + line + 1, sizeof(char**) * (csv->num_lines - line));
    }

    for (size_t i = 0; i < csv->num_fields; i++)
        free(csv->lines[line][i]);
    free(csv->lines[line]);

    csv->num_lines--;
}

void csv_dump(CSV* csv)
{
        
    //print field names first
    for (size_t i = 0; i < csv->num_fields; i++) {
        printf("%s", csv->field_name[i]);
        if (i < csv->num_fields - 1)
        printf(", ");
    }
    printf("\n");

    for (size_t i = 0; i < csv->num_lines; i++) {
        for (size_t j = 0; j < csv->num_fields; j++) {
            printf("%s", csv->lines[i][j]);
            if (j < csv->num_fields - 1)
            printf(", ");
        }
        printf("\n");
    }

    printf("num lines is %zu\n", csv->num_lines);
}

#endif // CSV_PARSER_IMPLEMENTATION

