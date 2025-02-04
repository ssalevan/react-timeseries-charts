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
import ReactDOM from "react-dom";
import { TimeRange } from "pondjs";

// http://stackoverflow.com/a/28857255
function getElementOffset(element) {
    const de = document.documentElement;
    const box = element.getBoundingClientRect();
    const top = box.top + window.pageYOffset - de.clientTop;
    const left = box.left + window.pageXOffset - de.clientLeft;
    return {top, left};
}

export default React.createClass({

    displayName: "EventHandler",

    getInitialState() {
        return {
            isPanning: false,
            initialPanBegin: null,
            initialPanEnd: null,
            initialPanPosition: null
        };
    },

    // get the event mouse position relative to the event rect
    getOffsetMousePosition(e) {
        const trackerRect = ReactDOM.findDOMNode(this.refs.eventrect);
        const offset = getElementOffset(trackerRect);
        const x = e.pageX - offset.left;
        const y = e.pageY - offset.top;
        return [Math.round(x), Math.round(y)];
    },

    handleScrollWheel(e) {
        e.preventDefault();

        const SCALE_FACTOR = 0.001;
        let scale = 1 + e.deltaY * SCALE_FACTOR;
        if (scale > 3) {
            scale = 3;
        }
        if (scale < 0.1) {
            scale = 0.1;
        }

        const xy = this.getOffsetMousePosition(e);

        const begin = this.props.scale.domain()[0].getTime();
        const end = this.props.scale.domain()[1].getTime();

        const center = this.props.scale.invert(xy[0]).getTime();

        let beginScaled = center - parseInt((center - begin) * scale, 10);
        let endScaled = center + parseInt((end - center) * scale, 10);

        // Duration constraint
        let duration = (end - begin) * scale;

        if (this.props.minDuration) {
            const minDuration = parseInt(this.props.minDuration, 10);
            if (duration < this.props.minDuration) {
                beginScaled = center - (center - begin) /
                    (end - begin) * minDuration;
                endScaled = center + (end - center) /
                    (end - begin) * minDuration;
            }
        }

        if (this.props.minTime && this.props.maxTime) {
            const maxDuration = this.props.maxTime.getTime() -
                                this.props.minTime.getTime();
            if (duration > maxDuration) {
                duration = maxDuration;
            }
        }

        // Range constraint
        if (this.props.minTime && beginScaled < this.props.minTime.getTime()) {
            beginScaled = this.props.minTime.getTime();
            endScaled = beginScaled + duration;
        }

        if (this.props.maxTime && endScaled > this.props.maxTime.getTime()) {
            endScaled = this.props.maxTime.getTime();
            beginScaled = endScaled - duration;
        }

        const newBegin = new Date(beginScaled);
        const newEnd = new Date(endScaled);

        const newTimeRange = new TimeRange(newBegin, newEnd);

        if (this.props.onZoom) {
            this.props.onZoom(newTimeRange);
        }
    },

    handleMouseDown(e) {
        e.preventDefault();

        const x = e.pageX;
        const y = e.pageY;
        const xy0 = [Math.round(x), Math.round(y)];

        const begin = this.props.scale.domain()[0].getTime();
        const end = this.props.scale.domain()[1].getTime();

        document.addEventListener("mouseover", this.handleMouseMove);
        document.addEventListener("mouseup", this.handleMouseUp);

        this.setState({
            isPanning: true,
            initialPanBegin: begin,
            initialPanEnd: end,
            initialPanPosition: xy0
        });
    },

    handleMouseUp(e) {
        e.preventDefault();

        document.removeEventListener("mouseover", this.handleMouseMove);
        document.removeEventListener("mouseup", this.handleMouseUp);

        this.setState({
            isPanning: false,
            initialPanBegin: null,
            initialPanEnd: null,
            initialPanPosition: null
        });
    },

    handleMouseOut(e) {
        e.preventDefault();

        if (this.props.onMouseOut) {
            this.props.onMouseOut();
        }
    },

    handleMouseMove(e) {
        e.preventDefault();

        const x = e.pageX;
        const y = e.pageY;
        const xy = [Math.round(x), Math.round(y)];

        if (this.state.isPanning) {

            const xy0 = this.state.initialPanPosition;
            const timeOffset = this.props.scale.invert(xy[0]).getTime() -
                this.props.scale.invert(xy0[0]).getTime();

            let newBegin = parseInt(this.state.initialPanBegin -
                timeOffset, 10);
            let newEnd = parseInt(this.state.initialPanEnd - timeOffset, 10);
            const duration = parseInt(this.state.initialPanEnd -
                this.state.initialPanBegin, 10);

            // Range constraint
            if (this.props.minTime && newBegin < this.props.minTime.getTime()) {
                newBegin = this.props.minTime.getTime();
                newEnd = newBegin + duration;
            }

            if (this.props.maxTime && newEnd > this.props.maxTime.getTime()) {
                newEnd = this.props.maxTime.getTime();
                newBegin = newEnd - duration;
            }

            const newTimeRange = new TimeRange(newBegin, newEnd);

            // onZoom callback
            if (this.props.onZoom) {
                this.props.onZoom(newTimeRange);
            }
        } else if (this.props.onMouseMove) {
            const trackerPosition = this.getOffsetMousePosition(e)[0];
            const time = this.props.scale.invert(trackerPosition);

            // onMouseMove callback
            if (this.props.onMouseMove) {
                this.props.onMouseMove(time);
            }
        }
    },

    render() {
        const cursor = this.state.isPanning ? "-webkit-grabbing" : "default";
        const children = React.Children.map(this.props.children, (element) => {
            return React.cloneElement(element, {isPanning: this.state.isPanning});
        });
        return (
            <g
                pointerEvents="all"
                onWheel={this.handleScrollWheel}
                onMouseDown={this.handleMouseDown}
                onMouseMove={this.handleMouseMove}
                onMouseOut={this.handleMouseOut}
                onMouseUp={this.handleMouseUp}>
                <rect
                    key="handler-hit-rect"
                    ref="eventrect"
                    style={{opacity: 0.0, cursor}}
                    x={0} y={0}
                    width={this.props.width}
                    height={this.props.height} />
                {children}
            </g>
        );
    }
});
