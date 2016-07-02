var React = require('react');
var ReactDOM = require('react-dom');

var ReactRouter = require('react-router');
var Router = ReactRouter.Router;
var Route = ReactRouter.Route;
var Navigation = ReactRouter.Navigation;

import { browserHistory } from 'react-router';

var util = require('./helpers.js');

var ReactFireMixin = require('reactfire');

/*
  App
*/
var App = React.createClass({
  mixins: [ReactFireMixin],
  componentWillMount: function() {
    var firebaseRef = firebase.database().ref('fishes');
    this.bindAsArray(firebaseRef, 'fishes');

    firebaseRef.on("child_added", function(dataSnapshot) {
      this.state.fishes.push(dataSnapshot.val());
      this.setState({
        fishes: this.fishes
      });
    }.bind(this));
  },
  getInitialState: function() {
    return {
      order: {},
      fishes: {}
    }
  },
  addFish: function(fish) {
    var timestamp = (new Date()).getTime();
    this.state.fishes['fish-' + timestamp] = fish;
    this.setState({ fishes : this.state.fishes });
  },
  loadSampleFishes: function() {
    var _this = this;
    this.setState({ fishes : require('./sample-fishes.js') });
    this.firebaseRefs['fishes'].push(
      Object.keys(this.state.fishes).map(
        function(key) {
          var fish = {};
          fish[key] = _this.state.fishes[key];
          return fish;
        }
      )
    );
  },
  renderFish: function(key) {
    var fishes = this.state.fishes[1];
    return <Fish key={key} index={key} details={fishes[key]} orderFish={this.orderFish} />
  },
  orderFish: function(key) {
    this.state.order[key] = this.state.order[key] + 1 || 1;
    this.setState({order: this.state.order})
  },
  render: function() {
    var fishes = this.state.fishes[1];
    return (
      <div className="catch-of-the-day">
        <div className="menu">
          <Header tagline="Fresh Seafood Market" />
          <ul className="list-of-fishes">
            { /*Object.keys(fishes).map(this.renderFish)*/ }
          </ul>
        </div>
        <Order orders={this.state.order} fishes={fishes} />
        <Inventory addFish={this.addFish} loadFishes={this.loadSampleFishes} />
      </div>
    )
  }
});

/*
  Add fish form
*/
var AddFishForm = React.createClass({
  createFish: function(e) {
    e.preventDefault();
    var fish = {
      name: this.refs.name.value,
      price: this.refs.price.value,
      status: this.refs.status.value,
      description: this.refs.description.value,
      image: this.refs.image.value
    };
    this.props.addFish(fish);
    this.refs.fishForm.reset();
  },
  render: function() {
    return (
      <form className="fish-edit" ref="fishForm" onSubmit={this.createFish}>
        <input type="text" ref="name" placeholder="Fish Name"/>
        <input type="text" ref="price" placeholder="Fish Price" />
        <select ref="status">
          <option value="available">Fresh!</option>
          <option value="unavailable">Sold Out!</option>
        </select>
        <textarea type="text" ref="description" placeholder="Desc"></textarea>
        <input type="text" ref="image" placeholder="URL to Image" />
        <button type="submit">+ Add Item </button>
      </form>
    )
  }
});


/*
  Header
*/
var Header = React.createClass({
  render: function() {
    return (
      <header className="top">
        <h1>Catch
          <span className="ofThe">
            <span className="of">of</span>
            <span className="the">the</span>
          </span>
          Day</h1>
        <h3 className="tagline"><span>{this.props.tagline}</span></h3>
      </header>
    )
  }
});

/*
  Order
*/
var Order = React.createClass({
  render: function() {
    var orderIds = Object.keys(this.props.orders);

    var total = orderIds.reduce((prevTotal, key)=> {
      var fish = this.props.fishes[key],
          count = this.props.orders[key],
          isAvailable = fish && fish.status === 'available';

      if(fish && isAvailable) {
        return prevTotal + (count * parseInt(fish.price) || 0);
      }

      return prevTotal;
    }, 0);

    return (
      <div className="order-wrap">
        <h2 className="order-title">Your Order</h2>
        <ul className="order">
          { orderIds.map(this.displayOrder) }
          <li className="total">
            <strong>Total:</strong>
            { util.formatPrice(total) }
          </li>
        </ul>
      </div>
    )
  },
  displayOrder: function(fish) {
    var amount = this.props.orders[fish],
        fish = this.props.fishes[fish];

    if(!fish) {
      return <li key={key}>Sorry, fish no longer available!</li>
    }

    return (
      <li>
        {amount}lbs {fish.name}
        <span className="price">{util.formatPrice(amount * fish.price)}</span>
      </li>
    )
  }
});

/*
  Inventory
*/
var Inventory = React.createClass({
  render: function() {
    return (
      <div>
        <h2>Inventory</h2>
        <AddFishForm addFish={this.props.addFish} />
        <button onClick={this.props.loadFishes}>Load fishes</button>
      </div>
    )
  }
});

/*
  Fish
*/
var Fish = React.createClass({
  render: function() {
    var details = this.props.details,
        isAvailable = (details.status === 'available'),
        buttonText = isAvailable ? 'Add to Order' : 'Sold out!';
    return (
      <li className="menu-fish">
        <img src={details.image} alt={details.name} />
        <h3 className="fish-name">{details.name}
          <span className="price">{util.formatPrice(details.price)}</span>
        </h3>
        <p>{details.desc}</p>
        <button disabled={!isAvailable} onClick={this.orderFish}>{buttonText}</button>
      </li>
    )
  },
  orderFish: function() {
    this.props.orderFish(this.props.index);
  }
});


/*
  StorePicker
  This will let us make <StorePicker/>
*/
var StorePicker = React.createClass({
  contextTypes: {
    router: React.PropTypes.object
  },

  goToStore: function(e) {
    e.preventDefault();
    this.context.router.push('/store/' + this.refs.storeId.value);
  },

  render: function() {
    return (
      <form className="store-selector" onSubmit={this.goToStore}>
        <h2>Please Enter A Store</h2>
        <input type="text" ref="storeId" defaultValue={util.getFunName()} required />
        <input type="Submit" />
      </form>
    )
  }

});

var NotFound = React.createClass({
  render: function() {
    return (
      <div>
        <h1>Sorry, I'm a bit lost!</h1>
        <div className="buttonWrapper">
          <button className="center"><a href="/">Take me home</a></button>
        </div>
      </div>
    )
  }
});

/*
  Routes
*/
var routes = (
  <Router history={browserHistory}>
    <Route path="/" component={StorePicker} />
    <Route path="/store/:storeId" component={App} />
    <Route path="/*" component={NotFound} />
  </Router>
)

ReactDOM.render(routes, document.querySelector('#main'));
