'use strict';

formsAngular.controller('SearchCtrl', ['$scope', '$location', 'routingService', 'SubmissionsService',
    function ($scope, $location, routingService, SubmissionsService) {

  var currentRequest = '';

  $scope.handleKey = function (event) {
    if (event.keyCode === 27 && $scope.searchTarget.length > 0) {
      $scope.searchTarget = '';
    } else if ($scope.results.length > 0) {
      switch (event.keyCode) {
        case 38:
          // up arrow pressed
          if ($scope.focus > 0) {
            $scope.setFocus($scope.focus - 1);
          }
          if (typeof event.preventDefault === 'function') { event.preventDefault(); }
          break;
        case 40:
          // down arrow pressed
          if ($scope.results.length > $scope.focus + 1) {
            $scope.setFocus($scope.focus + 1);
          }
          if (typeof event.preventDefault === 'function') { event.preventDefault(); }
          break;
        case 13:
          if ($scope.focus != null) {
            $scope.selectResult($scope.focus);
          }
          break;
      }
    }
  };

  $scope.setFocus = function (index) {
    if ($scope.focus !== null) { delete $scope.results[$scope.focus].focussed; }
    $scope.results[index].focussed = true;
    $scope.focus = index;
  };

  $scope.selectResult = function (resultNo) {
    var result = $scope.results[resultNo];

    var part1Url;
    if (typeof $scope.fngViewName !== 'undefined') {
      part1Url = $scope.fngViewName;
    } else {
      if (typeof result.resource !== 'undefined') {
        part1Url = result.resource;
      } else {
        if (typeof $scope.fngModel !== 'undefined') {
          part1Url = $scope.fngModel;
        } else {
          console.error('Missing resource/model name for building url');
        }
      }
    }


    var url = routingService.buildOperationUrl('edit', part1Url, $scope.fngFormName, result.id);
    $location.path(url);
  };

  $scope.resultClass = function (index) {
    var resultClass = 'search-result';
    if ($scope.results && $scope.results[index].focussed) { resultClass += ' focus'; }
    return resultClass;
  };

  var clearSearchResults = function () {
    $scope.moreCount = 0;
    $scope.errorClass = '';
    $scope.results = [];
    $scope.focus = null;
  };

  $scope.$watch('searchTarget', function (newValue) {
    if (newValue && newValue.length > 0) {
      currentRequest = newValue;

      var options = {};

      if (typeof $scope.fngLimit !== 'undefined' && $scope.fngLimit !== '') {
        options.limit = $scope.fngLimit;
      }
      if (typeof $scope.fngFilter !== 'undefined' && $scope.fngFilter !== '') {
        options.find = $scope.fngFilter;
      }
      //if (typeof $scope.fngAggregate !== 'undefined' && $scope.fngAggregate !== '') {
      //  options.aggregate = $scope.fngAggregate;
      //}
      if (typeof $scope.fngOrder !== 'undefined' && $scope.fngOrder !== '') {
        options.order = $scope.fngOrder;
      }
      if (typeof $scope.fngSkip !== 'undefined' && $scope.fngSkip !== '') {
        options.skip = $scope.fngSkip;
      }

      var searchPromise;
      if (typeof $scope.fngModel !== 'undefined' && $scope.fngModel !== '') {
        searchPromise = SubmissionsService.searchModelPagedAndFilteredList($scope.fngModel, currentRequest, options);
      } else {
        searchPromise = SubmissionsService.searchPagedAndFilteredList(currentRequest, options);
      }

      searchPromise.success(function (data) {        // Check that we haven't fired off a subsequent request, in which
        // case we are no longer interested in these results
        if (currentRequest === newValue) {
          if ($scope.searchTarget.length > 0) {
            $scope.results = data.results;
            $scope.moreCount = data.moreCount;
            if (data.results.length > 0) {
              $scope.errorClass = '';
              $scope.setFocus(0);
            }
            $scope.errorClass = $scope.results.length === 0 ? 'error' : '';
          } else {
            clearSearchResults();
          }
        }
      }).error(function (data, status) {
        console.log('Error in search.js : ' + data + ' (status=' + status + ')');
      });
    } else {
      clearSearchResults();
    }
  }, true);

  $scope.$on('$routeChangeStart', function () {
    $scope.searchTarget = '';
  });

}])
  .directive('globalSearch', ['cssFrameworkService', function (cssFrameworkService) {
    return {
      restrict: 'AE',
      scope: {
        fngModel: '=',
        fngFilter: '=',
        fngLimit: '=',
        fngOrder: '=',
        fngSkip: '=',
        fngViewName: '=',
        fngFormName: '='
      },
      templateUrl: 'template/search-' + cssFrameworkService.framework() + '.html',
      controller: 'SearchCtrl'
    };
  }
  ]);
