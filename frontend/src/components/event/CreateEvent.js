import { Editor } from '@tinymce/tinymce-react';
import React, { Component } from "react";
import { getCookie } from '../../utils'

class CreateEvent extends Component {
  constructor(props) {
    super(props);
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
    const csrftoken = getCookie('csrftoken');
    fetch('api/event', {
      credentials: 'include',
      method: 'POST',
      mode: 'same-origin',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-CSRFToken': csrftoken
      },
      body: JSON.stringify({
        name: this.state.name,
        description: this.state.description,
        parent: this.state.parent
      })
    }).then(response => {
      if (response.status > 400) {
        console.log(response.status);
        return this.setState(() => {
          return { placeholder: "Something went wrong!" };
        });
      }
      return response.json();
    }).then(event => {
      this.props.appendEvent(event);
      this.setState({
        name: "",
        description: "",
        parent: ""
      })
      this.editor.setContent('');
    })
  }

  render() {
    return (
      <div className="mt-4">
        <form id="eventCreateForm" action="/" method="POST" onSubmit={(e) => this.submit(e)}>
          <div className="d-flex justify-content-between align-content-center mb-2">
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
            <label htmlFor="name">Description:</label>
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
              {this.props.events.map(event => {
                return(
                  <option value={event.id} key={event.name + event.id}>{event.name}</option>
                )
              })}
            </select>
          </div>
        </form>
      </div>
    );
  }
}

export default CreateEvent;