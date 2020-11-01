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
      tooltipField: null
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

    node.append("text")
        .attr("dy", "0.31em")
        .attr("x", d => d.children ? -6 : 36)
        .attr("text-anchor", d => d.children ? "end" : "start")
        .text(d => d.data.name)
        .append("tspan")
          .style("fill", "#3eac34")
          .text(d => ` [${this.getNatureFromNode(d.data.value)}]`);
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
        />
        <svg id="event-graph" ref={this.graphRef}></svg>
      </div>
    );
  }
}

export default EventGraph;

//     this.state = {
//       myConfig: {
//         nodeHighlightBehavior: true,
//         node: {
//             color: "lightgreen",
//             size: 3000,
//             fontSize: 14,
//             highlightFontSize: 16,
//             highlightStrokeColor: "blue",
//             labelProperty: (node) => this.myCustomLabelBuilder(node),
//             labelPosition: "center",
//         },
//         link: {
//             highlightColor: "lightblue",
//         },
//         d3: {
//           gravity: -300,
//           linkLength: 100,
//         }
//       },
//     };
//   }

//   getData(){
//     return {
//       nodes: this.getNodes(),
//       links: this.getLinks(),
//     }
//   }

//   getNodes(){
//     const nodes = [];
//     nodes.push({id: "base"});
//     this.props.event.fields.forEach(x => nodes.push({id: x.id}));
//     return nodes;
//   }

//   getLinks(){
//     const links = [];
//     this.props.event.fields.forEach(x => links.push({target: "base", source: x.id}));
//     return links;
//   }

//   myCustomLabelBuilder(node) {
//     if(node.id == "base"){
//       return this.props.event.name;
//     }
//     const field = this.props.event.fields.get(parseInt(node.id))
//     if(field){
//       return field.name;
//     }
//     return node.id;
//   }

//   // graph event callbacks
//   onClickGraph() {
//     console.log(`Clicked the graph background`);
//   };

//   onClickNode(nodeId) {
//     console.log(`Clicked node ${nodeId}`);
//   };

//   onDoubleClickNode(nodeId) {
//     console.log(`Double clicked node ${nodeId}`);
//   };

//   onRightClickNode(event, nodeId) {
//     console.log(`Right clicked node ${nodeId}`);
//   };

//   onMouseOverNode(nodeId) {
//     console.log(`Mouse over node ${nodeId}`);
//   };

//   onMouseOutNode(nodeId) {
//     console.log(`Mouse out node ${nodeId}`);
//   };

//   onClickLink(source, target) {
//     console.log(`Clicked link between ${source} and ${target}`);
//   };

//   onRightClickLink(event, source, target) {
//     console.log(`Right clicked link between ${source} and ${target}`);
//   };

//   onMouseOverLink(source, target) {
//     console.log(`Mouse over in link between ${source} and ${target}`);
//   };

//   onMouseOutLink(source, target) {
//     console.log(`Mouse out link between ${source} and ${target}`);
//   };

//   onNodePositionChange(nodeId, x, y) {
//     console.log(`Node ${nodeId} is moved to new position. New position is x= ${x} y= ${y}`);
//   };

//   render() {
//     return (
//       <Graph
//         id="graph-id" // id is mandatory, if no id is defined rd3g will throw an error
//         data={(() => this.getData())()}
//         config={this.state.myConfig}
//         onClickNode={this.onClickNode}
//         onDoubleClickNode={this.onDoubleClickNode}
//         onRightClickNode={this.onRightClickNode}
//         onClickGraph={() => this.onClickGraph()}
//         onClickLink={this.onClickLink}
//         onRightClickLink={this.onRightClickLink}
//         onMouseOverNode={this.onMouseOverNode}
//         onMouseOutNode={this.onMouseOutNode}
//         onMouseOverLink={this.onMouseOverLink}
//         onMouseOutLink={this.onMouseOutLink}
//         onNodePositionChange={this.onNodePositionChange}
//       />
//     );
//   }
// }

