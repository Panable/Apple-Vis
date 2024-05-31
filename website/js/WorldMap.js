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


let color_pallete = ['#ffffcc','#ffeda0','#fed976','#feb24c','#fd8d3c','#fc4e2a','#e31a1c','#bd0026','#800026'];
let color = d3.scaleQuantize()
              .range(color_pallete);

    d3.json("../data_processing/processed_data/world_map.json").then(data => {
        const countries = topojson.feature(data, data.objects.countries);
        color.domain([
            1, 500
            ]);

        g.selectAll('path').data(countries.features).enter().append('path').attr('class', 'country').attr('d',path)
            .style("fill", function (d) {
                let value = d.properties.fruit_consumption;
                if (value) {
                    return color(value[value.length - 1].value);
                 } else {
                    return "#ccc";
                 }
            });
    });
}

