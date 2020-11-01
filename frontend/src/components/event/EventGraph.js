import './EventGraph.css';
import React, { Component } from "react";
import * as d3 from "d3";
import feather from 'feather-icons/dist/feather';
import { data } from 'jquery';
import EventFieldPopup from './EventFieldPopup';

class EventGraph extends Component {
  constructor(props) {
    super(props);
    this.state = {
      tooltipStyle: {
        top: 0,
        left: 0,
        opacity: 0
      },
      tooltipField: null,
      showExcluded: true,
    }
    this.graphRef = React.createRef();
    this.tooltipChange = false;
    this.clickedOnNode = false;
  }

  componentDidMount() {
    this.updateGraph();
  }

  componentDidUpdate() {
    if(!this.tooltipChange) {
      this.updateGraph();
    }
    this.tooltipChange = false;
  }

  updateGraph() {
    const width = 954;
    const name = this.props.event.name;
    const children = [];
    this.props.event.fields.forEach(field => {
      if(!this.state.showExcluded && field.excluded){
        return;
      }
      children.push({name: field.name, value: field});
    })
    children.sort((a, b) => {
      var textA = a.name.toUpperCase();
      var textB = b.name.toUpperCase();
      return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
    });
    const root = this.tree({name, children, value: this.props.event}, width);
    let x0 = Infinity;
    let x1 = -x0;
    root.each(d => {
      if (d.x > x1) x1 = d.x;
      if (d.x < x0) x0 = d.x;
    });
    const startX = - root.dy / 1.5
    d3.selectAll(this.graphRef.current.children).remove();
    const svg = d3.select(this.graphRef.current).attr("viewBox", [startX, 0, width, root.dx * 2]);
    this.populateSvg(svg, root, x0);
    feather.replace();
  }

  populateSvg(svg, root, x0) {
    svg.on("click", () => this.removeTooltip());
    const g = svg.append("g");
    
    this.tooltipTransformX = 0;
    this.tooltipTransformY = 0;
    svg.call(d3.zoom().transform, d3.zoomIdentity);
    svg.call(d3.zoom().on("zoom", (event) => {
      const pos = event.transform;
      const tootip = this.state.tooltipStyle;
      g.attr("transform", pos);
      this.tooltipChange = true;
      this.tooltipTransformX = pos.x;
      this.tooltipTransformY = pos.y;
      this.setState({tooltipStyle: {
        top: tootip.top,
        left: tootip.left,
        opacity: tootip.opacity,
        transform: "translate(" + this.tooltipTransformX + "px, " + this.tooltipTransformY + "px)",
      }});
    }));

    const link = g.append("g")
      .attr("fill", "none")
      .attr("stroke", "#ccc")
      .attr("stroke-width", "2px")
      .selectAll("path")
        .data(root.links())
        .join("path")
          .attr("d", d3.linkHorizontal()
              .x(d => d.y)
              .y(d => d.x));
    
    const node = g.append("g")
        .attr("stroke-linejoin", "round")
        .attr("stroke-width", 3)
        .selectAll("g")
        .data(root.descendants())
        .join("g")
          .attr("class", "node")
          .attr("transform", d => `translate(${d.y},${d.x})`)
          .on("click", (treeNode, d) => this.clickNode(treeNode, d));
  
    node.append("span")
        .style("color", d => d.data.value.required ? "#f44336" : "#ccc")
        .attr("data-feather", "alert-triangle")
        .attr("width", 20)
        .attr("x", 12)
        .attr("y", -12);
  
    node.append("span")
        .style("color", d => d.data.value.allow_none ? "#ccc" : "#2196f3")
        .attr("data-feather", "x-circle")
        .attr("width", 20)
        .attr("x", -6)
        .attr("y", -12);

    const text = node.append("text")
        .attr("dy", "0.31em")
        .attr("x", d => d.children ? -6 : 36)
        .attr("text-anchor", d => d.children ? "end" : "start")
        .style("fill", d => d.data.value.excluded ? "#ccc" : "#212529")
        .text(d => d.data.name);

    text.append("tspan")
          .style("fill", "#3eac34")
          .text(d => ` [${this.getNatureFromNode(d.data.value)}]`);
    
    text.clone(true).lower().attr("stroke", "white");
  }

  getNatureFromNode(node){
    if (typeof node.nature !== 'undefined'){
      return node.nature;
    }
    return "Event";
  }

  tree(data, width) {
    const root = d3.hierarchy(data);
    root.dx = 30;
    root.dy = (width / (root.height + 1)) / 2;
    return d3.tree().nodeSize([root.dx, root.dy])(root);
  }

  clickNode(event, treeNode){
    this.tooltipChange = true;
    this.clickedOnNode = true;
    this.setState({
      tooltipStyle: {
        top: (event.layerY - this.tooltipTransformY - 50),
        left: (event.layerX - this.tooltipTransformX),
        opacity: 1,
        transform: "translate(" + this.tooltipTransformX + "px, " + this.tooltipTransformY + "px)",
      },
      tooltipField: treeNode.data.value
    });
  }

  removeTooltip(){
    // is run after the clickNode!
    if(this.clickedOnNode){
      this.clickedOnNode = false;
      return;
    }
    this.tooltipChange = true;
    this.setState({tooltipStyle: {opacity: 0}})
  }

  toggleShowAddField(field) {
    this.setState({tooltipStyle: {opacity: 0}});
    this.props.toggleShowAddField(field);
  }

  deleteEventField(field) {
    this.props.deleteEventField(field, () => {
      this.setState({tooltipStyle: {opacity: 0}});
    });
  }

  toggleShowExcluded() {
    this.setState((state, props) => ({showExcluded: !state.showExcluded}));
  }

  render() {
    return (
      <div>
        <EventFieldPopup
        event={this.props.event}
        natures={this.props.natures}
        field={this.state.tooltipField}
        style={this.state.tooltipStyle}
        toggleShowAddField={(field) => this.toggleShowAddField(field)}
        deleteEventField={(field) => this.deleteEventField(field)}
        showExcluded={this.state.showExcluded}
        toggleShowExcluded={(showExcluded) => this.toggleShowExcluded(showExcluded)}
        />
        <svg id="event-graph" ref={this.graphRef}></svg>
      </div>
    );
  }
}

export default EventGraph;
