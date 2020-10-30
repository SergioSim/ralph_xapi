import { Editor } from '@tinymce/tinymce-react';
import React, { Component } from "react";
import { alertService } from '../../services/alert.service';
import Api from '../../services/api.service';

class CreateEvent extends Component {
  constructor(props) {
    super(props);
    this.api = new Api();
    this.state = {
      name: "",
      description: "",
      parent: ""
    }
  }

  handleNameChange(event) {
    this.setState({name: event.target.value});
  }

  handleParentChange(event) {
    this.setState({parent: event.target.value});
  }

  handleEditorChange(content, editor){
    this.editor = editor;
    this.setState({description: content});
  }

  submit(e){
    e.preventDefault();
    const body = {
      name: this.state.name,
      description: this.state.description,
      parent: this.state.parent
    };
    this.api.createEvent(body).then(event => {
      if(!event) return;
      event.fields = new Map();
      this.props.updateEvent(event);
      this.setState({name: "", description: "", parent: ""});
      this.editor.setContent('');
      alertService.success('Event: "' + event.name + '" created with success!');
      document.getElementById("eventCreateForm").reset();
    });
  }

  render() {
    return (
      <div className="container mt-4">
        <form id="eventCreateForm" action="/" method="POST" onSubmit={(e) => this.submit(e)}>
          <div className="d-flex justify-content-between align-content-center mb-2 ml-3">
            <h2>Create a new Event!</h2>
            <button type="submit" from="eventCreateForm" className="btn btn-primary">Save</button>
          </div>
          <div className="form-group form-check">
            <label htmlFor="name">Event name:</label>
            <input type="text" className="form-control" id="name"
              aria-describedby="nameHelp" value={this.state.name} onChange={(event) => this.handleNameChange(event)} required/>
            <small id="nameHelp" className="form-text text-muted">Should be unique</small>
          </div>
          <div className="form-group form-check">
            <label htmlFor="description">Description:</label>
            <Editor
              initialValue=""
              init={{height: 500}}
              onEditorChange={(content, editor) => this.handleEditorChange(content, editor)}
              textareaName='description'
            />
          </div>
          <div className="form-group form-check">
            <select className="custom-select" size="5" value={this.state.parent}
                    onChange={(event) => this.handleParentChange(event)}>
              <option>No Parent</option>
              {(() => {
                const events = [];
                this.props.events.forEach(event => events.push(
                  <option value={event.id} key={event.name + event.id}>{event.name}</option>
                ));
                return events;
              })()}
            </select>
          </div>
        </form>
      </div>
    );
  }
}

export default CreateEvent;