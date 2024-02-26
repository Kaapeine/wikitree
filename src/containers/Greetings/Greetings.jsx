import React, { Component } from 'react';
import icon from '../../assets/img/wiki-128.png';

class GreetingComponent extends Component {
  render() {
    return (
      <div>
        <p>Hello, WikiTree!</p>
        <img src={icon} alt="extension icon" />
      </div>
    );
  }
}

export default GreetingComponent;
