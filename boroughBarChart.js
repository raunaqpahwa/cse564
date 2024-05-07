import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import { metadata } from "./constants.js";

const plotBoroughBarChart = async (borough) => {
  const requestData = await axios.get(
    "http://localhost:8000/borough_bar_chart",
    {
      params: {
        borough,
      },
    }
  );
  const boroughBarChartData = requestData.data;
  const maxValue = boroughBarChartData.reduce(
    (acc, val) => Math.max(acc, val["value"] + 2),
    0
  );
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
  document.querySelector("#bar-reset").style.display = "initial";
  const x = d3
    .scaleBand()
    .domain(boroughBarChartData.map((d) => d["name"]))
    .range([marginLeft, width - marginRight])
    .padding(0.7);

  const y = d3
    .scaleLinear()
    .domain([0, maxValue])
    .range([height - marginBottom, marginTop]);

  // title
  svg
    .append("g")
    .append("text")
    .attr("x", width / 2)
    .attr("y", marginTop - 20)
    .attr("text-anchor", "middle")
    .style("font-size", "18px")
    .style("text-decoration", "underline")
    .text(`Distribution of ${metadata[borough]["displayName"]} Units`);

  svg
    .append("g")
    .attr("fill", "#0275ff")
    .selectAll()
    .data(boroughBarChartData)
    .join("rect")
    .attr("x", (d) => x(d["name"]))
    .attr("width", x.bandwidth())
    .attr("y", (d) => y(d["value"]))
    .attr("height", (d) => height - marginBottom - y(d["value"]))
    .on("mouseover", (e, d) => {
      tooltip
        .style("display", "flex")
        .html(`Units: ${d["value"]}`)
        .style("left", e.pageX + 15 + "px")
        .style("top", e.pageY - 20 + "px");
    })
    .on("mouseout", () => {
      tooltip.html("").style("display", "none");
    });

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
        .text(`Type of unit →`)
    )
    .attr("class", "x-axis");

  d3.select(".x-axis")
    .selectAll("text") // select all the text elements
    .each(function (d) {
      if (d === "Homeownership") {
        d3.select(this).attr("transform", "translate(10, 0)");
      }
    });

  // y-axis
  svg
    .append("g")
    .attr("transform", `translate(${marginLeft}, 0)`)
    .call(
      d3
        .axisLeft(y)
        .ticks(height / 30)
        .tickSizeOuter(0)
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
        .text(`Number of units`)
    );

  d3.select("#bar-reset").on("click", () => {});
};

export default plotBoroughBarChart;
