window.onload = startRadar;

// Function to parse query parameters from URL
function getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

function startRadar() {
    let country = getParameterByName('country') || 'Australia';
    let data_file_path = '../data_processing/processed_data/radar.json';
    d3.json(data_file_path)
        .then(data => {
            generateCheckboxes(data, country);
            updateChart();
        })
        .catch(error => {
            console.error('Error loading JSON data:', error);
        });
}

function draw(data) {
    var margin = { top: 0, right: 100, bottom: 100, left: 100 },
        width = Math.min(700, window.innerWidth - 10) - margin.left - margin.right,
        height = Math.min(width, window.innerHeight - margin.top - margin.bottom - 20);
    
    var width, height = 750;
    height = 650;

    var radarChartOptions = {
        w: width,
        h: height,
        margin: margin,
        levels: 3,
        roundStrokes: true,
    };

    RadarChart(".radarChart", data, radarChartOptions);
}

function generateCheckboxes(data, country) {
    var checkboxContainer = document.getElementById('checkboxContainer');
    console.log(checkboxContainer);
    checkboxContainer.innerHTML = '';
    data.forEach((d, i) => {
        let innerCheckboxContainer = document.createElement('div');
        var checkbox = document.createElement('input');

        checkbox.addEventListener('change', (event) => {
          if (event.currentTarget.checked) {
            var checkboxes = document.querySelectorAll('.checkbox');
            var selectedCountries = [];
            checkboxes.forEach((checkbox) => {
                if (checkbox.checked) {
                    selectedCountries.push(checkbox.value);
                }
            });
            if (selectedCountries.length > 3) {
                checkbox.checked = false;
                alert('too many countries selected');
            } else {
                updateChart();
            }
          }
        else
            updateChart();
        })

        checkbox.type = 'checkbox';
        checkbox.id = 'checkbox' + i;
        checkbox.value = d.name;
        // Set 'checked' attribute to true only for Australia
        checkbox.checked = (d.name === country);
        checkbox.className = 'checkbox';
        var label = document.createElement('label');
        label.htmlFor = 'checkbox' + i;
        label.appendChild(document.createTextNode(d.name));

        innerCheckboxContainer.appendChild(checkbox);
        innerCheckboxContainer.appendChild(label);
        checkboxContainer.appendChild(innerCheckboxContainer);
    });
}

function updateChart() {
    var checkboxes = document.querySelectorAll('.checkbox');
    var selectedCountries = [];
    checkboxes.forEach((checkbox) => {
        if (checkbox.checked) {
            selectedCountries.push(checkbox.value);
        }
    });

    let data_file_path = '../data_processing/processed_data/radar.json';
    d3.json(data_file_path).then(data => {
        const filteredData = data.filter(d => selectedCountries.includes(d.name));
        draw(filteredData);
    });
}

function updateLegend(data) { // Accept color as a parameter
    var legendDiv = d3.select(".legend");
    legendDiv.selectAll("*").remove();
    data.forEach((d, i) => {
        legendDiv.append("div")
            .text(d.name)
            .style("color", cfg.color(i))
            .attr("class", "legend");
    });
}

function RadarChart(id, data, options) {
    var cfg = {
        w: 600,
        h: 600,
        margin: { top: 20, right: 20, bottom: 20, left: 20 },
        levels: 3,
        maxValue: 1,
        labelFactor: 1.25,
        wrapWidth: 60,
        opacityArea: 0.35,
        dotRadius: 4,
        opacityCircles: 0.1,
        strokeWidth: 2,
        roundStrokes: false,
        color: d3.scaleOrdinal(d3.schemeCategory10)
    };

    if ('undefined' !== typeof options) {
        for (var i in options) {
            if ('undefined' !== typeof options[i]) { cfg[i] = options[i]; }
        }
    }

    var maxValue = 1;

    var allAxis = (data[0].data.map(function(i){ return i.axis; })), 
        total = allAxis.length, 
        radius = Math.min(cfg.w / 2, cfg.h / 2),
        angleSlice = Math.PI * 2 / total; 

    var rScale = d3.scaleLinear()
        .range([0, radius])
        .domain([0, maxValue]);

    d3.select(id).select("svg").remove();
    d3.select(".legend-svg").remove();

    var svg = d3.select(id).append("svg")
        .attr("width", cfg.w + cfg.margin.left + cfg.margin.right)
        .attr("height", cfg.h + cfg.margin.top + cfg.margin.bottom)
        .attr("class", "radar" + id);

    var g = svg.append("g")
        .attr("transform", "translate(" + (cfg.w / 2 + cfg.margin.left) + "," + (cfg.h / 2 + cfg.margin.top) + ")");

    var axisGrid = g.append("g").attr("class", "axisWrapper");

    axisGrid.selectAll(".levels")
        .data(d3.range(1, (cfg.levels + 1)).reverse())
        .enter()
        .append("circle")
        .attr("class", "gridCircle")
        .attr("r", function (d) { return radius / cfg.levels * d; })
        .style("fill", "#CDCDCD")
        .style("stroke", "#CDCDCD")
        .style("fill-opacity", cfg.opacityCircles)
        .style("filter", "url(#glow)");

    var axis = axisGrid.selectAll(".axis")
        .data(allAxis)
        .enter()
        .append("g")
        .attr("class", "axis");

    axis.append("line")
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", function (d, i) { return rScale(maxValue * 1.1) * Math.cos(angleSlice * i - Math.PI / 2); })
        .attr("y2", function (d, i) { return rScale(maxValue * 1.1) * Math.sin(angleSlice * i - Math.PI / 2); })
        .attr("class", "line")
        .style("stroke", "#999999")
        .style("stroke-width", "2px");

    axis.append("text")
        .attr("class", "legend")
        .style("font-size", "11px")
        .attr("text-anchor", "middle")
        .attr("dy", "0.35em")
        .attr("x", function (d, i) { return rScale(maxValue * cfg.labelFactor) * Math.cos(angleSlice * i - Math.PI / 2); })
        .attr("y", function (d, i) { return rScale(maxValue * cfg.labelFactor) * Math.sin(angleSlice * i - Math.PI / 2); })
        .text(function (d) { console.log(d); return d; })

    var radarLine = d3.radialLine()
        .curve(d3.curveLinearClosed)
        .radius(function (d) { return rScale((d.value - d.min) / (d.max - d.min)); })
        .angle(function (d, i) { return i * angleSlice; });

    if (cfg.roundStrokes) {
        radarLine.curve(d3.curveCardinalClosed);
    }

    var blobWrapper = g.selectAll(".radarWrapper")
        .data(data.map((d, i) => ({ ...d, index: i })))
        .enter().append("g")
        .attr("class", "radarWrapper");

    blobWrapper.append("path")
        .attr("class", "radarArea")
        .attr("d", function (d) { return radarLine(d.data); })
        .style("fill", function (d, i) { return cfg.color(i); })
        .style("fill-opacity", cfg.opacityArea)
        .on('mouseover', function (event, d) {
            d3.selectAll(".radarArea")
                .transition().duration(200)
                .style("fill-opacity", 0.1);

            d3.select(this)
                .transition().duration(200)
                .style("fill-opacity", 0.7);
        })
        .on('mouseout', function () {
            d3.selectAll(".radarArea")
                .transition().duration(200)
                .style("fill-opacity", cfg.opacityArea);
        });

    blobWrapper.append("path")
        .attr("class", "radarStroke")
        .attr("d", function (d) { return radarLine(d.data); })
        .style("stroke-width", cfg.strokeWidth + "px")
        .style("stroke", function (d, i) { return cfg.color(i); })
        .style("fill", "none")
        .style("filter", "url(#glow)");

    blobWrapper.selectAll(".radarCircle")
        .data(function(d) { return d.data; })
        .enter().append("circle")
        .attr("class", "radarCircle")
        .attr("r", cfg.dotRadius)
        .attr("cx", function(d, i) { 
            return rScale((d.value - d.min) / (d.max - d.min)) * Math.cos(angleSlice * i - Math.PI / 2); 
        })
        .attr("cy", function(d, i) { 
            return rScale((d.value - d.min) / (d.max - d.min)) * Math.sin(angleSlice * i - Math.PI / 2); 
        })
        .style("fill", function(d, i) { 
            var parentIndex = d3.select(this.parentNode).datum().index;
            console.log(parentIndex);  // Log the parent index to debug
            return cfg.color(parentIndex); 
        })
        .style("fill-opacity", 0.8);

        var blobCircleWrapper = g.selectAll(".radarCircleWrapper")
            .data(data)
            .enter().append("g")
            .attr("class", "radarCircleWrapper");

        blobCircleWrapper.selectAll(".radarInvisibleCircle")
            .data(function (d) { return d.data; })
            .enter().append("circle")
            .attr("class", "radarInvisibleCircle")
            .attr("r", cfg.dotRadius * 1.5)
            .attr("cx", function (d, i) { return rScale((d.value - d.min) / (d.max - d.min)) * Math.cos(angleSlice * i - Math.PI / 2); })
            .attr("cy", function (d, i) { return rScale((d.value - d.min) / (d.max - d.min)) * Math.sin(angleSlice * i - Math.PI / 2); })
            .style("fill", "none")
            .style("pointer-events", "all")
            .on("mouseover", function (event, d) {
                const units = {
                    "Fruit Consumption": "kg/year",
                    "Overweight/Obese": "% population",
                    "Cardiovascular Incidences": "% population",
                    "Vegetable Consumption": "kg/year",
                    "Diabetes Prevalance": "% population"
                };
                const unit = units[d.axis] || '';
                const value = `${d.value} ${unit}`;
                tooltip
                    .attr("x", this.cx.baseVal.value)
                    .attr("y", this.cy.baseVal.value - 10)
                    .text(value)
                    .transition().duration(200)
                    .style("opacity", 1);
            })
            .on("mouseout", function () {
                tooltip.transition().duration(200)
                    .style("opacity", 0);
            });

    var tooltip = g.append("text")
        .attr("class", "tooltip")
        .style("opacity", 0);

    var legendSvg = d3.select(".legend")
        .append("svg")
        .attr("class", "legend-svg")
        .attr("width", 200) // Adjust width as needed
        .attr("height", data.length * 20); // Adjust height based on the number of legend items

    let center = 60;

    // Add legend circles
    legendSvg.selectAll("circle.legend-circle")
        .data(data)
        .enter()
        .append("circle")
        .attr("class", "legend-circle")
        .attr("cx", 10 + center) // Adjust circle position as needed
        .attr("cy", function (d, i) { return i * 20 + 10; }) // Adjust circle position as needed
        .attr("r", 6)
        .style("fill", function (d, i) { return cfg.color(i); });

    // Add legend labels
    legendSvg.selectAll("text.legend-label")
        .data(data)
        .enter()
        .append("text")
        .attr("class", "legend-label")
        .attr("x", 25 + center) // Adjust label position as needed
        .attr("y", function (d, i) { return i * 20 + 15; }) // Adjust label position as needed
        .text(function (d) { return d.name; });
}
