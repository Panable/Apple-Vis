// Initializes all elements and draws the graph
function init() {
    const width = 1000; // Reduced width
    const height = 600; // Reduced height
    const svg = d3.select('#charts').append('svg').attr('width', width).attr('height', height);

    // Define the clip path
    svg.append('defs').append('clipPath')
        .attr('id', 'clip')
        .append('rect')
        .attr('width', width)
        .attr('height', height - 0); // Adjusted height to clip out Antarctica

    const projection = d3.geoMercator().scale(145).translate([(width / 2) - 20, (height / 1.5) + 25]); // Adjusted scale and translation
    const path = d3.geoPath(projection);

    const g = svg.append('g'); // Apply the clip path to the group element

    let color_pallete = ['#ffffcc','#ffeda0','#fed976','#feb24c','#fd8d3c','#fc4e2a','#e31a1c','#bd0026','#800026'];
    let color = d3.scaleQuantize().range(color_pallete);

    const tooltip = d3.select('body').append('div')
        .attr('class', 'tooltip')
        .style('position', 'absolute')
        .style('background-color', '#2B2B2B')
        .style('border', '1px solid #cccccc')
        .style('padding', '5px')
        .style('pointer-events', 'none')
        .style('opacity', 0);

    d3.json("../data_processing/processed_data/world_map.json").then(data => {
        const countries = topojson.feature(data, data.objects.countries);
        color.domain([1, 500]);

        g.selectAll('path').data(countries.features).enter().append('path').attr('class', 'country').attr('d', path)
            .style("fill", function (d) {
                let value = d.properties.fruit_consumption;
                if (value) {
                    return color(value[value.length - 1].value);
                } else {
                    return "#ccc";
                }
            })
            .on('mouseover', function(event, d) {
                d3.select(this).style('cursor', 'pointer'); // Change cursor style
                let value = d.properties.fruit_consumption ? d.properties.fruit_consumption[d.properties.fruit_consumption.length - 1].value : 'No data';
                tooltip.transition().style('opacity', 0.9);
                tooltip.html(`<strong>${d.properties.name}</strong><br>Fruit Consumption: ${value}`)
                    .style('left', `${event.pageX + 10}px`)
                    .style('top', `${event.pageY - 20}px`);
            })
            .on('mousemove', function(event) {
                tooltip.style('left', `${event.pageX + 10}px`)
                    .style('top', `${event.pageY - 20}px`);
            })
            .on('mouseout', function() {
                tooltip.transition().style('opacity', 0);
            })
            .on('click', function(event, d) {
                window.location.href = `RadarChart.html?country=${d.properties.name}`;
            });


        const handleLegendMouseOver = (d, i) => {
            // Change the fill color and border width of all paths
            g.selectAll('path')
                .style('fill', function (d) {
                    let value = d.properties.fruit_consumption;
                    if (value && color(value[value.length-1].value) == color(i * (500 / (numNotches)))) {
                        return color(i * (500 / (numNotches))); // Set the fill color to the same as the notch color
                    } else {
                        return '#ccc'; // Make other paths gray
                    }
                })
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
        };
        // Add legend

    const legendWidth = width - 100; // Increased width for the legend
    const legendHeight = 20;
    const numNotches = 10;
    const notchWidth = legendWidth / numNotches;
    const notchY = height - 200;

// Add legend
    const legendSvg = d3.select(".legend")
        .append("svg")
        .attr("class", "legend-svg")
        .attr("width", width) // Adjust width as needed
        .attr("height", 100); // Adjust height based on the number of legend items

    const legend = legendSvg.append('g')
        .attr('class', 'legend')
        .attr('transform', 'translate(50, 70)');


legend.selectAll('rect')
    .data(d3.range(0, numNotches))
    .enter()
    .append('rect')
    .attr('x', (d, i) => i * notchWidth)
    .attr('y', 0) // Adjust the y position as needed
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
    .attr('y', -5) // Adjust the y position as needed
    .text((d, i) => i * (500 / (numNotches)).toString()+"kg");

// Add legend title
legend.append('text')
    .attr('x', legendWidth / 2)
    .attr('y', -35) // Adjust the y position as needed
    .attr('text-anchor', 'middle')
    .style('font-family', 'Roboto') // Set font family to Roboto
    .style('font-size', '20px') // Set font size to 20px
    .text('Legend');
    });

    // Add zoom functionality
    const zoom = d3.zoom()
        .scaleExtent([1, 8]) // Set the zoom scale limits
        .translateExtent([[0, 0], [width, height]]) // Set the translation extent
        .on('zoom', zoomed);

    svg.call(zoom);

    function zoomed(event) {
        g.attr('transform', event.transform);
    }

    // Function to reset zoom
    function resetZoom() {
        console.log("RESETTING");
        svg.transition().duration(750).call(
            zoom.transform,
            d3.zoomIdentity // Reset to the initial zoom state
        );
    }

    // Attach resetZoom function to a button
    d3.select("#reset").append("button")
        .text("Reset Zoom")
        .on("click", resetZoom);
}

window.onload = init;
