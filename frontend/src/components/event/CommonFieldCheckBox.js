import React, { Component } from "react";


class CommonFieldCheckBox extends Component {
	constructor(props){
    super(props);
  }

  render() {
    return (
      <div className="form-check pl-0 mb-1">
        <div className="form-check form-check-inline">
          <input className="form-check-input" type="checkbox" name="required" id="required"
            checked={this.props.required} onChange={(e)=> this.props.toggleFieldChange(e, "required")}/>
          <label className="form-check-label" htmlFor="required">
            <span className="mouse-pointer" data-feather="alert-triangle" style={{height: "1.2em", color: "#f44336"}}></span> Required
          </label>
        </div>
        <div className="form-check form-check-inline">
          <input className="form-check-input" type="checkbox" name="allow_none" id="allow_none"
            checked={this.props.allow_none} onChange={(e)=> this.props.toggleFieldChange(e, "allow_none")}/>
          <label className="form-check-label" htmlFor="allow_none">
            <span className="mouse-pointer" data-feather="circle" style={{height: "1.2em", color: "#2196f3"}}></span> Allow None
          </label>
        </div>
        <div className="form-check form-check-inline">
          <input className="form-check-input" type="checkbox" name="excluded" id="excluded"
            checked={this.props.excluded} onChange={(e)=> this.props.toggleFieldChange(e, "excluded")}/>
          <label className="form-check-label" htmlFor="excluded">
            <span className="mouse-pointer" data-feather="external-link" style={{height: "1.2em", color: "#ff9800"}}></span> Excluded
          </label>
        </div>
      </div>
    )
  }
}

export default CommonFieldCheckBox;