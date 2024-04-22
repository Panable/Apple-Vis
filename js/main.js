window.onload = init;

//initializes all elements and draws the graph
function init()
{
    let dataset = [14,  5, 26, 23,  9, 
                    1,  2,  3,  4,  5, 
                    6,  7,  8,  9, 10, 
                   11, 12, 13, 14, 15,
                   16, 17, 18, 19, 20, 
                   21, 22, 23, 24, 25,
                   26, 27, 28, 29, 30];

    let w = 500;
    let h = 200;

    let svg = create_canvas(w, h);
    init_buttons(svg, dataset, w, h);
    gen_placeholders(svg, dataset);
    draw(svg, dataset, w, h);
}

function bind_random_dataset(dataset, svg, h)
{
    let y_scale = d3.scaleLinear()
                  .domain([            //domain of linear function (x values) what are the numbers to scale with
                      d3.min(dataset), //minumum y of dataset
                      d3.max(dataset)  //maximum y of dataset
                  ])
                  .rangeRound([10, h]);
    let new_number = Math.floor(Math.random() * 30);
    dataset.push(new_number);
    let bars = svg.selectAll("rect").data(dataset); //binds the new data to the svg
    bars.enter().append("rect").attr("x", 500).attr("y", (d) => h-y_scale(d)).merge(bars)
        .on("mouseover", function() {
            d3.select(this).attr("fill", "orange");
            let x_pos = parseFloat(d3.select(this).attr("x"));
            let y_pos = parseFloat(d3.select(this).attr("y"));
            svg.append("text")
                .attr("id", "tooltip")
                .attr("x", x_pos)
                .attr("y", y_pos + 10)
                .attr("font-size", "0.8em")
                .text(d3.select(this).datum());
        })
        .on("mouseout", function() { 
        d3.select("#tooltip").remove();
        d3.select(this).attr("fill", (d) => setColor(d, dataset))
});
}

let removing = false;
//initializes the button functionality
function init_buttons(svg, dataset, w, h)
{

    let x_scale = d3.scaleBand()                      // (ordinal scaling)
                    .domain(d3.range(dataset.length)) // generates an array from 0 - dataset.length and sets it as our ordinal scale to those values
                    .rangeRound([0,w])                // sets the range of our scale to be from 0 to the width of our canvas
                    .paddingInner(0.05);              // add padding between the bars
    d3.select("#sort")
      .on("click", function() {
                let delay = d3.select("#delay").property("value");
                let duration = d3.select("#duration").property("value");
                let easeFunction = eval(d3.select("#transitions").property("value"));
                svg.selectAll("rect")
                   .sort((a, b) => d3.ascending(a, b))
                   .transition()
                   .duration(duration)
                   .delay( (_, i) => i / dataset.length * delay) //normalize delay
                   .ease(easeFunction)                                   //set ease function
                   .attr("x", (_, i) => x_scale(i) );
      });
    d3.select("#sortDesc")
      .on("click", function() {
                let delay = d3.select("#delay").property("value");
                let duration = d3.select("#duration").property("value");
                let easeFunction = eval(d3.select("#transitions").property("value"));
                svg.selectAll("rect")
                   .sort((a, b) => d3.descending(a, b))
                   .transition()
                   .duration(duration)
                   .delay( (_, i) => i / dataset.length * delay) //normalize delay
                   .ease(easeFunction)                                   //set ease function
                   .attr("x", (_, i) => x_scale(i) );
      });
    d3.select("#redraw")
      .on("click", function() {
                let delay = d3.select("#delay").property("value");
                let duration = d3.select("#duration").property("value");
                let easeFunction = eval(d3.select("#transitions").property("value"));
                
                draw_with_transition(svg, dataset, w, h, delay, duration, easeFunction); //draws the new data
      });
    d3.select("#remove")
      .on("click", function() {
          if (removing) return;
          removing = true;
          dataset.shift();
          let bars = svg.selectAll("rect").data(dataset); //binds the new data to the svg
          
        bars.exit()
            .transition()
            .duration(500)
            .attr("x", w)
            .remove()
            .on("end", function() {
                let delay = d3.select("#delay").property("value");
                let duration = d3.select("#duration").property("value");
                let easeFunction = eval(d3.select("#transitions").property("value"));
                
                draw_with_transition(svg, dataset, w, h, delay, duration, easeFunction); //draws the new data
                removing = false;
            });
      });
    //run custom transition
    d3.select("#custom")
      .on("click", function() {
          bind_random_dataset(dataset, svg, h);

          let delay = d3.select("#delay").property("value");
          let duration = d3.select("#duration").property("value");
          let easeFunction = eval(d3.select("#transitions").property("value"));

          draw_with_transition(svg, dataset, w, h, delay, duration, easeFunction); //draws the new data
      });

    d3.select("#trans1")
      .on("click", function() {
          bind_random_dataset(dataset, svg, h);

          let delay = 1000;
          let duration = 1000;
          let easeFunction = d3.easeCubicInOut;

          draw_with_transition(svg, dataset, w, h, delay, duration, easeFunction); //draws the new data
      });

    d3.select("#trans2")
      .on("click", function() {
          bind_random_dataset(dataset, svg, h);

          let delay = 1000;
          let duration = 1000;
          let easeFunction = d3.easeElasticOut;

          draw_with_transition(svg, dataset, w, h, delay, duration, easeFunction); //draws the new data
      });
}

//creates an svg canvas and returns it
function create_canvas()
{
    //canvas size
    let w = 500;
    let h = 200;

    //define svg canvas
    return svg = d3.select("#charts")  // in #charts
                .append("svg")         //add the svg
                .attr("width", w)      //set width attribute
                .attr("height", h);    //set height attribute
}

//generates placeholder elements and binds data to svg
function gen_placeholders(svg, dataset)
{
    svg.selectAll("rect") //select all rect elements
        .data(dataset)    //bind data
        .enter()          //generate placeholder for data
        .append("rect");  //adds a rect element to each data element
}


//draws (elements need to exit already)
function draw(svg, dataset, w, h) {

    let x_scale = d3.scaleBand()                      // (ordinal scaling)
                    .domain(d3.range(dataset.length)) // generates an array from 0 - dataset.length and sets it as our ordinal scale to those values
                    .rangeRound([0,w])                // sets the range of our scale to be from 0 to the width of our canvas
                    .paddingInner(0.05);              // add padding between the bars


    let y_scale = d3.scaleLinear()
                  .domain([            //domain of linear function (x values) what are the numbers to scale with
                      d3.min(dataset), //minumum y of dataset
                      d3.max(dataset)  //maximum y of dataset
                  ])
                  .rangeRound([10, h]);


    svg.selectAll("rect")
        .attr("x", (_, i) => i * x_scale.step())    // x_scale.step() returns distance between points (padding included)
        .attr("y", (d) => h - y_scale(d))           // y value needs to start at the top
        .attr("width", x_scale.bandwidth())         // sets the width of the band as determined by x_scale
        .attr("height", (d) => y_scale(d))          // set height based on calculated y_scale
        .attr("fill", (d) => setColor(d, dataset)) //set color based on data
        .on("mouseover", function() {
            d3.select(this).attr("fill", "orange");
            let x_pos = parseFloat(d3.select(this).attr("x"));
            let y_pos = parseFloat(d3.select(this).attr("y"));
            svg.append("text")
                .attr("id", "tooltip")
                .attr("x", x_pos)
                .attr("y", y_pos + 10)
                .attr("font-size", "0.8em")
                .text(d3.select(this).datum());
        })
        .on("mouseout", function() { 
        d3.select("#tooltip").remove();
        d3.select(this).attr("fill", (d) => setColor(d, dataset))
});

}

function draw_with_transition(svg, dataset, w, h, duration, delay, ease) {
    console.log(dataset.length);
    let x_scale = d3.scaleBand()                      // (ordinal scaling)
                    .domain(d3.range(dataset.length)) // generates an array from 0 - dataset.length and sets it as our ordinal scale to those values
                    .rangeRound([0,w])                // sets the range of our scale to be from 0 to the width of our canvas
                    .paddingInner(0.05);              // add padding between the bars


    let y_scale = d3.scaleLinear()
                  .domain([            //domain of linear function (x values) what are the numbers to scale with
                      d3.min(dataset), //minumum y of dataset
                      d3.max(dataset)  //maximum y of dataset
                  ])
                  .rangeRound([10, h]);

    svg.selectAll("rect")
        .transition()
        .duration(duration)
        .delay( (_, i) => i / dataset.length * delay) //normalize delay
        .ease(ease)                                   //set ease function
        .attr("x", (_, i) => i * x_scale.step())      // x_scale.step() returns distance between points (padding included)
        .attr("y", (d) => h - y_scale(d))             // y value needs to start at the top
        .attr("width", x_scale.bandwidth())           // sets the width of the band as determined by x_scale
        .attr("height", (d) => y_scale(d))            // set height based on calculated y_scale
        .attr("fill", (d) => setColor(d, dataset));   //set color based on data
}

//returns color based on data in dataset
function setColor(data, dataset)
{
    //https://www.learnui.design/tools/data-color-picker.html

    //easier to store as hex instead of rgb.
    let color_palette = [
        [0, 63, 92],
        [47, 75, 124],
        [102, 81, 145],
        [160, 81, 149],
        [212, 80, 135],
        [249, 93, 106],
        [255, 124, 67],
        [255, 166, 0]
    ];

    //I am not sure of a better way to do this

    //gets the minimum and maximum value of the array

    //use plus here to convert the column into a number?
    //Without the + operator, d[columnName] would be treated as a string, 
    let min = d3.min(dataset);
    let max = d3.max(dataset);

    let val = data;


    //https://d3js.org/d3-scale/linear
    //d3.ScaleLinear maps an input domain to an output domain using linear transformation

    //different scaling functions - https://d3js.org/d3-scale

    //preserves proportional differences

    //using it here to convert the data value to an accurate array index

    let color_palette_index_calc = d3.scaleLinear([min, max], [0, color_palette.length - 1]); //mapping function

    let color_palette_index = Math.round(color_palette_index_calc(val)); // calculating the index

    let element = color_palette[color_palette_index]; //indexing into the element

    //cleanliness
    let r = element[0];
    let g = element[1];
    let b = element[2];

    return `rgb(${r}, ${g}, ${b})`;
}
