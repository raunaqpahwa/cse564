import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7/+esm'
import { boroughColors, selectedBoroughColors, metadata } from './constants.js'
import renderMap from './map.js'
import plotBoroughBarChart from './boroughBarChart.js'
import treeMap from './treeMap.js'
import barChart from './barChart.js'

boroughColors['Staten Island'] = '#FFEB3B'

let pieData = await d3.csv('./crimes.csv')

let selectedBorough = null

const renderPie = () => {
  const svg = d3.select('#pie-svg')
  const width = svg.node().clientWidth
  const height = svg.node().clientHeight

  const tooltip = d3.select('.tooltip')
  tooltip.html('').style('display', 'none')

  const pie = d3.pie().value(d => d.Rate)
  const arcs = pie(pieData)

  const radius = Math.min(width, height) / 2
  const innerRadius = radius * 0.6 // Set the inner radius for the donut chart
  const arc = d3.arc().innerRadius(innerRadius).outerRadius(radius)

  const pieSvg = svg
    .append('g')
    .attr('transform', `translate(${width / 2}, ${height / 2})`)

  pieSvg
    .selectAll('path')
    .data(arcs)
    .join('path')
    .attr('d', arc)
    .attr('id', d => `pie-${d.data.Borough}`)
    .attr('fill', (d, i) => {
      const borough = d.data.Borough
      return boroughColors[borough] || 'gray'
    })
    .attr('stroke', 'white')
    .attr('stroke-width', 2)
    .on('mouseover', (e, d) => {
      tooltip
        .style('display', 'flex')
        .html(`<strong>${d.data.Borough}</strong><br>${d.data.Rate} crimes`)
        .style('left', e.pageX + 15 + 'px')
        .style('top', e.pageY - 20 + 'px')
    })
    .on('mouseout', () => {
      tooltip.html('').style('display', 'none')
    })
    .attr('fill', d => {
      const borough = d.data.Borough
      return selectedBorough === null || selectedBorough === borough
        ? boroughColors[borough]
        : '#a6a6a6'
    })
    .on('click', (event, d) => {
      let clickedBorough = d.data.Borough
      // console.log(clickedBorough)

      if (selectedBorough === clickedBorough) {
        selectedBorough = null
        pieSvg
          .selectAll('path')
          .data(arcs)
          .join('path')
          .attr('d', arc)
          .attr('fill', d => {
            const borough = d.data.Borough
            return boroughColors[borough]
          })
        barChart()
        renderMap()
        treeMap()
        d3.select(`#map-${clickedBorough}`).dispatch('click')
      } else {
        pieSvg
          .selectAll('path')
          .data(arcs)
          .join('path')
          .attr('d', arc)
          .attr('fill', d => {
            const borough = d.data.Borough
            return borough === clickedBorough
              ? selectedBoroughColors[borough]
              : '#a6a6a6'
          })

        selectedBorough = clickedBorough
        if (event.isTrusted) {
          let modBorough =
            selectedBorough === 'Staten Island'
              ? 'StatenIsland'
              : selectedBorough

          plotBoroughBarChart(modBorough)
          treeMap()
          // Tree map
          const boroughBlock = d3
            .selectAll("g[id*='treemap-']")
            .filter((treeBlock, i) =>
              treeBlock.data.name.includes(modBorough) ? true : false
            )
          console.log(boroughBlock)
          const currBorough = boroughBlock._groups[0][0]

          if (currBorough) {
            d3.select(`#${currBorough.id}`).dispatch('click')
          }

          d3.select(`#map-${clickedBorough}`).dispatch('click')
        }
      }
    })

  pieSvg
    .append('text')
    .attr('text-anchor', 'middle')
    .attr('dominant-baseline', 'middle')
    .text('Crime Rate')
    .style('font-size', '20px')
    .style('font-weight', 'bold')
    .style('fill', 'black')
}

export default renderPie
