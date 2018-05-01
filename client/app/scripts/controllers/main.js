'use strict';

/**
 * @ngdoc function
 * @name preventure.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the preventure
 */
angular.module('preventure')
  .controller('MainCtrl',['$scope','$state','$log','Home', function ($scope,$state,$log,Home) {

    /*Initialise some scope variables for form use*/
    $scope.showResult = false;
    $scope.city=[{"name":'Sydney'},
                  {"name":'Brisbane'},
                  {"name": 'Melbourne'}]


    $scope.type=[{"name":'Crash',},
                  {"name":'Hazard'},
                  {"name":'Theft'},
                  {"name":'Unconfirmed'}]
    $scope.form = {"city":'',
                    "type":''}
    /*call submit form to hit the search*/
    $scope.gotoSubmit = function(form) {
        $('.loading').show()
        if (form.$valid) {

            /*If user dont send any value then fetch all the results*/

            if($scope.form== undefined ){
              var city = 'all'
              var type = 'all'

            } else {
                if ($scope.form['city'].length == 0) {
                    var city = 'all'
                } else {
                    var city = $scope.form['city']
                }
                if ($scope.form['type'].length == 0) {

                    var type = 'all'
                } else {
                    var type = $scope.form['type']
                }
            }
            Home.getResponseDetails(city,type).then(
                function success(response) {
                    $scope.showResult = true;
                    $scope.response = response.incidents.incidents
                    $scope.summary = response.summary
                    $('.loading').hide()

                },
                function fail(error) {
                  $('.loading').hide()

                });
        }
    }

    /*Code for pagination*/
    $scope.itemsPerPage = 10;
      $scope.currentPage = 0;

      $scope.range = function () {

        var rangeSize = 4;
        if ($scope.pageCount() < rangeSize) {
          rangeSize = $scope.pageCount() + 1
        }
        var ps = [];
        var start;

        start = $scope.currentPage;
        if (start > $scope.pageCount() - rangeSize) {
          start = $scope.pageCount() - rangeSize + 1;
        }

        for (var i = start; i < start + rangeSize; i++) {
          ps.push(i);
        }
        return ps;
      };

      $scope.prevPage = function () {
        if ($scope.currentPage > 0) {
          $scope.currentPage--;
        }
      };

      $scope.firstPage = function () {
        if ($scope.currentPage > 0) {
          $scope.currentPage = 0;
        }
      }

      $scope.DisablePrevPage = function () {
        return $scope.currentPage === 0 ? "disabled" : "";
      };

      $scope.pageCount = function () {

        return Math.ceil($scope.response.length / $scope.itemsPerPage) - 1;
      };

      $scope.nextPage = function () {
        if ($scope.currentPage < $scope.pageCount()) {
          $scope.currentPage++;
        }
      };

      $scope.lastPage = function () {
        if ($scope.currentPage < $scope.pageCount()) {

          $scope.currentPage = $scope.pageCount();
        }
      }


      $scope.DisableNextPage = function () {
        return $scope.currentPage === $scope.pageCount() ? "disabled" : "";
      };

      $scope.setPage = function (n) {
        $scope.currentPage = n;
      };

      $scope.pagination = function () {
        if ($scope.pageCount() <= 0) {
          return false
        } else {
          return true
        }

      }




  }])
    /*pagination */
  .filter('pagination', function () {
    return function (input, start) {
      start = parseInt(start, 10);
      return input.slice(start);
    };
  })

    /*Retricting the data shown in the table for more streamlined view*/
  .filter('cut', function () {
    return function (value, wordwise, max, tail) {
      if (!value) return '';

      max = parseInt(max, 10);
      if (!max) return value;
      if (value.length <= max) return value;

      value = value.substr(0, max);
      if (wordwise) {
        var lastspace = value.lastIndexOf(' ');
        if (lastspace !== -1) {
          //Also remove . and , so its gives a cleaner result.
          if (value.charAt(lastspace - 1) === '.' || value.charAt(lastspace - 1) === ',') {
            lastspace = lastspace - 1;
          }
          value = value.substr(0, lastspace);
        }
      }

      return value + (tail || ' …');
    };
  })
