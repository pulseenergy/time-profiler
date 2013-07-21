var moment = require('moment'),
	csv = require('csv'),
	util = require('util'),
	events = require('events'),
	_  = require('underscore');


util.inherits(Profiler, events.EventEmitter);
function Profiler () {
	this.profiles = {};
	events.EventEmitter.call(this);
}

var _profiler = new Profiler();
module.exports =  _profiler;

Profiler.prototype.addProfile = function (name) {
	var profile = new Profile(name);
	this.profiles[name] = profile;
	return profile;
};

function Profile (name) {
	this.name = name;
	this.time = moment();
	this.events = {};
	this.finished = false;
}


function Event (name, profileStartTime) {
	this.name = name;
	this.profileStartTime = profileStartTime;
	this.startTime = moment().valueOf() - profileStartTime.valueOf();
}

Event.prototype.completeEvent = function () {
	this.endTime = moment().valueOf() - this.profileStartTime.valueOf();
	this.duration = this.endTime - this.startTime;
};


Profile.prototype.addEvent = function (name) {
	if (this.finished) {
		return console.error("Cannot add event to profile marked as complete");
	}
	var event = new Event(name, this.time);
	this.events[name] = event;
	return event;
};



Profile.prototype.completeProfile = function (skipPrinting) {
	this.totalTime =  moment().valueOf() - this.time.valueOf();
	this.fnished = true;
	if (!skipPrinting) {
		console.log("****************Profile: " + this.name + " ************");
		console.log("Total Time: " + this.totalTime);
		_.each(this.events, function (event, name) {
			console.log("Event: " + name + "- " + (event.duration ? event.duration : event.startTime));
		});
	}
	_profiler.emit("finished", this.name);
};

Profiler.prototype.exportProfilesToCsv = function (path) {
	var result = [];
	var headers = ["Profile", "Total Time"];
	var additionalHeaders = _.uniq(_.flatten(_.map(this.profiles, function (profile) {
		return _.pluck(profile.events, "name");
	})));
	headers = headers.concat(additionalHeaders);
	result.push(headers);

	_.each(this.profiles, function (profile) {
		var profileRow = [profile.name, profile.totalTime];
		_.each(additionalHeaders, function (header) {
			if (profile.events[header]) {
				profileRow.push(profile.events[header].duration ? profile.events[header].duration : profile.events[header].startTime);
			} else {
				profileRow.push("");
			}
		});
		result.push(profileRow);
	});
	csv()
		.from(result)
		.to(path || "profilerOut.csv");
};

Profiler.prototype.refresh = function () {
	this.profiles = [];
};

Profiler.prototype.getProfile = function (name) {
	return this.profiles[name];
};