'use strict';

angular.module('preventure')

    .factory('Home' ,['$log','ResponseDetailResource', function($log,ResponseDetailResource) {
        $log.info("homesvc :init")

        return{

          getResponseDetails:function(city,type){
            console.log("homeSvc -- getresponsedetails");
					return ResponseDetailResource.get({'city':city,'type':type}).$promise.then(function(response){

                        return response;
                    });
			}


        }
    }])
