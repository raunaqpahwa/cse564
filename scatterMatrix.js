import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import { colors, metadata } from "./constants.js";
import debounce from "./utils.js";

const createScatterMatrixTooltip = (k) => {
  return `<p style="font-weight: bold;">• Clusters-</p>
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

const scatterMatrix = async (di, k) => {
  const scatterMatrixData = await axios.get(
    "http://localhost:8000/scattermatrix",
    {
      params: { di, k },
    }
  );
  const scatterMatrix = scatterMatrixData.data;
  const parentContainer = d3.select(".scatter-matrix");
  const svgDiv = d3.select(".scatter-svg");
  svgDiv.selectAll("svg").remove();
  const width = parentContainer.node().clientWidth / 4;
  const height = parentContainer.node().clientHeight / 4 - 10;
  const margin = 30;
  const marginTop = 30;
  const tooltip = d3.select(".tooltip");
  parentContainer
    .on(
      "mouseover",
      debounce((event) => {
        tooltip
          .style("display", "flex")
          .html(`${createScatterMatrixTooltip(k)}`)
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

  const plotSingleCell = (outerFeature, innerFeature) => {
    const svg = svgDiv
      .append("svg")
      .attr("width", width)
      .attr("height", height);

    const xScale = d3
      .scaleLinear()
      .domain([0, 1])
      .range([margin, width - margin]);

    const yScale = d3
      .scaleLinear()
      .domain([0, 1])
      .range([height - marginTop, marginTop]);

    // circle
    svg
      .selectAll(".circle")
      .data(scatterMatrix.clusterLabels)
      .join("circle")
      .attr("cx", (d, i) => xScale(scatterMatrix.values[outerFeature][i]))
      .attr("cy", (d, i) => yScale(scatterMatrix.values[innerFeature][i]))
      .attr("r", 2)
      .attr("fill", (d) => colors[d + 1]);

    svg
      .append("g")
      .attr("transform", `translate(0, ${height - marginTop})`)
      .call(d3.axisBottom(xScale).tickValues([0, 0.2, 0.4, 0.6, 0.8, 1]))
      .call((g) =>
        g
          .append("text")
          .attr("x", width - 20)
          .attr("y", 25)
          .attr("fill", "#71797E")
          .style("font-size", "10px")
          .style("text-decoration", "underline")
          .attr("text-anchor", "end")
          .text(`${metadata[outerFeature]["displayName"]}`)
      );

    svg
      .append("g")
      .attr("transform", `translate(${margin}, 0)`)
      .call(d3.axisLeft(yScale).tickValues([0, 0.2, 0.4, 0.6, 0.8, 1]))
      .call((g) =>
        g
          .append("text")
          .attr("x", margin)
          .attr("y", marginTop - 10)
          .attr("fill", "#71797E")
          .style("font-size", "10px")
          .style("text-decoration", "underline")
          .attr("text-anchor", "end")
          .text(`${metadata[innerFeature]["displayName"]}`)
      );
  };

  for (let outerFeature of scatterMatrix.names) {
    for (let innerFeature of scatterMatrix.names) {
      plotSingleCell(outerFeature, innerFeature);
    }
  }
};

export default scatterMatrix;
