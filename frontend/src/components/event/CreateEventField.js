import { Editor } from '@tinymce/tinymce-react';
import React, { Component } from "react";
import { getCookie } from '../../utils'
import { alertService } from '../../services/alert.service';
import $ from 'jquery'

const eventNature = {
  // Should be the same as on server side!
  FIELD:    "Field",
  NESTED:   "Nested",
  DICT:     "Dict",
  LIST:     "List",
  STRING:   "String",
  UUID:     "UUID",
  INTEGER:  "Integer",
  BOOLEAN:  "Boolean",
  DATETIME: "DateTime",
  URL:      "Url",
  EMAIL:    "Email",
  IPV4:     "IPv4"
}

class CreateEventField extends Component {
	constructor(props){
		super(props);
		this.state = {
      name: "",
      nature: eventNature.STRING,
      nature_fields: {},
      description: "",
      required: true,
      allow_none: false,
      excluded: false,
		}
  }

  componentDidMount(){
    $('#createEventModal').modal({show: this.props.hidden})
  }

  componentDidUpdate(){
    $('#createEventModal').modal({show: this.props.hidden})
  }

  handleEditorChange(content, editor){
    this.editor = editor;
    this.setState({description: content});
  }

  handleFieldChange(event, field_name) {
    this.setState({[field_name]: event.target.value});
  }

  toggleFieldChange(event, field_name){
    this.setState((state, props) => ({[field_name]: !state[field_name]}))
  }

  renderNatureFields(){
    const notSpecial = [
      eventNature.STRING,
      eventNature.UUID,
      eventNature.BOOLEAN,
      eventNature.DATETIME,
      eventNature.EMAIL
    ];
    if(this.state.nature in notSpecial){
      return;
    }
    // TODO: Render for each nature it's custom fields
    if(this.state.nature == eventNature.NESTED){
      return (
        <span>Input: event_id, exclude</span>
      )
    }
    if(this.state.nature == eventNature.DICT){
      return (
        <span>Input: keys, values</span>
      )
    }
    if(this.state.nature == eventNature.LIST){
      return (
        <span>Input: event_field</span>
      )
    }
    if(this.state.nature == eventNature.INTEGER){
      return (
        <span>Input: strict</span>
      )
    }
    if(this.state.nature == eventNature.URL){
      return (
        <span>Input: relative</span>
      )
    }
    if(this.state.nature == eventNature.IPV4){
      return (
        <span>Input: exploded</span>
      )
    }
  }

  submit(e) {
    e.preventDefault();
    const event_id = this.props.event.id;
    const csrftoken = getCookie('csrftoken');
    fetch('api/event/field/', {
      credentials: 'include',
      method: 'POST',
      mode: 'same-origin',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-CSRFToken': csrftoken
      },
      body: JSON.stringify({
        event: this.props.event.id,
        name: this.state.name,
        nature: this.state.nature,
        description: this.state.description,
        required: this.state.required,
        allow_none: this.state.allow_none,
      })
    }).then(response => {
      this.statusCode = response.status;
      if (response.status > 400) {
        return;
      }
      return response.json();
    }).then(eventField => {
      if (!eventField){
        alertService.error("Some thing is wrong :( Status " + this.statusCode);
        return;
      }
      if(this.statusCode != 201){
        alertService.error(JSON.stringify(eventField));
        return;
      }
      alertService.success('Event: "' + eventField.name + '" created with success!');
      this.setState({
        name: "",
        nature: eventNature.STRING,
        nature_fields: {},
        description: "",
        required: true,
        allow_none: false
      })
      this.editor.setContent('');
      this.props.updateField(eventField);
    })
  }

  render() {
    return (
      <div className="modal fade"
          id="createEventModal"
          data-backdrop="static"
          data-keyboard="false"
          tabIndex="-1"
          aria-labelledby="staticBackdropLabel"
          aria-hidden={this.props.hidden ? "false": "true"}>
        <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable modal-xl">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="staticBackdropLabel">Create new Field for Event: <strong>{this.props.event.name}</strong></h5>
              <button type="button" className="close" data-dismiss="modal" aria-label="Close" onClick={() => this.props.toggleShowAddField()}>
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
            <div className="modal-body">

              <form id="eventFieldCreateForm" action="/" method="POST" onSubmit={(e) => this.submit(e)}>
                <div className="form-row">
                  <div className="form-group col-md-6">
                    <label htmlFor="name">Field name:</label>
                    <input type="text" name="name" id="name" className="form-control" value={this.state.name}
                            onChange={(event) => this.handleFieldChange(event, "name")} required/>
                  </div>
                  <div className="form-group col-md-6">
                    <label htmlFor="nature">Field type</label>
                    <select name="nature" className="custom-select" value={this.state.nature}
                            onChange={(event) => this.handleFieldChange(event, "nature")} required>
                      {(() => {
                        const natures = [];
                        Object.values(eventNature).forEach(val => natures.push(
                          <option value={val} key={"nature" + val}>{val}</option>
                        ));
                        return natures;
                      })()}\
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group col-md-6">
                    <label htmlFor="description">Description:</label>
                    <Editor
                      initialValue=""
                      init={{height: 300}}
                      onEditorChange={(content, editor) => this.handleEditorChange(content, editor)}
                      textareaName='description'
                    />
                  </div>
                  <div className="form-group col-md-6 mt-n1">
                    <div className="form-check pl-0 mb-1">
                      <div className="form-check form-check-inline">
                        <input className="form-check-input" type="checkbox" name="required" id="required"
                          checked={this.state.required} onChange={(e)=> this.toggleFieldChange(e, "required")}/>
                        <label className="form-check-label" htmlFor="required">Required</label>
                      </div>
                      <div className="form-check form-check-inline">
                        <input className="form-check-input" type="checkbox" name="allow_none" id="allow_none"
                          checked={this.state.allow_none} onChange={(e)=> this.toggleFieldChange(e, "allow_none")}/>
                        <label className="form-check-label" htmlFor="Allow None">Allow None</label>
                      </div>
                    </div>
                    <div className="form-group form-check">
                      {this.renderNatureFields()}
                    </div>
                  </div>
                </div>
              </form>

            </div>
            <div className="modal-footer">
              <button type="submit" form="eventFieldCreateForm" className="btn btn-primary">Save</button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default CreateEventField;