import React, { Component } from "react";

class Nav extends Component {

  onClick(e, item){
    e.preventDefault();
    this.props.onClick(item);
  }

  render() {
    return (
        <nav className="navbar navbar-dark sticky-top bg-dark flex-md-nowrap p-0 shadow">
            <div className="navbar-brand col-md-4 col-lg-3 mr-0 px-3 mouse-pointer" onClick={(e) => this.onClick(e, null)}>Ralph xAPI</div>
            <button className="navbar-toggler position-absolute d-md-none collapsed" type="button" data-toggle="collapse" data-target="#sidebarMenu" aria-controls="sidebarMenu" aria-expanded="false" aria-label="Toggle navigation">
                <span className="navbar-toggler-icon"></span>
            </button>
        </nav>
    );
  }
}

export default Nav;