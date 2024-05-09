window.onload = init;

//initializes all elements and draws the graph
function init()
{
    const width = 900;
    const height = 600;
    const svg = d3.select('#charts').append('svg').attr('width', width).attr('height', height);

    const projection = d3.geoMercator().scale(140).translate([width / 2, height / 1.4]);
    const path = d3.geoPath(projection);

    const g = svg.append('g');

    let color_pallete = [
        "#edf8fb",
        "#b3cde3",
        "#8c96c6",
        "#8856a7",
        "#810f7c",
    ];

let color = d3.scaleQuantize()
              .range(color_pallete);

    d3.json("modified_countries.json").then(data => {
        console.log(data.objects.countries);
        const countries = topojson.feature(data, data.objects.countries);
        color.domain([
            0, 100
            ]);

        g.selectAll('path').data(countries.features).enter().append('path').attr('class', 'country').attr('d',path)
            .style("fill", function (d) {
                let value = d.properties.percentage;
                if (value) {
                    return color(value);
                 } else {
                    return "#ccc";
                 }
            });
    });
}

