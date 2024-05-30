const MAX_COUNTRIES = 5; // Maximum number of countries to select

let data_file_path = '../data_processing/processed_data/fruit_to_obese.json';

d3.json(data_file_path).then(data => { // Read data from JSON file
    const countries = data.map(d => d.name); // Extract country names

    // Initialize select2 dropdown
    $('#countrySelect').select2({      
        data: countries, 
        maximumSelectionLength: MAX_COUNTRIES,
        placeholder: 'Select up to 5 countries',
        allowClear: true // Allow user to clear selection
    });

    // Plot button click event
    d3.select('#plotButton').on('click', () => {
        const selectedCountries = $('#countrySelect').val(); // Get selected countries
        if (selectedCountries.length === MAX_COUNTRIES) { // Check if exactly 5 countries are selected
            plotStackedBarChart(selectedCountries, data); // Plot stacked bar chart
        } else {
            alert('Please select exactly 5 countries.');
        }
    });
});

function plotStackedBarChart(selectedCountries, data) { // Plot stacked bar chart
    const filteredData = data.filter(d => selectedCountries.includes(d.name)); // Filter data based on selected countries

    const formattedData = filteredData.map(d => ({ // Format data for stacked bar chart
        Country: d.name,
        'Fruit Consumption (%)': d.fruit_consumption[d.fruit_consumption.length - 1].value / 5, // Fruit consumption percentage
        'Overweight or Obese (%)': d.overweight[d.overweight.length - 1].value
    }));

    // Clear any previous chart
    d3.select('#chart').html('');

    const margin = { top: 40, right: 180, bottom: 60, left: 100 }, // Chart margins
        width = 960 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom;

    const svg = d3.select('#chart').append('svg') // Create SVG element
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)  
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`); 

    const x = d3.scaleLinear() // Define x and y scales
        .domain([0, d3.max(formattedData, d => d['Fruit Consumption (%)'] + d['Overweight or Obese (%)'])]) // Add fruit consumption and overweight or obese percentages
        .range([0, width]);

    const y = d3.scaleBand()
        .domain(formattedData.map(d => d.Country)) // Add country names
        .range([0, height])
        .padding(0.2);

    // Define color scale for the bars
    const color = d3.scaleOrdinal()
        .domain(['Fruit Consumption (%)', 'Overweight or Obese (%)']) // Add fruit consumption and overweight or obese percentages
        .range(['#ff9999', '#66b3ff']);

    // Add bars
    svg.append('g')
        .selectAll('g')
        .data(d3.stack().keys(['Fruit Consumption (%)', 'Overweight or Obese (%)'])(formattedData)) // Add fruit consumption and overweight or obese percentages
        .enter().append('g')
        .attr('fill', d => color(d.key)) 
        .selectAll('rect')
        .data(d => d)
        .enter().append('rect')
        .attr('y', d => y(d.data.Country))
        .attr('x', d => x(d[0]))
        .attr('width', d => x(d[1]) - x(d[0]))
        .attr('height', y.bandwidth())
        .on('mouseover', function(event, d) {
            const key = d3.select(this.parentNode).datum().key; // Get key (fruit consumption or overweight or obese)
            const value = (d[1] - d[0]).toFixed(1); // Get value
            const text = key === 'Fruit Consumption (%)' ? 'Fruit Consumption: ' : 'Overweight or Obese: '; 
            tooltip.transition().duration(200).style('opacity', 0.9); // Show tooltip
            tooltip.html(`${text}${value}%`)
                .style('left', (event.pageX + 5) + 'px')
                .style('top', (event.pageY - 28) + 'px');
        })
        .on('mouseout', function(d) {
            tooltip.transition().duration(500).style('opacity', 0); 
        });

    // Add the tooltip container to the vis container
    const tooltip = d3.select('body').append('div')
        .attr('class', 'tooltip')
        .style('opacity', 0);

    // Add X axis
    svg.append('g')
        .attr('class', 'x-axis')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(x).ticks(5).tickFormat(d => d + '%')) 
        .selectAll("text")
        .style("font-size", "12px");

    // Add Y axis
    svg.append('g')
        .attr('class', 'y-axis')
        .call(d3.axisLeft(y))
        .selectAll("text")
        .style("font-size", "12px");

    // Add X axis label
    svg.append('text')
        .attr('x', width / 2)
        .attr('y', height + margin.bottom - 20) // Move the label down
        .attr('text-anchor', 'middle')
        .style('font-size', '14px')
        .style('font-weight', 'bold')
        .text('Percentage');

    // Add chart title
    svg.append('text')
        .attr('x', width / 2) // Center the title
        .attr('y', -margin.top / 2) // Move the title up
        .attr('text-anchor', 'middle')
        .style('font-size', '16px')
        .style('font-weight', 'bold')
        .text('Fruit Consumption and Overweight or Obese Percentage by Country');

    // Add legend
    const legend = svg.append('g')
        .attr('transform', `translate(${width + 30}, 0)`);

    legend.append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', 18)
        .attr('height', 18)
        .style('fill', '#ff9999');
    
    legend.append('text')
        .attr('x', 24)
        .attr('y', 9)
        .attr('dy', '.35em')
        .style('font-size', '12px')
        .text('Fruit Consumption (%)');

    legend.append('rect')
        .attr('x', 0)
        .attr('y', 20)
        .attr('width', 18)
        .attr('height', 18)
        .style('fill', '#66b3ff');
    
    legend.append('text')
        .attr('x', 24)
        .attr('y', 29)
        .attr('dy', '.35em')
        .style('font-size', '12px')
        .text('Overweight or Obese (%)');
}
