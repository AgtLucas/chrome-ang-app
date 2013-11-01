'use strict';

// Define Angular Module
var app = angular.module('noMoreLies', []);

// Main Controller
app.controller('MainCtrl', function($scope, $timeout, Weather, UserService) {
    // Date object
    $scope.date = {};
    // Update function
    var updateTime = function() {
        $scope.date.tz = new Date(new Date().toLocaleString(
                'en-US', {timezone: $scope.user.timezone}
            ));
        $timeout(updateTime, 1000);
    }

    $scope.weather = {}
    $scope.user = UserService.user;
    Weather.getWeatherForecast($scope.user.location)
    .then(function(data) {
        $scope.weather.forecast = data;
    });

    // Kick off update function
    updateTime();
});

// Setting Controller
app.controller('SettingsCtrl', function($scope, UserService, Weather) {
    $scope.user = UserService.user;
    $scope.fetchCities = Weather.getCityDetails;

    $scope.save = function() {
        UserService.save();
    }
});

// Factory
app.factory('UserService', function() {
    var defaults = {
        location: 'autoip'
    };
    var service = {
        user: {},
        save: function() {
            sessionStorage.presently = angular.toJson(service.user);
        },
        restore: function() {
            service.user = angular.fromJson(sessionStorage.presently) || defaults

            return service.user;
        }
    };

    service.restore();
    return service;
});

// Provider
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
            },

            getCityDetails: function(query) {
                var d = $q.defer();
                $http({
                    method: 'GET',
                    url: 'http://autocomplete.wunderground.com/' +
                         'aq?query=' +
                         query
                }).success(function(data) {
                    d.resolve(data.RESULTS);
                }).error(function(err) {
                    d.reject(err);
                });
                return d.promise;
            }
        }
    }
});

// Directives
app.directive('autoFill', function($timeout) {
    return {
        restrict: 'EA',
        scope: {
            autoFill: '&',
            ngModel: '='
        },
        compile: function(tEle, tAttrs) {
            // Compile function
            var tplEl = angular.element(
                '<div class="typehead">' +
                    '<input type="text" autocomplete="off" />' +
                        '<ul class="auto-list" ng-show="reslist">' +
                            '<li ng-repeat="res in reslist" ' +
                            '>{{res.name}}</li>' +
                        '</ul>' +
                '</div>'
            );

            var input = tplEl.find('input');
            input.attr('type', tAttrs.type);
            input.attr('ng-model', tAttrs.ngModel);
            input.attr('timezone', tAttrs.timezone);
            tEle.replaceWith(tplEl);
            return function(scope, ele, attrs, ctrl) {
                var minKeyCount = attrs.minKeyCount || 3,
                    timer,
                    val,
                    input = ele.find('input');

                input.bind('keyup', function(e) {
                    val = ele.val();
                    if (val.length < minKeyCount) {
                        if (timer) $timeout.cancel(timer);
                        scope.reslist = null;
                        return;
                    } else {
                        if (timer) $timeout.cancel(timer);
                        timer = $timeout(function() {
                            scope.autoFill()(val)
                            .then(function(data) {
                                if (data && data.length > 0) {
                                    scope.reslist = data;
                                    scope.ngModel = 'zmw:' + data[0].zmw;
                                    scope.timezone = data[0].tz;
                                }
                            });
                        }, 300);
                    }
                });

                input.bind('blur', function(e) {
                    scope.reslist = null;
                    scope.$digest();
                });
            }
        }
    }
});

// Configs
app.config(function(WeatherProvider) {
    WeatherProvider.setApiKey('0bf91bb915508618');
});

app.config(function($routeProvider) {
    $routeProvider.when('/', {
        templateUrl: 'templates/home.html',
        controller: 'MainCtrl'
    })
    .when('/settings', {
        templateUrl: 'templates/settings.html',
        controller: 'SettingsCtrl'
    })
    .otherwise({redirectTo: '/'});
});
