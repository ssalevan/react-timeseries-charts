
This example demonstrates using the pond.js library in conjunction with the charts library to do client side time series processing.

In this example we have an simulated incoming stream of measurements, represented by the dots. The visualization you see shows the 5 min aggregations (both average and max) of the incoming stream as a green bar chart. We calculate this as described below.

### Events

To do this, each event is generated semi-randomly, but they could be coming from a real source. We add a new Event for each minute, but emit 5 per second to speed up the simulation. Essentially we do this:

```js
import { Event } from "pondjs";

const value = getRandomValue();
const time = getNextTime();
const event = new Event(t, value);
```

Now we want to do some things with that Event:

 * Store it, so we can show the scatter plot
 * Aggregate it to give us our 5 min average and maximum values

To store it, we put it into a circle buffer that keeps the last n Events. Otherwise we'll eventually kill the browser. The circle buffer is placed in the React component's state.

### Aggregation

For the more interesting part, the aggregation, we need to setup up a couple of Pond Pipelines to do the work. Here's the 5 min aggregator that we setup:

```js

import { UnboundedIn, Pipeline, EventOut } from "pondjs";

...

const eventSource = new UnboundedIn();

Pipeline()
    .from(this.eventSource)
    .windowBy("5m")
    .emitOn("discard")
    .aggregate({value: avg})
    .to(EventOut, event => {
        // Store the resulting output events in our component state
    });
```

The Pipeline now just needs a feed of events added to its eventSource in order to process them into a new aggregated events. Each time one of these new events is emitted we take that from the callback defined in `to()` and place it into the component's state.


```js
eventSource.addEvent(event);
```

### Visualization

The first thing we need to do is turn our three event lists (the original events along with the two aggregated event streams) into TimeSeries objects which can then be passed to our charting code. Since we can construct a pond.js TimeSeries object from a list of events, this is simply a matter of pulling the list from the circle buffer and giving it to the TimeSeries constructor.

For example, our 5 min averages:

```js
const name = "5m-avg";
const events = this.state.avgOut.toArray(); // from circle buffer
const avgSeries = new TimeSeries({name, events});
```

Next we figure out the begin and end times for the chart. The chart expands outward until it gets to 3 hours and then pans with the new data. Once we calculate the beginTime and endTime we make a TimeRange to represent this range:

```js
const timeRange = new TimeRange(beginTime, endTime);
```

Finally we render() the chart:

```js
    render() {
        return (
            <ChartContainer timeRange={timeRange}>
                <ChartRow height="150">
                    <YAxis
                        id="y"
                        label="Value"
                        min={0} max={1500}
                        type="linear"/>
                    <Charts>
                        <BarChart
                            axis="y"
                            series={avgSeries}
                            columns={["value"]} />
                        <BarChart
                            axis="y"
                            series={maxSeries}
                            columns={["value"]} />
                        <ScatterChart
                            axis="y"
                            series={rawSeries} />
                    </Charts>
                </ChartRow>
            </ChartContainer>
        );
    }
```
