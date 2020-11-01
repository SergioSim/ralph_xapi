import { Editor } from '@tinymce/tinymce-react';
import React, { Component } from "react";
import { alertService } from '../../services/alert.service';
import Api from '../../services/api.service';
import $ from 'jquery'
import { eventNature, booleanNatures, notSpecialNatures } from '../../common'


class CreateEventField extends Component {
	constructor(props){
    super(props);
    this.api = new Api();
		this.state = {
      name: "",
      nature: eventNature.STRING,
      nature_fields: {},
      description: "",
      required: true,
      allow_none: false,
      excluded: false,
      exploded: true,
      relative: true,
      strict: true,
    }
  }

  componentDidMount(){
    $('#createEventModal').modal({show: this.props.hidden});
    window.addEventListener("keydown", ev => {
      if(this.props.hidden && ev.key == "Escape"){
        this.props.toggleShowAddField();
      }
    });
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
    
    if(notSpecialNatures.includes(this.state.nature)){
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
        <div className="form-group form-check">
          <input className="form-check-input" type="checkbox" name="strict" id="strict"
            checked={this.state.strict} onChange={(e)=> this.toggleFieldChange(e, "strict")}/>
          <label className="form-check-label" htmlFor="strict">
            Strict
          </label>
          <p>
            <small className="text-muted">
              If selected, only integer types are valid. Otherwise, any value castable to int is valid.
            </small>
          </p>
        </div>
      )
    }
    if(this.state.nature == eventNature.URL){
      return (
        <div className="form-group form-check">
          <input className="form-check-input" type="checkbox" name="relative" id="relative"
            checked={this.state.relative} onChange={(e)=> this.toggleFieldChange(e, "relative")}/>
          <label className="form-check-label" htmlFor="relative">
            Relative
          </label>
          <p>
            <small className="text-muted">
              Whether to allow relative URLs.
            </small>
          </p>
        </div>
      )
    }
    if(this.state.nature == eventNature.IPV4){
      return (
        <div className="form-group form-check">
          <input className="form-check-input" type="checkbox" name="exploded" id="exploded"
            checked={this.state.exploded} onChange={(e)=> this.toggleFieldChange(e, "exploded")}/>
          <label className="form-check-label" htmlFor="exploded">
            Exploded
          </label>
          <p>
            <small className="text-muted">
              If selected, serialize ip address in long form, ie. with groups consisting entirely of zeros included.
            </small>
          </p>
        </div>
      )
    }
  }

  submit(e) {
    e.preventDefault();
    const body = {
      event: this.props.event.id,
      name: this.state.name,
      nature: this.state.nature,
      description: this.state.description,
      required: this.state.required,
      allow_none: this.state.allow_none,
    }
    if (notSpecialNatures.includes(this.state.nature)) {
      this.sendSubmit(body);
      return;
    }
    if (booleanNatures.includes(this.state.nature)) {
      let valueNameRoute = {
        [eventNature.IPV4]: {value: this.state.exploded, name: "exploded", route: (body) => this.api.createIpv4Nature(body)},
        [eventNature.URL]: {value: this.state.relative, name: "relative", route: (body) => this.api.createUrlNature(body)},
        [eventNature.INTEGER]: {value: this.state.strict, name: "strict", route: (body) => this.api.createIntegerNature(body)},
      }[this.state.nature];
      let natures = this.props.natures.get(this.state.nature);
      natures.forEach(function(value, key) {
        if (value[valueNameRoute.name] == valueNameRoute.value) {
          body.nature_id =  key;
        }
      });
      if(body.nature_id){
        this.sendSubmit(body);
        return;
      }
      valueNameRoute.route({[valueNameRoute.name]: valueNameRoute.value}).then(nature => {
        if(!nature) return;
        alertService.success('New ' + this.state.nature + ' Nature created: "' + nature.id + '"!');
        body.nature_id = nature.id;
        this.props.updateNature(this.state.nature, nature);
        this.sendSubmit(body);
      });
    }
    
  }

  sendSubmit(body){
    this.api.createEventField(body).then(eventField => {
      if (!eventField) return;
      alertService.success('EventField: "' + eventField.name + '" created with success!');
      this.setState({
        name: "",
        nature: eventNature.STRING,
        nature_fields: {},
        description: "",
        required: true,
        allow_none: false,
        exploded: true,
        relative: true,
        strict: true,
      })
      this.editor.setContent('');
      this.props.updateField(eventField);
      document.getElementById("eventFieldCreateForm").reset();
    });
  }

  render() {
    return (
      <div className="modal fade"
          id="createEventModal"
          data-backdrop="static"
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
                        <label className="form-check-label" htmlFor="required">
                          <span className="mouse-pointer" data-feather="alert-triangle" style={{height: "1.2em", color: "#f44336"}}></span> Required
                        </label>
                      </div>
                      <div className="form-check form-check-inline">
                        <input className="form-check-input" type="checkbox" name="allow_none" id="allow_none"
                          checked={this.state.allow_none} onChange={(e)=> this.toggleFieldChange(e, "allow_none")}/>
                        <label className="form-check-label" htmlFor="allow_none">
                          <span className="mouse-pointer" data-feather="circle" style={{height: "1.2em", color: "#2196f3"}}></span> Allow None
                        </label>
                      </div>
                    </div>
                    {this.renderNatureFields()}
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