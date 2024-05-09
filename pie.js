import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import { boroughColors, selectedBoroughColors, metadata } from "./constants.js";
import renderMap from "./map.js";
import plotBoroughBarChart from "./boroughBarChart.js";
import treeMap from "./treeMap.js";
import barChart from "./barChart.js";
import plotRadarPlot from "./radarPlot.js";

let pieData = await d3.csv("./crimes.csv");

let selectedBorough = null;

let toggle = false;

const renderPie = () => {
  const svg = d3.select("#pie-svg");
  svg.selectAll("*").remove();
  const width = svg.node().clientWidth;
  const height = svg.node().clientHeight;
  selectedBorough = null;

  const tooltip = d3.select(".tooltip");
  tooltip.html("").style("display", "none");

  let pie;
  if (toggle) {
    pie = d3.pie().value((d) => d.Rate);
  } else {
    pie = d3.pie().value((d) => d.Total);
  }
  const arcs = pie(pieData);

  const radius = Math.min(width, height) / 2;
  const innerRadius = radius * 0.6; // Set the inner radius for the donut chart
  const arc = d3.arc().innerRadius(innerRadius).outerRadius(radius);

  const pieSvg = svg
    .append("g")
    .attr("transform", `translate(${width / 2}, ${height / 2})`);

  pieSvg
    .selectAll("path")
    .data(arcs)
    .join("path")
    .attr("d", arc)
    .attr("id", (d) => `pie-${d.data.Borough}`)
    .attr("fill", (d, i) => {
      const borough = d.data.Borough;
      return boroughColors[borough] || "gray";
    })
    .attr("stroke", "white")
    .attr("stroke-width", 2)
    .attr("cursor", "pointer")
    .attr("opacity", 0.7) // Set initial opacity to 0
    .transition() // Add transition for animation
    .duration(1000) // Set the duration of the animation
    .attr("opacity", 1) // Fade in by changing opacity to 1
    .attr("fill", (d) => {
      const borough = d.data.Borough;
      return selectedBorough === null || selectedBorough === borough
        ? boroughColors[borough]
        : "#a6a6a6";
    })
    .on("end", function () {
      // Remove the transition after the animation is complete
      d3.select(this).transition().duration(0);
    });

  pieSvg
    .selectAll("path")
    .data(arcs)
    .join("path")
    .attr("d", arc)
    .attr("id", (d) => `pie-${d.data.Borough}`)
    .attr("fill", (d, i) => {
      const borough = d.data.Borough;
      return boroughColors[borough] || "gray";
    })
    .attr("stroke", "white")
    .attr("stroke-width", 2)
    .attr("cursor", "pointer")
    .on("mouseover", (e, d) => {
      tooltip
        .style("display", "flex")
        .html(
          `<strong>${metadata[d.data.Borough]["displayName"]}</strong>Total - ${
            d.data.Total
          } crimes <br/> Rate - ${parseFloat(d.data.Rate).toFixed(2)} `
        )
        .style("left", e.pageX + 15 + "px")
        .style("top", e.pageY - 20 + "px");
    })
    .on("mouseout", () => {
      tooltip.html("").style("display", "none");
    })
    .attr("fill", (d) => {
      const borough = d.data.Borough;
      return selectedBorough === null || selectedBorough === borough
        ? boroughColors[borough]
        : "#a6a6a6";
    })
    .on("click", (event, d) => {
      console.log(event);
      let clickedBorough = d.data.Borough;
      // console.log(clickedBorough)

      if (selectedBorough === clickedBorough) {
        selectedBorough = null;
        pieSvg
          .selectAll("path")
          .data(arcs)
          .join("path")
          .transition()
          .duration(500)
          .attr("d", arc)
          .attr("fill", (d) => {
            const borough = d.data.Borough;
            return boroughColors[borough];
          });
        barChart();
        renderMap();
        treeMap();

        d3.select(`#map-${clickedBorough}`).dispatch("click");
        d3.select(`[class=radarInvisibleCircle-${clickedBorough}]`).dispatch(
          "mouseout"
        );
      } else {
        pieSvg
          .selectAll("path")
          .data(arcs)
          .join("path")
          .transition()
          .duration(500)
          .attr("d", arc)
          .attr("fill", (d) => {
            const borough = d.data.Borough;
            return borough === clickedBorough
              ? selectedBoroughColors[borough]
              : "#a6a6a6";
          });

        let sum;
        let percentage;
        if (toggle) {
          sum = d3.sum(pieData, (d) => d.Rate);
          percentage = (d.data.Rate / sum) * 100;
        } else {
          sum = d3.sum(pieData, (d) => d.Total);
          percentage = (d.data.Total / sum) * 100;
        }

        d3.select("#pie-title").remove();
        d3.select("#percentage").remove();
        pieSvg
          .append("text")
          .attr("id", "percentage")
          .attr("text-anchor", "middle")
          .attr("dominant-baseline", "middle")
          .text(`${percentage.toFixed(2)}%`)
          .style("font-size", "24px")
          .style("font-weight", "bold")
          .style("fill", "black")
          .attr("opacity", 0) // Set initial opacity to 0
          .transition() // Add transition for animation
          .duration(1000) // Set the duration of the animation
          .attr("opacity", 1); // Fade in by changing opacity to 1

        selectedBorough = clickedBorough;

        if (event.isTrusted) {
          let modBorough =
            selectedBorough === "Staten Island"
              ? "StatenIsland"
              : selectedBorough;

          plotBoroughBarChart(modBorough);
          plotRadarPlot();
          treeMap();
          // Tree map
          const boroughBlock = d3
            .selectAll("g[id*='treemap-']")
            .filter((treeBlock, i) =>
              treeBlock.data.name.includes(modBorough) ? true : false
            );
          console.log(boroughBlock);
          const currBorough = boroughBlock._groups[0][0];

          if (currBorough) {
            d3.select(`#${currBorough.id}`).dispatch("click");
          }

          d3.select(`#map-${clickedBorough}`).dispatch("click");
          d3.select(`[class=radarInvisibleCircle-${modBorough}]`).dispatch(
            "mouseover"
          );
        }
      }
    });

  pieSvg
    .append("text")
    .attr("text-anchor", "middle")
    .attr("id", "pie-title")
    .attr("dominant-baseline", "middle")
    .text(toggle ? "Crime Rate" : "Total Crime")
    .style("font-size", "18px")
    .style("font-weight", "bold")
    .style("fill", "black")
    .attr("cursor", "pointer")
    .attr("opacity", 0) // Set initial opacity to 0
    .on("click", () => {
      toggle = !toggle;
      renderPie();
    })
    .transition() // Add transition for animation
    .duration(1000) // Set the duration of the animation
    .attr("opacity", 1); // Fade in by changing opacity to 1
};

export default renderPie;
