'use strict';

/**
 * @ngdoc overview
 * @name pycharmProjectsApp
 * @description
 * # pycharmProjectsApp
 *
 * Main module of the application.
 */
angular
  .module('preventure', [
    'ngMaterial',
    'ngAnimate',
    'ngAria',
    'ngCookies',
    'ngMessages',
    'ngResource',
    'ngSanitize',
    'ui.router',
    'ui.router.state.events'
  ])

	.config(['$stateProvider', '$injector', '$urlRouterProvider', '$httpProvider',function ($stateProvider, $injector, $urlRouterProvider, $httpProvider) {

		console.log("angular.config");




		$stateProvider


			.state('root', {
				url: '/',
				abstract: false,
				templateUrl: 'views/main.html', // template: '<div ui-view></div>',
				controller: 'MainCtrl',
				data: { ncyBreadcrumbSkip: true }//,
				//resolve: $injector.get('HomeCtrlResolveMap')
			})



    ;
		// For any unmatched url, redirect to /manage
		$urlRouterProvider.otherwise('/');


		/*
		 * HTTP Interceptors
		 */
		// httpResponseInterceptor to pass HTTP error codes (e.g. 404) back to the resolved HTTP promise
		// http interceptor returns errors to $resource calls that would otherwise just hang
		var interceptor = function ($location, $q, $log, $rootScope) {
			return {
				'responseError': function (rejection) {
					$log.error("$httpProvider.interceptor: Error -> %s", rejection.status);
					return $q.reject(rejection);
				}
			}
		};

	}])
	.run(['$rootScope',function($rootScope){
	    $rootScope
	        .$on('$stateChangeStart',
	            function(event, toState, toParams, fromState, fromParams,$document){
	                $(".loading").show();
	        });

	    $rootScope
	        .$on('$stateChangeSuccess',
	            function(event, toState, toParams, fromState, fromParams,$document){
	                $(".loading").hide();
	        });


	}]);
