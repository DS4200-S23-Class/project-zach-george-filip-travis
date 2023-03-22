const FRAME_WIDTH = 500;
const FRAME_HEIGHT = 500;
const MARGINS = { top: 50, bottom: 50, left: 50, right: 50 };
const VIS_WIDTH = FRAME_WIDTH - MARGINS.left - MARGINS.right;
const VIS_HEIGHT = FRAME_HEIGHT - MARGINS.top - MARGINS.bottom;
const PADDING = 15;

let states = [];
let sportsbooks = {}
const filters = document.getElementById("filterTable");
const sportsByState = d3.csv("data/Bookie by State.csv").then((data) => {
  console.log(data);
  for (const book of data) {
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
    box.setAttribute("onclick", "updateFilters()");
    box.setAttribute("checked", "true");
    const row = filters.appendChild(document.createElement("tr"));
    const labelCol = row.appendChild(document.createElement("td"));
    const boxCol = row.appendChild(document.createElement("td"));
    labelCol.appendChild(label);
    boxCol.appendChild(box);
  });
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
}

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

let svg1 = d3
  .select("body")
  .append("svg")
  .attr("height", VIS_HEIGHT)
  .attr("width", VIS_WIDTH);

d3.csv("data/NBA_Bets_Today.csv").then((data) => {
  console.log(data);

  let bookies = Array.from(new Set(data.map((d) => d.site_title)));
  let x_scale = d3
    .scaleBand()
    .domain(bookies)
    .range([0, VIS_WIDTH]);

  let y_scale = d3
    .scaleLinear()
    .domain(d3.extent(data.map((d) => + d["price_away"])))
    .range([VIS_HEIGHT - MARGINS.top, MARGINS.top]);

  let colors_1 = d3.scaleOrdinal().domain(bookies).range(d3.schemePaired);


  // decide which variable size of circles (currently away point spread, want to change this to amount of money already spent by other users on this bet maybe?
  // or amount of people?)
  let circ_size_domain = d3.extent(data.map((d) => + d["point_spread_away"]));
  // size the circles
  let circ_size = d3.scaleSqrt().domain(circ_size_domain).range([2, 50]);

  svg1.selectAll(".circ")
    .data(data)
    .enter()
    .append("circle")
    .attr("class", "circ")
    .attr("stroke", "black")
    .attr("fill", (d) => color(d.site_title))
    .attr("r", (d) => size(d["point_spread_away"]))
    .attr("cx", (d) => x_scale(d.site_title))
    .attr("cy", (d) => y_scale(d.price_away));
});