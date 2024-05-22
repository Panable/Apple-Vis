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

void process_world_map(void)
{
    cJSON* fruit_consumption = open_json("fruit_consumption.json");
    cJSON* world_map = open_json("../countries-50m.json");

    cJSON* test = search_json(fruit_consumption, "Australia");

    cJSON* objects = get_obj(world_map, "objects");
    cJSON* countries = get_obj(objects, "countries");
    cJSON* geometries = get_obj(countries, "geometries");
    //cJSON* properties  = get_obj(geometries, "properties");
    
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
                    printf("BINDING\n");
                }
            } 
            else
            {
                printf("Name not found or not a string\n");
            }
        }
    }


    write_json(world_map, "../modified_countries3.json");

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

CSV* clean_fruit_to_obesity_rate(void)
{
    CSV* csv = parse_csv("fruit_to_obesity_rate.csv");
    // 1. Favour measured over self-reporting
    
    size_t country = get_column_index(csv, "Reference area");
    size_t measure = get_column_index(csv, "MEASURE");
    size_t method = get_column_index(csv, "Measurement method");

    for (int i = 0; i < (int)csv->num_lines; i++) {
        char* cur_country = csv->lines[i][country];
        char* cur_measure = csv->lines[i][measure];
        char* cur_method  = csv->lines[i][method];

        if (strcmp(cur_measure, "SP_OVRGHT_OBS") == 0) {
            int matching_method_index = find_matching_method(csv, cur_country, i + 1);

            // matching survey method exists!
            if (matching_method_index != -1) {
                // delete the self-reporting method.
                if (strcmp(cur_method, "Self-reporting") == 0) {
                    remove_row(csv, i);
                    i -= 1;
                    continue;
                } else if (strcmp(csv->lines[matching_method_index][method], "Self-reporting") == 0) {
                    i -= 1;
                    remove_row(csv, matching_method_index);
                    continue;
                } else {
                    fprintf(stderr, "Something went wrong here\n");
                }
                continue;
            }
        }

        bool is_fruit_consumption = strcmp(cur_measure, "SP_CFRD") == 0;
        bool is_overweight_or_obese = strcmp(cur_measure, "SP_OVRGHT_OBS") == 0;

        int matching_country_index = -1;
        if (is_fruit_consumption)
            matching_country_index = find_matching_country(csv, "SP_OVRGHT_OBS", cur_country, 0);
        else if (is_overweight_or_obese)
            matching_country_index = find_matching_country(csv, "SP_CFRD", cur_country, 0);

        if (matching_country_index == -1) {
            remove_row(csv, i);
            i -= 1;
        }
    }

    write_csv(csv, "test.csv");
    return csv;
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

cJSON* fruit_obs_to_json(CSV* csv)
{
    cJSON* countries = cJSON_CreateArray();

    size_t country = get_column_index(csv, "Reference area");
    size_t measure = get_column_index(csv, "MEASURE");
    size_t method = get_column_index(csv, "Measurement method");
    size_t value = get_column_index(csv, "OBS_VALUE");
    size_t year = get_column_index(csv, "TIME_PERIOD");

    for (size_t i = 0; i < csv->num_lines; i++) {
        char* cur_country = csv->lines[i][country];
        char* cur_measure = csv->lines[i][measure];
        char* cur_value  = csv->lines[i][value];
        char* cur_year = csv->lines[i][year];
        char* cur_method = csv->lines[i][method];
        
        // find existing country.
        cJSON* country = find_country(countries, cur_country);
        
        // not found -> create a new country
        if (!country) {
            country = cJSON_CreateObject();
            cJSON_AddStringToObject(country, "name", cur_country);
            cJSON_AddItemToArray(countries, country);
        }
        
        bool is_fruit_consumption = strcmp(cur_measure, "SP_CFRD") == 0;
        bool is_overweight_or_obese = strcmp(cur_measure, "SP_OVRGHT_OBS") == 0;
        
        if (is_fruit_consumption) {
           cJSON* fruit_consumption = cJSON_CreateObject();
           double percentage = atof(cur_value);
           double year = atof(cur_year);
           cJSON_AddNumberToObject(fruit_consumption, "percentage", percentage);
           cJSON_AddNumberToObject(fruit_consumption, "year", year);
           cJSON_AddItemToObject(country, "fruit_consumption", fruit_consumption);
        } else if (is_overweight_or_obese) {
           cJSON* overweight = cJSON_CreateObject();
           double percentage = atof(cur_value);
           double year = atof(cur_year);
           cJSON_AddNumberToObject(overweight, "percentage", percentage);
           cJSON_AddNumberToObject(overweight, "year", year);
           cJSON_AddStringToObject(overweight, "measurement_method", cur_method);
           cJSON_AddItemToObject(country, "overweight_or_obese", overweight);
        } else {
            fprintf(stderr, "Something went wrong here\n");
        }
    }


    return countries;
}

cJSON* intermediary_fruit_consumption(CSV* csv)
{
    cJSON* countries = cJSON_CreateArray();

    size_t country = get_column_index(csv, "Entity");
    size_t country_code = get_column_index(csv, "Code");
    size_t year = get_column_index(csv, "Year");
    size_t value = get_column_index(csv, "Fruit");

    for (size_t i = 0; i < csv->num_lines; i++) {

        // Values in CSV
        char* cur_country = csv->lines[i][country];
        char* cur_country_code = csv->lines[i][country_code];
        char* cur_year  = csv->lines[i][year];
        char* cur_value = csv->lines[i][value];

        cJSON* country = find_country(countries, cur_country);
        cJSON* data = NULL;
        
        // not found -> create a new country
        if (!country) {
            // Create country
            country = cJSON_CreateObject();
            cJSON_AddStringToObject(country, "name", cur_country);
            cJSON_AddItemToArray(countries, country);

            // Create data array

            data = cJSON_CreateArray();
            cJSON_AddItemToObject(country, "fruit_consumption", data);
        } else {
            data = get_obj(country, "fruit_consumption");
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
    printf("%s\n", cJSON_Print(countries));
    return countries;
}

void test_json_formatting()
{
    cJSON* json = open_json("format.json");
    printf("%s\n", cJSON_Print(json));
    printf("-----------------------------------------\n");

    assert(cJSON_IsArray(json));

    cJSON* country = NULL;
    cJSON_ArrayForEach(country, json) {
        cJSON* country_name = get_obj(country, "country_name");
        printf("%s\n", cJSON_Print(country_name));
    }
}

int main(void)
{
    CSV* fruit_consumption_csv = parse_csv("fruit-consumption-per-capita-who.csv");
    cJSON* fc = intermediary_fruit_consumption(fruit_consumption_csv);
    write_json(fc, "fruit_consumption.json");

    process_world_map();

    return 0;
    CSV* csv = clean_fruit_to_obesity_rate();
    //csv_dump(csv);
    cJSON* json = fruit_obs_to_json(csv);
    //printf("%s\n", cJSON_Print(json));
    write_json(json, "test.json");
    return 0;

    cJSON* countries = cJSON_CreateArray();
    cJSON* country = cJSON_CreateObject();

    cJSON* name = cJSON_CreateString("Australia");
    cJSON* fruit_consumption = cJSON_CreateObject();
    cJSON_AddNumberToObject(fruit_consumption, "percentage", 99.99);
    cJSON_AddNumberToObject(fruit_consumption, "year", 2003);
    cJSON* overweight_obese = cJSON_CreateObject();
    cJSON_AddNumberToObject(overweight_obese, "percentage", 69.99);
    cJSON_AddNumberToObject(overweight_obese, "year", 2033);
    cJSON_AddStringToObject(overweight_obese, "measurement_method", "Survey");

    cJSON_AddItemToObject(country, "name", name);
    cJSON_AddItemToObject(country, "fruit_consumption", fruit_consumption);
    cJSON_AddItemToObject(country, "overweight_obese", overweight_obese);

    cJSON_AddItemToArray(countries, country);

    printf("%s\n", cJSON_Print(countries));
    csv_free(csv);
    return 0;
}
