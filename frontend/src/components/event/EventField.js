import React, { Component } from "react";

class EventField extends Component {
	constructor(props){
		super(props);
		this.state = {
        event: this.props.event,
		}
  }

  render() {
    if(this.props.hidden){
      return null;
    }
    return (
      <div>Event field! for event {this.props.event.name}</div>
    );
  }
}

export default EventField;