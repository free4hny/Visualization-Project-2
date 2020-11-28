(() => {
  const format = d3.format(",");
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
    topic = "Population";

  let topicColor = defaultTopics.find((t) => t.topic === topic).colorFn;
  let topicDensity = defaultTopics.find((t) => t.topic === topic).densities;
  const densityLineWidth = 500;
  const margin = { top: 0, right: 0, bottom: 40, left: 0 };
  const width = 900 - margin.left - margin.right;
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

  const projection = d3
    .geoMercator()
    .scale(100)
    .translate([width / 2.2, height / 1.5]);

  const path = d3.geoPath().projection(projection);

  svg.call(tip);
  d3.json("../data/world.json").then((world, err) => {
    d3.csv("../data/factbook.csv").then((facts, err) => {
      // const topics = Object.keys(facts[0]);

      const topics = defaultTopics.map((dt) => dt.topic);
      const continents = [
        ...new Set(
          world.features.map((country) => country.properties.continent)
        ),
      ];
      let countriesIncContinent = {};

      //get countries in continent
      continents.forEach((c) => {
        countriesIncContinent[c] = world.features
          .filter((country) => country.properties.continent === c)
          .map((country) => country.properties.name);
      });

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
      });

      topic_selector.addEventListener("change", function (e) {
        topic = e.target.value;
        topicColor = defaultTopics.find((t) => t.topic === topic).colorFn;
        topicDensity = defaultTopics.find((t) => t.topic === topic).densities;
        updateWorldmap();
      });

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
    });
  });
})();
