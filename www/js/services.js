angular.module("app.services",[])
.factory('API', ['$http', '$ionicPopup', '$cookies', function($http, $ionicPopup, $cookies){
  return {
    home: "http://merdivanweb.eu-gb.mybluemix.net",
    geocoding: "http://maps.googleapis.com/maps/api/geocode/json",
    request: function (endpoint, params) {
      return $http({withCredentials: true, url:this.home+"/api/"+endpoint, data: params,
        headers:{'Content-Type': 'application/json; charset=utf-8'}, method: 'POST'});
    },
    mapReq: function(lat,lng){
      //params: latlng:"{{lat}},{{lng}}", sensor:true
      return $http.get(this.geocoding+"?latlng="+lat+","+lng+"&sensor=true");
    },
    responseAlert : function(res){
      return $ionicPopup.alert({
        title: "Error Code: " + (res.status ? res.status + " " + res.statusText : "0"), template: JSON.stringify(res)
      })
    },
    statusAlert: function(res){
      return $ionicPopup.alert({
        title: "Error Code: " + (res.data.Footer.ErrorCode ? res.data.Footer.ErrorCode : "0"), template: res.data.Footer.ErrorMessage
      })
    },
    categories: [
      {Category: "Çöp",
      CategoryId: "8f5f7256-c3a6-4d14-aeb0-a39c0e280b25"}
    ],
    UserId: null,
  }
}])
