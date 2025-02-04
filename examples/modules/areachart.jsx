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
import Highlighter from "./highlighter";
import APIDocs from "./docs";

// Pond
import { TimeSeries } from "pondjs";

// Imports from the charts library
import Legend from "../../src/legend";
import ChartContainer from "../../src/chartcontainer";
import ChartRow from "../../src/chartrow";
import Charts from "../../src/charts";
import YAxis from "../../src/yaxis";
import AreaChart from "../../src/areachart";
import Resizable from "../../src/resizable";

// Data
const rawTrafficData = require("../data/link-traffic.json");

const trafficBNLtoNEWYSeries = new TimeSeries({
    name: `BNL to NEWY`,
    columns: ["time", "in"],
    points: _.map(rawTrafficData.traffic["BNL--NEWY"], p => [p[0] * 1000, p[1]])
});

const trafficNEWYtoBNLSeries = new TimeSeries({
    name: `NEWY to BNL`,
    columns: ["time", "out"],
    points: _.map(rawTrafficData.traffic["NEWY--BNL"], p => [p[0] * 1000, p[1]])
});

const traffic = TimeSeries.timeSeriesListMerge(
    {name: "traffic"},
    [trafficBNLtoNEWYSeries, trafficNEWYtoBNLSeries]
);

export default React.createClass({

    mixins: [Highlighter],

    getInitialState() {
        return {
            tracker: null,
            timerange: traffic.range()
        };
    },

    handleTrackerChanged(t) {
        this.setState({tracker: t});
    },

    handleTimeRangeChange(timerange) {
        this.setState({timerange});
    },

    render() {
        const dateStyle = {
            fontSize: 12,
            color: "#AAA",
            borderWidth: "1",
            borderColor: "#F4F4F4"
        };

        const max = _.max([
            trafficBNLtoNEWYSeries.max("in"),
            trafficNEWYtoBNLSeries.max("out")
        ]);

        const axistype = "linear";
        const tracker = this.state.tracker ? `${this.state.tracker}` : "";

        return (
            <div>
                <div className="row">
                    <div className="col-md-12">
                        <h3>AreaChart</h3>
                    </div>
                </div>

                <hr />

                <div className="row">
                    <div className="col-md-4">
                        <Legend type="swatch" categories={[
                            {key: "in", label: "Into Site", style: {fill: "#448FDD"}},
                            {key: "out", label: "Out of site", style: {fill: "#FD8D0D"}}
                        ]} />
                    </div>
                    <div className="col-md-8">
                        <span style={dateStyle}>{tracker}</span>
                    </div>
                </div>

                <hr />

                <div className="row">
                    <div className="col-md-12">
                        <Resizable>

                            <ChartContainer
                                timeRange={this.state.timerange}
                                trackerPosition={this.state.tracker}
                                onTrackerChanged={this.handleTrackerChanged}
                                enablePanZoom={true}
                                maxTime={traffic.range().end()}
                                minTime={traffic.range().begin()}
                                minDuration={1000 * 60 * 60}
                                onTimeRangeChanged={this.handleTimeRangeChange} >
                                <ChartRow height="150" debug={false}>
                                    <Charts>
                                        <AreaChart
                                            axis="traffic"
                                            fillOpacity={0.8}
                                            series={traffic}
                                            columns={{up: ["in"], down: ["out"]}} />
                                    </Charts>
                                    <YAxis id="traffic" label="Traffic (bps)" labelOffset={0} min={-max} max={max} absolute={true} width="60" type={axistype}/>
                                </ChartRow>
                            </ChartContainer>

                        </Resizable>
                    </div>
                </div>

                <hr />

                <div className="row">
                    <div className="col-md-12">
                        <APIDocs file="src/areachart.jsx"/>
                    </div>
                </div>
            </div>
        );
    }
});
