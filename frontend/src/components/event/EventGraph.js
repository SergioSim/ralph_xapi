import React, { Component } from "react";
import * as d3 from "d3";

class EventGraph extends Component {
  constructor(props) {
    super(props);
    this.graphRef = React.createRef();
  }

  componentDidMount() {
    this.updateGraph();
  }

  componentDidUpdate() {
    this.updateGraph();
  }

  updateGraph() {
    const width = 954;
    const name = this.props.event.name;
    const children = [];
    this.props.event.fields.forEach(field => {
      children.push({name: field.name, value: field});
    })
    const root = this.tree({name, children}, width);
    let x0 = Infinity;
    let x1 = -x0;
    root.each(d => {
      if (d.x > x1) x1 = d.x;
      if (d.x < x0) x0 = d.x;
    });
    const startX = - root.dy / 1.5
    const startY = x0 - root.dx;
    d3.selectAll("svg > *").remove();
    const svg = d3.select(this.graphRef.current).attr("viewBox", [startX, - startY, width, x1 - x0 + root.dx * 2]);
    this.populateSvg(svg, root, x0);
  }

  populateSvg(svg, root, x0) {
    const g = svg.append("g")
      .attr("font-family", "sans-serif,Arial Black")
      .attr("font-size", 20);
    
    svg.call(d3.zoom().transform, d3.zoomIdentity);
    svg.call(d3.zoom().on("zoom", function (event) {
      g.attr("transform", event.transform)
    }));

    const link = g.append("g")
      .attr("fill", "none")
      .attr("stroke", "#555")
      .attr("stroke-opacity", 0.5)
      .attr("stroke-width", 2)
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
          .attr("transform", d => `translate(${d.y},${d.x})`);
  
    node.append("circle")
        .attr("fill", d => d.children ? "#555" : "#999")
        .attr("r", 2.5);
  
    node.append("text")
        .attr("dy", "0.31em")
        .attr("x", d => d.children ? -12 : 12)
        .attr("text-anchor", d => d.children ? "end" : "start")
        .text(d => d.data.name)
        .clone(true).lower()
          .attr("stroke", "white");
  }

  tree(data, width) {
    const root = d3.hierarchy(data);
    root.dx = 30;
    root.dy = (width / (root.height + 1)) / 2;
    return d3.tree().nodeSize([root.dx, root.dy])(root);
  }

  render() {
    return (
      <div>
        <svg ref={this.graphRef} height="100%" width="100%" style={{minHeight: "600px"}}></svg>
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

