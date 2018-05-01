'use strict';

angular.module('preventure')


.factory('ResponseDetailResource', function($resource, Api) {
	        return $resource("/api/response/details/:city/:type",{},
	    	        {'get': {method: 'GET',transformResponse: Api.getResponseTransformer()}}
	            )
})




