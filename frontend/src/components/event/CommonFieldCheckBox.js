import React, { Component } from "react";


class CommonFieldCheckBox extends Component {
	constructor(props){
    super(props);
  }

  getIcon(name, color){
    return <span className="mouse-pointer" data-feather={name} style={{height: "1.2em", color}}></span>
  }

  render() {
    return (
      <div className="form-check pl-0 mb-1">
        <div className="form-check form-check-inline">
          <input className="form-check-input" type="checkbox" name="required" id="required"
            checked={this.props.required} onChange={(e)=> this.props.toggleFieldChange(e, "required")}/>
          <label className="form-check-label" htmlFor="required">
            {this.getIcon("alert-triangle", "#f44336")} Required
          </label>
        </div>
        <div className="form-check form-check-inline">
          <input className="form-check-input" type="checkbox" name="allow_none" id="allow_none"
            checked={this.props.allow_none} onChange={(e)=> this.props.toggleFieldChange(e, "allow_none")}/>
          <label className="form-check-label" htmlFor="allow_none">
            {this.getIcon("x-circle", "#2196f3")} Allow None
          </label>
        </div>
        <div className="form-check form-check-inline">
          <input className="form-check-input" type="checkbox" name="excluded" id="excluded"
            checked={this.props.excluded} onChange={(e)=> this.props.toggleFieldChange(e, "excluded")}/>
          <label className="form-check-label" htmlFor="excluded">
            {this.getIcon("external-link", "#ff9800")} Excluded
          </label>
        </div>
      </div>
    )
  }
}

export default CommonFieldCheckBox;