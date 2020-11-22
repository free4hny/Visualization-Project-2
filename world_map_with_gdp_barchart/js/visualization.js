//function map() {
(() => {  
  const format = d3.format(",");
  const defaultTopics = [
    {
      topic: "Population",
      colorRange: ["rgb(0, 0, 30)", "rgb(0, 0, 255)"],
    },
    {
      topic: "GDP - per capita",
      colorRange: ["rgb(30, 0, 0)", "rgb(255, 0, 0)"],
    },
    {
      topic: "Unemployment rate(%)",
      colorRange: ["rgb(0, 30, 0)", "rgb(0, 255, 0)"],
    },
    {
      topic: "Electricity - production(kWh)",
      colorRange: ["rgb(0, 30, 30)", "rgb(0, 255, 255)"],
    },
  ];
  
  let continent = "All",
    topic = "Population",
    maxValue,
    minValue;
  
  const topicColor = d3
    .scaleLinear()
    .range(defaultTopics.find((t) => t.topic === topic).colorRange);
  
  
  const margin = { top: 0, right: 0, bottom: 0, left: 0 };
  const width = 1000 - margin.left - margin.right;
  const height = 600 - margin.top - margin.bottom;

  const svg = d3
    .select(".world-map")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .style("background", "lightgrey")
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
        }: </strong><span class='details'>${parseFloat(d.value).toLocaleString()}</span>`
    );

  const projection = d3
    .geoMercator()
    .scale(110)
    .translate([width / 2.5, height / 1.5]);

  const path = d3.geoPath().projection(projection);

  svg.call(tip);
  d3.json("../data/world.json").then((world, err) => {
    d3.csv("../data/factbook.csv").then((facts, err) => {
      // const topics = Object.keys(facts[0]);
      //console.log(continent + topic);
      const topics = defaultTopics.map((dt) => dt.topic);
      const continents = [
        ...new Set(
          world.features.map((country) => country.properties.continent)
        ),
      ];
      
      const continent_selector = document.getElementById("continent-selector");      
      const topic_selector = document.getElementById("topic-selector");
      
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
        barchart();        
      });

      topic_selector.addEventListener("change", function (e) {
        topic = e.target.value;
        //console.log(topic);
        maxValue = Math.max(...facts.map((f) => f[topic]));
        minValue = Math.min(...facts.map((f) => f[topic]));
        topicColor
          .domain([minValue, maxValue])
          .range(defaultTopics.find((t) => t.topic === topic).colorRange);
        
        updateWorldmap();        
        barchart();
      });

      maxValue = Math.max(...facts.map((f) => f[topic]));
      minValue = Math.min(...facts.map((f) => f[topic]));

      topicColor
        .domain([minValue, maxValue])
        .range(defaultTopics.find((t) => t.topic === topic).colorRange);
      
      updateWorldmap();
      
      function updateWorldmap() {
        
        svg.select(".countries").remove();
        svg
          .append("g")
          .attr("class", "countries")
          .selectAll("path")
          .data(world.features)
          .enter()
          .append("path")
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
            return countryInfo ? topicColor(countryInfo[topic]) : "grey";
          })
          .on("mouseover", function (d) {
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
            const tipData = {
              country: d.properties.name_long,
              topic: topic,
              value: countryInfo ? countryInfo[topic] : null,
            };
            countryInfo && tip.show(tipData, this);
            d3.select(this).style("opacity", 1).style("stroke-width", 2);
          })
          .on("mouseout", function () {
            tip.hide();
            d3.select(this).style("opacity", 0.8).style("stroke-width", 1);
          })
          .style("stroke", "white")
          .style("opacity", 0.8)
          .style("stroke-width", 0.3)
          ;
      }
      
      //*********SVG1 for BarChart - Vandana**********
      const width1 = 350;
      const height1 = 350;
      //d3.select('svg1').remove();
      const svg1 = d3
            .select(".barchart")      
            .append("svg")
            .attr("width", width1)
            .attr("height", height1)
            .style("background", "lightgrey")
            ;
      barchart();
      //Barchart - Vandana
      function barchart(){
        svg1.select("g").remove();

        //console.log(continent);
        //console.log(topic);
                
        const titleText = 'Bar Chart of Countries - GDP - per capita';// + topic;
        const xAxisLabelText = 'GDP - per capita';//topic;
        //console.log(titleText);
        //console.log(xAxisLabelText);        
        
        const render = data => {
          
          const xValue = d => d['GDP - per capita'];//topic];
          const yValue = d => d.Country;
          const margin1 = { top: 50, right: 40, bottom: 50, left: 100 };
          const innerWidth = width1 - margin1.left - margin1.right;
          const innerHeight = height1 - margin1.top - margin1.bottom;
            
          const xScale = d3.scaleLinear()
            .domain([0, 60000])//d3.max(data, xValue)])
            .range([0, innerWidth ]);
            
          const yScale = d3.scaleBand()
            .domain(data.map(yValue))
            .range([0, innerHeight])
            .padding(0.1);
            
            
          const g = svg1.append('g')
            .attr('transform', `translate(${margin1.left},${margin1.top})`);
            
          const xAxisTickFormat = number =>
            d3.format('.2s')(number)
              .replace('G', 'B');
            
          const xAxis = d3.axisBottom(xScale)
            .tickFormat(xAxisTickFormat)
            .tickSize(-innerHeight);
            
          g.append('g')
            .call(d3.axisLeft(yScale))
            .selectAll('.domain, .tick line')
              .remove();
            
          const xAxisG = g.append('g').call(xAxis)
            .attr('transform', `translate(0,${innerHeight})`);
            
          xAxisG.select('.domain').remove();
            
          xAxisG.append('text')
              .attr('class', 'axis-label')
              .attr('y', 30)
              .attr('x', innerWidth / 2)
              .attr('fill', 'black')
              .text(xAxisLabelText);
            
          g.selectAll('rect').data(data)
            .enter().append('rect')
              .attr('y', d => yScale(yValue(d)))
              .attr('width', d => xScale(xValue(d)))
              .attr('height', yScale.bandwidth()/2)             

          g.append('text')
              .attr('class', 'title')
              .attr('y', -10)
              .text(titleText);

          g.selectAll('rect')
                .on('mouseover',mouseoverbarchart)
                .on('mouseout',mouseoutbarchart);
          
          function mouseoverbarchart (d,i) {
            //console.log(d['Country']);
            d3.select(this).transition()
                  .duration('50')
                  .style("opacity", ".85")
                  .style("stroke","darkblue")
                  .style("stroke-width", 2);
            d3.select("svg")
                  .append("g")                  
                  .selectAll("path")
                  .data(world.features)
                  .enter()
                  .append("path")
                  .attr("d", path)                  
                  .style("fill", function(f){
                    if(f.properties.name === d["Country"]){
                      //console.log(f.properties.name);
                      return "#fd8d3c";
                    }else{
                      return "grey";
                    }                 
                  })
                  .style("stroke", "white")
                  .style("opacity", 0.8)
                  .style("stroke-width", 1);
                  
          }
          function mouseoutbarchart (d,i) {
            //console.log(d['Country']);
            d3.select(this).transition()
                  .duration('50')
                  .style("opacity", 0.5);
                  //.style("fill","red");
            d3.select("svg")
                  .append("g")                  
                  .selectAll("path")
                  .data(world.features)
                  .enter()
                  .append("path")
                  .attr("d", path)                  
                  .style("fill", "Grey");
            
          }
          
        };
        //Get Countries of the selected continent - Vandana        
        var CountriesofContinent = world.features.map(function(d){
          //console.log(d.properties.continent);
          if(continent === "All"){
            //console.log(d.properties.name);
            return d.properties.name;            
          }else if(continent === d.properties.continent){
            //console.log(d.properties.name)
            return d.properties.name;
          }
        });
        //console.log(CountriesofContinent);

        var countriesdata1 = [];
        CountriesofContinent.forEach(function(d){
          if(d !== undefined){
            //console.log(d);
            facts.filter(function(e) {
              //console.log(e);
              if(e['Country'] === d){
                //console.log(d + '=' + e['Country']);               
                countriesdata1.push(e);                                
              }//end of if country === d              
            });// end of facts filter            
          }//end of if(d != null)          
        });//end of foreach
        //console.log(countriesdata1);
        var SortedData1 = countriesdata1      	
        .sort(function(a,b) {return d3.descending(+a['GDP - per capita'], +b['GDP - per capita']);}).slice(0,10);//top 10 filtering
        //.sort(function(a,b) {return d3.descending(+a[topic], +b[topic]);}).slice(0,10);//top 10 filtering
        
        render(SortedData1);
                
      }//end of barchart function
      d3.selectAll(".barchart").empty();
    });//end of d3 csv
  });//end of d3 json
})();

//map();//end
