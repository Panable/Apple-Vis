// Main function to draw the initial chart
function drawChart(data, selectedCountry) {
    // Define SVG dimensions and margins
    const svg = d3.select("svg"),
        margin = { top: 20, right: 80, bottom: 70, left: 60 },
        width = +svg.attr("width") - margin.left - margin.right,
        height = +svg.attr("height") - margin.top - margin.bottom;

    // Append a group element to SVG and translate it to accommodate margins
    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    // Append x, y, and y1 axes groups
    g.append("g")
        .attr("class", "axis axis--x")
        .attr("transform", `translate(0,${height})`);

    g.append("g")
        .attr("class", "axis axis--y");

    g.append("g")
        .attr("class", "axis axis--y1")
        .attr("transform", `translate(${width},0)`);

    // Append x, y, and y1 axis labels
    g.append("text")
        .attr("class", "x-label")
        .attr("fill", "#FFF")
        .attr("y", height + 50)
        .attr("x", width / 2)
        .attr("text-anchor", "middle")
        .text("Year");

    g.append("text")
        .attr("class", "y0-label")
        .attr("fill", "#FFF")
        .attr("transform", "rotate(-90)")
        .attr("y", -50)
        .attr("x", -height / 2)
        .attr("dy", "0.71em")
        .attr("text-anchor", "middle")
        .text("Fruit Consumption");

    g.append("text")
        .attr("class", "y1-label")
        .attr("fill", "#FFF")
        .attr("transform", "rotate(-90)")
        .attr("y", width + 50)
        .attr("x", -height / 2)
        .attr("dy", "0.71em")
        .attr("text-anchor", "middle")
        .text("Cardiovascular Incidences");

    // Define and append tooltip
    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("visibility", "hidden")
        .style("background-color", "#2B2B2B")
        .style("border", "solid")
        .style("border-width", "1px")
        .style("border-radius", "5px")
        .style("padding", "10px")
        .style("pointer-events", "none");

    // Call updateChart to draw initial data
    updateChart(data, selectedCountry, tooltip);
}

// Function to update the chart with new data
function updateChart(data, selectedCountry, tooltip) {
    // Retrieve SVG, margins, and dimensions
    const svg = d3.select("svg"),
        margin = { top: 20, right: 80, bottom: 70, left: 60 },
        width = +svg.attr("width") - margin.left - margin.right,
        height = +svg.attr("height") - margin.top - margin.bottom,
        g = svg.select("g");

    // Define x, y0, and y1 scales
    const x = d3.scaleBand().rangeRound([0, width]).padding(0.1),
        y0 = d3.scaleLinear().rangeRound([height, 0]),
        y1 = d3.scaleLinear().rangeRound([height, 0]);

    // Retrieve data for the selected country
    const countryData = data.find(d => d.name === selectedCountry);
    const fruitConsumption = countryData.fruit_consumption.map(v => ({ ...v, country: countryData.name }));
    const cardiovascularIncidences = countryData.cardiovascular_incidences.map(v => ({ ...v, country: countryData.name }));

    // Calculate start and end years for the selected data
    const startYear = d3.max([d3.min(fruitConsumption, d => d.year), d3.min(cardiovascularIncidences, d => d.year)]);
    const endYear = d3.min([d3.max(fruitConsumption, d => d.year), d3.max(cardiovascularIncidences, d => d.year)]);

    // Filter data for the selected range of years
    const filteredFruitConsumption = fruitConsumption.filter(d => d.year >= startYear && d.year <= endYear);
    const filteredCardiovascularIncidences = cardiovascularIncidences.filter(d => d.year >= startYear && d.year <= endYear);

    // Set domains for x, y0, and y1 scales
    x.domain(filteredFruitConsumption.map(d => d.year));
    y0.domain([0, 500]).nice();
    y1.domain([0, 1.6]).nice();

    // Define color palette and color scale
    let color_pallete = ['#ffffcc','#ffeda0','#fed976','#feb24c','#fd8d3c','#fc4e2a','#e31a1c','#bd0026','#800026'];
    let color = d3.scaleQuantize().range(color_pallete);
    color.domain([1, 500]);

    // Update x, y, and y1 axes
    g.select(".axis--x")
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("x", -5)
        .attr("y", 10)
        .attr("dy", ".35em")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end");

    g.select(".axis--y")
        .transition().duration(1000)
        .call(d3.axisLeft(y0));

    g.select(".axis--y1")
        .transition().duration(1000)
        .call(d3.axisRight(y1));

    // Update or append bars for fruit consumption data
    const bars = g.selectAll(".bar")
        .data(filteredFruitConsumption, d => d.year);

    // Handle enter selection for bars
    bars.enter().append("rect")
        .attr("class", "bar")
        .attr("x", d => x(d.year))
        .attr("y", height)
        .attr("width", x.bandwidth())
        .attr("height", 0)
        .merge(bars)
        .transition()
        .duration(1000)
        .attr("x", d => x(d.year))
        .attr("y", d => y0(d.value))
        .attr("width", x.bandwidth())
        .attr("height", d => height - y0(d.value))
        .attr("fill", d => color(d.value));

    // Handle exit selection for bars
    bars.exit().remove();

    // Add event listeners for bars to show tooltip
    bars.on("mouseover", function(event, d) {
            tooltip.style("visibility", "visible")
                .html(`Year: ${d.year}<br>Fruit Consumption: ${d.value}`)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 15) + "px");
        })
        .on("mousemove", function(event) {
            tooltip.style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 15) + "px");
        })
        .on("mouseout", function() {
            tooltip.style("visibility", "hidden");
        });

    // Update or append line for cardiovascular incidences data
    const line = d3.line()
        .x(d => x(d.year) + x.bandwidth() / 2)
        .y(d => y1(d.value));

    const path = g.selectAll(".line")
        .data([filteredCardiovascularIncidences]);

    // Handle enter selection for line
    path.enter().append("path")
        .attr("class", "line")
        .merge(path)
        .transition()
        .duration(1000)
        .attr("d", line);

    // Handle exit selection for line
    path.exit().remove();
}
