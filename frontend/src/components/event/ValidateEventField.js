import React, { Component } from "react";
import Api from '../../services/api.service';
import { alertService } from '../../services/alert.service';
import { xAPINature, xAPINatures } from '../../common'; 
import $ from 'jquery'


class validateEventField extends Component {
	constructor(props){
    super(props);
    this.api = new Api();
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.state = {
      validate: "",
      tests: [],
      updateTest: null,
      stderr: "",
    }
  }

  componentDidMount(){
    $('#validateEventModal').modal({show: this.props.hidden});
    this.keydownListener = window.addEventListener('keydown', this.handleKeyDown);
  }

  componentWillUnmount(){
    window.removeEventListener('keydown', this.handleKeyDown)
  }

  componentDidUpdate(){
    $('#validateEventModal').modal({show: this.props.hidden})
    if (this.props.field && this.props.field.validate != "" && this.state.validate == "") {
      this.fetchEventFieldTest()
    }
  }

  fetchEventFieldTest() {
    this.api.fetchEventFieldTestByEventField(this.props.field.id).then(tests => {
      if (!tests) return;
      this.setState({
        validate: this.props.field.validate,
        tests: tests.data
      });
      alertService.success('Test and validation function fetched!');
    });
  }

  handleKeyDown(ev) {
    if(this.props.hidden && ev.key == "Escape") {
      this.closeModal()
    }
  }

  closeModal(){
    this.setState({validate: ""});
    this.props.toggleShowValidateField();
  }

  handleValidateChange(event) {
    this.setState({validate: event.target.value});
  }

  handleUpdateTestChange(event, name) {
    const updateTest = this.state.updateTest;
    updateTest[name] = event.target.value;
    this.setState({updateTest});
  }

  submit(e) {
    e.preventDefault();
    this.updateEventField();
  }

  updateEventField() {
    return this.api.updateEventField(this.props.field.id, {validate: this.state.validate}).then(field => {
      if (!field) return;
      this.props.updateField(field);
      alertService.success('EventField: "' + field.name + '" updated with success!');
    });
  }

  toggleUpdateEventFieldTest(test) {
    if (this.state.updateTest && !this.state.updateTest.id){
      return;
    }
    // copy dict = {...dict}
    this.setState({updateTest: {...test}});
  }

  deleteEventFieldTest(test) {
    if(!confirm(`Are you sure to want to delete EventFieldTest with input_data="${test.input_data}" ?`)){
      return;
    };
    this.api.deleteEventFieldTest(test.id).then(response => {
      if (!response) return;
      this.setState((state, props) => ({tests: state.tests.filter((item) => item.id != test.id)}));
      alertService.success(`EventFieldTest with input_data="${test.input_data}" deleted with success!`);
    });
  }

  saveEventFieldTest() {
    const updateTest = this.state.updateTest;
    if (updateTest.id){
      this.api.updateEventFieldTest(updateTest.id, updateTest).then(test => {
        if (!test) return;
        this.setState((state, props) => ({
          tests: state.tests.map(x => x.id == test.id ? test : x),
          updateTest: null
        }));
        alertService.success(`EventFieldTest with input_data="${updateTest.input_data}" updated with success!`);
      });
      return;
    }
    this.api.createEventFieldTest(updateTest).then(test => {
      if (!test) return;
      this.setState((state, props) => ({
        tests: state.tests.map(x => x.id ? x : test),
        updateTest: null
      }));
      alertService.success(`EventFieldTest with input_data="${updateTest.input_data}" created with success!`);
    })
  }

  addEventFieldTest() {
    if (this.state.updateTest && !this.state.updateTest.id){
      return;
    }
    const updateTest = {
      event_field: this.props.field.id,
      input_data: "",
      input_nature: xAPINatures.STRING,
      validation_exception: "",
    }
    this.setState((state, props) => ({updateTest, tests: [updateTest, ...state.tests]}));
  }

  resetEventFieldTest() {
    const newState = {updateTest: null}
    if (!this.state.updateTest.id){
      newState["tests"] =  this.state.tests.filter((item) => item.id);
    }
    this.setState(newState);
  }

  saveAndRunTests() {
    this.updateEventField().then(() => {
      this.api.validateEventField(this.props.field.id).then(res => {
        if (!res) return;
        console.log("the res", res);
        this.setState({stderr: res.stderr});
        alertService.success("Test Executed!");
      });
    });
  }

  render() {
    if (!this.props.field) return null;
    let isDisabled = this.state.updateTest && !this.state.updateTest.id;
    return (
      <div className="modal fade"
          id="validateEventModal"
          data-backdrop="static"
          tabIndex="-1"
          aria-labelledby="staticBackdropLabel"
          aria-hidden={this.props.hidden ? "false": "true"}>
        <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable modal-xl">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="staticBackdropLabel">
                Validate Event Field: <strong>{this.props.field.name}</strong>
              </h5>
              <button type="button" className="close" data-dismiss="modal"
                      aria-label="Close" onClick={() => this.closeModal()}>
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
            <div className="modal-body">
              <h6>Description:</h6>
              <div dangerouslySetInnerHTML={{__html: this.props.field.description}}></div>
              <form id="eventFieldValidateForm" onSubmit={(e) => this.submit(e)}>
                <div className="form-group">
                  <label htmlFor="validate" className="m-0">Validation function:</label><br/>
                  <small className="text-muted mb-1">
                    P.S. the event field is accessible by it's name:
                    <strong>{this.props.field.name}</strong>
                  </small>
                  <textarea
                    className="form-control" rows="10" cols="110" id="validate" name="validate"
                    value={this.state.validate}
                    onChange={(e) => this.handleValidateChange(e)}
                  />
                </div>
              </form>
              <label className="m-0">Tests</label>
              <button type="button" className="btn btn-success btn-sm m-2"
                      onClick={() => this.addEventFieldTest()} disabled={isDisabled}>
                Add
              </button><br/>
              <table className="table">
                <thead>
                  <tr>
                    <th scope="col">Input</th>
                    <th scope="col">Type</th>
                    <th scope="col">Exception</th>
                    <th scope="col">Edit</th>
                  </tr>
                </thead>
                <tbody>
                  {this.state.tests.map(test => {
                    if (this.state.updateTest && this.state.updateTest.id == test.id) {
                      return (
                        <tr key="0">
                        <th scope="row">
                          <input type="text" name="input_data" id="input_data" className="form-control"
                              value={this.state.updateTest.input_data}
                              onChange={(event) => this.handleUpdateTestChange(event, "input_data")} required
                          />
                        </th>
                        <td>
                          <select name="input_nature" className="custom-select" value={this.state.updateTest.input_nature}
                                  onChange={(event) => this.handleUpdateTestChange(event, "input_nature")} required>
                            {(() => {
                              const natures = [];
                              Object.values(xAPINatures).forEach(val => natures.push(
                                <option value={val} key={"nature" + val}>{val}</option>
                              ));
                              return natures;
                            })()}
                          </select>
                        </td>
                        <td>
                          <input type="text" name="validation_exception" id="validation_exception" className="form-control"
                              value={this.state.updateTest.validation_exception}
                              onChange={(event) => this.handleUpdateTestChange(event, "validation_exception")}
                          />
                        </td>
                        <td>
                          <button type="button" className="btn btn-success btn-sm m-2"
                                  onClick={() => this.saveEventFieldTest()}>
                            Save
                          </button>
                          <button type="button" className="btn btn-warning btn-sm m-2"
                                  onClick={() => this.resetEventFieldTest()}>
                            Reset
                          </button>
                        </td>
                      </tr>
                      )
                    }
                    return (
                      <tr key={test.id}>
                        <th scope="row">{test.input_data}</th>
                        <td>{test.input_nature}</td>
                        <td>{test.validation_exception}</td>
                        <td>
                          <button type="button" className="btn btn-primary btn-sm m-2"
                                  onClick={() => this.toggleUpdateEventFieldTest(test)} disabled={isDisabled}>
                            Update
                          </button>
                          <button type="button" className="btn btn-danger btn-sm m-2"
                                  onClick={() => this.deleteEventFieldTest(test)}>
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div>
                <h6>Test output:</h6>
                <pre style={{color: "#c82333", fontWeight: "bold"}}>
                  {this.state.stderr}
                </pre>
              </div>
            </div>
            <div className="modal-footer">
              <a href={`/api/event/code/field/${this.props.field.id}`} className="btn btn-warning" target="_blank">
                Preview tests
              </a>
              <button className="btn btn-success" onClick={() => this.saveAndRunTests()}>
                Save &amp; Run tests
              </button>
              <button form="eventFieldValidateForm" type="submit" className="btn btn-primary">
                Save
              </button>
              <button className="btn btn-danger" onClick={() => this.fetchEventFieldTest()}>
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default validateEventField;