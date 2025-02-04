"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _d3Shape = require("d3-shape");

var _d3Shape2 = _interopRequireDefault(_d3Shape);

var _pondjs = require("pondjs");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function scaleAsString(scale) {
    return scale.domain() + "-" + scale.range();
}

/**
 * The `<AreaChart>` component is able to display single or multiple stacked
 * areas above or below the axis. It used throughout the
 * [My ESnet Portal](http://my.es.net).

 * The `<AreaChart>` should be used within a `<ChartContainer>` structure,
 * as this will construct the horizontal and vertical axis, and manage
 * other elements. Here is an example of an `<AreaChart>` with an up and down
 * network traffic visualization:
 *
 *  ```
 *   render() {
 *      return (
 *          ...
 *          <ChartContainer timeRange={trafficSeries.timerange()} width="1080">
 *              <ChartRow height="150">
 *                  <Charts>
 *                      <AreaChart
 *                          axis="traffic"
 *                          series={trafficSeries}
 *                          columns={{up: ["in"], down: ["out"]}}/>
 *                  </Charts>
 *                  <YAxis
 *                      id="traffic"
 *                      label="Traffic (bps)"
 *                      min={-max} max={max}
 *                      absolute={true}
 *                      width="60"
 *                      type="linear"/>
 *              </ChartRow>
 *          </ChartContainer>
 *          ...
 *      );
 *  }
 *  ```
 * The `<AreaChart>` takes a single `TimeSeries` object into its `series` prop. This
 * series can contain multiple columns and those columns can be referenced using the `columns`
 * prop. The `columns` props allows you to map columns in the series to the chart,
 * letting you specify the stacking and orientation of the data. In the above example
 * we map the "in" column in `trafficSeries` to the up direction and the "out" column to
 * the down direction. Each direction is specified as an array, so adding multiple
 * columns into a direction will stack the areas in that direction.
 *
 * Note: It is recommended that `<ChartContainer>`s be placed within a <Resizable> tag,
 * rather than hard coding the width as in the above example.
 */
/**
 *  Copyright (c) 2015, The Regents of the University of California,
 *  through Lawrence Berkeley National Laboratory (subject to receipt
 *  of any required approvals from the U.S. Dept. of Energy).
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree.
 */

exports.default = _react2.default.createClass({

    displayName: "AreaChart",

    propTypes: {

        /**
         * What [Pond TimeSeries](http://software.es.net/pond#timeseries) data to visualize
         */
        series: _react2.default.PropTypes.instanceOf(_pondjs.TimeSeries).isRequired,

        /**
         * Reference to the axis which provides the vertical scale for ## drawing. e.g.
         * specifying axis="trafficRate" would refer the y-scale to the YAxis of id="trafficRate".
         */
        axis: _react2.default.PropTypes.string.isRequired,

        /**
         * The series series columns mapped to stacking up and down.
         * Has the format:
         * ```
         *  "columns": {
         *      up: ["in", ...],
         *      down: ["out", ...]
         *  }
         *  ```
         */
        columns: _react2.default.PropTypes.shape({
            up: _react2.default.PropTypes.arrayOf(_react2.default.PropTypes.string),
            down: _react2.default.PropTypes.arrayOf(_react2.default.PropTypes.string)
        }),

        stack: _react2.default.PropTypes.bool,

        /**
         * The style of the area chart, with format:
         * ```
         * "style": {
         *     up: ["#448FDD", "#75ACE6", "#A9CBEF", ...],
         *     down: ["#FD8D0D", "#FDA949", "#FEC686", ...]
         * }
         * ```
         *
         * Currenly it is only possible to set the color for each area.
         * This may change in the future. You can, however, set the fill
         * opacity (see `fillOpacity`), but this will apply to all areas.
         */
        style: _react2.default.PropTypes.shape({
            up: _react2.default.PropTypes.arrayOf(_react2.default.PropTypes.string),
            down: _react2.default.PropTypes.arrayOf(_react2.default.PropTypes.string)
        }),

        fillOpacity: _react2.default.PropTypes.number,

        /**
         * Any of D3's interpolation modes.
         */
        interpolation: _react2.default.PropTypes.oneOf(["curveBasis", "curveBasisOpen", "curveBundle", "curveCardinal", "curveCardinalOpen", "curveCatmullRom", "curveCatmullRomOpen", "curveLinear", "curveMonotone", "curveNatural", "curveRadial", "curveStep", "curveStepAfter", "curveStepBefore"])
    },

    getDefaultProps: function getDefaultProps() {
        return {
            transition: 0,
            interpolation: "curveLinear",
            style: {
                up: ["#448FDD", "#75ACE6", "#A9CBEF"],
                down: ["#FD8D0D", "#FDA949", "#FEC686"]
            },
            fillOpacity: 0.75,
            columns: {
                up: ["value"],
                down: []
            },
            stack: true
        };
    },
    renderPaths: function renderPaths(columnList, direction) {
        var _this = this;

        var dir = direction === "up" ? 1 : -1;
        var cursor = this.props.isPanning ? "-webkit-grabbing" : "default";
        var size = this.props.series.size();
        var offsets = new Array(size).fill(0);

        return columnList.map(function (columnName, i) {
            var style = {
                fill: _this.props.style[direction][i],
                opacity: _this.props.fillOpacity,
                pointerEvents: "none",
                cursor: cursor
            };

            var outlineStyle = {
                stroke: _this.props.style[direction][i],
                strokeWidth: 1,
                fill: "none",
                opacity: 1,
                pointerEvents: "none",
                cursor: cursor
            };

            // Stack the series columns to get our data in x0, y0, y1 format
            var data = [];
            for (var _i = 0; _i < _this.props.series.size(); _i++) {
                var seriesPoint = _this.props.series.at(_i);
                data.push({
                    x0: _this.props.timeScale(seriesPoint.timestamp()),
                    y0: _this.props.yScale(offsets[_i]),
                    y1: _this.props.yScale(offsets[_i] + dir * seriesPoint.get(columnName))
                });
                if (_this.props.stack) {
                    offsets[_i] += dir * seriesPoint.get(columnName);
                }
            }

            // Use D3 to build an area generation function
            var area = _d3Shape2.default.area().curve(_d3Shape2.default[_this.props.interpolation]).x(function (d) {
                return d.x0;
            }).y0(function (d) {
                return d.y0;
            }).y1(function (d) {
                return d.y1;
            });

            // Use the area generation function with our stacked data
            // to get an SVG path
            var areaPath = area(data);

            // Outline the top of the curve
            var lineFunction = _d3Shape2.default.line().curve(_d3Shape2.default[_this.props.interpolation]).x(function (d) {
                return d.x0;
            }).y(function (d) {
                return d.y1;
            });
            var outlinePath = lineFunction(data);

            return _react2.default.createElement(
                "g",
                { key: "area-" + i },
                _react2.default.createElement("path", {
                    key: "area-" + direction + "-" + i,
                    clipPath: _this.props.clipPathURL,
                    style: style,
                    d: areaPath }),
                _react2.default.createElement("path", {
                    style: outlineStyle,
                    key: "outline-" + direction + "-" + i,
                    clipPath: _this.props.clipPathURL,
                    d: outlinePath })
            );
        });
    },
    renderAreas: function renderAreas() {
        var up = this.props.columns.up || [];
        var down = this.props.columns.down || [];

        return _react2.default.createElement(
            "g",
            null,
            this.renderPaths(up, "up"),
            this.renderPaths(down, "down")
        );
    },
    shouldComponentUpdate: function shouldComponentUpdate(nextProps) {
        var newSeries = nextProps.series;
        var oldSeries = this.props.series;

        var width = nextProps.width;
        var timeScale = nextProps.timeScale;
        var yScale = nextProps.yScale;
        var interpolate = nextProps.interpolate;
        var isPanning = nextProps.isPanning;
        var columns = nextProps.columns;
        var style = nextProps.style;

        var widthChanged = this.props.width !== width;
        var timeScaleChanged = scaleAsString(this.props.timeScale) !== scaleAsString(timeScale);
        var yAxisScaleChanged = this.props.yScale != yScale;
        var interpolateChanged = this.props.interpolate !== interpolate;
        var isPanningChanged = this.props.isPanning !== isPanning;
        var columnsChanged = JSON.stringify(this.props.columns) !== JSON.stringify(columns);
        var styleChanged = JSON.stringify(this.props.style) !== JSON.stringify(style);

        var seriesChanged = false;
        if (oldSeries.length !== newSeries.length) {
            seriesChanged = true;
        } else {
            seriesChanged = !_pondjs.TimeSeries.is(oldSeries, newSeries);
        }

        return seriesChanged || timeScaleChanged || widthChanged || interpolateChanged || isPanningChanged || columnsChanged || styleChanged || yAxisScaleChanged;
    },
    render: function render() {
        return _react2.default.createElement(
            "g",
            null,
            this.renderAreas()
        );
    }
});