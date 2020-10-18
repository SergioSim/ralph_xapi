import React, { Component } from "react";
import { render } from "react-dom";
import MyGraph from "./MyGraph";
import './App.css';

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      data: [],
      loaded: false,
      placeholder: "Loading"
    };
  }

  componentDidMount() {
    fetch("api/event")
      .then(response => {
        if (response.status > 400) {
          return this.setState(() => {
            return { placeholder: "Something went wrong!" };
          });
        }
        return response.json();
      })
      .then(data => {
        this.setState(() => {
          return {
            data,
            loaded: true
          };
        });
      });
  }

  render() {
    return (
      <div>
      <ul>
        {this.state.data.map(contact => {
          return (
            <li key={contact.id}>
              {contact.name} - {contact.email}
            </li>
          );
        })}
      </ul>
      <MyGraph/>
      </div>
    );
  }
}

export default App;