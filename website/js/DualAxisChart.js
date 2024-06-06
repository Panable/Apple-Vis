window.onload = startChart;

function getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

function startChart() {
    let country = getParameterByName('country') || 'Afghanistan';
    let data_file_path = '../data_processing/processed_data/data_complete.json';
    d3.json(data_file_path).then(data => {
        generateRadioButtons(data, country);
        generateLegend();
        drawChart(data, country);
    }).catch(error => {
        console.error('Error loading JSON data:', error);
    });
}

function generateRadioButtons(data, selectedCountry) {
    var radioContainer = document.getElementById('radioContainer');
    radioContainer.innerHTML = '';
    data.forEach((d, i) => {
        let innerRadioContainer = document.createElement('div');
        var radio = document.createElement('input');

        radio.addEventListener('change', (event) => {
            if (event.currentTarget.checked) {
                updateChart(data, event.currentTarget.value);
            }
        });

        radio.type = 'radio';
        radio.id = 'radio' + i;
        radio.name = 'country';
        radio.value = d.name;
        radio.checked = (d.name === selectedCountry);
        radio.className = 'radio';
        var label = document.createElement('label');
        label.htmlFor = 'radio' + i;
        label.appendChild(document.createTextNode(d.name));

        innerRadioContainer.appendChild(radio);
        innerRadioContainer.appendChild(label);
        radioContainer.appendChild(innerRadioContainer);
    });
}

function generateLegend() {
    var legendContainer = document.getElementById('legendContainer');
    legendContainer.innerHTML = '';

    const legendData = [
        { name: 'Fruit Consumption', color: 'steelblue' },
        { name: 'Cardiovascular Incidences', color: 'red' }
    ];

    legendData.forEach((d, i) => {
        let legendItem = document.createElement('div');
        let colorBox = document.createElement('span');
        colorBox.style.display = 'inline-block';
        colorBox.style.width = '10px';
        colorBox.style.height = '10px';
        colorBox.style.backgroundColor = d.color;
        colorBox.style.marginRight = '5px';
        legendItem.appendChild(colorBox);

        let text = document.createTextNode(d.name);
        legendItem.appendChild(text);

        legendContainer.appendChild(legendItem);
    });
}

function drawChart(data, selectedCountry) {
    const svg = d3.select("svg"),
        margin = { top: 20, right: 80, bottom: 70, left: 60 },
        width = +svg.attr("width") - margin.left - margin.right,
        height = +svg.attr("height") - margin.top - margin.bottom;

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    g.append("g")
        .attr("class", "axis axis--x")
        .attr("transform", `translate(0,${height})`);

    g.append("g")
        .attr("class", "axis axis--y");

    g.append("g")
        .attr("class", "axis axis--y1")
        .attr("transform", `translate(${width},0)`);

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

    updateChart(data, selectedCountry);
}

function updateChart(data, selectedCountry) {
    const svg = d3.select("svg"),
        margin = { top: 20, right: 80, bottom: 70, left: 60 },
        width = +svg.attr("width") - margin.left - margin.right,
        height = +svg.attr("height") - margin.top - margin.bottom,
        g = svg.select("g");

    const x = d3.scaleBand().rangeRound([0, width]).padding(0.1),
        y0 = d3.scaleLinear().rangeRound([height, 0]),
        y1 = d3.scaleLinear().rangeRound([height, 0]);

    const countryData = data.find(d => d.name === selectedCountry);
    const fruitConsumption = countryData.fruit_consumption.map(v => ({ ...v, country: countryData.name }));
    const cardiovascularIncidences = countryData.cardiovascular_incidences.map(v => ({ ...v, country: countryData.name }));

    const startYear = d3.max([d3.min(fruitConsumption, d => d.year), d3.min(cardiovascularIncidences, d => d.year)]);
    const endYear = d3.min([d3.max(fruitConsumption, d => d.year), d3.max(cardiovascularIncidences, d => d.year)]);

    const filteredFruitConsumption = fruitConsumption.filter(d => d.year >= startYear && d.year <= endYear);
    const filteredCardiovascularIncidences = cardiovascularIncidences.filter(d => d.year >= startYear && d.year <= endYear);

    x.domain(filteredFruitConsumption.map(d => d.year));
    y0.domain([0, 500]).nice();
    y1.domain([0, 1.6]).nice();

    let color_pallete = ['#ffffcc','#ffeda0','#fed976','#feb24c','#fd8d3c','#fc4e2a','#e31a1c','#bd0026','#800026'];
    let color = d3.scaleQuantize().range(color_pallete);
    color.domain([1, 500]);

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

    const bars = g.selectAll(".bar")
        .data(filteredFruitConsumption, d => d.year);

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

    bars.exit().remove();

    const line = d3.line()
        .x(d => x(d.year) + x.bandwidth() / 2)
        .y(d => y1(d.value));

    const path = g.selectAll(".line")
        .data([filteredCardiovascularIncidences]);

    path.enter().append("path")
        .attr("class", "line")
        .attr("stroke", "#00805A")
        .attr("stroke-width", 2)
        .attr("fill", "none")
        .merge(path)
        .transition()
        .duration(1000)
        .attr("d", line);

    path.exit().remove();
}

