import React, { Component } from "react";
import Api from '../../services/api.service';
import { alertService } from '../../services/alert.service';
import { xAPINature, xAPINatures } from '../../common'; 
import $ from 'jquery'


class ValidateEventField extends Component {
	constructor(props){
    super(props);
    this.api = new Api();
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.state = {
      validate: "",
      tests: new Map(),
      updateTest: null,
      stderr: "",
      testColors: new Map(),
      testMessages: new Map(),
    }
    this.userClearedValidate = false;
  }

  componentDidMount(){
    $('#validateEventModal').modal({show: this.props.hidden});
    this.keydownListener = window.addEventListener('keydown', this.handleKeyDown);
    this.userClearedValidate = false;
  }

  componentWillUnmount(){
    window.removeEventListener('keydown', this.handleKeyDown)
  }

  componentDidUpdate(){
    $('#validateEventModal').modal({show: this.props.hidden})
    if (this.props.field && this.props.field.validate != "" && this.state.validate == "" && !this.userClearedValidate) {
      this.fetchEventFieldTest()
    }
  }

  fetchEventFieldTest() {
    this.api.fetchEventFieldTestByEventField(this.props.field.id).then(tests => {
      if (!tests) return;
      this.setState({
        validate: this.props.field.validate,
        tests: new Map(tests.data.map(x => [x.id, x]))
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
    if (event.target.value == "") {
      this.userClearedValidate = true;
    } else {
      this.userClearedValidate = false;
    }
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
    if (this.hasAddedTest()){
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
      this.setState((state, props) => {
        state.tests.delete(test.id);
        return {};
      });
      alertService.success(`EventFieldTest with input_data="${test.input_data}" deleted with success!`);
    });
  }

  saveEventFieldTest() {
    const updateTest = this.state.updateTest;
    if (updateTest.id){
      this.updateEventFieldTest(updateTest);
      return;
    }
    this.createEventFieldTest(updateTest)
  }

  createEventFieldTest(updateTest) {
    this.api.createEventFieldTest(updateTest).then(test => {
      if (!test) return;
      this.setState((state, props) => {
        state.tests.delete("updateTest");
        return {
          tests: state.tests.set(test.id, test),
          updateTest: null
        }
      });
      alertService.success(`EventFieldTest with input_data="${updateTest.input_data}" created with success!`);
    })
  }

  updateEventFieldTest(updateTest) {
    this.api.updateEventFieldTest(updateTest.id, updateTest).then(test => {
      if (!test) return;
      this.setState((state, props) => ({
        tests: state.tests.set(test.id, test),
        updateTest: null
      }));
      alertService.success(`EventFieldTest with input_data="${updateTest.input_data}" updated with success!`);
    });
    return;
  }

  addEventFieldTest() {
    if (this.hasAddedTest()){
      return;
    }
    const updateTest = {
      event_field: this.props.field.id,
      input_data: "",
      input_nature: xAPINatures.STRING,
      validation_exception: "",
    }
    this.setState((state, props) => ({updateTest, tests: state.tests.set("updateTest", updateTest)}));
  }

  resetEventFieldTest() {
    this.setState((state, props) => {
      state.tests.delete("updateTest");
      return {updateTest: null}
    });
  }

  saveAndRunTests() {
    this.updateEventField().then(() => {
      this.api.validateEventField(this.props.field.id).then(res => {
        if (!res) return;
        if (res.isError) {
          alertService.error("Error! Test NOT Executed!");
        }
        let stdout = [];
        try {
          stdout = JSON.parse(res.stdout.substring(0, res.stdout.length -1));
        } catch (error) {
          console.log(error);
          alertService.error("Unable to parse STDOUT! Did you use print? Print is not allowed!");
        }
        const colorsAndMessages = this.getTestColorsAndMessages(stdout);
        this.setState({stderr: res.stderr, testColors: colorsAndMessages[0], testMessages: colorsAndMessages[1]});
      });
    });
  }

  getTestColorsAndMessages(stdout) {
    const colors = new Map();
    const messages = new Map();
    stdout.forEach(obj => {
      const testCase = this.state.tests.get(obj.id);
      const currentOutput = obj.output ? obj.output : "";
      if (testCase.validation_exception == currentOutput){
        colors.set(obj.id, "#95d695");
        return;
      }
      colors.set(obj.id, "#f66");
      messages.set(obj.id, `Got "${currentOutput}" instead!`);
    });
    return [colors, messages];
  }

  hasAddedTest() {
    return this.state.tests.has("updateTest");
  }

  appendRenderedTest(test, tests) {
    if (this.state.updateTest && this.state.updateTest.id == test.id){
      tests.push(this.getRenderedUpdateTest());
      return;
    }
    tests.push(this.getRenderedTest(test))
  }

  getRenderedUpdateTest() {
    return (
      <tr key="0">
        <td>{this.state.updateTest.id}</td>
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

  getRenderedTest(test) {
    const errorMessage = this.state.testMessages.get(test.id);
    return(
      <tr key={test.id}>
        <td>{test.id}</td>
        <th scope="row">
          {test.input_data}
        </th>
        <td>{test.input_nature}</td>
        <td style={{backgroundColor: this.state.testColors.get(test.id)}}>
          {test.validation_exception}
          {errorMessage && <strong><br/>{errorMessage}</strong>}
        </td>
        <td>
          <button type="button" className="btn btn-primary btn-sm m-2"
                  onClick={() => this.toggleUpdateEventFieldTest(test)} disabled={this.hasAddedTest()}>
            Update
          </button>
          <button type="button" className="btn btn-danger btn-sm m-2"
                  onClick={() => this.deleteEventFieldTest(test)}>
            Delete
          </button>
        </td>
      </tr>
    )
  }

  render() {
    if (!this.props.field) return null;
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
                      onClick={() => this.addEventFieldTest()} disabled={this.hasAddedTest()}>
                Add
              </button><br/>
              <table className="table">
                <thead>
                  <tr>
                    <th scope="col">Id</th>
                    <th scope="col">Input</th>
                    <th scope="col">Type</th>
                    <th scope="col">Exception</th>
                    <th scope="col">Edit</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const tests = [];
                    this.state.tests.forEach(test => this.appendRenderedTest(test, tests));
                    return tests
                  })()}
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

export default ValidateEventField;