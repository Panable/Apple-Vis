#include <assert.h>
#include <stdio.h>
#include <stdlib.h>
#include <cjson/cJSON.h>
#include <string.h>
#define CSV_PARSER_IMPLEMENTATION
#include "csv_parser.h"

#define get_obj cJSON_GetObjectItemCaseSensitive

void write_json(cJSON* json, const char* file_name)
{
    // write csv
    FILE* output_file = fopen(file_name, "w");
    assert(output_file);

    char* modified_json = cJSON_Print(json);
    fputs(modified_json, output_file);

    fclose(output_file);
    free(modified_json);
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
    CSV* csv = ParseCSV("fruit_consumption_all_countries.csv");
    int line_number = search_field(csv, "Australia", "country_name");
    char* field = get_field(csv, line_number, "percentage");
    printf("the line number of australia is %s\n", field);
    printf("zeroth element is %s\n", csv->lines[37][1]);

    cJSON* json = open_json("../countries-110m.json");
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
            // cJSON_AddStringToObject(properties, "hello", "bing");
            if (name && cJSON_IsString(name)) {
                printf("Name: %s\n", name->valuestring);
                int line_number = search_field(csv, name->valuestring, "country_name");
                //found name! let's import our percentage~!
                if (line_number != -1) {
                    printf("Found %s and %s\n", name->valuestring, get_field(csv, line_number, "country_name"));
                    char* percentage_as_str = get_field(csv, line_number, "percentage");
                    double percentage = atof(percentage_as_str);
                    cJSON_AddNumberToObject(properties, "percentage", percentage);
                }
            } else {
                printf("Name not found or not a string\n");
            }
        }
    }

    write_json(json, "../modified_countries.json");


    csv_free(csv);
    cJSON_Delete(json);
    return 0;
}
