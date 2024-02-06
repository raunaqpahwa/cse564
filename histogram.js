import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import displayNames from "./constants.js";

const plotHorizontalHistogram = (plotKey, plotData) => {
  const margin = {
    top: 40,
    left: 40,
    right: 20,
    bottom: 20,
  };

  const width = 960;
  const height = 540;

  const bins = d3
    .bin()
    .thresholds(10)
    .value((d) => d[plotKey])(plotData);

  const x = d3
    .scaleLinear()
    .domain([0, d3.max(bins, (d) => d.length)])
    .range([margin.left, width - margin.right]);

  const y = d3
    .scaleLinear()
    .domain([bins[0].x0, bins[bins.length - 1].x1])
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
    .attr("fill", "#0275ff")
    .selectAll()
    .data(bins)
    .join("rect")
    .attr("x", (d) => margin.left)
    .attr("width", (d) => x(d.length))
    .attr("y", (d, i) => height - margin.bottom - (i + 1) * (y(d.x0) - y(d.x1)))
    .attr("height", (d) => y(d.x0) - y(d.x1) - 1);

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
        .text(`→ Frequency`)
    );

  svg
    .append("g")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y).ticks(height / 40))
    .call((g) => g.select(".domain").remove())
    .call((g) =>
      g
        .append("text")
        .attr("x", -margin.left)
        .attr("y", 10)
        .style("font-size", "14px")
        .attr("transform", "translate(0, 4)")
        .attr("fill", "currentColor")
        .attr("text-anchor", "start")
        .text(`${displayNames[plotKey]["displayName"]} ↑`)
    );

  return svg.node();
};

const plotVerticalHistogram = (plotKey, plotData) => {
  const margin = {
    top: 40,
    right: 20,
    bottom: 20,
    left: 40,
  };

  const width = 960;
  const height = 540;

  const bins = d3
    .bin()
    .thresholds(10)
    .value((d) => d[plotKey])(plotData);

  const x = d3
    .scaleLinear()
    .domain([bins[0].x0, bins[bins.length - 1].x1])
    .range([margin.left, width - margin.right]);

  const y = d3
    .scaleLinear()
    .domain([0, d3.max(bins, (d) => d.length)])
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
    .attr("fill", "#0275ff")
    .selectAll()
    .data(bins)
    .join("rect")
    .attr("x", (d) => x(d.x0) + 1)
    .attr("width", (d) => x(d.x1) - x(d.x0) - 1)
    .attr("y", (d) => y(d.length))
    .attr("height", (d) => y(0) - y(d.length));

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
        .text(`${displayNames[plotKey]["displayName"]} →
              `)
    );

  svg
    .append("g")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y).ticks(height / 30))
    .call((g) => g.select(".domain").remove())
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

const plotHistogram = (plotKey, plotData, isHorizontal) => {
  if (isHorizontal) {
    return plotHorizontalHistogram(plotKey, plotData);
  } else {
    return plotVerticalHistogram(plotKey, plotData);
  }
};

export default plotHistogram;
