import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import { colors, variableColors, metadata } from "./constants.js";
import pcTable from "./pcTable.js";
import debounce from "./utils.js";

let globalDi = 5,
  globalK = 4,
  globalAxis1 = 1,
  globalAxis2 = 2;

const createBiplotTooltip = (k) => {
  return `<p style="font-weight: bold;">• Features (Scaled x5)-</p>
            <ul style="list-style-type: none;">
                ${Object.keys(variableColors)
                  .map(
                    (variableColor) =>
                      `<li style="display: flex; align-items: center;">${metadata[variableColor]["displayName"]} 
                        <div style="width: 15px; height: 5px; background-color: ${variableColors[variableColor]}; display: inline-block; margin-left: 5px; border-radius: 2px;">
                        </div>
                      </li>`
                  )
                  .join("")}
            </ul>
            <p style="font-weight: bold;">• Clusters-</p>
            <ul style="list-style-type: none;">
                    ${Object.keys(colors)
                      .map((color, i) =>
                        i + 1 <= k
                          ? `<li style="display: flex; align-items: center;">Cluster ${
                              i + 1
                            } 
                    <div style="width: 15px; height: 5px; background-color: ${
                      colors[color]
                    }; display: inline-block; margin-left: 5px; border-radius: 2px;">
                    </div>
                  </li>`
                          : null
                      )
                      .filter((val) => val !== null)
                      .join("")}
            </ul>`;
};

const biPlot = async (axis1, axis2, k, di) => {
  if (axis1 > axis2) {
    [axis1, axis2] = [axis2, axis1];
  }
  if (axis1 === null) {
    axis1 = globalAxis1;
  } else {
    globalAxis1 = axis1;
  }
  if (axis2 === null) {
    axis2 = globalAxis2;
  } else {
    globalAxis2 = axis2;
  }
  if (k === null) {
    k = globalK;
  } else {
    globalK = k;
  }
  if (di === null) {
    di = globalDi;
  } else {
    globalDi = di;
  }

  const axiosData = await axios.get("http://localhost:8000/biplot", {
    params: { axis1, axis2, k },
  });

  const biplotData = axiosData.data;

  const svg = d3.select("#biplot-svg");
  const width = svg.node().clientWidth;
  const height = svg.node().clientHeight;
  const margin = 20;
  const tooltip = d3.select(".tooltip");

  svg.selectAll("*").remove();

  const xScale = d3
    .scaleLinear()
    .domain([-1, 1])
    .range([margin, width - margin]);

  const yScale = d3
    .scaleLinear()
    .domain([-1, 1])
    .range([height - margin, margin]);

  svg
    .on(
      "mouseover",
      debounce((event) => {
        tooltip
          .style("display", "flex")
          .html(`${createBiplotTooltip(k)}`)
          .style("left", event.pageX + 15 + "px")
          .style("top", event.pageY - 100 + "px");
      }, 500)
    )
    .on(
      "mouseout",
      debounce((event) => {
        tooltip.style("display", "none").html("");
      }, 500)
    );

  // arrows
  svg
    .selectAll("marker")
    .data(biplotData.features)
    .enter()
    .append("marker")
    .attr("id", (d, i) => `arrow-${i}`)
    .attr("markerWidth", 3)
    .attr("markerHeight", 3)
    .attr("refX", 1)
    .attr("refY", 1.5)
    .attr("orient", "auto")
    .append("path")
    .attr("d", "M0,0 L0,3 L3,1.5 z")
    .style("fill", (d) => variableColors[d.name]);

  // line
  svg
    .selectAll("line")
    .data(biplotData.features)
    .enter()
    .append("line")
    .attr("x1", width / 2)
    .attr("y1", height / 2)
    .attr("x2", (d) => xScale(d.axis1))
    .attr("y2", (d) => yScale(d.axis2))
    .attr("stroke", (d) => variableColors[d.name])
    .attr("stroke-width", 2)
    .attr("marker-end", (d, i) => `url(#arrow-${i})`);

  // circle
  svg
    .selectAll(".biplot-circle")
    .data(biplotData.points)
    .enter()
    .append("circle")
    .attr("cx", (d) => xScale(d.axis1))
    .attr("cy", (d) => yScale(d.axis2))
    .attr("r", 2)
    .attr("fill", (d) => colors[d.pointK]);

  // title
  svg
    .append("g")
    .append("text")
    .attr("x", 40)
    .attr("y", margin + 10)
    .attr("text-anchor", "middle")
    .style("font-size", "18px")
    .style("text-decoration", "underline")
    .text(`Biplot`);

  // x-axis
  svg
    .append("g")
    .attr("transform", `translate(0, ${height / 2})`)
    .call(d3.axisBottom(xScale))
    .call((g) =>
      g
        .append("text")
        .attr("x", width - margin)
        .attr("y", 30)
        .attr("fill", "#71797E")
        .style("font-size", "14px")
        .style("font-weight", 500)
        .style("text-decoration", "underline")
        .attr("text-anchor", "end")
        .text(`PC ${axis1}`)
    );

  // y-axis
  svg
    .append("g")
    .attr("transform", `translate(${width / 2}, 0)`)
    .call(d3.axisLeft(yScale))
    .call((g) =>
      g
        .append("text")
        .attr("x", 40)
        .attr("y", 30)
        .attr("fill", "#71797E")
        .style("font-size", "14px")
        .style("font-weight", 500)
        .style("text-decoration", "underline")
        .attr("text-anchor", "end")
        .text(`PC ${axis2}`)
    );

  svg
    .append("text")
    .attr("x", width - margin - 5)
    .attr("y", 30)
    .attr("fill", "#71797E")
    .style("font-size", "14px")
    .style("font-weight", 700)
    .style("text-decoration", "underline")
    .attr("text-anchor", "end")
    .text("Hover for legend");

  pcTable(di, k);
};

export default biPlot;
