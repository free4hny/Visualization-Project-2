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
  const width = 750 - margin.left - margin.right;
  const height = 500 - margin.top - margin.bottom;

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
    .offset([150, 50])
    .html(
      (d) =>
        `<strong>Country: </strong><span class='details'>${
          d.country
        }<br></span><strong>${
          d.topic
        }: </strong><span class='details'>${parseFloat(d.value).toLocaleString()}</span>`
    );

  //div and div1 are for the tooltip
  var div = d3.select("body").append("div")	
      .attr("class", "tooltip")				
      .style("opacity", 0);

  
  const projection = d3
    .geoMercator()
    .scale(100)
    .translate([width / 2.3, height / 1.5]);

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
        barcharthigh();
        barchartlow();        
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
        barcharthigh();
        barchartlow();
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
              .attr('width', d => xScale(xValue(d)))
              .attr('height', yScale.bandwidth())             

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
                  .style("fill","red");
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
                      return "#fd8d3c";
                    }else{
                      return "grey";
                    }                 
                  })
                  .style("stroke", "white")
                  .style("opacity", 0.8)
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
                  .style("fill","black");
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
              .text(xAxisLabelText);
            
          g.selectAll('rect').data(data)
            .enter().append('rect')
              .attr('y', d => yScale(yValue(d)))
              .attr('width', d => xScale(xValue(d)))
              .attr('height', yScale.bandwidth())             

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
                  .style("fill", "Red");
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
                      return "#fd8d3c";
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
                  .style("fill","black");
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
      
    });//end of d3 csv
  });//end of d3 json
})();

//map();//end
