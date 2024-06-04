// Initializes all elements and draws the graph
function init() {
    const width = 1200; // Reduced width
    const height = 800; // Reduced height
    const svg = d3.select('#charts').append('svg').attr('width', width).attr('height', height);

    // Define the clip path
    svg.append('defs').append('clipPath')
        .attr('id', 'clip')
        .append('rect')
        .attr('width', width)
        .attr('height', height - 220); // Adjusted height to clip out Antarctica

    const projection = d3.geoMercator().scale(150).translate([(width / 2) - 20, (height / 1.5) - 180]); // Adjusted scale and translation
    const path = d3.geoPath(projection);

    const g = svg.append('g').attr('clip-path', 'url(#clip)'); // Apply the clip path to the group element

    let color_pallete = ['#ffffcc','#ffeda0','#fed976','#feb24c','#fd8d3c','#fc4e2a','#e31a1c','#bd0026','#800026'];
    let color = d3.scaleQuantize().range(color_pallete);

    d3.json("../data_processing/processed_data/world_map.json").then(data => {
        const countries = topojson.feature(data, data.objects.countries);
        color.domain([1, 500]);

        g.selectAll('path').data(countries.features).enter().append('path').attr('class', 'country').attr('d',path)
            .style("fill", function (d) {
                let value = d.properties.fruit_consumption;
                if (value) {
                    return color(value[value.length - 1].value);
                } else {
                    return "#ccc";
                }
            });

        // Add legend
        const legend = svg.append('g')
            .attr('class', 'legend')
            .attr('transform', 'translate(20, 20)');

        const legendWidth = 300; // Increased width for the legend
        const legendHeight = 20;
        const numNotches = 10;
        const notchWidth = legendWidth / numNotches;
        const notchY = height - 200;

        const handleLegendMouseOver = (d, i) => {
            // Change the fill color and border width of all paths
            g.selectAll('path')
                .style('fill', function (d) {
                    let value = d.properties.fruit_consumption;
                    if (value && color(value[value.length-1].value) == color(i * (500 / (numNotches)))) {
                        console.log(color(value[value.length-1].value) == color(i * (500 / (numNotches))));
                        return color(i * (500 / (numNotches))); // Set the fill color to the same as the notch color
                    } else {
                        return '#ccc'; // Make other paths gray
                    }
                })
                .style('stroke-width', function (d) {
                    let value = d.properties.fruit_consumption;
                    if (value && value[value.length - 1].value >= i * (500 / (numNotches)) && value[value.length - 1].value < (i + 1) * 100) {
                        return 2; // Increase border width for highlighted countries
                    } else {
                        return 0.5; // Set default border width
                    }
                });
        };

        const handleLegendMouseOut = () => {
            // Restore the fill color and border width of all paths
            g.selectAll('path')
                .style('fill', function (d) {
                    let value = d.properties.fruit_consumption;
                    if (value) {
                        return color(value[value.length - 1].value);
                    } else {
                        return "#ccc";
                    }
                })
                .style('stroke-width', 0.5); // Restore default border width
        };


        legend.selectAll('rect')
            .data(d3.range(0, numNotches))
            .enter()
            .append('rect')
            .attr('x', (d, i) => i * notchWidth)
            .attr('y', notchY)
            .attr('width', notchWidth)
            .attr('height', legendHeight)
            .style('fill', (d, i) => color(i * (500 / (numNotches))))
            .style('stroke', 'black') // Add border around each notch
            .style('stroke-width', 1) // Border width
            .on('mouseover', handleLegendMouseOver)
            .on('mouseout', handleLegendMouseOut);

        legend.selectAll('text')
            .data(d3.range(0, numNotches + 1)) // Add labels for each notch
            .enter()
            .append('text')
            .attr('x', (d, i) => i * notchWidth)
            .attr('y', notchY - legendHeight + 10)
            .text((d, i) => i * (500 / (numNotches)));

        // Add legend title
        legend.append('text')
            .attr('x', legendWidth / 2)
            .attr('y', notchY - 40)
            .attr('text-anchor', 'middle')
            .text('Legend');
    });
}

// Call the init function when window loads
window.onload = init;
