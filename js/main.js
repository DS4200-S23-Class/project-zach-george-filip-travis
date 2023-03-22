const FRAME_WIDTH = 500;
const FRAME_HEIGHT = 500;
const MARGINS = { top: 50, bottom: 50, left: 50, right: 50 };
const VIS_WIDTH = FRAME_WIDTH - MARGINS.left - MARGINS.right;
const VIS_HEIGHT = FRAME_HEIGHT - MARGINS.top - MARGINS.bottom;
const PADDING = 15;

const FRAME1 = d3
  .select("#vis1")
  .append("svg")
  .attr("height", FRAME_HEIGHT)
  .attr("width", FRAME_WIDTH)
  .attr("class", "frame");

const FRAME2 = d3
  .select("#vis2")
  .append("svg")
  .attr("height", FRAME_HEIGHT)
  .attr("width", FRAME_WIDTH)
  .attr("class", "frame");

// move vis stuff they write in here to plotData
d3.csv("data/NBA_Bets_Today.csv").then((data) => {
  let states = [];
  let sportsbooks = {};

  const filters = document.getElementById("filterTable");
  d3.csv("data/Bookie by State.csv").then((stateData) => {
    console.log(stateData);
    for (const book of stateData) {
      const bookName = book["Bookie "];
      const bookStates = book["States"].split(" ");
      sportsbooks[bookName] = bookStates;
      states = [...new Set([...states, ...bookStates])].sort();
    }
    states.forEach((s) => {
      let label = document.createElement("label");
      label.setAttribute("for", s);
      label.innerText = s;
      let box = document.createElement("input");
      box.setAttribute("type", "checkbox");
      box.setAttribute("id", s);
      box.setAttribute("name", s);
      box.setAttribute("value", s);
      box.addEventListener("click", updateFilters);
      box.setAttribute("checked", "true");
      const row = filters.appendChild(document.createElement("tr"));
      const labelCol = row.appendChild(document.createElement("td"));
      const boxCol = row.appendChild(document.createElement("td"));
      labelCol.appendChild(label);
      boxCol.appendChild(box);
    });
  });

  function plotData(betData) {
    console.log(betData);

    // vis1 start
    let bookies = Array.from(new Set(betData.map((d) => d.site_title)));
    let x_scale = d3
      .scaleBand()
      .domain(bookies)
      .range([2 * PADDING, VIS_WIDTH]);

    let y_scale = d3
      .scaleLinear()
      .domain(d3.extent(betData.map((d) => +d["point_spread_home"])))
      .range([VIS_HEIGHT - MARGINS.top, MARGINS.top]);

    let colors_1 = d3.scaleOrdinal().domain(bookies).range(d3.schemePaired);

    // decide which variable size of circles represents (currently is away point spread, change this to amount of money already spent by other users on this bet maybe?
    // or amount of users?)
    let circ_size_domain = d3.extent(
      betData.map((d) => +d["point_spread_away"])
    );
    // size the circles
    let circ_size = d3.scaleSqrt().domain(circ_size_domain).range([2, 5]);

    FRAME1.selectAll(".circ")
      .data(betData)
      .enter()
      .append("circle")
      .attr("class", "circ")
      .attr("stroke", "black")
      .attr("fill", (d) => colors_1(d.site_title))
      .attr("r", (d) => circ_size(d["point_spread_away"]))
      .attr("cx", (d) => x_scale(d.site_title))
      .attr("cy", (d) => y_scale(d.point_spread_home));

    let sim = d3
      .forceSimulation(betData)
      .force(
        "x",
        d3
          .forceX((d) => {
            return x_scale(d.site_title);
          })
          .strength(0.4)
      )

      .force(
        "y",
        d3
          .forceY((d) => {
            return y_scale(d.point_spread_home);
          })
          .strength(1)
      )

      .force(
        "collide",
        d3.forceCollide((d) => {
          return circ_size(d["point_spread_away"]);
        })
      )

      .alphaDecay(0)
      .alpha(0.2)
      .on("tick", tick);

    // updates location of circles each tick
    function tick() {
      d3.selectAll(".circ")
        .attr("cx", (d) => d.x)
        .attr("cy", (d) => d.y);
    }

    // applies force decay after 3 seconds
    let decay_init = setTimeout(function () {
      console.log("alpha decay begins");
      sim.alphaDecay(0.1);
    }, 3000);
  }

  plotData(data);

  const tooltips = d3
    .select("#vis1")
    .append("div")
    .attr("class", "ttip_1")
    .style("opacity", 0);

  FRAME1.selectAll(".circ").on("mouseover", function (i, d) {
    // d3.select(this).transition().duration("100").attr("stroke-width", 2);
    // // tooltip appear
    // tooltips.transition().duration(100).style("opacity", 1);
    // insert data into tooltip
    tooltips.style("opacity", 1);
  });

  // highlight on mouseover
  FRAME1.selectAll(".circ").on("mousemove", function (i, d) {
    tooltips
      .html(d.home_team + " @ " + d.away_team + ": " + d.point_spread_home)
      .style("left", i.pageX + 13 + "px")
      .style("top", i.pageY - 13 + "px");
  });

  // end highlight on mouseout
  FRAME1.selectAll(".circ").on("mouseleave", function (i, d) {
    // d3.select(this).transition().duration("100").attr("stroke-width", 1);
    // // tooltip disappear
    // tooltips.transition().duration("150").attr("opacity", 0);
    tooltips.style("opacity", 0);
  });

  function updateFilters() {
    for (const child of filters.getElementsByTagName("input")) {
      if (child.checked) {
        if (!states.includes(child.name)) {
          states.push(child.name);
          states = states.sort();
        }
      } else {
        states = states.filter((s) => s !== child.name);
      }
    }
    const filteredData = [];
    for (const bet of data) {
      const book = bet["site_title"];
      const bookStates = sportsbooks[book];
      if (bookStates.some((s) => states.includes(s))) {
        filteredData.push(bet);
      }
    }
    const svg = d3.select("#vis1");
    svg.selectAll("circle").remove();
    plotData(filteredData);
  }
}
  // vis2 start
);