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
  }

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
    plotData(filteredData);
  }

  plotData(data);
});