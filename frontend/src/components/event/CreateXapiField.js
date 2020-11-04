import { Editor } from '@tinymce/tinymce-react';
import React, { Component } from "react";
import { alertService } from '../../services/alert.service';
import Api from '../../services/api.service';
import $ from 'jquery'
import { xAPINatures } from '../../common'
import NatureSelect from './NatureSelect';


class CreateXapiField extends Component {
	constructor(props){
    super(props);
    this.api = new Api();
		this.state = {
      name: "",
      parent: "",
      nature: xAPINatures.STRING,
      description: "",
      default: ""
    };
    this.handleKeyDown = this.handleKeyDown.bind(this);
  }

  componentDidMount(){
    $('#createXapiModal').modal({show: this.props.hidden});
    this.keydownListener = window.addEventListener('keydown', this.handleKeyDown);
  }

  componentWillUnmount(){
    window.removeEventListener('keydown', this.handleKeyDown)
  }

  componentDidUpdate(){
    $('#createXapiModal').modal({show: this.props.hidden})
  }

  handleKeyDown(ev) {
    if(this.props.hidden && ev.key == "Escape") {
      this.props.toggleShowAddField();
    }
  }

  handleEditorChange(content, editor){
    this.editor = editor;
    this.setState({description: content});
  }

  handleFieldChange(event, field_name) {
    this.setState({[field_name]: event.target.value});
  }

  submit(e) {
    e.preventDefault();
    const body = {
      event: this.props.event.id,
      name: this.state.name,
      nature: this.state.nature,
      description: this.state.description,
      default: this.state.default,
    }
    this.api.createXAPIField(body).then(eventField => {
      if (!eventField) return;
      alertService.success('xApi Field: "' + eventField.name + '" created with success!');
      this.setState({
        name: "",
        parent: "",
        nature: xAPINatures.STRING,
        description: "",
        default: ""
      })
      this.editor.setContent('');
      this.props.updateField(eventField);
    });
  }

  render() {
    return (
      <div className="modal fade"
          id="createXapiModal"
          data-backdrop="static"
          tabIndex="-1"
          aria-labelledby="staticBackdropLabel"
          aria-hidden={this.props.hidden ? "false": "true"}>
        <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable modal-xl">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="staticBackdropLabel">Create new xApi Field for Event: <strong>{this.props.event.name}</strong></h5>
              <button type="button" className="close" data-dismiss="modal" aria-label="Close" onClick={() => this.props.toggleShowAddField()}>
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
            <div className="modal-body">

              <form id="xapiFieldCreateForm" action="/" method="POST" onSubmit={(e) => this.submit(e)}>
                <div className="form-row">
                  <div className="form-group col-md-6">
                    <label htmlFor="name">Field name:</label>
                    <input type="text" name="name" id="name" className="form-control" value={this.state.name}
                            onChange={(event) => this.handleFieldChange(event, "name")} required/>
                  </div>
                  <NatureSelect
                    nature={this.state.nature}
                    natures={xAPINatures}
                    handleFieldChange={(e, name) => this.handleFieldChange(e, name)}
                  />
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

                  </div>
                </div>
              </form>

            </div>
            <div className="modal-footer">
              <button type="submit" form="xapiFieldCreateForm" className="btn btn-primary">Save</button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default CreateXapiField;