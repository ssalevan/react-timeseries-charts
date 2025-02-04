/**
 *  Copyright (c) 2016, The Regents of the University of California,
 *  through Lawrence Berkeley National Laboratory (subject to receipt
 *  of any required approvals from the U.S. Dept. of Energy).
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree.
 */

import React from "react";
import Ring from "ringjs";
import Highlighter from "./highlighter";
import Markdown from "react-markdown";

import {
    TimeSeries,
    TimeRange,
    Event,
    Pipeline,
    UnboundedIn,
    EventOut,
    avg,
    max
} from "pondjs";

import ChartContainer from "../../src/chartcontainer";
import ChartRow from "../../src/chartrow";
import Charts from "../../src/charts";
import YAxis from "../../src/yaxis";
import ScatterChart from "../../src/scatterchart";
import BarChart from "../../src/barchart";
import Resizable from "../../src/resizable";
import Legend from "../../src/legend";

import docs from "raw!../../docs/realtime.md";

const sec = 1000;
const minute = 60 * sec;
const hours = 60 * minute;
const INTERVAL_RATE = 200;

export default React.createClass({

    displayName: "AggregatorDemo",

    mixins: [Highlighter],

    getInitialState() {
        return {
            time: new Date(2015, 0, 1),
            events: new Ring(200),
            avgOut: new Ring(100),
            maxOut: new Ring(100)
        };
    },

    getNewEvent(t) {
        const base = Math.sin(t.getTime() / 10000000) * 350 + 500;
        return new Event(t, parseInt(base + Math.random() * 1000, 10));
    },

    componentDidMount() {

        //
        // Setup our aggregation pipelines
        //

        this.eventSource = new UnboundedIn();

        Pipeline()
            .from(this.eventSource)
            .windowBy("5m")
            .emitOn("discard")
            .aggregate({value: max})
            .to(EventOut, event => {
                const events = this.state.maxOut;
                events.push(event);
                this.setState({maxOut: events});
            });

        Pipeline()
            .from(this.eventSource)
            .windowBy("5m")
            .emitOn("discard")
            .aggregate({value: avg})
            .to(EventOut, event => {
                const events = this.state.avgOut;
                events.push(event);
                this.setState({avgOut: events});
            });
       
        //
        // Setup our interval to advance the time and generate raw events
        //

        const increment = minute;
        this.interval = setInterval(() => {
            const t = new Date(this.state.time.getTime() + increment);
            const event = this.getNewEvent(t);

            // Raw events
            const newEvents = this.state.events;
            newEvents.push(event);
            this.setState({time: t, events: newEvents});

            // Let our aggregators process the event
            this.eventSource.addEvent(event);
            //this.hourlyAggregator.addEvent(event);

        }, INTERVAL_RATE);
    },

    componentWillUnmount() {
        clearInterval(this.interval);
    },

    render() {
        const latestTime = `${this.state.time}`;

        const fiveMinuteStyle = {
            value: {
                normal: {fill: "#619F3A", opacity: 0.2},
                highlight: {fill: "619F3A", opacity: 0.5},
                selected: {fill: "619F3A", opacity: 0.5}
            }
        };

        const scatterStyle = {
            value: {
                normal: {
                    fill: "steelblue",
                    opacity: 0.5
                }
            }
        };

        //
        // Create a TimeSeries for our raw, 5min and hourly events
        //

        const eventSeries =
            new TimeSeries({
                name: "raw",
                events: this.state.events.toArray()
            });

        const avgSeries =
            new TimeSeries({
                name: "five minute avg",
                events: this.state.avgOut.toArray()
            });

        const maxSeries =
            new TimeSeries({
                name: "five minute max",
                events: this.state.maxOut.toArray()
            });

        // Timerange for the chart axis
        const initialBeginTime = new Date(2015, 0, 1);
        const timeWindow = 3 * hours;

        let beginTime;
        const endTime = new Date(this.state.time.getTime() + minute);
        if (endTime.getTime() - timeWindow < initialBeginTime.getTime()) {
            beginTime = initialBeginTime;
        } else {
            beginTime = new Date(endTime.getTime() - timeWindow);
        }
        const timeRange = new TimeRange(beginTime, endTime);

        // Charts (after a certain amount of time, just show hourly rollup)
        const charts = (
            <Charts>
                <BarChart
                    axis="y"
                    series={maxSeries}
                    style={fiveMinuteStyle}
                    columns={["value"]} />
                <BarChart
                    axis="y"
                    series={avgSeries}
                    style={fiveMinuteStyle}
                    columns={["value"]} />
                <ScatterChart
                    axis="y"
                    series={eventSeries}
                    style={scatterStyle} />
            </Charts>
        );

        const dateStyle = {
            fontSize: 12,
            color: "#AAA",
            borderWidth: "1",
            borderColor: "#F4F4F4"
        };

        return (
            <div>
                <div className="row">
                    <div className="col-md-12">
                        <h3>Realtime example</h3>
                    </div>
                </div>
                <hr />
                <div className="row">
                    <div className="col-md-4">
                        <Legend type="swatch" categories={[
                            {key: "avg", label: "Avg", style: {fill: "#C5DCB7"}},
                            {key: "max", label: "Max", style: {fill: "#DFECD7"}}
                        ]} />
                    </div>
                    <div className="col-md-8">
                        <span style={dateStyle}>{latestTime}</span>
                    </div>
                </div>
                <hr />
                <div className="row">
                    <div className="col-md-12">
                        <Resizable>
                            <ChartContainer timeRange={timeRange}>
                                <ChartRow height="150">
                                    <YAxis
                                        id="y"
                                        label="Value"
                                        min={0} max={1500}
                                        width="70" type="linear"/>
                                    {charts}
                                </ChartRow>
                            </ChartContainer>
                        </Resizable>
                    </div>
                </div>
                <hr />
                 <div className="row">
                    <div className="col-md-12">
                        <Markdown source={docs}/>
                    </div>
                </div>
            </div>
        );
    }
});
