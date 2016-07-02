/* global angular, document, window */
'use strict';
angular.module('starter.controllers', ['ngCookies','app.services','ngMap'])

.config(['$httpProvider', '$ionicConfigProvider' ,function($httpProvider, $ionicConfigProvider){
  $httpProvider.defaults.headers.post ={
    'Content-Type': 'application/json; charset=utf-8'
  };
  $ionicConfigProvider.scrolling.jsScrolling(false);
}])

.controller('AppCtrl', function($log, $scope, $state, $ionicModal, $ionicPopup, $timeout, $ionicSideMenuDelegate, API) {
    // Form data for the login modal
    $scope.isExpanded = false;
    $scope.hasHeaderFabLeft = false;
    $scope.hasHeaderFabRight = false;

    var navIcons = document.getElementsByClassName('ion-navicon');
    for (var i = 0; i < navIcons.length; i++) {
        navIcons.addEventListener('click', function() {
            this.classList.toggle('active');
        });
    }

    ////////////////////////////////////////
    // Layout Methods
    ////////////////////////////////////////

    $scope.hideNavBar = function() {
        document.getElementsByTagName('ion-nav-bar')[0].style.display = 'none';
    };

    $scope.showNavBar = function() {
        document.getElementsByTagName('ion-nav-bar')[0].style.display = 'block';
    };

    $scope.noHeader = function() {
        var content = document.getElementsByTagName('ion-content');
        for (var i = 0; i < content.length; i++) {
            if (content[i].classList.contains('has-header')) {
                content[i].classList.toggle('has-header');
            }
        }
    };

    $scope.setExpanded = function(bool) {
        $scope.isExpanded = bool;
    };

    $scope.setHeaderFab = function(location) {
        var hasHeaderFabLeft = false;
        var hasHeaderFabRight = false;

        switch (location) {
            case 'left':
                hasHeaderFabLeft = true;
                break;
            case 'right':
                hasHeaderFabRight = true;
                break;
        }

        $scope.hasHeaderFabLeft = hasHeaderFabLeft;
        $scope.hasHeaderFabRight = hasHeaderFabRight;
    };

    $scope.hasHeader = function() {
        var content = document.getElementsByTagName('ion-content');
        for (var i = 0; i < content.length; i++) {
            if (!content[i].classList.contains('has-header')) {
                content[i].classList.toggle('has-header');
            }
        }

    };

    $scope.hideHeader = function() {
        $scope.hideNavBar();
        $scope.noHeader();
    };

    $scope.showHeader = function() {
        $scope.showNavBar();
        $scope.hasHeader();
    };

    $scope.clearFabs = function() {
        var fabs = document.getElementsByClassName('button-fab');
        if (fabs.length && fabs.length > 1) {
            fabs[0].remove();
        }
    };

    $scope.setMenu = function(bool){
      $ionicSideMenuDelegate.toggleRight(bool);
    }

    $scope.setChosenObs = function (obs){
      $scope.target = obs;
      API.request("Vote/GetVoteCount", {ObservationId: obs.ObservationId})
        .then(
          function onSuccess(res){
            $scope.target.VoteCount = res.data.Result.VoteCount;
            $scope.setMenu(true);
          },
          function onError(res){
            API.responseAlert(res);
          }
        )
    }

    $scope.goAttachments = function(){
      $scope.setMenu(false);
      $state.go("app.gallery", {target: $scope.target})
    }

    $scope.Vote = function(op){
      $log.debug(typeof op);
      if(op == "Add" || op == "Remove")
        API.request("Vote/"+op, {ObservationId: $scope.target.ObservationId})
          .then(
            function onSuccess(res){
              $log.debug(res);
              if(res.data.Result.Footer.IsSuccess){
                $scope.target.VoteCount = res.data.Result.VoteCount;
                $scope.target.Style = op;
              }
              else API.statusAlert(res);
            },
            function onError(res){
              API.responseAlert(res);
            }
          )
      else $ionicPopup.alert({
        title:"Wow!", template:"<center>Nice Trick Pal.</center>"
      })
    }
})

.controller('LoginCtrl', function($scope, $log, $timeout, $stateParams, ionicMaterialInk, API, $state) {
  $scope.$parent.clearFabs();
  $timeout(function () {
    $scope.$parent.hideHeader();
  }, 0);
  ionicMaterialInk.displayEffect();

  $scope.logindata = {};

  $scope.login = function () {
    var data = $scope.logindata;
    API.request("Account/Login", data)
      .then(
        function onSuccess(res) {
          if (res.data.Footer.IsSuccess) {
            $log.debug(res);
            // API.UserId = res.data.UserId;
            $state.go("app.profile");
          }
          else API.statusAlert(res)
        },
        function onError(res) {
          API.responseAlert(res)
        }
      )
  }
})

.controller('RegisterCtrl', function($scope, $stateParams, $ionicPopup, ionicMaterialInk, API, $state) {
    $scope.$parent.showHeader();
    $scope.$parent.clearFabs();
    $scope.$parent.setExpanded(false);
    $scope.isExpanded = true;
    ionicMaterialInk.displayEffect();
    $scope.regdata = {};

    $scope.register = function(){
      var regdata = $scope.regdata;
      regdata.Header = null;
      API.request("Account/Register", regdata)
        .then(
          function onSuccess(res){
            if(res.data.Footer.IsSuccess){
              $state.go("app.login");
            }
            else API.statusAlert(res);
          },
          function onError(res){
            API.responseAlert(res);
          }
        );
    }
})

.controller('ProfileCtrl', function($scope, $log, $state, $stateParams, $timeout, $ionicLoading, $ionicPopup, ionicMaterialMotion, ionicMaterialInk, API) {
    // Set Header
    $scope.$parent.showHeader();
    $scope.$parent.clearFabs();
    $scope.$parent.setExpanded(false);
    $scope.$parent.setHeaderFab(false);
    $scope.isExpanded = false;
    $scope.hasHeaderFabLeft = false;
    $scope.hasHeaderFabRight = false;

    // Set Motion
    $timeout(function() {
        ionicMaterialMotion.slideUp({
            selector: '.slide-up'
        });
    }, 300);

    $timeout(function() {
        ionicMaterialMotion.fadeSlideInRight({
            startVelocity: 3000
        });
    }, 700);

    // Set Ink
    ionicMaterialInk.displayEffect();

    //Set map
    var map;
    $scope.$on('mapInitialized', function(evt, evtMap) {
      map = evtMap;
    });

    //Marker Functions
    var vm = this;
    vm.addMarker = function(event) {
      var ll = event.latLng;
      var target = {Latitude:ll.lat(), Longitude:ll.lng()};

      //Checks if target is in Izmir
      API.mapReq(target.Latitude, target.Longitude)
        .then(
          function onSuccess(res){
            var data = res.data.results;
            $log.debug(data);
            var result = sift.indexOf({"address_components": {"long_name":"İzmir"}},data);
            if(result>=0) $scope.target = target;
            else $ionicPopup.alert({
              title:"Hata",template:"<center>Tikladiginiz alan Izmir'de degildir.</center>"
            })
          },
          function onError(res){
            API.responseAlert(res);
          }
        );
      $scope.$apply();
    }

    //Marker Details
    $scope.goDetails = function(events, marker){
      $scope.$parent.setChosenObs(marker.obs);
    }

    //Get Observations
    API.request("Observation/List", {PageNumber: $stateParams.PageNumber, PageSize: 50})
      .then(
        function onSuccess(res){
          if(res.data.Footer.IsSuccess){
            $scope.observations = res.data.ObservationList;
            $log.debug($scope.observations);
          }
          else API.statusAlert(res);
        },
        function onError(res){
          API.responseAlert(res);
        }
      );

    //Creating Observation Click Control
    $scope.createObs = function(){
      if ($scope.target) $state.go("app.listView", {target: $scope.target})
      else $ionicPopup.alert({
        title:"Hata",template:"<center>Gozlemin olusturulacagi yeri secmeniz gerekiyor.</center>"
      })
    };
    // API.request("Categories/GetCategories", {})
    //   .then(
    //     function onSuccess(res){
    //       API.responseAlert(res);
    //     },
    //     function onError(res){
    //       API.responseAlert(res);
    //     }
    //   );
})

.controller('CreateObsCtrl', function($scope, $log, $ionicPopup, $ionicLoading, $stateParams, $timeout, $q, ionicMaterialMotion, ionicMaterialInk, $state, API) {
  $scope.$parent.showHeader();
  $scope.$parent.setExpanded(false);
  $scope.$parent.setHeaderFab(false);
  // $scope.isExpanded = false;
  // $scope.hasHeaderFabLeft = false;
  // $scope.hasHeaderFabRight = false;

    $scope.obs = {};
    $scope.attachments = [];
    $timeout(function() {
        ionicMaterialMotion.fadeSlideIn({
            selector: '.animate-fade-slide-in .item'
        });
    }, 200);

    // Activate ink for controller
    ionicMaterialInk.displayEffect();

    //Image Upload Function
    var promises = [];
    var UploadImage = function(file, id, promises){
      var d = $q.defer();
      API.request("Image/Upload", {ImageFile: file, ObservationId: id})
        .then(
          function onSuccess(res){
            if(res.data.Footer.IsSuccess){
              d.resolve();
            }
            else {
              d.reject(res);
            }
          },
          function onError(res){
            d.reject(res);
          }
        );
      promises.push(d.promise);
    }

    $scope.send = function(){
      $ionicLoading.show({template:"Gözlem Yükleniyor..."});
      var params = {};
      angular.extend(params, $scope.obs);
      params.CategoryId = $stateParams.category.CategoryId;
      params.Latitude = parseFloat($stateParams.target.Latitude);
      params.Longitude = parseFloat($stateParams.target.Longitude);
      API.request("Observation/Create", params)
        .then(
          function onSuccess(res){
            if(res.data.Footer.IsSuccess){
              angular.forEach($scope.attachments, function(file, key){
                UploadImage(file, res.data.ObservationId, promises);
              })
              $q.all(promises).then(function(results){
                var failIndex = sift.indexOf({success: false},results);
                if(failIndex>=0){
                  $ionicLoading.hide();
                  $ionicPopup.alert({
                    title:"Basarisiz",template: JSON.stringify(results[failIndex])
                  });
                }
                else{
                  $ionicLoading.hide();
                  $ionicPopup.alert({
                    title:"Basarili",template:"<center>Gozlem Kaydedildi.</center>"
                  }).then(function(res){$state.go("app.profile");});
                }
              })
            }
            else API.statusAlert(res);
          },
          function onError(res){
            API.responseAlert(res);
          }
        )
    }
})

.controller('ListViewCtrl', function($scope, $state, $log, $stateParams, $timeout, ionicMaterialInk, ionicMaterialMotion, API) {
    $scope.$parent.showHeader();
    $scope.$parent.setExpanded(false);
    $scope.$parent.setHeaderFab(false);
    $scope.isExpanded = false;
    $scope.hasHeaderFabLeft = false;
    $scope.hasHeaderFabRight = false;

    // Activate ink for controller
    ionicMaterialInk.displayEffect();

    ionicMaterialMotion.pushDown({
        selector: '.push-down'
    });
    ionicMaterialMotion.fadeSlideInRight({
        selector: '.animate-fade-slide-in .item'
    });

    $scope.ShowFullScreen = function (att){
      window.FullScreenImage.showImageBase64(att, "Gozlemden Ek", "jpg")
    }
    $scope.categories = API.categories;

    if($stateParams.target) $log.debug("target Var");

    API.request("Categories/GetCategories", {})
      .then(
        function onSuccess(res){
          if(res.data.Footer.IsSuccess){
            API.categories = res.data.CategoryList;
          }
          else API.statusAlert(res);
        },
        function onError(res){
          API.responseAlert(res);
        }
      )

    $scope.createObs = function(cat){
      $log.debug($stateParams.target);
      $state.go("app.createObs", {target: $stateParams.target, category: cat})
    }



})

.controller('GalleryCtrl', function($scope, $q, $stateParams, $timeout, $log, $ionicLoading, ionicMaterialInk, ionicMaterialMotion, API) {
    $scope.$parent.showHeader();
    $scope.$parent.setExpanded(false);
    $scope.$parent.setHeaderFab(false);

    // Activate ink for controller
    ionicMaterialInk.displayEffect();

    ionicMaterialMotion.pushDown({
        selector: '.push-down'
    });
    ionicMaterialMotion.fadeSlideInRight({
        selector: '.animate-fade-slide-in .item'
    });

    $ionicLoading.show({template:"Yukleniyor..."});
    $scope.pics = [];
    // var files = $stateParams.target.Attachment;
    // angular.forEach(files, function(file, key){
    //   var fileID = file.split(".")[0];
    //   API.request("Image/Download",{ObservationId: $stateParams.target.ObservationId})
    //     .then(
    //       function onSuccess(res){
    //         if(res.data.Footer.IsSuccess){
    //
    //         }
    //         else API.statusAlert(res);
    //       },
    //       function onError(res){
    //         API.responseAlert(res);
    //       }
    //     )
    // });
    API.request("Image/Download",{ObservationId: $stateParams.target.ObservationId})
      .then(
        function onSuccess(res){
          if(res.data.Footer.IsSuccess){
            $scope.pics = res.data.ImageFile;
            $log.debug($scope.pics);
            $ionicLoading.hide();
          }
          else {
            $ionicLoading.hide();
            API.statusAlert(res);
          }
        },
        function onError(res){
          $ionicLoading.hide();
          API.responseAlert(res);
        }
      );
    })

.directive("fileread", [function () {
    return {
        scope: {
            fileread: "="
        },
        link: function (scope, element, attributes) {
            element.bind("change", function (changeEvent) {
                angular.forEach(changeEvent.target.files, function(file, key){
                    var reader = new FileReader();
                    reader.onload = function(event) {
                      scope.fileread.push(event.target.result);
                    };
                    reader.readAsDataURL(file);
                });
            });
        }
    }
}]);
