window.onload = init;

//initializes all elements and draws the graph
function init()
{
    const width = 1800;
    const height = 1200;
    const svg = d3.select('#charts').append('svg').attr('width', width).attr('height', height);
     // Define the clip path
        svg.append('defs').append('clipPath')
            .attr('id', 'clip')
            .append('rect')
            .attr('width', width)
            .attr('height', height - 320); // Adjust height to clip out Antarctica

    const projection = d3.geoMercator().scale(200).translate([(width / 2) - 20, (height / 1.5) - 200]);
    const path = d3.geoPath(projection);

    const g = svg.append('g').attr('clip-path', 'url(#clip)'); // Apply the clip path to the group element

    let color_pallete = [
        "#003f5c",
        "#2f4b7c",
        "#665191",
        "#a05195",
        "#d45087",
        "#f95d6a",
        "#ff7c43",
        "#ffa600",
    ];
let color = d3.scaleQuantize()
              .range(color_pallete);

    d3.json("modified_countries3.json").then(data => {
        console.log(data.objects.countries);
        const countries = topojson.feature(data, data.objects.countries);
        color.domain([
            10, 150
            ]);

        g.selectAll('path').data(countries.features).enter().append('path').attr('class', 'country').attr('d',path)
            .style("fill", function (d) {
                console.log(d.properties.name);
                let value = d.properties.fruit_consumption;
                if (value) {
                    if (d.properties.name == "Mongolia") {
                        console.log(d.properties.fruit_consumption);
                        console.log(color(value[value.length - 1].value));
                    }
                    return color(value[value.length - 1].value);
                 } else {
                    return "#ccc";
                 }
            });
    });
}

