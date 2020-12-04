//function map() {
(() => {
  function getCountrySlug(country) {
    return country.toLowerCase().replace(/ /g, '-')
  }
  const format = d3.format(",");
  const humanFormat = d3.format('~s');
  function tickFormat(num) {
    return humanFormat(num).replace('G', 'B');
  }

  // Adding a Drop-down for the Y-axis to access Bubble Chart
  const fieldsMapping = {
    'Population': ['Area(sq km)'],
    'GDP - per capita': ['Life expectancy at birth(years)'],
    'Unemployment rate(%)': ['Labor force'],
    'Electricity - production(kWh)': ['Electricity - consumption(kWh)']
  }
  const defaultTopics = [
    {
      topic: "Population",
      colorFn: d3
        .scaleThreshold()
        .domain([0, 10000000, 50000000, 100000000, 250000000, 5000000000])
        .range(d3.schemeYlGnBu[7]),
      densities: ["0", "10M", "50M", "100M", "250M", ">250M"],
    },
    {
      topic: "GDP - per capita",
      colorFn: d3
        .scaleThreshold()
        .domain([0, 2000, 5000, 10000, 20000, 35000, 50000, 100000])
        .range(d3.schemeYlOrRd[9]),
      densities: [
        "0",
        "$2,000",
        "$5,000",
        "$10,000",
        "$20,000",
        "$35,000",
        "$50,000",
        ">$50,000",
      ],
    },
    {
      topic: "Unemployment rate(%)",
      colorFn: d3
        .scaleThreshold()
        .domain([0, 1, 5, 10, 15, 20, 50, 100])
        .range(d3.schemeYlGn[9]),
      densities: ["0%", "1%", "5%", "10%", "15%", "20%", "50%", ">50%"],
    },
    {
      topic: "Electricity - production(kWh)",
      colorFn: d3
        .scaleThreshold()
        .domain([
          0,
          100000000,
          10000000000,
          50000000000,
          100000000000,
          1000000000000,
          5000000000000,
        ])
        .range(d3.schemeOranges[8]),
      densities: ["0", "0.1B", "10B", "50B", "100B", "1000B", ">1000B"],
    },
  ];


  let continent = "All",
    topic = "Population",
    yAxisParam = 'Area(sq km)';

  function setYAxisLabelDropdown() {
    var fields = fieldsMapping[topic];
    d3.select('#mapping-selector').html('');
    if (fields) {
        var options = d3.select('#mapping-selector').selectAll('option')
            .data(fields)
            .enter()
            .append('option');
        options.text(function (d) {
            return d;
        }).attr('value', function(d) {
            return d;
        })
    }
  }

  let topicColor = defaultTopics.find((t) => t.topic === topic).colorFn;
  let topicDensity = defaultTopics.find((t) => t.topic === topic).densities;
  const densityLineWidth = 500;
  const margin = { top: 0, right: 0, bottom: 40, left: 0 };
  const width = 750 - margin.left - margin.right;
  const height = 500 - margin.top - margin.bottom;

  const svg = d3
    .select(".world-map")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .style("background", "grey")
    .append("g")
    .attr("class", "map");

  const tip = d3
    .tip()
    .attr("class", "d3-tip")
    .offset([100, 50])
    .html(
      (d) =>
        `<strong>Country: </strong><span class='details'>${
          d.country
        }<br></span><strong>${
          d.topic
        }: </strong><span class='details'>${parseFloat(
          d.value
        ).toLocaleString()}</span>`
    );

  //div tooltip - Vandana
  var div = d3.select("body").append("div")
      .attr("class", "tooltip")
      .style("opacity", 0);


  const projection = d3
    .geoMercator()
    .scale(100)
    .translate([width / 2.2, height / 1.5]);

  const path = d3.geoPath().projection(projection);
  let countriesIncContinent = {};

  svg.call(tip);
  d3.json("../data/world.json").then((world, err) => {
    d3.csv("../data/factbook.csv").then((facts, err) => {
      // const topics = Object.keys(facts[0]);
      //console.log(continent + topic);
      setYAxisLabelDropdown();
      const topics = defaultTopics.map((dt) => dt.topic);
      const continents = [
        ...new Set(
          world.features.map((country) => country.properties.continent)
        ),
      ];


      //get countries in continent
      continents.forEach((c) => {
        countriesIncContinent[c] = world.features
          .filter((country) => country.properties.continent === c)
          .map((country) => country.properties.name);
      });

      const continent_selector = document.getElementById("continent-selector");
      const topic_selector = document.getElementById("topic-selector");
      const mapping_selector = document.getElementById('mapping-selector');

      let innerStr = "<option value='All' selected>All</option>";

      continents.forEach((c) => {
        innerStr += `<option value="${c}" ${
          c === continent ? "selected" : ""
        }>${c}</option>`;
      });
      continent_selector.innerHTML = innerStr;

      innerStr = "";

      topics.forEach((t) => {
        innerStr += `<option value="${t}" ${
          t === topic ? "selected" : ""
        }>${t}</option>`;
      });
      topic_selector.innerHTML = innerStr;

      continent_selector.addEventListener("change", function (e) {
        continent = e.target.value;
        updateWorldmap();
        barcharthigh();
        barchartlow();
        bubble_chart();
      });

      topic_selector.addEventListener("change", function (e) {
        topic = e.target.value;
        //console.log(topic);
        topicColor = defaultTopics.find((t) => t.topic === topic).colorFn;
        topicDensity = defaultTopics.find((t) => t.topic === topic).densities;

        setYAxisLabelDropdown();
        if (fieldsMapping[topic]) {
            yAxisParam = fieldsMapping[topic][0];
        }
        updateWorldmap();
        barcharthigh();
        barchartlow();
        bubble_chart();
      });

      mapping_selector.addEventListener('change', function(e) {
        yAxisParam = e.target.value;
        bubble_chart();
      })

      updateWorldmap();

      function updateWorldmap() {
        svg.selectAll("*").remove();
        svg
          .append("text")
          .style("font-size",17)
          .style("font-weight", "bold")
          .style("fill", "black")
          .attr("x", 20)
          .attr("y", 20)
          .text(topic + ' (2005)');
        const densityG = svg
          .append("g")
          .attr("class", "density-line")
          .attr(
            "transform",
            `translate(${(width - densityLineWidth) / 2}, ${height - 40})`
          );

        //topicDensity
        let rectWidth = Math.floor(densityLineWidth / topicDensity.length);
        const densityX = d3
          .scaleBand()
          .domain(topicDensity)
          .range([0, densityLineWidth]);
        const densityXAxis = densityG.append("g").call(d3.axisBottom(densityX));
        densityXAxis.selectAll("text").attr("dx", -densityX.bandwidth() / 2);
        densityXAxis.selectAll("line").remove();
        densityXAxis.selectAll(".domain").remove();
        const zone = densityG
          .selectAll("zone")
          .data(topicDensity.slice(0, -1))
          .enter()
          .append("g")
          .attr("class", ".zone");
        zone
          .append("rect")
          .attr("x", (_, i) => i * rectWidth)
          .attr("y", 20)
          .attr("width", rectWidth)
          .attr("height", 15)
          .style("fill", (_, i) => topicColor(topicColor.domain()[i]))
          .on("mouseover", function (d, i) {
            const ranges = [topicColor.domain()[i], topicColor.domain()[i + 1]];
            countryMap.selectAll(".country").each(function (d) {
              if (d) {
                if (continent !== "All") {
                  if (countriesIncContinent[continent].includes(d.country)) {
                    if (
                      ranges[0] <= parseFloat(d[topic]) &&
                      parseFloat(d[topic]) <= ranges[1]
                    ) {
                      d3.select(this)
                        .style("stroke", "white")
                        .style("stroke-width", 2)
                        .style("opacity", 1);
                    }
                  }
                } else {
                  if (
                    ranges[0] <= parseFloat(d[topic]) &&
                    parseFloat(d[topic]) <= ranges[1]
                  ) {
                    d3.select(this)
                      .style("stroke", "white")
                      .style("stroke-width", 2)
                      .style("opacity", 1);
                  }
                }
              }
            });
          })
          .on("mouseout", function (d, i) {
            countryMap
              .selectAll(".country")
              .style("opacity", 1)
              .style("stroke-width", 0.3)
              .style("stroke", "white");
          });

        const countryMap = svg.append("g").attr("class", "country-map");
        svg.call(d3.zoom().transform, d3.zoomIdentity);

        svg.call(
          d3.zoom().on("zoom", function () {
            countryMap.attr("transform", d3.event.transform);
          })
        );

        countryMap
          .append("g")
          .attr("class", "countries")
          .selectAll("path")
          .data(world.features)
          .enter()
          .append("path")
          .attr("class", "country")
          .attr("d", path)
          .style("fill", (d) => {
            let countryInfo;
            if (continent === "All") {
              countryInfo = facts.filter(
                (fact) => fact.Country === d.properties.name
              )[0];
            } else {
              countryInfo = facts.filter(
                (fact) =>
                  d.properties.continent === continent &&
                  fact.Country === d.properties.name
              )[0];
            }
            if (countryInfo) {
              d["country"] = d.properties.name;
              d["Population"] = countryInfo["Population"];
              d["GDP - per capita"] = countryInfo["GDP - per capita"];
              d["Unemployment rate(%)"] = countryInfo["Unemployment rate(%)"];
              d["Electricity - production(kWh)"] =
                countryInfo["Electricity - production(kWh)"];
            }
            return countryInfo ? topicColor(countryInfo[topic]) : "grey";
          })
          .on("mouseover", function (d) {
            const tipData = {
              country: d.properties.name_long,
              topic: topic,
              value: d ? d[topic] : null,
            };
            if (d && continent === "All") {
              tip.show(tipData, this);
              d3.select(this).style("opacity", 1).style("stroke-width", 3);
            }
            if (
              d &&
              countriesIncContinent[continent] &&
              countriesIncContinent[continent].includes(d.country)
            ) {
              tip.show(tipData, this);
              d3.select(this).style("opacity", 1).style("stroke-width", 3);
            }
          })
          .on("mouseout", function () {
            tip.hide();
            d3.select(this).style("opacity", 1).style("stroke-width", 0.3);
          })
          .style("stroke", "white")
          .style("opacity", 1)
          .style("stroke-width", 0.6);
      }

      //*********SVG1 - BarChart for Top 10 Highest Countries - Vandana**********
      const widthhigh = 500;
      const heighthigh = 250;
      //d3.select('svg1').remove();
      const svghigh = d3
            .select(".barcharthigh")      
            .append("svg")
            .attr("width", widthhigh)
            .attr("height", heighthigh)
            .style("background", "white")
            ;
      barcharthigh();
      //Barchart - Vandana
      function barcharthigh(){
        svghigh.select("g").remove();

        //console.log(continent);
        //console.log(topic);
                
        const titleText = 'Bar Chart of Top 10 Countries - ' + topic;//GDP - per capita';
        const xAxisLabelText = topic;//'GDP - per capita';
        //console.log(titleText);
        //console.log(xAxisLabelText);        
        
        const renderhigh = data => {
          
          const xValue = d => d[topic];//'GDP - per capita'];
          const yValue = d => d.Country;
          //const xValue = d => d.Country;//'GDP - per capita'];
          //const yValue = d => d[topic];
          const marginhigh = { top: 50, right: 40, bottom: 50, left: 100 };
          const innerWidthhigh = widthhigh - marginhigh.left - marginhigh.right;
          const innerHeighthigh = heighthigh - marginhigh.top - marginhigh.bottom;
          
          maxValuehigh = Math.max(...data.map((f) => f[topic]));
          //console.log(maxValuehigh);
          const xScale = d3.scaleLinear()
            //.domain([0, 60000])
            .domain([0, maxValuehigh])
            .range([0, innerWidthhigh ]);
          //console.log(xScale.domain());            
            
          const yScale = d3.scaleBand()
            .domain(data.map(yValue))
            .range([0, innerHeighthigh])
            .padding(0.1);
            
          const g = svghigh.append('g')
            .attr('transform', `translate(${marginhigh.left},${marginhigh.top})`);
            
          const xAxisTickFormat = number =>
            d3.format('.2s')(number)
              .replace('G', 'B');
            
          const xAxis = d3.axisBottom(xScale)
            .tickFormat(xAxisTickFormat)
            .tickSize(-innerHeighthigh);
            
          g.append('g')
            .call(d3.axisLeft(yScale))
            .selectAll('.domain, .tick line')
              .remove();
            
          const xAxisG = g.append('g').call(xAxis)
            .attr('transform', `translate(0,${innerHeighthigh})`);
            
          xAxisG.select('.domain').remove();
            
          xAxisG.append('text')
              .attr('class', 'axis-label')
              .attr('y', 30)
              .attr('x', innerWidthhigh / 2)
              .attr('fill', 'black')
              .text(xAxisLabelText);
            
          
          g.selectAll('rect').data(data)
              .enter().append('rect')
                .attr('y', d => yScale(yValue(d)))
                .attr('width', d => xScale(xValue(0)))
                .attr('height', yScale.bandwidth()/1.5)
          
                //Amination for Bar      
          g.selectAll("rect")
              .transition()
              .duration(800)
              .attr("y", d => yScale(yValue(d)))
              .attr("width", d => xScale(xValue(d)))
              .delay(function(d,i){console.log(i) ; return(i*100)})

          g.append('text')
              .attr('class', 'title')
              .attr('y', -10)
              .text(titleText);

          g.selectAll('rect')
                .on('mouseover',mouseoverbarcharthigh)
                .on('mouseout',mouseoutbarcharthigh);
          
          function mouseoverbarcharthigh (d,i) {
            //console.log(d['Country']);
            d3.select(this).transition()
                  .duration('50')
                  .style("opacity", ".85")
                  .style("fill","red")
                  .attr('height', yScale.bandwidth());
            d3.select("svg")
                  .append("g")                  
                  .selectAll("path")
                  .data(world.features)
                  .enter()
                  .append("path")
                  .attr("d", path)                  
                  .style("fill", function(f){
                    if(f.properties.name === d["Country"]){
                      //console.log(topic);
                      return "red";
                    }else{
                      return "grey";
                    }                 
                  })
                  .style("stroke", "white")
                  .style("opacity", 0.85)
                  .style("stroke-width", 1);
                div.transition()
                    .duration(50)
                    .style("opacity", 1);
                div.html("<b>Country: </b>"+ d["Country"] +"<br/>"+"<b>"+topic+ ":</b>" +d[topic])
                  .style("left", (d3.event.pageX) + "px")
                  .style("top", (d3.event.pageY-28) + "px");
                  
          }
          function mouseoutbarcharthigh (d,i) {
            //console.log(d['Country']);
            
            d3.select(this).transition()
                  .duration('50')
                  .style("opacity", 0.9)
                  .style("fill","black")
                  .attr('height', yScale.bandwidth()/1.5);
            d3.select("svg")
                  .append("g")                  
                  .selectAll("path")
                  .data(world.features)
                  .enter()
                  .append("path")
                  .attr("d", path)                  
                  .style("fill", "Grey");
            div.transition()
                  .duration(50)
                  .style("opacity", 0);                       
            
          }
          
        };
        //Get Countries of the selected continent - Vandana        
        var CountriesofContinenthigh = world.features.map(function(d){
          //console.log(d.properties.continent);
          if(continent === "All"){
            //console.log(d.properties.name);
            return d.properties.name;            
          }else if(continent === d.properties.continent){
            //console.log(d.properties.name)
            return d.properties.name;
          }
        });
        //console.log(CountriesofContinenthigh);

        var countriesdatahigh = [];
        CountriesofContinenthigh.forEach(function(d){
          if(d !== undefined){
            //console.log(d);
            facts.filter(function(e) {
              //console.log(e);
              if(e['Country'] == d){
                //console.log(d + '=' + e['Country']);               
                countriesdatahigh.push(e);
                //console.log(d3.max(e[topic]));                                
              }//end of if country === d              
            });// end of facts filter            
          }//end of if(d != null)          
        });//end of foreach
        //console.log(countriesdata1);
        var SortedDatahigh = [];
        SortedDatahigh = countriesdatahigh        
        //.sort(function(a,b) {return d3.descending(+a['GDP - per capita'], +b['GDP - per capita']);}).slice(0,10);//top 10 filtering
        .sort(function(a,b) {return d3.descending(+a[topic], +b[topic]);}).slice(0,10);//top 10 filtering
        //console.log(SortedDatahigh.sort());
        renderhigh(SortedDatahigh);       
                
      }//end of barchart function
      d3.selectAll(".barcharthigh").empty();

      /*SVG2 - BarChart for Top 10 Lowest Countries Vandana */
      
      const widthlow = 500;
      const heightlow = 250;
      //d3.select('svg1').remove();
      const svglow = d3
            .select(".barchartlow")      
            .append("svg")
            .attr("width", widthlow)
            .attr("height", heightlow)
            .style("background", "white")
            ;
      barchartlow();
      //Barchart - Vandana
      function barchartlow(){
        svglow.select("g").remove();

        //console.log(continent);
        //console.log(topic);
                
        const titleText = 'Bar Chart of Bottom 10 Countries - ' + topic;//GDP - per capita';
        const xAxisLabelText = topic;//'GDP - per capita';
        //console.log(titleText);
        //console.log(xAxisLabelText);        
        
        const renderlow = data => {
          
          const xValue = d => d[topic];//'GDP - per capita'];
          const yValue = d => d.Country;
          //const xValue = d => d.Country;//'GDP - per capita'];
          //const yValue = d => d[topic];
          const marginlow = { top: 50, right: 40, bottom: 50, left: 100 };
          const innerWidthlow = widthlow - marginlow.left - marginlow.right;
          const innerHeightlow = heightlow - marginlow.top - marginlow.bottom;
          
          maxValuelow = Math.max(...data.map((f) => f[topic]));
          //console.log(maxValuelow);
          const xScale = d3.scaleLinear()
            //.domain([0, 60000])
            .domain([0, maxValuelow])
            .range([0, innerWidthlow ]);
          //console.log(xScale.domain());            
            
          const yScale = d3.scaleBand()
            .domain(data.map(yValue))
            .range([0, innerHeightlow])
            .padding(0.1);           
            
          const g = svglow.append('g')
            .attr('transform', `translate(${marginlow.left},${marginlow.top})`);
            
          const xAxisTickFormat = number =>
            d3.format('.2s')(number)
              .replace('G', 'B');
            
          const xAxis = d3.axisBottom(xScale)
            .tickFormat(xAxisTickFormat)
            .tickSize(-innerHeightlow);
            
          g.append('g')
            .call(d3.axisLeft(yScale))
            .selectAll('.domain, .tick line')
              .remove();
            
          const xAxisG = g.append('g').call(xAxis)
            .attr('transform', `translate(0,${innerHeightlow})`);
            
          xAxisG.select('.domain').remove();
            
          xAxisG.append('text')
              .attr('class', 'axis-label')
              .attr('y', 30)
              .attr('x', innerWidthlow / 2)
              .attr('fill', 'black')
              .text(xAxisLabelText)
              ;
            
          g.selectAll('rect').data(data)
            .enter().append('rect')
              .attr('y', d => yScale(yValue(d)))
              .attr('width', d => xScale(xValue(0)))
              .attr('height', yScale.bandwidth()/1.5)
              
          g.selectAll("rect")
            .transition()
            .duration(800)
            .attr("y", d => yScale(yValue(d)))
            .attr("width", d => xScale(xValue(d)))
            .delay(function(d,i){console.log(i) ; return(i*100)})
          
          g.append('text')
              .attr('class', 'title')
              .attr('y', -10)
              .text(titleText);

          g.selectAll('rect')
                .on('mouseover',mouseoverbarchartlow)
                .on('mouseout',mouseoutbarchartlow);
          
          function mouseoverbarchartlow (d,i) {
            //console.log(d['Country']);
            d3.select(this).transition()
                  .duration('50')
                  .style("opacity", ".8")                  
                  .style("fill", "Red")
                  .attr('height', yScale.bandwidth());
            d3.select("svg")
                  .append("g")                  
                  .selectAll("path")
                  .data(world.features)
                  .enter()
                  .append("path")
                  .attr("d", path)                  
                  .style("fill", function(f){
                    if(f.properties.name === d["Country"]){
                      console.log(topic);
                      return "red";
                    }else{
                      return "grey";
                    }                 
                  })
                  .style("stroke", "white")
                  .style("opacity", 0.8)
                  .style("stroke-width", 1);
                div.transition()
                    .duration(50)
                    .style("opacity", .9);
                div.html("<b>Country: </b>"+ d["Country"] +"<br/>"+"<b>"+topic+ ":</b>" +d[topic])
                  .style("left", (d3.event.pageX) + "px")
                  .style("top", (d3.event.pageY-28) + "px");
                  
          }
          function mouseoutbarchartlow (d,i) {
            //console.log(d['Country']);
            d3.select(this).transition()
                  .duration('50')
                  .style("opacity", 0.9)
                  .style("fill","black")
                  .attr('height', yScale.bandwidth()/1.5);
            d3.select("svg")
                  .append("g")                  
                  .selectAll("path")
                  .data(world.features)
                  .enter()
                  .append("path")
                  .attr("d", path)                  
                  .style("fill", "Grey");
            div.transition()
                  .duration(50)
                  .style("opacity", 0);                     
            
          }
          
        };
        //Get Countries of the selected continent - Vandana        
        var CountriesofContinentlow = world.features.map(function(d){
          //console.log(d.properties.continent);
          if(continent === "All"){
            //console.log(d.properties.name);
            return d.properties.name;            
          }else if(continent === d.properties.continent){
            //console.log(d.properties.name)
            return d.properties.name;
          }
        });
        //console.log(CountriesofContinentlow);

        var countriesdatalow = [];
        CountriesofContinentlow.forEach(function(d){
          if(d !== undefined){
            //console.log(d);
            facts.filter(function(e) {
              //console.log(e);
              if(e['Country'] == d){
                //console.log(d + '=' + e['Country']);               
                countriesdatalow.push(e);
                //console.log(d3.max(e[topic]));                                
              }//end of if country === d              
            });// end of facts filter            
          }//end of if(d != null)          
        });//end of foreach
        //console.log(countriesdata1);
        var SortedDatalow = [];
        SortedDatalow = countriesdatalow        
        //.sort(function(a,b) {return d3.descending(+a['GDP - per capita'], +b['GDP - per capita']);}).slice(0,10);//top 10 filtering
        .sort(function(a,b) {return d3.ascending(+a[topic], +b[topic]);}).slice(0,10);//top 10 filtering
        //console.log(SortedDatalow.sort());
        renderlow(SortedDatalow);
        
                
      }//end of barchart function
      d3.selectAll(".barchartlow").empty();


      ///Bubble Chart Implementation////

      const width_bubble = 600;
      const height_bubble = 420;

      //d3.select('svg1').remove();
      const svg_bubble = d3
            .select("#bubble-chart-container")
            .append("svg")
            .attr("width", width_bubble)
            .attr("height", height_bubble)
            .style("background", "white")
            ;

    // -1- Create a tooltip div that is hidden by default:
    var tooltip = d3.select("body")
      .append("div")
        .style("opacity", 0.3)
        .attr("class", "tooltip")
        .style("background-color", "darkgray")
        .style("border-radius", "8px")
        .style("padding", "20px")
        .style("color", "black")
    bubble_chart();

      function bubble_chart(){
        d3.select("#bubble-chart-container").html('');

        console.log("Inside bubble chart");
        console.log(continent);
        console.log(topic);

        const titleText = 'Bubble Chart across Countries - ' + topic;//GDP - per capita';
        const xAxisLabelText = topic;

        // set the dimensions and margins of the graph
        var margin = {top: 40, right: 150, bottom: 60, left: 80},
            width = 600 - margin.left - margin.right,
            height = 420 - margin.top - margin.bottom;

        // append the svg object to the body of the page
        var svg = d3.select("#bubble-chart-container")
          .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
          .append("g")
            .attr("transform",
                  "translate(" + margin.left + "," + margin.top + ")");

        //Read the data
        var selectedContinentCountries = countriesIncContinent[continent];
        data = facts.filter(function(row) {
            return (continent === 'All') || (selectedContinentCountries.indexOf(row.Country) > -1)
        });
        console.log("Data")
        console.log(data);
        svg_bubble.select("g").remove();


        var CountriesofContinentbubble = world.features.map(function(d){
          //console.log(d.properties.continent);
          if(continent === "All"){
            //console.log(d.properties.name);
            return d.properties.name;
          }else if(continent === d.properties.continent){
            //console.log(d.properties.name)
            return d.properties.name;
          }
        });

        var countriesdatabubble = [];
        CountriesofContinentbubble.forEach(function(d){
          if(d !== undefined){
            //console.log(d);
            facts.filter(function(e) {
              //console.log(e);
              if(e['Country'] == d){
                //console.log(d + '=' + e['Country']);
                countriesdatabubble.push(e);
                //console.log(d3.max(e[topic]));
              }//end of if country === d
            });// end of facts filter
          }//end of if(d != null)
        });//end of foreach
        //console.log(countriesdata1);

        var SortedDatabubble = [];
        SortedDatabubble = countriesdatabubble
        .sort(function(a,b) {return d3.descending(+a[topic], +b[topic]);});//.slice(0,15);//top 10 filtering

        const xValue = d => d[topic];
        const yValue = d => d[yAxisParam];

        console.log(xValue);

        // Add X axis
        var xDomain = [
            d3.min(facts, function(d) { return parseFloat(d[topic])}),
            d3.max(facts, function(d) { return parseFloat(d[topic])})
        ]
        var yDomain = [
            d3.min(facts, function(d) { return parseFloat(d[yAxisParam])}),
            d3.max(facts, function(d) { return parseFloat(d[yAxisParam])})
        ]

        console.log(yDomain)

        var x = d3.scaleLinear()
          .domain(xDomain)
          .range([ 0, width]);
        svg.append("g")
          .attr("transform", "translate(0," + height + ")")
          .call(d3.axisBottom(x).ticks(3).tickFormat(tickFormat));

        // Add X axis label:
        svg.append("text")
            .attr("text-anchor", "start")
            .attr("x", width / 2)
            .attr("y", height + 40)
            .text(topic)
            .style("font", "14px times");

        // Add Y axis
        var y = d3.scaleLinear()
          .domain(yDomain)
          .range([height, 0]);
        svg.append("g")
          .call(d3.axisLeft(y).tickFormat(tickFormat));

        // Add Y axis label:
        svg.append("text")
          .attr("transform", "rotate(-90)")
          .attr("text-anchor", "end")
          .attr("x", 0 - (height / 2))
          .attr("y", 0 - 50)
          .text(yAxisParam)
          .style("font", "14px times")
          .attr("text-anchor", "middle");

        // Add a scale for bubble size
        var z = d3.scaleSqrt()
          .domain(xDomain)
          .range([ 2, 30]);



        // -2- Create 3 functions to show / update (when mouse move but stay on same circle) / hide the tooltip
        var showTooltip = function(d) {
          highlight(d);
          tooltip
            .transition()
            .duration(200)
          var tooltipText = 'Country: ' + d['Country'] + '<br>';
          tooltipText += topic + ': ' + d[topic] + '<br>';
          tooltipText += yAxisParam + ': ' + d[yAxisParam] + '<br>' + '<br>';

          tooltip
            .style("opacity", 1)
            .html(tooltipText)
            .style("left", (d3.event.pageX + 10) + "px")
            .style("top", (d3.event.pageY + 10) + "px")
        }
        var moveTooltip = function(d) {
          tooltip
            .style("left", (d3.event.pageX + 10) + "px")
            .style("top", (d3.event.pageY + 10) + "px")
        }
        var hideTooltip = function(d) {
          noHighlight(d);
          tooltip
            .transition()
            .duration(200)
            .style("opacity", 0)
        }

        // ---------------------------//
        //       HIGHLIGHT GROUP      //
        // ---------------------------//

        // What to do when one group is hovered
        var highlight = function(d){
          // reduce opacity of all groups
          d3.selectAll(".bubbles").style("opacity", 0.15)
          // expect the one that is hovered
          d3.selectAll("."+getCountrySlug(d.Country)).style("opacity", 0.9).style('fill', '#ffa500');
        }

        // And when it is not hovered anymore
        var noHighlight = function(d){
          d3.selectAll(".bubbles").style("opacity", 0.3).style('fill', 'indigo');
        }

          svg.selectAll('circle').data(data)
              .enter().append('circle')
               .attr("cx", function(d) {
                   return x(xValue(d));
               })
                .attr('class', function(d) {
                    return getCountrySlug(d.Country);
                })
               .attr("cy", function(d) { return y(yValue(d)); })
               .attr("r", function(d) { return z(z(d)); });

          svg.append('text')
              .attr("text-anchor", "start")
              .attr('class', 'title')
              .attr('y', -20)
              .text(titleText);


        // Add the Bubbles to the chart
        svg.append('g')
          .selectAll("dot")
          .data(SortedDatabubble)
          .enter()
          .append("circle")
            .attr("class", function(d) { return "bubbles " + getCountrySlug(d.Country) })
            .attr("cx", function (d) {
                return x(xValue(d));
            } )
            .attr("cy", function (d) { return y(yValue(d)); } )
            .attr("r", function (d) { return z(xValue(d)); } )
            .style("fill", "indigo")
            .style("opacity", "0.7")
            .attr("stroke", "black")
            .attr("stroke-width", "0.2")
            //.style("fill", function (d) { return myColor(d['Population']); } )
          // -3- Trigger the functions for hover
          .on("mouseover", showTooltip )
          .on("mousemove", moveTooltip )
          .on("mouseleave", hideTooltip )


      }//end of bubblechart function
      d3.selectAll(".bubblechart").empty();

      });//end of d3 csv
  });//end of d3 json
})();

