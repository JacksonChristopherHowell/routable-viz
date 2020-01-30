/* global window */
import React, {Component} from 'react';
import {render} from 'react-dom';
import {StaticMap} from 'react-map-gl';
import {COORDINATE_SYSTEM,  OrbitView, AmbientLight, PointLight, LightingEffect} from '@deck.gl/core';
import DeckGL from '@deck.gl/react';
import axios from 'axios';

import {TripsLayer} from '@deck.gl/geo-layers';
import {GeoJsonLayer, IconLayer} from '@deck.gl/layers';
import {SimpleMeshLayer} from '@deck.gl/mesh-layers';

import {SphereGeometry} from '@luma.gl/core'

import {OBJLoader} from '@loaders.gl/obj';
import {registerLoaders} from '@loaders.gl/core';

// Add the loaders that handle your mesh format here
registerLoaders([OBJLoader]);

// Set your mapbox token here
const MAPBOX_TOKEN = "pk.eyJ1Ijoid2FsbGFyZWx2byIsImEiOiJjazVkeDNrMDgwYmN1M2RuMzRjcnRkdDh1In0.rWHBqU9mPLizJr1nFGpgfQ"; //process.env.MapboxAccessToken; // eslint-disable-line

// Source data JSON  //http://api.routable.ai/query/vehicles/historical.json?api_key=visualization-challenge_2020-01-14T14:59:54Z&start=2019-01-01T00:00:00-05:00&end=2019-01-01T00:45:00-05:00
const DATA_URL = {
  TRIPS: "http://api.routable.ai/query/vehicles/historical.json" +
         "?api_key=visualization-challenge_2020-01-14T14:59:54Z" +
         "&start=2019-01-01T00:00:00-05:00" +
         "&end=2019-01-01T00:45:00-05:00"
};

const MESH_URL =
  'https://raw.githubusercontent.com/uber-common/deck.gl-data/master/examples/mesh/minicooper.obj';


const config = {
  TIME_FIELD: 'time',
  LOCATION_FIELD: 'location',
  EVENT_FIELD: 'event',
  SCHEDULE_FIELD: 'schedule', 
  PATH_FIELD: 'path',   
// time: "2019-01-01T05:02:00Z"
// location: {lat: 22.493149249640517, lng: 113.91750056699055}
// event: "progress"
// schedule: {veh_id: 0, events: Array(6)}
// path: {type: "Feature", geometry: {…}, properties: null}
}

const EVENT_PROGRESS = "progress";
const EVENT_REBALANCE = "rebalance";
const EVENT_PICKUP = "pickup";
const EVENT_DROPOFF = "droppoff";

function featureCollection(features) {
  this.type = "FeatureCollection",
  this.features = features;
}

var updates = [];
var progress = [];
var progressPaths = [];
var cars = [];
var times = [];

axios
  .get(DATA_URL.TRIPS)
  .then(response => {
    //console.log(response.data);
    
    updates = response.data
    .map(item => item.updates);
    console.log(updates);

    progress = updates.map(function(subarray) {
      return subarray.filter((obj, index, self) => obj[config.EVENT_FIELD] === "progress");
    });
    //console.log(progress);

    progressPaths = progress.map(function(subarray) {
      return subarray.map(obj => obj[config.PATH_FIELD])
        .filter((value, index, self) => value !== null);
    });
    //console.log(progressPaths);

    // times = updates.map(function(subarray) {
    //   return subarray
    //     .filter((obj, index, self) => 
    //       Date.parse(obj[config.TIME_FIELD])/1000 - Date.parse(self[0][config.TIME_FIELD])/1000 >= 2500);
    // });
    // console.log(times);

    // for(var i=0;i<target.length;i++){
    //   target[i] = target[i]
    //               .filter((obj, index, self) => obj[config.EVENT_FIELD] === "progress")
    //               //.map(obj => obj[config.PATH_FIELD])
    //               //.filter((value, index, self) => value !== null);
    // }
    //paths = target2; //.flat();
    //console.log(paths);

    cars = _getCars(response.data[0]);
    //console.log(paths[0][0].geometry.coordinates[0]);
    //console.log(_getGeoJSON(response.data));

  })
  .catch(err => {
    throw err;
  });

const timestamp1 = Date.parse('2019-01-01T05:00:30Z') / 1000;
const timestamp2 = Date.parse('2019-01-01T05:01:30Z') / 1000;
const timestamp3 = Date.parse('2019-01-01T05:45:00Z') / 1000;
console.log(
  timestamp3 - timestamp1
);

function _getCars(d) {
  let locs = d.updates.map(function(l) { 
        return {
          position: [l.location.lng, l.location.lat],
          color: [255, 0, 0],
          orientation: [0, 0, 0]
        }
      });
  return locs
};

const ROUTABLE_RED = [223, 36, 48];

const ambientLight = new AmbientLight({
  color: [255, 255, 255],
  intensity: 1.0
});

const pointLight = new PointLight({
  color: [255, 255, 255],
  intensity: 2.0,
  position: [-74.05, 40.7, 8000]
});

const lightingEffect = new LightingEffect({ambientLight, pointLight});

const material = {
  ambient: 0.1,
  diffuse: 0.6,
  shininess: 32,
  specularColor: [60, 64, 70]
};

const DEFAULT_THEME = {
  buildingColor: [74, 80, 87],
  trailColor0: [253, 128, 93],
  trailColor1: [23, 184, 190],
  material,
  effects: [lightingEffect]
};

const INITIAL_VIEW_STATE = {
  longitude: 0.942264,
  latitude: 55.50027,
  zoom: 14,
  pitch: 45,
  bearing: 0,
};

export default class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      time: 0,
      viewState: INITIAL_VIEW_STATE,
    };

    this._getPath = this._getPath.bind(this);
    this._onViewStateChange = this._onViewStateChange.bind(this);
    // this._getFuturePaths = this._getFuturePaths.bind(this);
    //this._getCars = this._getCars.bind(this);
  }

  componentDidMount() {
    this._animate();
  }

  _onViewStateChange({viewState}) {
    //console.log(viewState);
    this.setState({viewState});
  }

  componentWillUnmount() {
    if (this._animationFrame) {
      window.cancelAnimationFrame(this._animationFrame);
    }
  }

  _animate() { 
    const {
      loopLength = 60 * 45, // unit corresponds to the timestamp in source data
      animationSpeed = 30 // unit time per second
    } = this.props;
    const timestamp = Date.now() / 1000;
    const loopTime = loopLength / animationSpeed;

    this.setState({
      time: ((timestamp % loopTime) / loopTime) * loopLength
    });

    this._animationFrame = window.requestAnimationFrame(
        this._animate.bind(this)
    );
  }

  _getTimestamps (d) {
    let startTime = Date.parse(d.updates[0].time) / 1000;
    return d.updates.map(l => Date.parse(l.time) / 1000 - startTime);
  }

  _getPath(d) {
    let locs = d.updates.map(l => [l.location.lng, l.location.lat]);
    this.setState({
      viewState: {
        ...this.state.viewState,
        longitude: locs[0][0],
        latitude: locs[0][1],
      }
    });
    return locs
  }

  _getFuturePaths(d) {
    let time = this.state.time;
    //console.log(time);

    let futurePaths = d.map(function(subarray) {
        return subarray
          .filter((obj, index, self) => Date.parse(obj[config.TIME_FIELD])/1000 - Date.parse(self[0][config.TIME_FIELD])/1000 >= time)
          .map(obj => obj[config.PATH_FIELD])
          .filter((value, index, self) => value !== null);
      });
    return futurePaths[0];
  }

  _getCars(d) {
    let time = this.state.time;
    console.log("time = "+time);
    if (d){
    let locs = d.filter((obj, index, self) => Date.parse(obj[config.TIME_FIELD])/1000 - Date.parse(self[0][config.TIME_FIELD])/1000 >= time);
    console.log(locs);

    let now = locs.map(function(l) {            
              return {
                  position: [l.location.lng, l.location.lat],
                  color: [255, 0, 0],
                  orientation: [0, 0, 0]
                }
              });
    //console.log(now);
    return now
    }
  }


  testFunk(){
    this.testFunk2();
  }

  testFunk2(){
     console.log("time = "+this.state.time); 
  }
  
  _renderLayers() {
    const {
      trips = DATA_URL.TRIPS,
      trailLength = 30,
      theme = DEFAULT_THEME,
    } = this.props;

    return [
      new SimpleMeshLayer({
        id: 'mini-coopers',
        data:  this._getCars(updates[0]),
        mesh: MESH_URL,
        getScale: [1,1,1],
        //getPosition: this._getCars,
        getPosition: d => d.position,
        getColor: d => d.color,
        // getOrientation: d => d.orientation
      }),
      new TripsLayer({
        id: 'trips',
        data: trips,
        getPath: this._getPath,
        getTimestamps: this._getTimestamps,
        getColor: d => ROUTABLE_RED,
        opacity: 1,
        widthMinPixels: 5,
        rounded: true,
        trailLength,
        currentTime: this.state.time,
        shadowEnabled: false
      }),
      // new GeoJsonLayer({
      //   id: 'geojson-layer',
      //   data: this._getFuturePaths(updates),
      //   pickable: true,
      //   stroked: false,
      //   filled: true,
      //   extruded: true,
      //   lineWidthScale: 20,
      //   lineWidthMinPixels: 2,
      //   getFillColor: [160, 160, 180, 200],
      //   getLineColor: [200, 200, 200],
      //   getRadius: 100,
      //   getLineWidth: 1,
      //   getElevation: 30,
      // }),
    ];
  }

  render() {
    const {
      mapStyle = 'mapbox://styles/wallarelvo/ck5dxpxfo0hn01ip1f0p7izug',
      theme = DEFAULT_THEME
    } = this.props;

    const {viewState} = this.state;

    //this.testFunk();

    return (
      <DeckGL
        layers={this._renderLayers()}
        effects={theme.effects}
        initialViewState={INITIAL_VIEW_STATE}
        viewState={viewState}
        onViewStateChange={this._onViewStateChange}
        controller={true}
      >
        <StaticMap
          reuseMaps
          mapStyle={mapStyle}
          preventStyleDiffing={true}
          mapboxApiAccessToken={MAPBOX_TOKEN}
        />
      </DeckGL>
    );
  }

}

export function renderToDOM(container) {
  render(<App />, container);
}
