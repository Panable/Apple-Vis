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

    d3.json("countries-110m.json").then(data => {
        console.log(data.objects.countries);
        const countries = topojson.feature(data, data.objects.countries);

        g.selectAll('path').data(countries.features).enter().append('path').attr('class', 'country').attr('d',path);
    });
}

