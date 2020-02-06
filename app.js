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

const ICON_MAPPING = {
  marker: {x: 0, y: 0, width: 128, height: 128, anchorY:128, mask: true}
};

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
    //var testInterPol = updates[0].slice(1,3);  
    //interpolatePos(testInterPol);

    // progress = updates.map(function(subarray) {
    //   return subarray.filter((obj, index, self) => obj[config.EVENT_FIELD] === "progress");
    // });
    //console.log(progress);

    // progressPaths = progress.map(function(subarray) {
    //   return subarray.map(obj => obj[config.PATH_FIELD])
    //     .filter((value, index, self) => value !== null);
    // });
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

    //cars = _getCars(response.data[0]);
    //console.log(paths[0][0].geometry.coordinates[0]);
    //console.log(_getGeoJSON(response.data));

  })
  .catch(err => {
    throw err;
  });

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

function angleFromCoordinate(lat1,lon1,lat2,lon2) {
    var p1 = {
        x: lat1,
        y: lon1
    };
    var p2 = {
        x: lat2,
        y: lon2
    };
    // angle in radians
    //var angleRadians = Math.atan2(p2.y - p1.y, p2.x - p1.x);

    // angle in degrees
    var angleDeg = Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180 / Math.PI;

    var bearing = (angleDeg + 360) % 360;
    bearing = 360 - bearing;
    // Get 'back bearing' https://www.maptools.com/tutorials/plotting/forward-and-back-bearings
    if (bearing <= 180 ){
      bearing = bearing + 180;
    } else {
      bearing = bearing - 180;
    }
    return bearing;
}

function interpolatePos(locs) {
  //need to map each item in array
    let interPtsArr = locs.map(function(obj, index) {
      var t1 = Date.parse(locs[index][config.TIME_FIELD])/1000; 
      var t2, deltaLat, deltaLon;
      if (index < locs.length-1) { 
        t2 = Date.parse(locs[index+1][config.TIME_FIELD])/1000;
        deltaLat = locs[index+1].location.lat - locs[index].location.lat;
        deltaLon = locs[index+1].location.lng - locs[index].location.lng;
      } else {
        return null;
      }
      const step = 3; 
      var interPtCollection = []; 
      for (let t = t1; t < t2; t+= step) {
        let t0_1 = (t - t1) / (t2 - t1);
        let latInter = locs[index].location.lat + deltaLat  * t0_1;
        let lonInter = locs[index].location.lng + deltaLon  * t0_1;
        let interPolLoc = {
          lonInter: lonInter, 
          latInter: latInter, 
          timeInter: t
        };
        interPtCollection.push(interPolLoc);
      }
      return interPtCollection;
    });
    //console.log(interPtsArr);
    return interPtsArr;
}

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
    if(futurePaths[0]) return futurePaths[0][0] ;
  }

  _getStops(d) {
    let time = this.state.time;
    //console.log(time);

    let futureStops = d.map(function(subarray) {
        return subarray
          .filter((obj, index, self) => Date.parse(obj[config.TIME_FIELD])/1000 - Date.parse(self[0][config.TIME_FIELD])/1000 >= time)
          .filter((obj, index, self) => obj[config.SCHEDULE_FIELD] !== null)
          .map(obj => obj[config.SCHEDULE_FIELD].events);
      });
    //console.log(futureStops);

    if(futureStops.length>0 && futureStops[0][0]){
      let mapStops = futureStops[0][0].map( function(obj, index, self) { 
          switch(obj.event) {
            case "dropoff":
              obj.color =  [255,0,0]
              break;
            case "pickup":
              obj.color = [0,255,0]
              break;
            case "rebalance":
              obj.color = [255,255,0]
              break;
            default:
              obj.color = [169,169,169]
          }
          return {
            color: obj.color,
            event: obj.event, 
            time: obj.time, 
            coordinates: [ obj.location.lng, obj.location.lat, 0], // obj.location.lng, obj.location.lat // obj.location.lat, obj.location.lng
          }
      });
      //console.log(mapStops);
      return mapStops;
    } 
  }

  _getCars(d) {
    let time = this.state.time;
    //console.log("time = "+time);
    //let interpolLocs = interpolatePos(locs);
    if (d){

      // try to interpolate
      let interpolLocs = interpolatePos(d);
      //console.log(interpolLocs);
      let target = interpolLocs.map(function(subarray) {
        if (subarray !== undefined && subarray !== null && subarray.length>0){
          //console.log(subarray);
          return subarray
        }
      });
      target = target.flat();
      target = target.filter(item => item !== undefined);
      let timedInterpolLocs = target.filter((item, index, self) => item.timeInter - self[0].timeInter >= time)// should already be in milisecs
          .map(function(item, index, self) {
            var angle;
            if (index < self.length-1) {   ;
              angle = angleFromCoordinate(self[index].latInter, self[index].lonInter, self[index+1].latInter, self[index+1].lonInter);
            } else {
              angle = 0;
            }
            var newItem = [{
                position: [ item.lonInter, item.latInter ],
                color: [255, 0, 0],
                angle: [0, angle,0],
                time: item.timeInter,
              }];
            return newItem;  
          });
      //console.log(timedInterpolLocs[0]);
      return timedInterpolLocs[0];

    // let locs = d.filter((obj, index, self) => Date.parse(obj[config.TIME_FIELD])/1000 - Date.parse(self[0][config.TIME_FIELD])/1000 >= time);
    // let pos = locs.map(function(obj, index) {
    //           var angle;
    //           if (index < locs.length-1) {   ;
    //             angle = angleFromCoordinate(locs[index].location.lat, locs[index].location.lng, locs[index+1].location.lat, locs[index+1].location.lng);
    //           } else {
    //             angle = 0;
    //           }  
    //           return [{
    //               position: [locs[index].location.lng, locs[index].location.lat],
    //               color: [255, 0, 0],
    //               angle: [0, angle,0],
    //             }]
    //           });
    // return pos[0];
    }
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
        getScale: [0.75,0.75,0.75],
        //getPosition: this._getCars,
        getPosition: d => d.position,
        getColor: d => d.color,
        getOrientation: d => d.angle,
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
      new GeoJsonLayer({
        id: 'geojson-layer',
        data: this._getFuturePaths(updates),
        pickable: true,
        stroked: false,
        filled: true,
        extruded: true,
        lineWidthScale: 20,
        lineWidthMinPixels: 2,
        getFillColor: [160, 160, 180, 200],
        getLineColor: [200, 200, 200],
        getRadius: 100,
        getLineWidth: 1,
        getElevation: 30,
      }),
      new IconLayer({
        id: 'icon-layer',
        data: this._getStops(updates),
        //pickable: true,
        iconAtlas: 'icon-atlas.png',
        iconMapping: ICON_MAPPING,
        getIcon: d => 'marker',
        sizeScale: 15,
        getPosition: d => d.coordinates,
        getSize: d => 3,
        getColor: d => d.color,
      }),
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
