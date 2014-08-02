var centerLan = 31.534559;
var centerLon = 34.756404;
var currentAlarms =[];
var map;

function currAlarm (region , time,lat,lng) {
	var curr = new Date().getTime();
 	var item ={
  		cities : [],
  		region : region,
  		shelter: time,
  		created : curr,
  		lat: lat,
  		lng:lng
	};
	return item;
}

$(window).resize(function(){
	initMapCss();
});

function initialize() {
	$.ajaxSetup({cache:false});
	initMapCss();
	var mapOptions = {
		center : new google.maps.LatLng(centerLan, centerLon),
		zoom : 10,
		panControl: false,
   		zoomControl: false,
   		scaleControl: false
	};
	map = new google.maps.Map(document.getElementById("map"), mapOptions);
	refreshData();
}

function initMapCss() {
	$("#map").css('width', $(window).width() + "px");
	$("#map").css('height', $(window).height() + "px");
}

google.maps.event.addDomListener(window, 'load', initialize);

function setAlarm(lon, lat, time) {
	var alarmPosition = {
		strokeColor : '#FF0000',
		strokeOpacity : 0.4,
		strokeWeight : 0,
		fillColor : '#FF0000',
		fillOpacity : 0.35,
		map : map,
		center : new google.maps.LatLng(lon, lat),
		radius : Math.sqrt(150) * 200
	};
	// Add the circle for this city to the map.
	var cityCircle = new google.maps.Circle(alarmPosition);
	//remove the circle after some time
	setTimeout(function() {
		cityCircle.setMap(null);
	}, time * 1000);
}

var refreshData = function() {
	//Retrieveing the Json data output from Pikud Ha Oref
	$.ajax({
		//url : "test.php",
		url : "http://www.israelredcolor.com/alert.php",
		type : 'GET',
		success : function(res) {
			// get regions array from Pikud Ha Oref
			res = res.split(",");
			//console.log("res before : "+res);
			res.splice(res.length-1,1);
			//if (res[0]==""){res="";} //testing
			//if (res[0]==" 	"){res="";}
			//console.log(res);
			switch (res.length){
				case 1: {map.setZoom(12);break;}
				case 2: {map.setZoom(11);break;}
				//If the Json data output string from Pikud Ha Oref returns an empty arrey then set zoom to the original value ,10.
				default: {map.setZoom(10);break;}
			}
			updateAlarmsArray();
			if (res.length>0)
			$.each(res, function(i, region) {
				$.ajax({
					url : "includes/json/regions.json",
					type : 'GET',
					data : "json",
					success : function(res) {
						if (!regionAlreadyExist(region)) {
							if($("#current_alarms").html()== "אין התרעות כרגע"){
								$("#current_alarms").html(" ");
							}
							playAlertSound();
							var tempRegion = currAlarm();
							tempRegion.region=region;
							
						$.each(res, function(i, item) {// get city names that match the region , from the regions json file
							if (item.region == region) {
									$.getJSON('http://maps.googleapis.com/maps/api/geocode/json?address=' + item.city + '&language=he&sensor=true', function(res) {
									// for each city get the coordinates from google
									$.each(res.results, function(i, f) {
										//console.log(item.city);
										var tmp = "" + item.city + ", ישראל";
										if (tmp == f.formatted_address || item.city==f.formatted_address) {
											$("#current_alarms").append(item.city+", ");
											//Creating new alarm
											setAlarm(f.geometry.location.lat, f.geometry.location.lng, item.time);
											// This will set the map center to the center of the alarm location
											map.setCenter(new google.maps.LatLng(f.geometry.location.lat, f.geometry.location.lng));
											//Return the zoom attribute to its original value after the alarm.
											//setTimeout(function(){map.setCenter(new google.maps.LatLng(centerLan, centerLon));map.setZoom(10);},item.time*500);
											//(,item.time,f.geometry.location.lat,f.geometry.location.lng));
											tempRegion.shelter=item.time;
											tempRegion.lat = f.geometry.location.lat;
											tempRegion.lng = f.geometry.location.lng;
											tempRegion.cities.push(item.city);
										}
									});
								});
							}
						});
						currentAlarms.push(tempRegion);
						//console.log(currentAlarms);
						}
					},
					error : function(data) {
						console.log("error loading city names");
					}
				});
			});
		},
		error : function(data) {
			console.log("error loading regions");
		}
	});
	setTimeout(function() {
		refreshData();
	}, 4000);
};

function regionAlreadyExist(region){
	for (var i=0; i< currentAlarms.length;i++){
		if (currentAlarms[i].region == region){
			//console.log(region + " Already exists in current alarms array");
			return true;
		}
	}
	return false;
}

function updateAlarmsArray(){
	for (var i=0; i< currentAlarms.length;i++){
		if((currentAlarms[i].created + currentAlarms[i].shelter * 1000) < new Date().getTime()){
			if (i==0){
				currentAlarms=[];
				updateList();
				}
			else{
			currentAlarms.splice(i,1);
			updateList();
			}
/*
			if (i>0){ 
				map.setCenter(new google.maps.LatLng(currentAlarms[i-1].lat, currentAlarms[i-1].lng));
			}
			i--;*/

		}
	}
	//console.log("CurrentAllarms size: " + currentAlarms.length);
	if(currentAlarms.length==0 ){
		$("#current_alarms").html(" ");
		$("#current_alarms").html("אין התרעות כרגע");
	}
}

function updateList(){
	$("#current_alarms").html(" ");
	for (var i=0;i<currentAlarms.length;i++){
		for (var j=0;j<currentAlarms[i].cities.length;j++){
			if ($("#current_alarms").text().indexOf(currentAlarms[i].cities[j]) == -1)
				$("#current_alarms").append(currentAlarms[i].cities[j]+", ");
		}
	}
}


function playAlertSound() {
	embed = document.createElement("embed");
	embed.setAttribute("src", "sounds/alert.mp3");
	embed.setAttribute("hidden", true);
	embed.setAttribute("autostart", true);
	document.body.appendChild(embed);
}