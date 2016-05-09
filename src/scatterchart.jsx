/**
 *  Copyright (c) 2015, The Regents of the University of California,
 *  through Lawrence Berkeley National Laboratory (subject to receipt
 *  of any required approvals from the U.S. Dept. of Energy).
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree.
 */

import React from "react";
import _ from "underscore";
import { format } from "d3-format";
import { timeFormat } from "d3-time-format";
import merge from "merge";
import { Event, TimeSeries } from "pondjs";

import ValueList from "./valuelist";

const defaultStyle = {
    normal: {fill: "steelblue"},
    highlight: {fill: "#5a98cb"},
    selected: {fill: "yellow"},
    text: {fill: "#333", stroke: "none"}
};

/**
 * The `<ScatterChart >` widget is able to display a single series
 * scattered across a time axis.
 *
 * The ScatterChart should be used within `<ChartContainer>` etc.,
 * as this will construct the horizontal and vertical axis, and
 * manage other elements.
 *
 *
 * ```
 * <ChartContainer timeRange={series.timerange()}>
 *     <ChartRow height="150">
 *         <YAxis id="wind" label="Wind gust (mph)" labelOffset={-5}
 *                min={0} max={series.max()} width="100" type="linear" format=",.1f"/>
 *         <Charts>
 *             <ScatterChart axis="wind" series={series} style={{color: "steelblue", opacity: 0.5}} />
 *         </Charts>
 *     </ChartRow>
 * </ChartContainer>
 * ```
 */
export default React.createClass({

    displayName: "ScatterChart",

    getDefaultProps() {
        return {
            radius: 2.0,

            style: {
                color: "steelblue",
                opacity: 1
            },

            hintStyle: {
                line: {
                    stroke: "#AAA",
                    cursor: "crosshair"
                },
                box: {
                    fill: "white",
                    opacity: 0.85,
                    stroke: "#AAA"
                }
            },

            hintWidth: 90,
            hintHeight: 30
        };
    },

    propTypes: {

        /**
         * What [Pond TimeSeries](http://software.es.net/pond#timeseries) data to visualize
         */
        series: React.PropTypes.instanceOf(TimeSeries).isRequired,

        /**
         * Reference to the axis which provides the vertical scale for drawing. e.g.
         * specifying axis="trafficRate" would refer the y-scale to the YAxis of id="trafficRate".
         */
        axis: React.PropTypes.string.isRequired,

        /**
         * The radius of each point if a radius is not present in the series.
         */
        radius: React.PropTypes.number,

        /**
         * The style of the scatter chart drawing (using SVG CSS properties). For example:
         * ```
         * style = {
         *     color: "steelblue",
         *     opacity: 0.5
         * }
         * ```
         */
        style: React.PropTypes.shape({
            color: React.PropTypes.string,
            opacity: React.PropTypes.number
        })
    },

    /**
     * hover state is tracked internally and a highlight shown as a result
     */
    getInitialState() {
        return {
            hover: null
        };
    },

    /**
     * Continues a hover event on a specific bar of the bar chart.
     */
    handleMouseMove(e, event) {
        this.setState({hover: event});
        if (this.props.onMouseMove) {
            this.props.onMouseMove(event);
        }
    },

    handleMouseLeave() {
        this.setState({hover: null});
        if (this.props.onMouseLeave) {
            this.props.onMouseLeave(null);
        }
    },

    handleClick(e, event) {
        if (this.props.onSelectionChange) {
            this.props.onSelectionChange(event);
        }
    },

    renderTrackerTime(d) {
        const textStyle = {
            fontSize: 11,
            textAnchor: "left",
            fill: "#bdbdbd"
        };
        const format = timeFormat("%X");
        let dateStr = format(d);

        return (
            <text x={0} y={0} dy="1.2em" style={textStyle}>
                {dateStr}
            </text>
        );
    },

    renderHint(time, posx, posy, valueList) {
        const w = this.props.hintWidth;

        const horizontalMark = (
            <line
                style={this.props.hintStyle.line}
                x1={-10} y1={posy - 10}
                x2={0} y2={posy - 10} />
        );

        if (valueList) {
            if (posx + 10 + w < this.props.width - 300) {
                const verticalConnector = (
                    <line
                        style={this.props.hintStyle.line}
                        x1={0} y1={posy - 10}
                        x2={0} y2={20} />
                );
                return (
                    <g transform={`translate(${posx + 10},${10})`} >
                        {horizontalMark}
                        {verticalConnector}
                        {this.renderTrackerTime(time)}
                        <g transform={`translate(0,${20})`}>
                            <ValueList
                                align="left"
                                values={valueList}
                                style={this.props.hintStyle.box}
                                width={this.props.hintWidth}
                                height={this.props.hintHeight} />
                        </g>
                    </g>
                );
            } else {
                const verticalConnector = (
                    <line
                        style={this.props.hintStyle.line}
                        x1={0} y1={posy - 10}
                        x2={0} y2={20} />
                );
                return (
                    <g transform={`translate(${posx - w - 10},${10})`} >
                        {horizontalMark}
                        {verticalConnector}
                        {this.renderTrackerTime(time)}
                        <g transform={`translate(0,${20})`}>
                            <ValueList
                                align="left"
                                values={valueList}
                                style={this.props.hintStyle.box}
                                width={this.props.hintWidth}
                                height={this.props.hintHeight} />
                        </g>
                    </g>
                );
            }
        } else {
            return (
                <g />
            );
        }
    },

    renderScatter() {
        const series = this.props.series;
        const timeScale = this.props.timeScale;
        const yScale = this.props.yScale;

        const points = [];
        const hover = [];

        let key = 1;
        for (const event of series.events()) {
            const t = event.timestamp();
            const value = event.get(this.props.column);
            const x = timeScale(t);
            const y = yScale(value);
            const radius = _.isFunction(this.props.radius) ?
                this.props.radius(event) : this.props.radius;

            const isHighlighted =
                (this.state.hover &&
                    Event.is(this.state.hover, event)) ||
                (this.props.highlight &&
                    Event.is(this.props.highlight, event));

            const isSelected =
                (this.props.selection &&
                    Event.is(this.props.selection, event));

            const providedStyle = this.props.style ?
                this.props.style : {};
            const styleMap = _.isFunction(this.props.style) ?
                this.props.style(event) :
                merge(true, defaultStyle, providedStyle);

            let style = styleMap.normal;
            if (isSelected) {
                style = styleMap.selected;
            } else if (isHighlighted) {
                style = styleMap.hover;
            }
            
            // Hover text
            let text = `${value}`;
            let hoverText;
            if (isHighlighted) {
                if (this.props.format && _.isString(this.props.format)) {
                    const formatter = format(this.props.format);
                    text = formatter(value);
                } else if (_.isFunction(this.props.format)) {
                    text = this.props.format(value);
                }
                
                // const textStyle = styleMap.text;
                console.log("hover");
                hoverText = this.renderHint(t, x, y, [{label: "Wind", value: text}]);
            }

            if (hoverText) {
                hover.push(hoverText);
            }
                   
            points.push(
                <circle
                    key={key}
                    cx={x}
                    cy={y}
                    r={radius}
                    style={style}
                    pointerEvents="none"
                    clipPath={this.props.clipPathURL}
                    onClick={e => this.handleClick(e, event)}
                    onMouseLeave={() => this.handleMouseLeave()}
                    onMouseMove={e => this.handleMouseMove(e, event)} />
            );

            key++;
        }

        return (
            <g>
                {points}
                {hover}
            </g>
        );
    },

    render() {
        return (
            <g>
                {this.renderScatter()}
            </g>
        );
    }
});
