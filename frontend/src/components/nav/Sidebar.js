import React, { Component } from "react";

class Sidebar extends Component {
	constructor(props){
		super(props);
		this.state = {
				events: this.props.events 
		}
  }

  onClick(e, item){
    e.preventDefault();
    this.props.onClick(item);
  }
  
  render() {
    return (
      <nav id="sidebarMenu" className="col-md-3 col-lg-2 d-md-block bg-light sidebar collapse">
        <div className="sidebar-sticky">
          <ul className="nav flex-column">
          <li className="nav-item">
            <div className="nav-link active">
              <div className="d-flex justify-content-between align-content-center">
                <span>Events</span>
                <a href="#" aria-label="Add a new event" onClick={(e) => this.onClick(e, "create")}>
                  <span data-feather="plus-circle"></span>
                </a>
              </div>
            </div>
          </li>
            {this.props.events.map(item => {
              return(
                <li className="nav-item" key={item.name}>
                  <a className="nav-link" href="#" onClick={(e) => this.onClick(e, item)}>
                    <span data-feather="file"></span>
                    {item.name}
                  </a>
                </li>
              )
            })}
          </ul>
        </div>
      </nav>
    );
  }
}

export default Sidebar;