import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import mdsPlot from "./mdsPlot.js";
import pcpPlot from "./pcpPlot.js";

const clusterPlot = async () => {
  const clusterData = await axios.get("http://localhost:8000/cluster");
  const mse = clusterData.data.mse;

  const kValues = [...Object.keys(mse)].map((val) => Number(val));
  const mseValues = [...Object.values(mse)];
  const clusterObj = {};
  for (const clusterNum in mse) {
    clusterObj[mse[clusterNum]] = clusterNum;
  }

  const mseValuesBound = mseValues.reduce(
    (acc, val) => ({
      min: Math.min(val, acc["min"]),
      max: Math.max(val, acc["max"]),
    }),
    { min: Number.MAX_VALUE, max: Number.MIN_VALUE }
  );
  const svg = d3.select("#cluster-svg");
  const width = svg.node().clientWidth;
  const height = svg.node().clientHeight;
  const margin = 50;
  const tooltip = d3.select(".tooltip");

  const xScale = d3
    .scaleBand()
    .domain(kValues)
    .range([margin, width - margin])
    .padding(0.2);

  const yScale = d3
    .scaleLinear()
    .domain([mseValuesBound.min, mseValuesBound.max])
    .range([height - margin, margin]);

  const line = d3
    .line()
    .x((d, i) => xScale(i + 1) + xScale.bandwidth() / 2)
    .y((d) => yScale(d));

  // bar
  svg
    .append("g")
    .selectAll(".cluster-bar")
    .data(mseValues)
    .enter()
    .append("rect")
    .attr("class", "cluster-bar")
    .attr("x", (d, i) => xScale(i + 1))
    .attr("width", xScale.bandwidth())
    .attr("y", (d) => yScale(d))
    .attr("height", (d) => height - margin - yScale(d))
    .attr("fill", (d, i) => {
      if (i + 1 === 4) {
        return "#0d233d";
      }
      return "#0275ff";
    })
    .attr("stroke", (d, i) => {
      if (i + 1 === 4) {
        return "#FEA601";
      }
      return "";
    })
    .attr("stroke-width", 2)
    .on("mouseover", function (event, d) {
      tooltip
        .style("display", "flex")
        .html(`MSE: ${parseFloat(d).toFixed(2)}`)
        .style("left", event.pageX + 15 + "px")
        .style("top", event.pageY - 20 + "px");
    })
    .on("mouseleave", function (event, d) {
      tooltip.style("display", "none");
    })
    .on("click", function (event, d) {
      d3.selectAll(".cluster-bar").style("fill", "#0275ff");
      d3.select(this).style("fill", "#0d233d");
      mdsPlot(clusterObj[d], null);
      pcpPlot(clusterObj[d], null);
    });

  // line
  svg
    .append("path")
    .attr("fill", "none")
    .attr("stroke", "#0357bf")
    .attr("stroke-miterlimit", 1)
    .attr("stroke-width", 3)
    .attr("d", line(mseValues));

  // circle
  svg
    .selectAll(".cluster-circle")
    .data(mseValues)
    .enter()
    .append("circle")
    .attr("class", "cluster-circle")
    .attr("cx", (d, i) => xScale(i + 1) + xScale.bandwidth() / 2)
    .attr("cy", (d) => yScale(d))
    .attr("r", 4)
    .style("stroke", function (d, i) {
      if (i + 1 === 4) {
        return "#FEA601";
      }
      return "";
    })
    .attr("stroke-width", 2)
    .on("mouseover", function (event, d) {
      d3.select(this).transition().delay(0).duration(50).attr("r", 7);
      tooltip
        .style("display", "flex")
        .html(`MSE: ${parseFloat(d).toFixed(2)}`)
        .style("left", event.pageX + 15 + "px")
        .style("top", event.pageY - 20 + "px");
    })
    .on("mouseleave", function (d) {
      tooltip.style("display", "none");
      d3.select(this).transition().delay(0).duration(200).attr("r", 4);
    });

  // title
  svg
    .append("g")
    .append("text")
    .attr("x", width / 2)
    .attr("y", 20)
    .attr("text-anchor", "middle")
    .style("font-size", "18px")
    .style("text-decoration", "underline")
    .text(`Num Clusters vs Mean Squared Error`);

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
        .text(`Num Clusters`)
    );

  // y-axis
  svg
    .append("g")
    .attr("transform", `translate(${margin}, 0)`)
    .call(d3.axisLeft(yScale))
    .call((g) =>
      g
        .append("text")
        .attr("x", -margin + 10)
        .attr("y", 40)
        .style("font-size", "14px")
        .style("font-weight", 500)
        .attr("fill", "#71797E")
        .style("text-decoration", "underline")
        .attr("text-anchor", "start")
        .text(`Mean Squared Error`)
    );

  //legend
  svg
    .append("rect")
    .attr("width", 20)
    .attr("height", 6)
    .attr("x", width - margin - 155)
    .attr("y", margin + 15)
    .style("fill", "#FEA601")
    .attr("alignment-baseline", "middle")
    .attr("rx", 2)
    .attr("ry", 2);

  svg
    .append("text")
    .attr("x", width - margin - 130)
    .attr("y", margin + 20)
    .text("Elbow point")
    .style("font-size", "16px")
    .style("font-weight", 500)
    .attr("alignment-baseline", "middle");

  svg
    .append("rect")
    .attr("width", 20)
    .attr("height", 6)
    .attr("x", width - margin - 155)
    .attr("y", margin + 35)
    .style("fill", "#0d233d")
    .attr("alignment-baseline", "middle")
    .attr("rx", 2)
    .attr("ry", 2);

  svg
    .append("text")
    .attr("x", width - margin - 130)
    .attr("y", margin + 40)
    .text("Selected Cluster Size")
    .style("font-size", "16px")
    .style("font-weight", 500)
    .attr("alignment-baseline", "middle");
};

export default clusterPlot;
