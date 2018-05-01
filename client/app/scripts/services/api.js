'use strict';

// Service to API calls and simplify error handling
angular.module('preventure')

	.factory('Api', function ($http, $log, $q) {

		$log.info("Api factory init");

		function getResolver(deferred, resultPropertyName) {
			// return a response handler function
			return function resolver(result) {
				if (result && result.data && result.data.ok) {
					if (resultPropertyName) {
						// resolve with response[resultPropertyName] if it exists
						if (result.data.response[resultPropertyName]) {
							// resolve
							deferred.resolve(result.data.response[resultPropertyName]);
						} else {
							// failure - resultPropertyName does not exist
							$log.error("Api.get/post: `%s` attribute of result.data.response does not exist", resultPropertyName)
							deferred.reject(addError(result, "result.data.response."+resultPropertyName+" does not exist."));
						}
					} else {
						// no resultPropertyName so resolve the promise with the full response payload
						deferred.resolve(result.data.response);
					}
				} else {
					// failure
					deferred.reject(result);
				}
			}
		};

		function getFailure(deferred) {
			// return a failure handler function that rejects the promise
			return function failure(reason) {
				deferred.reject(reason);
			}
		};

		function addError(result, msg, code) {
			if (!result) result = {};
			result.error = {
				message: msg,
				code: code
			};
			return result;
		}

		return {

			// make a $http.get call to the resourceUri
			// reject if the response is not OK
			// resultPropertyName is the attribute of result.data.response that you expect back
			get: function (resourceUri, resultPropertyName, params) {
				$log.warn("api.get-> %s",resourceUri)
				var deferred = $q.defer();
				$http.get(resourceUri, params).then(getResolver(deferred,resultPropertyName), getFailure(deferred));
				return deferred.promise;
			},

			post: function (resourceUri, jsonPayload, resultPropertyName) {
				$log.warn("api.post-> %s",resourceUri)
				var deferred = $q.defer();
				$http.post(resourceUri, jsonPayload).then(getResolver(deferred,resultPropertyName), getFailure(deferred));
				return deferred.promise;
			},
            feedback: function (feedback) {
                // Update the employee data
                $log.warn('called feedback service');
                return this.post('/api/feedback', feedback);
            },

			// return a transformer function
			// use with $http or $resource calls
			// if the response data contains an error then returns a $q.reject() value
			getResponseTransformer : function (resultPropertyName) {
				return function responseTransformer(result, headers) {

					// attempt to parse result as JSON
					if (typeof result == "string") {
						try {
		                    result = angular.fromJson(result);
						} catch (e) {
							$log.error("Api.responseTransformer: malformed JSON returned : %s", result)
							return $q.reject(result);
						}
					}

					/* a successful response looks like this :
						{ ok: true,
						  response : {
						    <resultPropertyName>:<anything>     e.g: user : { name : "Jack", id:21 }
						  }

					 */


                    // $log.info(result);
					// $log.info("Api.responseTransformer -> %s", resultPropertyName);
                    if (result && result.ok) {
						if (resultPropertyName) {
							// resolve with response[resultPropertyName] if it exists
							if (result.response[resultPropertyName]) {
								// resolve
								return result.response[resultPropertyName];
							} else {
								// failure - resultPropertyName does not exist
								$log.error("Api.get/post: `%s` attribute of result.response does not exist", resultPropertyName)
								return $q.reject(addError(result, "result.response."+resultPropertyName+" does not exist."));
							}
						} else {
							// no resultPropertyName so resolve the promise with the full response payload
							return result.response;
						}
					} else {
						// failure
                        $log.error("responseTransformer: REJECTED because `result` is missing or result.ok = false");
                        $log.debug(result);
						return $q.reject(result);
					}
				}

			},

			// return a new array of the default transformers and ours appended so it runs last
			// use in a $resource definition
			// e.g.
			getResponseTransformerChain : function (resultPropertyName) {
				// return [this.getResponseTransformer(resultPropertyName)].concat($http.defaults.transformResponse)
				// strangely, adding to the front of the chain seems to have it execute last ????
				return [].concat($http.defaults.transformResponse, this.getResponseTransformer(resultPropertyName));
			}

		}
	});
