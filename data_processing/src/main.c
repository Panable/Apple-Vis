#include <assert.h>
#include <stdio.h>
#include <stdlib.h>
#include <cjson/cJSON.h>
#include <string.h>

#define get_obj cJSON_GetObjectItemCaseSensitive

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

typedef struct t_csv_line {
    char* field_name;
    char* data;
} t_csv_line;

typedef struct t_csv {
    t_csv_line* lines;
    size_t len;
} t_csv;

t_csv* csv_create(size_t len) {
    t_csv* csv = malloc(sizeof(t_csv));
    csv->lines = malloc(sizeof(t_csv_line) * len);
    csv->len = len;

    return csv;
}

void csv_free(t_csv* csv) 
{
    for (size_t i = 0; i < csv->len; i++) {
        //free(csv->lines[i].field_name);
        //free(csv->lines[i].data);
    }

    free(csv->lines);
    free(csv);
}

void populate_fields(char* line, t_csv* csv) 
{
    const char* tok;

    for (tok = strtok(line, ","); tok && *tok; tok = strtok(NULL, ",\n")) {
        printf("%s\n\n", tok);
    }
}

void populate_field_names(char* line, t_csv* csv) 
{
}


t_csv* ParseCSV(const char* file_name)
{
    size_t num_lines;
    size_t longest_line_length;

    count_lines_in_file(file_name, &num_lines, &longest_line_length);
    printf("number of lines is: %zu, longest line is %zu",
            num_lines, longest_line_length);

    t_csv* csv = csv_create(num_lines);



    FILE* stream = fopen(file_name, "r");
    char line[longest_line_length];

    int first = 1;
    while (fgets(line, longest_line_length, stream))
    {
        if (first) {
            populate_field_names(line, csv);
            first = 0;
        }

        populate_fields(line, csv);
    }

    return csv;
}

cJSON* open_json(const char* file_name)
{
    char* buffer = file_to_buffer(file_name);

    cJSON* json = cJSON_Parse(buffer);

    if (!json) {
        const char* error_ptr = cJSON_GetErrorPtr();
        if (error_ptr)
            fprintf(stderr, "Error at %s", error_ptr);
    }

    free(buffer);
    return json;
}

int main(void) {
    t_csv* csv = ParseCSV("fruit_consumption_all_countries.csv");
    csv_free(csv);
    return 0;
    cJSON* json = open_json("countries-110m.json");
    cJSON* objects = get_obj(json, "objects");
    cJSON* countries = get_obj(objects, "countries");
    cJSON* geometries = get_obj(countries, "geometries");
    //cJSON* properties  = get_obj(geometries, "properties");
    
// Iterate over geometries array
    cJSON* geometry = NULL;
    cJSON_ArrayForEach(geometry, geometries) {
        cJSON* properties = get_obj(geometry, "properties");
        if (properties) {
            cJSON* name = get_obj(properties, "name");
            cJSON_AddStringToObject(properties, "hello", "bing");
            if (name && cJSON_IsString(name)) {
                printf("Name: %s\n", name->valuestring);
            } else {
                printf("Name not found or not a string\n");
            }
        }
    }

    FILE* output_file = fopen("modified_countries.json", "w");
    assert(output_file);

    char* modified_json = cJSON_Print(json);
    fputs(modified_json, output_file);

    fclose(output_file);
    free(modified_json);
    cJSON_Delete(json);

    return 0;
}
