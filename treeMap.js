import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7/+esm'
import { uid } from './uid.js'
import { boroughColors, selectedBoroughColors } from './constants.js'
import barChart from './barChart.js'
import plotBoroughBarChart from './boroughBarChart.js'

const allBoroughs = ['StatenIsland', 'Manhattan', 'Brooklyn', 'Queens', 'Bronx']

let globalTreeMapData = null

const treeMap = async () => {
  if (globalTreeMapData === null) {
    const requestData = await axios.get('http://localhost:8000/tree_map')
    const treeMapData = requestData.data
    globalTreeMapData = treeMapData
  }

  const svg = d3.select('#tree-svg')
  svg.selectAll('*').remove()
  const width = svg.node().clientWidth
  const height = svg.node().clientHeight - 70
  let lastSet = false
  // Test

  function tile (node, x0, y0, x1, y1) {
    d3.treemapBinary(node, 0, 0, width, height)
    for (const child of node.children) {
      child.x0 = x0 + (child.x0 / width) * (x1 - x0)
      child.x1 = x0 + (child.x1 / width) * (x1 - x0)
      child.y0 = y0 + (child.y0 / height) * (y1 - y0)
      child.y1 = y0 + (child.y1 / height) * (y1 - y0)
    }
  }

  const hierarchy = d3
    .hierarchy(globalTreeMapData)
    .sum(d => d.value)
    .sort((a, b) => a.value - b.value)

  const root = d3.treemap().tile(tile)(hierarchy)

  // Create the scales.
  const x = d3.scaleLinear().rangeRound([0, width])
  const y = d3.scaleLinear().rangeRound([0, height])

  // Formatting utilities.
  const format = d3.format(',d')
  const name = d =>
    d
      .ancestors()
      .reverse()
      .map(d => d.data.name)
      .join('/')

  // Display the root.
  let group = svg.append('g').call(render, root)

  function render (group, root) {
    const node = group.selectAll('g').data(root.children.concat(root)).join('g')

    node
      .filter(d => (d === root ? d.parent : d.children))
      .attr('cursor', 'pointer')
      .attr('id', d =>
        allBoroughs.includes(d.data.name) ? `treemap-${d.data.name}` : ''
      )
      .on('click', (event, d) => {
        let returnVal = d === root ? zoomout(root) : zoomin(d)
        if (d.depth === 1 && event.isTrusted) {
          if (d === root) {
            barChart()
          } else {
            plotBoroughBarChart(d.data.name)
          }
          d3.select(`#map-${d.data.name}`).dispatch('click')
        }
        return returnVal
      })

    node.append('title').text(d => `${name(d)}\n${format(d.value)}`)

    node
      .append('rect')
      .attr('id', d => (d.leafUid = uid('leaf')).id)
      .attr('fill', d => {
        if (d === root) {
          return '#FFF'
        }
        if (d.depth === 1) {
          return d.children
            ? boroughColors[d.data.name]
            : selectedBoroughColors[d.name]
        }
        let currParent = d.parent
        while (currParent.depth > 1) {
          currParent = currParent.parent
        }

        return d.children
          ? boroughColors[currParent.data.name]
          : selectedBoroughColors[currParent.data.name]
      })
      .attr('stroke', '#fff')

    node
      .append('clipPath')
      .attr('id', d => (d.clipUid = uid('clip')).id)
      .append('use')
      .attr('xlink:href', d => d.leafUid.href)

    node
      .append('text')
      .attr('clip-path', d => d.clipUid)
      .attr('font-weight', d => (d === root ? 'bold' : null))
      .selectAll('tspan')
      .data(d =>
        d === root
          ? name(d).split().concat(format(d.value))
          : d.data.name.split(/(?=[A-Z][^A-Z])/g).concat(format(d.value))
      )
      .join('tspan')
      .attr('x', 3)
      .attr(
        'y',
        (d, i, nodes) => `${(i === nodes.length - 1) * 0.3 + 1.1 + i * 0.9}em`
      )
      .attr('fill-opacity', (d, i, nodes) =>
        i === nodes.length - 1 ? 0.9 : null
      )
      .attr('font-weight', (d, i, nodes) =>
        i === nodes.length - 1 ? 'bold' : 'normal'
      )
      .attr('fill', (d, i, nodes) => {
        console.log(d)
        if (d.startsWith('Boroughs')) {
          lastSet = true
        }
        return lastSet ? '#000000' : '#000'
      })
      .text(d => d)
    lastSet = false
    group.call(position, root)
  }

  function position (group, root) {
    group
      .selectAll('g')
      .attr('transform', d =>
        d === root
          ? `translate(0, ${height})`
          : `translate(${x(d.x0)},${y(d.y0)})`
      )
      .select('rect')
      .attr('width', d => (d === root ? width : x(d.x1) - x(d.x0)))
      .attr('height', d => (d === root ? 70 : y(d.y1) - y(d.y0)))
  }

  // When zooming in, draw the new nodes on top, and fade them in.
  function zoomin (d) {
    const group0 = group.attr('pointer-events', 'none')
    const group1 = (group = svg.append('g').call(render, d))

    x.domain([d.x0, d.x1])
    y.domain([d.y0, d.y1])

    svg
      .transition()
      .duration(750)
      .call(t => group0.transition(t).remove().call(position, d.parent))
      .call(t =>
        group1
          .transition(t)
          .attrTween('opacity', () => d3.interpolate(0, 1))
          .call(position, d)
      )
  }

  // When zooming out, draw the old nodes on top, and fade them out.
  function zoomout (d) {
    const group0 = group.attr('pointer-events', 'none')
    const group1 = (group = svg.insert('g', '*').call(render, d.parent))

    x.domain([d.parent.x0, d.parent.x1])
    y.domain([d.parent.y0, d.parent.y1])

    svg
      .transition()
      .duration(750)
      .call(t =>
        group0
          .transition(t)
          .remove()
          .attrTween('opacity', () => d3.interpolate(1, 0))
          .call(position, d)
      )
      .call(t => group1.transition(t).call(position, d.parent))
  }
  // Test end
}

export default treeMap
