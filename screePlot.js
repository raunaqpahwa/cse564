import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import biPlot from "./biPlot.js";
import pcTable from "./pcTable.js";

let axis1 = 1,
  axis2 = 2,
  di = null;

const appendDiCircle = (svg, di) => {
  d3.select(".di-circle").remove();
  const diCircle = d3.select(`.scree-circle-${di}`);
  const diCircleX = parseFloat(diCircle.attr("cx"));
  const diCircleY = parseFloat(diCircle.attr("cy"));
  const diCircleRadius = parseFloat(diCircle.attr("r"));

  svg
    .append("circle")
    .attr("class", "di-circle")
    .attr("cx", diCircleX)
    .attr("cy", diCircleY)
    .attr("r", diCircleRadius + 5)
    .style("fill", "none")
    .style("stroke", "#FF69B4")
    .style("stroke-width", 3)
    .style("stroke-dasharray", "4");
};

const screePlot = async () => {
  const screeData = await axios.get("http://localhost:8000/scree");
  const eigenValues = screeData.data.eigenValues;
  const eigenVectors = screeData.data.eigenVectors;
  const lineData = eigenValues.reduce(
    (arr, val, i) => [
      ...arr,
      arr.length > 0 ? val * 100 + arr[i - 1] : val * 100,
    ],
    []
  );
  const eigenValuesIndex = {};
  const lineDataIndex = {};
  for (let i = 0; i < eigenValues.length; i++) {
    eigenValuesIndex[eigenValues[i]] = i + 1;
    lineDataIndex[lineData[i]] = i + 1;
  }

  const svg = d3.select("#scree-svg");
  const width = svg.node().clientWidth;
  const height = svg.node().clientHeight;
  const margin = 50;
  const tooltip = d3.select(".tooltip");

  const xScale = d3
    .scaleBand()
    .domain(eigenValues.map((d, i) => i + 1))
    .range([margin, width - margin])
    .padding(0.2);

  const yScale = d3
    .scaleLinear()
    .domain([0, 100])
    .range([height - margin, margin]);

  const line = d3
    .line()
    .x((d, i) => xScale(i + 1) + xScale.bandwidth() / 2)
    .y((d) => yScale(d));

  // bar
  let cumulativeVariance = 0;

  svg
    .append("g")
    .selectAll(".scree-bar")
    .data(eigenValues)
    .enter()
    .append("rect")
    .attr("class", (d, i) => `scree-bar-${i + 1}`)
    .attr("x", (d, i) => xScale(i + 1))
    .attr("width", xScale.bandwidth())
    .attr("y", (d) => yScale(d * 100))
    .attr("height", (d) => height - margin - yScale(d * 100))
    .attr("fill", (d, i) =>
      i + 1 === axis1 || i + 1 === axis2 ? "#0d233d" : "#0275ff"
    )
    .attr("stroke", (d, i) => {
      cumulativeVariance += d * 100;
      if (cumulativeVariance >= 75 && di === null) {
        di = i + 1;
        return "#FEA601";
      }
      return "";
    })
    .attr("stroke-width", 2)
    .on("mouseover", function (event, d) {
      tooltip
        .html(`Variance: ${parseFloat(d * 100).toFixed(2)}%`)
        .style("left", event.pageX + 15 + "px")
        .style("top", event.pageY - 20 + "px")
        .style("display", "flex");
    })
    .on("mouseleave", function (event, d) {
      tooltip.style("display", "none");
    })
    .on("click", function (event, d) {
      let index = eigenValuesIndex[d];
      d3.select(`.scree-bar-${axis1}`).attr("fill", "#0275ff");
      d3.select(`.scree-bar-${axis2}`).attr("fill", "#0275ff");
      axis1 = axis2;
      axis2 = index;
      d3.select(`.scree-bar-${axis1}`).attr("fill", "#0d233d");
      d3.select(`.scree-bar-${axis2}`).attr("fill", "#0d233d");
      biPlot(axis1, axis2, null, null);
    });

  // line
  svg
    .append("path")
    .attr("fill", "none")
    .attr("stroke", "#0357bf")
    .attr("stroke-miterlimit", 1)
    .attr("stroke-width", 3)
    .attr("d", line(lineData));

  // circles
  let idiNotFound = true;
  svg
    .selectAll(".scree-circle")
    .data(lineData)
    .enter()
    .append("circle")
    .attr("class", (d, i) => `scree-circle-${i + 1}`)
    .attr("cx", (d, i) => xScale(i + 1) + xScale.bandwidth() / 2)
    .attr("cy", (d) => yScale(d))
    .attr("r", 4)
    .style("stroke", function (d) {
      if (d >= 75 && idiNotFound) {
        idiNotFound = false;
        return "#FEA601";
      }
      return "";
    })
    .attr("fill", "#0d233d")
    .attr("stroke-width", 2)
    .on("mouseover", function (event, d) {
      d3.select(this).transition().delay(0).duration(50).attr("r", 7);
      tooltip
        .style("display", "flex")
        .html(`Cumulative Var: ${parseFloat(d).toFixed(2)}%`)
        .style("left", event.pageX + 15 + "px")
        .style("top", event.pageY - 20 + "px");
    })
    .on("mouseleave", function (d) {
      tooltip.style("display", "none");
      d3.select(this).transition().delay(0).duration(200).attr("r", 4);
    })
    .on("click", function (event, d) {
      di = lineDataIndex[d];
      appendDiCircle(svg, di);
      biPlot(axis1, axis2, null, di);
    });

  appendDiCircle(svg, di);

  // x-axis
  svg
    .append("g")
    .attr("transform", `translate(0, ${height - margin})`)
    .call(d3.axisBottom(xScale))
    .call((g) =>
      g
        .append("text")
        .attr("x", width - margin + 20)
        .attr("y", 30)
        .attr("fill", "#71797E")
        .style("font-size", "14px")
        .style("font-weight", 500)
        .style("text-decoration", "underline")
        .attr("text-anchor", "end")
        .text(`Principal Components`)
    );

  // y-axis
  svg
    .append("g")
    .attr("transform", `translate(${margin}, 0)`)
    .call(d3.axisLeft(yScale).tickFormat((d) => d + "%"))
    .call((g) =>
      g
        .append("text")
        .attr("x", -margin + 5)
        .attr("y", 35)
        .style("font-size", "14px")
        .style("font-weight", 500)
        .attr("fill", "#71797E")
        .style("text-decoration", "underline")
        .attr("text-anchor", "start")
        .text(`Explained Variance (%)`)
    );

  // title
  svg
    .append("g")
    .append("text")
    .attr("x", width / 2)
    .attr("y", 20)
    .attr("text-anchor", "middle")
    .style("font-size", "18px")
    .style("text-decoration", "underline")
    .text(`Scree Plot (Dim. Index vs Explained Variance)`);

  // legend
  svg
    .append("rect")
    .attr("width", 20)
    .attr("height", 6)
    .attr("x", width - margin - 155)
    .attr("y", margin + 50)
    .style("fill", "#FEA601")
    .attr("alignment-baseline", "middle")
    .attr("rx", 2)
    .attr("ry", 2);

  svg
    .append("text")
    .attr("x", width - margin - 130)
    .attr("y", margin + 55)
    .text("Intrinsic Dim. Index")
    .style("font-size", "16px")
    .style("font-weight", 500)
    .attr("alignment-baseline", "middle");

  svg
    .append("circle")
    .attr("width", 20)
    .attr("height", 6)
    .attr("cx", width - margin - 145)
    .attr("cy", margin + 73)
    .attr("r", 8)
    .style("fill", "none")
    .style("stroke", "#FF69B4")
    .style("stroke-width", 3)
    .style("stroke-dasharray", "4");

  svg
    .append("text")
    .attr("x", width - margin - 130)
    .attr("y", margin + 75)
    .text("Selected Dim. Index")
    .style("font-size", "16px")
    .style("font-weight", 500)
    .attr("alignment-baseline", "middle");

  svg
    .append("rect")
    .attr("width", 20)
    .attr("height", 6)
    .attr("x", width - margin - 155)
    .attr("y", margin + 90)
    .style("fill", "#0d233d")
    .attr("alignment-baseline", "middle")
    .attr("rx", 2)
    .attr("ry", 2);

  svg
    .append("text")
    .attr("x", width - margin - 130)
    .attr("y", margin + 95)
    .text("Selected PC")
    .style("font-size", "16px")
    .style("font-weight", 500)
    .attr("alignment-baseline", "middle");
};

export default screePlot;
