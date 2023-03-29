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

  let selectedData = [];

  // note: since there are some sportsbooks that are in every state, unchecking a state may not change the graph
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

  document.getElementById("uncheck").addEventListener("click", () => {
    for (const child of filters.getElementsByTagName("input")) {
      child.checked = false;
    }
    updateFilters();
  });

  document.getElementById("check").addEventListener("click", () => {
    for (const child of filters.getElementsByTagName("input")) {
      child.checked = true;
    } 
    updateFilters();
  });

  function plotData(betData) {
    console.log(betData);

    // vis1 start
    let bookies = Array.from(new Set(betData.map((d) => d.site_title)));
    let x_scale = d3
      .scaleBand()
      .domain(bookies)
      .range([MARGINS.left + 40, VIS_WIDTH + MARGINS.left + 40]);

    let y_scale = d3
      .scaleLinear()
      .domain(d3.extent(betData.map((d) => +d["point_spread_home"])))
      .range([VIS_HEIGHT - MARGINS.top + 40, MARGINS.top + 40]);

    let colors_1 = d3.scaleOrdinal().domain(bookies).range(d3.schemePaired);

    // decide which variable size of circles represents (currently is away point spread, change this to amount of money already spent by other users on this bet maybe?
    // or amount of users?)
    let circ_size_domain = d3.extent(
      betData.map((d) => +d["point_spread_away"])
    );
    // size the circles
    let circ_size = d3.scaleSqrt().domain(circ_size_domain).range([2, 5]);

    FRAME1.append("g")
      .attr("transform", function (d, i) {
        return `translate(0,125)`;
      })
      .attr("class", "top");
    FRAME1.append("g")
      .attr("transform", function (d, i) {
        return `translate(${MARGINS.left}, ${MARGINS.top})`;
      })
      .attr("class", "left");
    FRAME1.append("text")
      .attr("class", "x-label")
      .attr("text-anchor", "middle")
      .attr("x", (VIS_WIDTH + MARGINS.left) / 2)
      .attr("y", 0)
      .text("sportsbooks");
    FRAME1.append("text")
      .attr("class", "y-label")
      .attr("y", 0)
      .attr("dy", ".75em")
      .text("distance from expected value (by odds)");

    // add axes
    let x_axis = d3.axisTop(x_scale);

    let y_axis = d3.axisLeft(y_scale);

    d3.select(".top").call(x_axis);
    d3.select(".left").call(y_axis);

    FRAME1.selectAll(".circ")
      .data(betData)
      .enter()
      .append("circle")
      .attr("class", "circ")
      .attr("stroke", "black")
      .attr("fill", (d) => colors_1(d.site_title))
      .attr("r", (d) => circ_size(d["point_spread_away"]))
      .attr("cx", (d) => x_scale(d.site_title))
      .attr("cy", (d) => y_scale(d.point_spread_home) + MARGINS.top);

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
        .attr("cy", (d) => d.y + MARGINS.top);
    }

    // applies force decay after 3 seconds
    let decay_init = setTimeout(function () {
      console.log("alpha decay begins");
      sim.alphaDecay(0.1);
    }, 3000);

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
        .html(
          d.home_team +
            " @ " +
            d.away_team +
            ": " +
            d.point_spread_home +
            "<br>" +
            d.site_title
        )
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

    const directions = FRAME2.append("text")
      .html("Click on a point on the left to display the graph here")
      .style("transform", "translate(100px, 100px)")
      .attr("class", "directions")
      .style("font-size", "12px");

    const title = FRAME2.append("g")
      .attr("class", "title")
      .style("transform", "translate(250px, 20px)")
      .attr("font-size", "15px");
    
    title.append("text").html("Point Spread and Price").attr("text-anchor", "middle");
    
    const specificTitle = title.append("text")
      .attr("class", "specific-title")
      .attr("text-anchor", "middle")
      .style("transform", "translateY(20px)");

    FRAME1.selectAll(".circ").on("click", function (i, d) {
      const selected = [
        {
          attribute: "point_spread_away",
          value: d.point_spread_away,
          title: "Away Point Spread",
        },
        {
          attribute: "point_spread_home",
          value: d.point_spread_home,
          title: "Home Point Spread",
        },
        {
          attribute: "price_away",
          value: d.price_away,
          title: "Away Price",
        },
        {
          attribute: "price_home",
          value: d.price_home,
          title: "Home Price",
        },
      ];
      const point = d3.select(this);
      const svg = d3.select("#vis2");
      svg.selectAll(".tick").remove();
      svg.selectAll("rect").remove();
      if (point.attr("class") === "selected circ") {
        selectedData.forEach((d) => {
          d.value = 0;
        });
        point.attr("class", "circ");
        FRAME1.selectAll(".unselected").attr("class", "circ");
        directions.style("display", "block");
        specificTitle.html("");
      } else {
        selectedData = selected;
        FRAME1.selectAll(".circ").attr("class", "unselected circ");
        point.attr("class", "selected circ");
        directions.style("display", "none");
        specificTitle.html(`${d.home_team} @ ${d.away_team}, ${d.site_title}`)
        plotBars();
      }
    });

    function plotBars() {
      const yScale =
        d3.max(
          selectedData.map((d) => {
            return Math.abs(parseInt(d.value));
          })
        ) + 10;

      const Y_SCALE2 = d3
        .scaleLinear()
        .domain([yScale, -yScale])
        .range([0, VIS_HEIGHT]);

      const X_SCALE2 = d3
        .scaleBand()
        .domain(
          selectedData.map(function (d) {
            return d.title;
          })
        )
        .range([0, VIS_WIDTH])
        .padding(0.2);

      let colors_2 = d3.scaleOrdinal()
      .domain(selectedData.map(d => {
        return d.title;
      }))
      .range(d3.schemePaired);

      FRAME2.selectAll("bars")
        .data(selectedData)
        .enter()
        .append("rect")
        .attr("y", function (d) {
          return Y_SCALE2(0) + MARGINS.bottom;
        })
        .attr("x", function (d) {
          return X_SCALE2(d.title) + MARGINS.left;
        })
        .attr("height", 0)
        .attr("width", X_SCALE2.bandwidth())
        .attr("fill", (d) => colors_2(d.title))
        .attr("class", "bar");

      FRAME2.selectAll("rect")
        .transition()
        .duration(800)
        .attr("y", function (d) {
          return Y_SCALE2(Math.max(0, d.value)) + MARGINS.bottom;
        })
        .attr("height", function (d) {
          return Math.abs(Y_SCALE2(0) - Y_SCALE2(d.value)) === 0
            ? 1.5
            : Math.abs(Y_SCALE2(0) - Y_SCALE2(d.value));
        })
        .delay(function (d, i) {
          return i * 100;
        });

      //Add X-Axis
      FRAME2.append("g")
        .attr(
          "transform",
          "translate(" + MARGINS.left + "," + (VIS_HEIGHT + MARGINS.bottom) + ")"
        )
        .call(d3.axisBottom(X_SCALE2))
        .attr("font-size", "10px");

      //Add Y-Axis
      FRAME2.append("g")
        .attr(
          "transform",
          "translate(" + MARGINS.left + "," + MARGINS.bottom + ")"
        )
        .call(d3.axisLeft(Y_SCALE2))
        .attr("font-size", "15px");

      const tooltips = d3
        .select("#vis1")
        .append("div")
        .attr("class", "ttip_1")
        .style("opacity", 0);

      FRAME2.selectAll(".bar").on("mouseover", function (i, d) {
        // d3.select(this).transition().duration("100").attr("stroke-width", 2);
        // // tooltip appear
        // tooltips.transition().duration(100).style("opacity", 1);
        // insert data into tooltip
        tooltips.style("opacity", 1);
      });

      // highlight on mouseover
      FRAME2.selectAll(".bar").on("mousemove", function (i, d) {
        tooltips
          .html(
            d.attribute + "<br>" + d.value
          )
          .style("left", i.pageX + 13 + "px")
          .style("top", i.pageY - 13 + "px");
      });

      // end highlight on mouseout
      FRAME2.selectAll(".bar").on("mouseleave", function (i, d) {
        // d3.select(this).transition().duration("100").attr("stroke-width", 1);
        // // tooltip disappear
        // tooltips.transition().duration("150").attr("opacity", 0);
        tooltips.style("opacity", 0);
      });

      const middleLine = d3.line();
      const points = [
        [MARGINS.left, VIS_HEIGHT / 2 + MARGINS.top],
        [VIS_WIDTH + MARGINS.right, VIS_HEIGHT / 2 + MARGINS.top],
      ];

      const pathOfLine = middleLine(points);

      FRAME2.append("path").attr("d", pathOfLine).attr("class", "middleLine");
    }

    plotBars();
  }

  plotData(data);

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
});
