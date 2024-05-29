#include <stddef.h>
#include <stdarg.h>
#include <assert.h>
#include <stdio.h>
#include <stdlib.h>
#include <cjson/cJSON.h>
#include <string.h>
#define CSV_PARSER_IMPLEMENTATION
#include "csv_parser.h"
#include "pl_utils.h"

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

cJSON* search_json(cJSON* json, const char* name)
{
    assert(cJSON_IsArray(json));
    cJSON* country = NULL;
    cJSON_ArrayForEach(country, json)
    {
        cJSON* country_name = get_obj(country, "name");
        char* val = cJSON_GetStringValue(country_name);

        if (strcmp(val, name) == 0) return get_obj(country, "fruit_consumption");
    }
    return NULL;
}

void process_world_map(const char* name)
{
    cJSON* fruit_consumption = open_json(name);
    cJSON* world_map = open_json("datasets/countries-50m.json");

    cJSON* test = search_json(fruit_consumption, "Australia");

    cJSON* objects = get_obj(world_map, "objects");
    cJSON* countries = get_obj(objects, "countries");
    cJSON* geometries = get_obj(countries, "geometries");
    
    // Iterate over geometries array
    cJSON* geometry = NULL;
    cJSON_ArrayForEach(geometry, geometries)
    {
        cJSON* properties = get_obj(geometry, "properties");
        if (properties)
        {
            cJSON* name = get_obj(properties, "name");
            // cJSON_AddStringToObject(properties, "hello", "bing");
            if (name && cJSON_IsString(name)) {
                cJSON* fruit_consumption_data = search_json(fruit_consumption, name->valuestring);
                if (fruit_consumption_data) {
                    cJSON_AddItemToObject(properties, "fruit_consumption", fruit_consumption_data);
                }
            } 
            else
            {
                printf("Name not found or not a string\n");
            }
        }
    }


    write_json(world_map, "processed_data/world_map.json");

    cJSON_Delete(world_map);
}

int find_matching_method(CSV* csv, const char* country, size_t cur_index)
{   
    size_t country_index = get_column_index(csv, "Reference area");
    size_t measure_index = get_column_index(csv, "MEASURE");
    size_t method_index = get_column_index(csv, "Measurement Method");

    for (size_t i = cur_index; i < csv->num_lines; i++) {
        char* cur_country = csv->lines[i][country_index];
        char* cur_measure = csv->lines[i][measure_index];

        
        // country and measure not what we are looking for.

        if (strcmp(cur_country, country) != 0)
            continue;
        if (strcmp(cur_measure, "SP_OVRGHT_OBS") != 0)
            continue;
        return i;
    }

    return -1;
}

int find_matching_country(CSV* csv, const char* search_measure, const char* search_country, size_t cur_index)
{   
    size_t country_index = get_column_index(csv, "Reference area");
    size_t measure = get_column_index(csv, "MEASURE");

    for (size_t i = cur_index; i < csv->num_lines; i++) {
        char* cur_country = csv->lines[i][country_index];
        char* cur_measure  = csv->lines[i][measure];
        
        if (strcmp(cur_country, search_country) != 0)
            continue;

        if (strcmp(cur_measure, search_measure) != 0)
            continue;

        return i;
    }

    return -1;
}

cJSON* find_country(cJSON* json, const char* country_name)
{
    cJSON* country = NULL; 
    cJSON_ArrayForEach(country, json) {
        cJSON* name = get_obj(country, "name");
        if (name && cJSON_IsString(name)) {
            if (strcmp(name->valuestring, country_name) != 0) continue;
            return country;
        }
    }
    return NULL;
}

cJSON* general_intermediary_json(cJSON* json, CSV* csv, const char* name, bool gen_new)
{
    size_t country_i = get_column_index(csv, "Entity");
    size_t year_i = get_column_index(csv, "Year");
    size_t value_i = get_column_index(csv, "Value");

    for (size_t i = 0; i < csv->num_lines; i++)
    {
        char* cur_country = csv->lines[i][country_i];
        char* cur_year  = csv->lines[i][year_i];
        char* cur_value = csv->lines[i][value_i];

        cJSON* country = find_country(json, cur_country);
        cJSON* data = get_obj(country, name);

        if (!country && !gen_new) continue;
        
        if (!country && gen_new)
        {
            // Create country
            country = cJSON_CreateObject();
            cJSON_AddStringToObject(country, "name", cur_country);
            cJSON_AddItemToArray(json, country);

        }
        if (country && !data)
        {
            // Create data array
            data = cJSON_CreateArray();
            cJSON_AddItemToObject(country, name, data);
        }

        assert(data);

        // Bind data values
        
        char* eptr;
        assert(cur_value);
        double val = strtod(cur_value, &eptr);

        cJSON* cur_data = cJSON_CreateObject();

        cJSON_AddNumberToObject(cur_data, "year", atof(cur_year));
        cJSON_AddNumberToObject(cur_data, "value", val);

        cJSON_AddItemToArray(data, cur_data);

    }
    return json;
}

// Variadic function to check existence of all specified fields in each JSON object in the array
cJSON* exist_all(cJSON* json, int num_names, ...) {
    if (!json || !cJSON_IsArray(json) || num_names <= 0) {
        return NULL;
    }

    // Create a new array to hold the filtered elements
    cJSON* processed = cJSON_CreateArray();
    if (!processed) {
        return NULL;
    }

    va_list names;
    va_start(names, num_names);

    cJSON* country = NULL;
    cJSON_ArrayForEach(country, json) {
        if (!country) {
            continue;
        }
        
        cJSON* new_country = cJSON_CreateObject();

        cJSON* country_name = get_obj(country, "name");
        assert(country_name);
        
        // add name of country
        cJSON_AddItemToObject(new_country, "name", cJSON_Duplicate(country_name, 0));

        bool keep = true;
        for (int i = 0; i < num_names; i++) {
            const char* name = va_arg(names, const char*);
            cJSON* found_obj = get_obj(country, name);
            if (!found_obj) {
                keep = false;
                cJSON_Delete(new_country); // free unused.
                break;
            }
            // append found_obj
            cJSON_AddItemToObject(new_country, name, cJSON_Duplicate(found_obj, 1));
        }

        // just copy over the name and individual arrays.
        // just refind the names?
        // build the json as we go.
        if (keep) {
            cJSON_AddItemToArray(processed, new_country);
        }

        // Reset the va_list for the next iteration
        va_end(names);
        va_start(names, num_names);
    }

    va_end(names);
    return processed;
}

cJSON* generate_all_intermediaries(void)
{
    CSV* fruit_consumption_csv = parse_csv("datasets/fruit-consumption-per-capita-who.csv");
    cJSON* intermediary = general_intermediary_json(cJSON_CreateArray(), fruit_consumption_csv, "fruit_consumption", true);

    CSV* overweight_csv = parse_csv("datasets/share-of-adults-who-are-overweight.csv");
    general_intermediary_json(intermediary, overweight_csv, "overweight", false);

    CSV* cardiovascular_death = parse_csv("datasets/cardiovascular-disease-death-rates.csv");
    general_intermediary_json(intermediary, cardiovascular_death, "cardiovascular-death-rates", false);

    csv_free(fruit_consumption_csv);
    csv_free(overweight_csv);
    csv_free(cardiovascular_death);
    PL_LOG(PL_INFO, "%s", "Successfully generated all intermediary data");
    return intermediary;
}

int main(void)
{
    /* Generate intermediary JSON (data_all.json) */
    cJSON* intermediary = generate_all_intermediaries();
    write_json(intermediary, "processed_data/data_all.json");
    process_world_map("processed_data/data_all.json");

    /* Generate specific data for graphs */
    cJSON* fruit_to_obese = exist_all(intermediary, 2, "fruit_consumption", "overweight");
    write_json(fruit_to_obese, "processed_data/fruit_to_obese.json");
    return 0;
}
