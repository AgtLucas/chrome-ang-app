'use strict';

var app = angular.module('noMoreLies', []);

app.controller('MainCtrl', function($scope, $timeout, Weather) {
    // Date object
    $scope.date = {};

    // Update function
    var updateTime = function() {
        $scope.date.raw = new Date();
        $timeout(updateTime, 1000);
    }

    $scope.weather = {}
    Weather.getWeatherForecast('CA/San_Francisco')
    .then(function(data) {
        $scope.weather.forecast = data;
    });

    // Kick off update function
    updateTime();
});


app.provider('Weather', function() {
    var apiKey = "";

    this.getUrl = function(type, ext) {
        return 'http://api.wunderground.com/api/' +
            this.apiKey + '/' + type + '/q/' +
            ext + '.json';
    };

    this.setApiKey = function(key) {
        if (key) this.apiKey = key;
    };

    this.$get = function($q, $http) {
        var self = this;
        return {
            getWeatherForecast: function(city) {
                var d = $q.defer();
                $http({
                    method: 'GET',
                    url: self.getUrl('forecast', city),
                    cache: true
                }).success(function(data) {
                    d.resolve(data.forecast.simpleforecast);
                }).error(function(err) {
                    d.reject(err);
                });
                return d.promise;
            }
        }
    }
});

app.config(function(WeatherProvider) {
    WeatherProvider.setApiKey('0bf91bb915508618');
});