import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import plotBoroughBarChart from "./boroughBarChart.js";
import { boroughColors, selectedBoroughColors, metadata } from "./constants.js";

let selectedBorough = null;

const barChart = async () => {
  const requestData = await axios.get("http://localhost:8000/bar_chart");
  const barData = requestData.data;
  const maxValue = barData.reduce((acc, val) => Math.max(acc, val["size"]), 0);

  selectedBorough = null;

  const svg = d3.select("#bar-svg");
  svg.selectAll("*").remove();
  const tooltip = d3.select(".tooltip");
  tooltip.html("").style("display", "none");
  const width = svg.node().clientWidth;
  const height = svg.node().clientHeight;
  const marginRight = 50,
    marginBottom = 60,
    marginTop = 50,
    marginLeft = 80;
  document.querySelector("#bar-reset").style.display = "none";
  const y = d3
    .scaleBand()
    .domain(barData.map((d) => d["borough"]))
    .range([marginTop, height - marginBottom])
    .padding(0.5);

  const x = d3
    .scaleLinear()
    .domain([0, maxValue + 50])
    .range([marginLeft, width - marginRight]);

  // rect-bars
  svg
    .append("g")
    .selectAll()
    .data(barData)
    .join("rect")
    .attr("id", (d) => `barRect-${d["borough"]}`)
    .attr("x", marginLeft)
    .attr("width", 0) // Set initial width to 0
    .attr("y", (d) => y(d["borough"]))
    .attr("height", y.bandwidth())
    .attr("fill", (d) => boroughColors[d["borough"]])
    .attr("cursor", "pointer")
    .on("mouseover", (e, d) => {
      tooltip
        .style("display", "flex")
        .html(`Units: ${d["size"]}`)
        .style("left", e.pageX + 15 + "px")
        .style("top", e.pageY - 20 + "px");
    })
    .on("mouseout", () => {
      tooltip.html("").style("display", "none");
    })
    .on("click", (e, d) => {
      const boroughBlock = d3
        .selectAll("g[id*='treemap-']")
        .filter((treeBlock, i) =>
          treeBlock.data.name.includes(d.borough) ? true : false
        );

      const currBorough = boroughBlock._groups[0][0];
      console.log(currBorough);
      if (currBorough) {
        d3.select(`#${currBorough.id}`).dispatch("click");
      }
      let clickedBorough = d["borough"];
      d3.select(`#map-${clickedBorough}`).dispatch("click");
      d3.select(`#pie-${clickedBorough}`).dispatch("click");
      // Radar chart
      d3.select(`[class=radarInvisibleCircle-${clickedBorough}]`).dispatch(
        "mouseover"
      );
      selectedBorough = clickedBorough;
      plotBoroughBarChart(selectedBorough);
    })
    .transition() // Add transition
    .duration(1000) // Set duration for the animation
    .attr("width", (d) => x(d["size"]) - marginLeft); // Animate the width

  // title
  svg
    .append("g")
    .append("text")
    .attr("x", width / 2)
    .attr("y", marginTop - 20)
    .attr("text-anchor", "middle")
    .style("font-size", "18px")
    .style("font-weight", "bold")
    .text(`Distribution of Affordable Housing in Boroughs`);

  // x-axis
  svg
    .append("g")
    .attr("transform", `translate(0, ${height - marginBottom})`)
    .call(
      d3
        .axisBottom(x)
        .ticks(width / 40)
        .tickSizeOuter(0)
    )
    .call((g) =>
      g
        .append("text")
        .attr("x", width - marginRight)
        .attr("y", 40)
        .attr("fill", "currentColor")
        .style("font-size", "14px")
        .attr("text-anchor", "end")
        .text(`No. of affordable housing properties →`)
    );

  // y-axis
  svg
    .append("g")
    .attr("transform", `translate(${marginLeft}, 0)`)
    .call(
      d3
        .axisLeft(y)
        .ticks(height / 30)
        .tickSizeOuter(0)
        .tickFormat((d) => metadata[d]["displayName"])
    )
    .call((g) =>
      g
        .append("text")
        .attr("x", -marginLeft + 10)
        .attr("y", marginTop - 5)
        .style("font-size", "14px")
        .attr("transform", "translate(0, -4)")
        .attr("fill", "currentColor")
        .attr("text-anchor", "start")
        .text(`Boroughs`)
    );
};

export default barChart;
