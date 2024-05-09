import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import { boroughColors, metadata, strokeColors } from "./constants.js";

let globalDistanceData = null;

let dispatched = false,
  dispatchedBorough = null;
const color = d3
  .scaleOrdinal()
  .range(["#b6a0d3", "#a4d6a5", "#7ebdc7", "#f29991", "#f5ba89"]);

const plotRadarPlot = async () => {
  const svg = d3.select("#radar-svg");
  dispatched = false;
  dispatchedBorough = null;
  svg.selectAll("*").remove();
  const width = svg.node().clientWidth;
  const height = svg.node().clientHeight;
  let radius = Math.min(width, height) / 2 - 30;
  let levels = 5;
  const tooltip = d3.select(".tooltip");
  tooltip.html("").style("display", "none");

  // Title
  svg
    .append("text")
    .attr("text-anchor", "middle")
    .attr("id", "radar-title")
    .attr("dominant-baseline", "middle")
    .text("Avg. Dist.")
    .style("font-size", "18px")
    .style("font-weight", "bold")
    .style("fill", "black")
    .attr("opacity", 0)
    .attr("transform", `translate(50, 20)`)
    .transition()
    .duration(1000)
    .attr("opacity", 1);

  if (globalDistanceData === null) {
    let distanceData = await axios.get("http://localhost:8000/dist_radar");
    distanceData = distanceData.data;
    globalDistanceData = distanceData;
  }
  let maxValue = 5.7;
  let rScale = d3.scaleLinear().domain([0, maxValue]).range([0, radius]);

  const allAxis = globalDistanceData[0].map((d) => d.axis);
  let total = allAxis.length;
  let angleSlice = (Math.PI * 2) / total;

  // Impl starts
  let g = svg
    .append("g")
    .attr("transform", `translate(${width / 2}, ${height / 2})`);

  let filter = g.append("defs").append("filter").attr("id", "glow"),
    feGaussianBlur = filter
      .append("feGaussianBlur")
      .attr("stdDeviation", "2.5")
      .attr("result", "coloredBlur"),
    feMerge = filter.append("feMerge"),
    feMergeNode_1 = feMerge.append("feMergeNode").attr("in", "coloredBlur"),
    feMergeNode_2 = feMerge.append("feMergeNode").attr("in", "SourceGraphic");

  let axisGrid = g.append("g").attr("class", "axisWrapper");

  axisGrid
    .selectAll(".levels")
    .data(d3.range(1, levels + 1).reverse())
    .enter()
    .append("circle")
    .attr("class", "gridCircle")
    .attr("r", (d, i) => (radius / levels) * d)
    .style("fill", "#CDCDCD")
    .style("stroke", "#CDCDCD")
    .style("fill-opacity", 0.1)
    .style("filter", "url(#glow)");

  let axis = axisGrid
    .selectAll(".axis")
    .data(allAxis)
    .enter()
    .append("g")
    .attr("class", "axis");

  axis
    .append("line")
    .attr("x1", 0)
    .attr("y1", 0)
    .attr(
      "x2",
      (d, i) => rScale(maxValue * 1.1) * Math.cos(angleSlice * i - Math.PI / 2)
    )
    .attr(
      "y2",
      (d, i) => rScale(maxValue * 1.1) * Math.sin(angleSlice * i - Math.PI / 2)
    )
    .attr("class", "line")
    .style("stroke", "white")
    .style("stroke-width", "2px");

  axis
    .append("text")
    .attr("class", "legend")
    .style("font-size", "11px")
    .attr("text-anchor", "middle")
    .style("font-weight", "bold")
    .attr("dx", (d, i) => (i === 1 ? "1.4em" : i === 3 ? "-1em" : "0.2em"))
    .attr("dy", (d, i) => (i === 0 ? "1em" : i === 2 ? "-0.6em" : "0.2em"))
    .attr(
      "x",
      (d, i) => rScale(maxValue * 1.25) * Math.cos(angleSlice * i - Math.PI / 2)
    )
    .attr(
      "y",
      (d, i) => rScale(maxValue * 1.25) * Math.sin(angleSlice * i - Math.PI / 2)
    )
    .text((d) => d);

  let radarLine = d3
    .lineRadial()
    .curve(d3.curveCardinalClosed)
    .radius((d) => rScale(d.value))
    .angle((d, i) => i * angleSlice);

  let blobWrapper = g
    .selectAll(".radarWrapper")
    .data(globalDistanceData)
    .enter()
    .append("g")
    .attr("class", "radarWrapper");

  blobWrapper
    .append("path")
    .attr("class", (d) => {
      return `radarArea-${d[0].borough}`;
    })
    .attr("d", (d, i) => radarLine(d))
    .style("fill", (d, i) => color(i))
    .style("fill-opacity", 0.35);

  blobWrapper
    .append("path")
    .attr("class", (d) => `radarStroke-${d[0].borough}`)
    .attr("d", (d, i) => radarLine(d))
    .style("stroke-width", "2px")
    .style("stroke", (d, i) => color(i))
    .style("fill", "none")
    .style("filter", "url(#glow)");

  blobWrapper
    .selectAll(".radarCircle")
    .data((d) => d)
    .enter()
    .append("circle")
    .attr("class", (d) => `radarCircle-${d.borough}`)
    .attr("r", 4)
    .attr("cx", function (d, i) {
      return rScale(d.value) * Math.cos(angleSlice * i - Math.PI / 2);
    })
    .attr("cy", function (d, i) {
      return rScale(d.value) * Math.sin(angleSlice * i - Math.PI / 2);
    })
    .style("fill", (d, i, j) => color(j))
    .style("fill-opacity", 0.8);

  let blobCircleWrapper = g
    .selectAll(".wrapperRadarCircle")
    .data(globalDistanceData)
    .enter()
    .append("g")
    .attr("class", "wrapperRadarCircle");

  // Dispatch event here
  blobCircleWrapper
    .selectAll(".radarInvisibleCircle")
    .data((d) => d)
    .enter()
    .append("circle")
    .attr("class", (d) => `radarInvisibleCircle-${d.borough}`)
    .attr("r", 4)
    .attr(
      "cx",
      (d, i) => rScale(d.value) * Math.cos(angleSlice * i - Math.PI / 2)
    )
    .attr(
      "cy",
      (d, i) => rScale(d.value) * Math.sin(angleSlice * i - Math.PI / 2)
    )
    .style("fill", "none")
    .style("pointer-events", "all")
    .on("mouseover", function (e, d) {
      if (dispatched && d.borough !== dispatchedBorough) {
        return;
      }
      if (e.isTrusted) {
        tooltip
          .style("display", "flex")
          .html(`${metadata[d.borough]["displayName"]}<br/>${d.value} miles`)
          .style("left", e.pageX + 15 + "px")
          .style("top", e.pageY - 20 + "px");
      } else {
        dispatched = true;
        dispatchedBorough = d.borough;
      }
      // Radar areas
      d3.selectAll(`[class^=radarArea]:not(.radarArea-${d.borough})`)
        .transition()
        .duration(300)
        .style("fill-opacity", 0);

      // Radar Stroke
      d3.selectAll(`[class^=radarStroke]:not(.radarStroke-${d.borough})`)
        .transition()
        .duration(300)
        .style("stroke-width", "0px");
      d3.selectAll(`[class=radarStroke-${d.borough}]`)
        .transition()
        .duration(300)
        .style("stroke", strokeColors[d.borough]);

      // Radar circles
      d3.selectAll(`[class^=radarCircle]:not(.radarCircle-${d.borough})`)
        .transition()
        .duration(300)
        .style("fill-opacity", 0);

      d3.selectAll(`[class=radarCircle-${d.borough}]`)
        .transition()
        .duration(300)
        .style("fill", strokeColors[d.borough]);
    })
    .on("mouseout", function (e, d) {
      tooltip.html("").style("display", "none");
      if (!e.isTrusted) {
        dispatched = false;
        dispatchedBorough = null;
      }
      if (dispatched) {
        return;
      }

      // Radar areas
      d3.selectAll(`[class^=radarArea]:not(.radarArea-${d.borough})`)
        .transition()
        .duration(500)
        .style("fill-opacity", 0.35);

      // Radar stroke
      d3.selectAll(`[class^=radarStroke]:not(.radarStroke-${d.borough})`)
        .transition()
        .duration(500)
        .style("stroke-width", "2px");
      d3.selectAll(`[class=radarStroke-${d.borough}]`)
        .transition()
        .duration(500)
        .style("stroke", boroughColors[d.borough]);

      // Radar circle
      d3.selectAll(`[class^=radarCircle]:not(.radarCircle-${d.borough})`)
        .transition()
        .duration(500)
        .style("fill-opacity", 0.8);
      d3.selectAll(`[class=radarCircle-${d.borough}]`)
        .transition()
        .duration(500)
        .style("fill", boroughColors[d.borough]);
    });
};

export default plotRadarPlot;
