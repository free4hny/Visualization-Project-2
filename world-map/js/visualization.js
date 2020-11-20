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
  const width = 1200 - margin.left - margin.right;
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
    .scale(130)
    .translate([width / 2, height / 1.5]);

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
        maxValue = Math.max(...facts.map((f) => f[topic]));
        minValue = Math.min(...facts.map((f) => f[topic]));
        topicColor
          .domain([minValue, maxValue])
          .range(defaultTopics.find((t) => t.topic === topic).colorRange);
        updateWorldmap();
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
          .style("stroke-width", 0.3);
      }
    });
  });
})();
