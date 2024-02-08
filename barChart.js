import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import displayNames from "./constants.js";

const plotHorizontalBarChart = (plotKey, plotData) => {
  const margin = {
    top: 40,
    right: 20,
    bottom: 20,
    left: 60,
  };

  const groupings = plotData.reduce(
    (acc, data) =>
      acc.has(data[plotKey])
        ? acc.set(data[plotKey], acc.get(data[plotKey]) + 1)
        : acc.set(data[plotKey], 1),
    new Map()
  );

  const maxValue = Array.from(groupings.values()).reduce((acc, val) =>
    Math.max(acc, val)
  );

  const width = 960;
  const height = 540;

  const y = d3
    .scaleBand()
    .domain(plotData.map((d) => d[plotKey]))
    .range([margin.top, height - margin.bottom])
    .padding(0.7);

  const x = d3
    .scaleLinear()
    .domain([0, maxValue])
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
    .join("rect")
    .attr("x", (d) => margin.left)
    .attr("width", (d) => x(groupings.get(d[plotKey])) - margin.left)
    .attr("y", (d) => y(d[plotKey]))
    .attr("height", y.bandwidth());

  svg
    .append("g")
    .append("text")
    .attr("x", width / 2)
    .attr("y", 14)
    .attr("text-anchor", "middle")
    .style("font-size", "18px")
    .style("text-decoration", "underline")
    .text(`Distribution of ${displayNames[plotKey]["displayName"]}`);

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
        .text(`Frequency →`)
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
          `${displayNames[plotKey]["displayName"]} ${displayNames[plotKey]["unit"]}`
        )
    );

  return svg.node();
};

const plotVerticalBarChart = (plotKey, plotData) => {
  const margin = {
    top: 40,
    right: 20,
    bottom: 20,
    left: 40,
  };

  const groupings = plotData.reduce(
    (acc, data) =>
      acc.has(data[plotKey])
        ? acc.set(data[plotKey], acc.get(data[plotKey]) + 1)
        : acc.set(data[plotKey], 1),
    new Map()
  );

  const maxValue = Array.from(groupings.values()).reduce((acc, val) =>
    Math.max(acc, val)
  );

  const width = 960;
  const height = 540;

  const x = d3
    .scaleBand()
    .domain(plotData.map((d) => d[plotKey]))
    .range([margin.left, width - margin.right])
    .padding(0.7);

  const y = d3
    .scaleLinear()
    .domain([0, maxValue])
    .range([height - margin.bottom, margin.top]);

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
    .append("text")
    .attr("x", width / 2)
    .attr("y", 14)
    .attr("text-anchor", "middle")
    .style("font-size", "18px")
    .style("text-decoration", "underline")
    .text(`Distribution of ${displayNames[plotKey]["displayName"]}`);

  svg
    .append("g")
    .attr("fill", "#0275ff")
    .selectAll()
    .data(plotData)
    .join("rect")
    .attr("x", (d) => x(d[plotKey]))
    .attr("width", x.bandwidth())
    .attr("y", (d) => y(groupings.get(d[plotKey])))
    .attr(
      "height",
      (d) => height - margin.bottom - y(groupings.get(d[plotKey]))
    );

  svg
    .append("g")
    .attr("transform", `translate(0, ${height - margin.bottom})`)
    .call(
      d3
        .axisBottom(x)
        .ticks(width / 80)
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
          `${displayNames[plotKey]["displayName"]} ${displayNames[plotKey]["unit"]}`
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
        .text(`↑ Frequency`)
    );

  return svg.node();
};

const plotBarChart = (plotKey, plotData, isHorizontal) =>
  isHorizontal
    ? plotHorizontalBarChart(plotKey, plotData)
    : plotVerticalBarChart(plotKey, plotData);

export default plotBarChart;
