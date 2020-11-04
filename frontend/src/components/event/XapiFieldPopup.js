import React, { Component } from "react";
import feather from 'feather-icons/dist/feather';

class XapiFieldPopup extends Component {
  constructor(props) {
    super(props);
  }

  componentDidUpdate(){
    feather.replace();
  }

  render() {
    const field = this.props.field;
    if(!field){
      return null;
    }
    return (
      <div className="popover bs-popover-right" role="tooltip" style={this.props.style} hidden={this.props.xapiTooltipHidden}>
        <div className="arrow" style={{top: "34px"}}></div>
        <h3 className="popover-header">Xapi: {field.name}</h3>
        <div className="popover-body">
          <div className="row">
            <div className="col-md-3">
              {field == this.props.event
              ? <div className="list-group">
                  <button className="btn btn-success my-1" onClick={() => this.props.toggleShowAddField(field)}>Create</button>
                </div>
              : null}
              {field != this.props.event
              ? <div className="list-group">
                  <button className="btn btn-warning my-1" onClick={() => this.props.toggleShowValidateField(field)}>Validate</button>
                  <button className="btn btn-primary my-1" onClick={() => this.props.toggleShowAddField(field)}>Update</button>
                  <button className="btn btn-danger my-1" onClick={() => this.props.deleteEventField(field)}>Delete</button>
                </div>
              : null}
            </div>
            <div className="col-md-9">
              <h6>Description: </h6>
              <div dangerouslySetInnerHTML={{__html: field.description}}></div>
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default XapiFieldPopup;