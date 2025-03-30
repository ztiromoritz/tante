# tante
Yet another commandline time tracker

# Installation

```npm i -g tante```

# Usage

# Changelog

## 0.0.13 
 * `tante xxx [from] [to]` can now be something like `tante xxx 01.10. =` for a range containing only one day 
 * `tante addup` for an accumulative over/undertime report and a weeky overview in one line
 * `tante set start/stop` to add entries on another day

## 0.0.12
 * `tante short-status` for bar integration

## 0.0.11
 * `tante status` one more week

## 0.0.10

 * `tante status` shows a lot more. 
 * `tante countdown` removed. Part of `tante status` now.
 * First param in `tante start` can be a time as well.
 * color bars for running task now stop at current moment.

## 0.0.9
commander version bump

## 0.0.8

New timeOrTask Option for tante start.
All of this is valid
```
    tante start 
    tante start 8:00
    tante start cleanup
    tante start 8:00 cleanup

```
Breaking change, no longer supported:
```

    tante start task 8:00

```
