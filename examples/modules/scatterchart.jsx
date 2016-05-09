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

import React from "react/";
import _ from "underscore";
import Moment from "moment";
import APIDocs from "./docs";
import Highlighter from "./highlighter";
import { format } from "d3-format";

// Pond
import { TimeSeries } from "pondjs";

// Imports from the charts library
import ChartContainer from "../../src/chartcontainer";
import ChartRow from "../../src/chartrow";
import Charts from "../../src/charts";
import YAxis from "../../src/yaxis";
import ScatterChart from "../../src/scatterchart";
import Resizable from "../../src/resizable";

// Weather data
import weatherJSON from "../data/weather.json";

//
// Read in the weather data and add some randomness and intensity for fun
//

const points = [];
_.each(weatherJSON, readings => {
    const time = new Moment(readings.Time).toDate().getTime();
    const reading = readings["WindSpeedGustMPH"];
    if (reading !== "-" && reading !== 0) {
        points.push([time, reading * 5 + Math.random() * 2.5 - 2.5, reading / 2]);
    }
});

//
// Timeseries
//

const series = new TimeSeries({
    name: "Gust",
    columns: ["time", "value", "radius"],
    points
});


//
// Render scatter chart
//

export default React.createClass({

    mixins: [Highlighter],

    getInitialState() {
        return {
            hover: null,
            highlight: null,
            selection: null
        };
    },

    handleHover(event) {
        this.setState({hover: event});
    },

    handleTrackerChanged(t) {
        this.setState({
            highlight: t ? series.at(series.bisect(t)) : null
        });
    },

    handleSelectionChanged(event) {
        this.setState({
            selection: event
        });
    },

    render() {
        const formatter = format(".2f");
        const text = this.state.highlight ?
            `Speed: ${formatter(this.state.highlight.get())} mph,
time: ${this.state.highlight.timestamp().toLocaleTimeString()}` :
            `Speed: - mph, time: -:--`;
        return (
            <div>
                <div className="row">
                    <div className="col-md-12">
                        <h3>ScatterChart Example</h3>
                    </div>
                </div>

                <hr/>

                <div className="row">
                    <div className="col-md-12">
                        {text}
                    </div>
                </div>

                <hr />

                <div className="row">
                    <div className="col-md-12">
                        <Resizable>
                            <ChartContainer
                                timeRange={series.range()}
                                onTrackerChanged={this.handleTrackerChanged}>
                                <ChartRow height="150" debug={false}>
                                    <YAxis id="wind-gust" label="Wind gust (mph)" labelOffset={-5}
                                           min={0} max={series.max()} width="70" type="linear" format=",.1f"/>
                                    <Charts>
                                        <ScatterChart
                                            axis="wind-gust"
                                            series={series}
                                            style={event => ({
                                                normal: {
                                                    fill: "green",
                                                    opacity: event.get("radius")/5
                                                },
                                                hover: {
                                                    fill: "ltgreen",
                                                    stroke: "green",
                                                    opacity: 1.0
                                                },
                                                selected: {
                                                    fill: "orange",
                                                    stroke: "orange",
                                                    strokeWidth: 3,
                                                    opacity: 1.0
                                                }
                                            })}
                                            format=".1f"
                                            selection={this.state.selection}
                                            onSelectionChange={this.handleSelectionChanged}                                            highlight={this.state.highlight}
                                            radius={event => event.get("radius")}/>
                                    </Charts>
                                </ChartRow>
                            </ChartContainer>
                        </Resizable>
                    </div>
                </div>

                <hr/>

                <div className="row">
                    <div className="col-md-12">
                        <APIDocs file="src/scatterchart.jsx"/>
                    </div>
                </div>
            </div>
        );
    }
});
