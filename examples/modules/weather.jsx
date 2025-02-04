/**
 *  Copyright (c) 2015, The Regents of the University of California,
 *  through Lawrence Berkeley National Laboratory (subject to receipt
 *  of any required approvals from the U.S. Dept. of Energy).
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree.
 */

/* eslint max-len:0 */

import React from "react";
import _ from "underscore";
import Moment from "moment";
import Markdown from "react-markdown";
import Highlighter from "./highlighter";

// Pond
import { TimeSeries } from "pondjs";

// Imports from the charts library
import ChartContainer from "../../src/chartcontainer";
import ChartRow from "../../src/chartrow";
import Charts from "../../src/charts";
import YAxis from "../../src/yaxis";
import AreaChart from "../../src/areachart";
import LineChart from "../../src/linechart";
import ScatterChart from "../../src/scatterchart";
import Resizable from "../../src/resizable";

// Weather data
import weatherJSON from "../data/weather.json";

// Docs
const exampleText = `

This example uses three rows to create stacked chart:

    <ChartContainer timeRange={tempSeries.range()}>

        <ChartRow height="150">
            <YAxis id="temp" label="Temperature (°F)" labelOffset={-5} style={{labelColor: scheme.temp}}
                   min={50} max={70} width="60" type="linear" format=",.1f"/>

            <Charts>
                <LineChart axis="temp" series={tempSeries} style={{color: scheme.temp, width: 2}}/>
                <LineChart axis="pressure" series={pressureSeries} style={{color: scheme.pressure, width: 2}}/>
            </Charts>
            <YAxis id="pressure" label="Pressure (in)" labelOffset={5} style={{labelColor: scheme.pressure}}
                   min={29.5} max={30.0} width="100" type="linear" format=",.1f"/>
        </ChartRow>

        <ChartRow height="150">
            <YAxis id="wind-gust" label="Wind gust (mph)" labelOffset={-5} style={{labelColor: scheme.gust}}
                   min={0} max={50} width="100" type="linear" format=",.1f"/>

            <Charts>
                <LineChart axis="wind" series={windSeries} style={{color: scheme.wind, width: 2}}/>
                <ScatterChart axis="wind-gust" series={gustSeries} style={{color: scheme.gust, opacity: 0.5}} />
            </Charts>

            <YAxis id="wind" label="Wind (mph)" labelOffset={5} style={{labelColor: scheme.wind}}
                   min={0} max={50} width="60" type="linear" format=",.1f"/>
        </ChartRow>

        <ChartRow height="150">
            <YAxis id="rain" label="Precipitation (in)" labelOffset={-5} style={{labelColor: scheme.rain}}
                   min={0} max={rainSeries.max()} width="60" type="linear" format=",.2f"/>
            <Charts>
                <AreaChart axis="rain" series={rainSeries} style={{up: [scheme.rain]}} interpolate="basis"/>
                <LineChart axis="total-rain" series={rainAccumSeries} style={{color: scheme.rainAccum, width: 1}} />
            </Charts>
            <YAxis id="total-rain" label="Total Precipitation (in)" labelOffset={5} min={0} max={rainAccumSeries.max()} width="60" type="linear" format=",.2f"/>
        </ChartRow>

    </ChartContainer>
`;

//
// Read in the weather data
//

const temperaturePoints = [];
const pressurePoints = [];
const windPoints = [];
const gustPoints = [];
const rainPoints = [];
const rainAccumPoints = [];
_.each(weatherJSON, readings => {
    const time = new Moment(readings.Time).toDate().getTime();
    const tempReading = readings.TemperatureF;
    const pressureReading = readings["PressureIn"];
    const windReading = readings["WindSpeedMPH"] === "Calm" ? 0 : readings["WindSpeedMPH"];
    const gustReading = readings["WindSpeedGustMPH"];
    const rainReading = readings["HourlyPrecipIn"] === "N/A" ? 0 : readings["HourlyPrecipIn"];
    const rainAccumReading = readings["dailyrainin"];

    temperaturePoints.push([time, tempReading]);
    pressurePoints.push([time, pressureReading]);

    // Somewhat fake the wind speed...
    windPoints.push([time, windReading * 5]);
    if (gustReading !== "-" && gustReading !== 0) {
        gustPoints.push([time, gustReading * 5 + Math.random() * 2.5 - 2.5, gustReading / 3]);
    }
    rainPoints.push([time, rainReading]);
    rainAccumPoints.push([time, rainAccumReading]);
});

//
// Timeseries
//

const tempSeries = new TimeSeries({
    name: "Temperature",
    columns: ["time", "temp"],
    points: temperaturePoints});
const pressureSeries = new TimeSeries({name: "Pressure", columns: ["time", "pressure"], points: pressurePoints});
const windSeries = new TimeSeries({name: "Wind", columns: ["time", "wind"], points: windPoints});
const gustSeries = new TimeSeries({name: "Gust", columns: ["time", "gust", "radius"], points: gustPoints});
const rainSeries = new TimeSeries({name: "Rain", columns: ["time", "value"], points: rainPoints});
const rainAccumSeries = new TimeSeries({name: "Rain Accum", columns: ["time", "rainAccum"], points: rainAccumPoints});

//
// Color scheme
//

const scheme = {
    temp: "#CA4040",
    pressure: "#9467bd",
    wind: "#987951",
    gust: "#CC862A",
    rain: "#849AB1",
    rainAccum: "#000"
};

const lineStyles = {
    temp: {
        stroke: scheme.temp,
        strokeWidth: 2
    },
    pressure: {
        stroke: scheme.pressure,
        strokeWidth: 2
    },
    wind: {
        stroke: scheme.wind,
        strokeWidth: 2
    },
    rainAccum: {
        stroke: scheme.rainAccum,
        strokeWidth: 1
    }
};

const scatterStyles = {
    gust: {
        normal: {
            fill: scheme.gust,
            opacity: 0.5
        }
    }
};

//
// Render weather charts
//

export default React.createClass({

    mixins: [Highlighter],

    getInitialState() {
        return {
            tracker: null
        };
    },

    render() {
        /*
        const trackerValues = [
            {label: "Temp", value: 33.2},
            {label: "Pressure", value: 123}
        ];
        */
        return (
            <div>

                <div className="row">
                    <div className="col-md-12">
                        <h3>Weather example</h3>
                        <hr />
                    </div>
                </div>

                <div className="row">
                    <div className="col-md-12">
                        <Resizable>
                            <ChartContainer
                                timeRange={tempSeries.timerange()}
                                showGrid={true}
                                trackerPosition={this.state.tracker}
                                trackerTimeFormat="%X"
                                onTrackerChanged={(tracker) => this.setState({tracker})} >

                                <ChartRow height="150" >
                                    <YAxis id="temp" label="Temperature (°F)" labelOffset={-5} style={{labelColor: scheme.temp}}
                                           min={50} max={70} width="80" type="linear" format=",.1f"/>
                                    <YAxis id="pressure" label="Pressure (in)" labelOffset={-5} style={{labelColor: scheme.pressure}}
                                           min={29.5} max={30.0} width="80" type="linear" format=",.1f"/>
                                    <Charts>
                                        <LineChart axis="temp" series={tempSeries} columns={["temp"]} style={lineStyles}/>
                                        <LineChart axis="pressure" series={pressureSeries} columns={["pressure"]} style={lineStyles}/>
                                    </Charts>

                                </ChartRow>

                                <ChartRow height="150" >
                                    <YAxis id="wind-gust" label="Wind gust (mph)" labelOffset={-5} style={{labelColor: scheme.gust}}
                                           min={0} max={50} width="80" type="linear" format=",.1f"/>

                                    <Charts>
                                        <LineChart axis="wind" series={windSeries} columns={["wind"]} style={lineStyles}/>
                                        <ScatterChart
                                            axis="wind-gust"
                                            series={gustSeries}
                                            columns={["gust"]}
                                            style={scatterStyles}
                                            radius={event => { return event.get("radius"); }}/>
                                    </Charts>

                                    <YAxis id="wind" label="Wind (mph)" labelOffset={5} style={{labelColor: scheme.wind}}
                                           min={0} max={50} width="80" type="linear" format=",.1f"/>
                                </ChartRow>

                                <ChartRow height="150">
                                    <Charts>
                                        <AreaChart axis="rain" series={rainSeries} style={{up: [scheme.rain]}} interpolate="basis" fillOpacity={0.4}/>
                                        <LineChart axis="total-rain" series={rainAccumSeries} columns={["rainAccum"]} style={lineStyles}/>
                                    </Charts>
                                    <YAxis id="total-rain" label="Total Precipitation (in)" labelOffset={5} min={0} max={rainAccumSeries.max("rainAccum")} width="80" type="linear" format=",.2f"/>
                                    <YAxis id="rain" label="Precipitation (in)" labelOffset={5} style={{labelColor: scheme.rain}}
                                           min={0} max={rainSeries.max()} width="80" type="linear" format=",.2f"/>
                                </ChartRow>

                            </ChartContainer>
                        </Resizable>
                    </div>
                </div>

                <hr/>

                <div className="row">
                    <div className="col-md-12">
                        <Markdown source={exampleText}/>
                    </div>
                </div>
            </div>
        );
    }
});
