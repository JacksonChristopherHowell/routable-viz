# Routable AI Visualization Challenge

At Routable AI, we are building the world’s most advanced mobility-as-a-service backend capable of dispatching fleets comprised of thousands of vehicles. Our technology stems from research conducted at MIT that showed all of Manhattan’s taxi demand (400,000 trips daily) could be served by 3,000 shared vehicles with minimal disruption to customer convenience (2.8 average waiting time, 3.5 average travel delay). Our main product offering is an API for fleet operators that makes shared vehicles (buses) available on-demand. Our API ingests transportation requests and vehicle locations, and returns what routes each vehicle should take to service the demand.

On the face of it, you may think we are only concerned with building out the backend, but this isn't the case at all. The data we are dealing with is high dimensional and changes over time. Visualizing and interacting with this data sheds incredible insight into how operational efficiency can be improved and where other problems exist within the system.

## Description

Our API works by collecting the state of the vehicles at a set interval as they operate. We also receive updates whenever a vehicle has completed an event (picking someone up, dropping someone off, etc). For this challenge, we want you to create an interactive visualization using [deck.gl](https://deck.gl/) that shows the vehicles moving over time to pick up and drop off riders.

### Requirements

1. Allow the API key, start time, and end time to be specified as URL query parameters
1. Use a [TripsLayer](https://deck.gl/#/documentation/deckgl-api-reference/layers/trips-layer) to visualize short term location history of each vehicle
1. Use a [GeoJsonLayer](https://deck.gl/#/documentation/deckgl-api-reference/layers/geojson-layer) to visualize the future path of each vehicle
1. Use an [IconLayer](https://deck.gl/#/documentation/deckgl-api-reference/layers/icon-layer) to display the pick up, drop off, and rebalance locations for each vehicle's schedule
1. Use a [SimpleMeshLayer](https://deck.gl/#/documentation/deckgl-api-reference/layers/simple-mesh-layer) to display the vehicle location with a 3D model. This can be as simple as using a sphere, but bonus points will be given for using a 3D model of a car
1. Add a play / pause button to start and stop the visualization
1. Add a slider to manipulate the current time of the visualization

We have done a little bit of the ground work for you. Historical vehicle state data can be retrieved from our server by using the [/query/vehicles/historical.json](https://routable.ai/docs/#tag/Historical-Vehicle-State/paths/~1query~1vehicles~1historical[.json]/get) endpoint. The data returned from this endpoint contains vehicle state information over time. See the metadata below for accessing test data

```
API key:    visualization-challenge_2020-01-14T14:59:54Z
Start time: 2019-01-01T00:00:00-05:00
End time:   2019-01-01T00:45:00-05:00
```

We have also provided code in this repo as a starting point. All of the React code can be found in `app.js`. This should act as your main entry point. You can run the development server using [docker](https://docs.docker.com/install/) as follows.

```
docker-compose up
```

**Note:** If you change `package.json` or `webpack.config.js`, you will need to run `docker-compose up --build`

For convenience, the server rebuilds your app as you update code. Now you can navigate to [localhost:8081](http://localhost:8081) to view the visualization

### How you will be judged

We will be looking at how well you fulfilled the requirements, what design decisions you made and why, the extensibility / quality of your code, and how well you are able to understand documentation to use a tool you may not have experience with.

### Final notes

- Install docker if you do not already have it
- Read all of the documentation
- If you get stuck or something doesn't seem right, email alex@routable.ai
- We care more about function than form given the timespan, but making things look good doesn't hurt
- The code will be reviewed, so keep that in mind
