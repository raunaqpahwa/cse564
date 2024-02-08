import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import displayNames from "./constants.js";

const plotScatterPlot = (xPlotKey, yPlotKey, plotData) => {
  const margin = {
    top: 40,
    right: 20,
    bottom: 20,
    left: 60,
  };

  const width = 960;
  const height = 540;

  const y = displayNames[yPlotKey]["isCategorical"]
    ? d3
        .scaleBand()
        .domain(plotData.map((d) => d[yPlotKey]))
        .range([height - margin.bottom, margin.top])
        .padding(1)
    : d3
        .scaleLinear()
        .domain([0, d3.max(plotData, (d) => d[yPlotKey])])
        .range([height - margin.bottom, margin.top]);

  const x = displayNames[xPlotKey]["isCategorical"]
    ? d3
        .scaleBand()
        .domain(plotData.map((d) => d[xPlotKey]))
        .range([margin.left, width - margin.right])
        .padding(1)
    : d3
        .scaleLinear()
        .domain([0, d3.max(plotData, (d) => d[xPlotKey])])
        .range([margin.left, width - margin.right]);

  const svg = d3
    .create("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .attr("viewBox", [
      0,
      0,
      width + margin.left + margin.right,
      height + margin.top + margin.bottom,
    ])
    .attr("style", "max-width: 100%; height: auto;");

  svg
    .append("g")
    .attr("fill", "#0275ff")
    .selectAll()
    .data(plotData)
    .join("circle")
    .attr("cx", (d) => x(d[xPlotKey]))
    .attr("cy", (d) => y(d[yPlotKey]))
    .attr("r", 3);

  svg
    .append("g")
    .append("text")
    .attr("x", width / 2)
    .attr("y", 14)
    .attr("text-anchor", "middle")
    .style("font-size", "18px")
    .style("text-decoration", "underline")
    .text(
      `Distribution of ${displayNames[xPlotKey]["displayName"]} vs ${displayNames[yPlotKey]["displayName"]}`
    );

  svg
    .append("g")
    .attr("transform", `translate(0, ${height - margin.bottom})`)
    .call(
      d3
        .axisBottom(x)
        .ticks(width / 40)
        .tickSizeOuter(0)
    )
    .call((g) =>
      g
        .append("text")
        .attr("x", width - margin.right)
        .attr("y", 50)
        .attr("fill", "currentColor")
        .style("font-size", "14px")
        .attr("text-anchor", "end")
        .text(
          `${displayNames[xPlotKey]["displayName"]} ${displayNames[xPlotKey]["unit"]}`
        )
    );

  svg
    .append("g")
    .attr("transform", `translate(${margin.left},0)`)
    .call(
      d3
        .axisLeft(y)
        .ticks(height / 30)
        .tickSizeOuter(0)
    )
    .call((g) =>
      g
        .append("text")
        .attr("x", -margin.left)
        .attr("y", 10)
        .style("font-size", "14px")
        .attr("transform", "translate(0, 4)")
        .attr("fill", "currentColor")
        .attr("text-anchor", "start")
        .text(
          `${displayNames[yPlotKey]["displayName"]} ${displayNames[yPlotKey]["unit"]}`
        )
    );

  return svg.node();
};

export default plotScatterPlot;
