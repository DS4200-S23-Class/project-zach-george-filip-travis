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

d3.csv("data/NBA_Bets_Today.csv").then((data) => {
  console.log(data);
});