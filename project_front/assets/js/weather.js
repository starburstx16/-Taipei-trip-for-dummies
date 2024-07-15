
// 獲取天氣資訊面板的元素
var weatherPanel = document.getElementById("weather-panel");
var weatherIcon = document.getElementById("weather-icon");

// 當用戶點擊天氣圖標時,面板就會顯示出來
weatherIcon.addEventListener("click", function (event) {
    event.stopPropagation();
    weatherPanel.classList.add('show');
    setTimeout(() => {
        weatherPanel.style.opacity = '1';
    }, 1); // 讓CSS transition生效
});

// 當用戶點擊面板以外的區域時,面板就會隱藏
document.addEventListener("click", function (event) {
    if (!event.target.closest(".weather-panel") && event.target !== weatherIcon) {
        weatherPanel.style.opacity = '0';
        setTimeout(() => {
            weatherPanel.classList.remove('show');
        }, 500); // 等待CSS transition完成
    }
});

var weatherConditions = new XMLHttpRequest();
var cObj;

// GET THE CONDITIONS
weatherConditions.open("get", "https://opendata.cwa.gov.tw/api/v1/rest/datastore/F-C0032-001?Authorization=your_api_key", true);
weatherConditions.send();

weatherConditions.onload = function () {
    if (weatherConditions.status === 200) {
        cObj = JSON.parse(weatherConditions.responseText);
        console.log(cObj);
        // Taipei
        var Taipei = cObj.records.location[5].locationName

        // description
        var description = cObj.records.location[5].weatherElement[0].time[0].parameter.parameterName;

        // maxtemp
        var MaxareaTemp = cObj.records.location[5].weatherElement[4].time[0].parameter.parameterName;
        var areaTempunit1 = cObj.records.location[5].weatherElement[4].time[0].parameter.parameterUnit;

        // mintemp
        var MinareaTemp = cObj.records.location[5].weatherElement[2].time[0].parameter.parameterName;
        var areaTempunit2 = cObj.records.location[5].weatherElement[2].time[0].parameter.parameterUnit;

        document.getElementById("city").innerHTML = Taipei;
        document.getElementById("description").innerHTML = description;
        //document.getElementById("station").innerHTML = "地區：" + taipeiarea;
        document.getElementById("maxtemp").innerHTML = MaxareaTemp + "&deg" + areaTempunit1;
        document.getElementById("mintemp").innerHTML = MinareaTemp + "&deg" + areaTempunit2;
    }
};

document.addEventListener("DOMContentLoaded", function() {
    // 呼叫 Google Geolocation API 獲取用戶的當前位置
    navigator.geolocation.getCurrentPosition(function(position) {
        // 獲取緯度和經度
        var latitude = position.coords.latitude;
        var longitude = position.coords.longitude;

        // 使用 Google Geocoding API 將經緯度轉換為行政區名稱
        var geocodingApiUrl = "https://maps.googleapis.com/maps/api/geocode/json?latlng=" + latitude + "," + longitude + "&key=api_key";

        // 發送 GET 請求以獲取行政區名稱
        fetch(geocodingApiUrl)
            .then(response => response.json())
            .then(data => {
                var areaName = getAreaName(data);
                if (areaName) {
                    var apiUrl = getApiUrl(areaName);
                    console.log(apiUrl); // 在此處確認 apiUrl 是否有值
                    if (apiUrl) {
                        // 只有在 apiUrl 有值的情況下才發送天氣請求
                        sendWeatherRequest(apiUrl);
                    }
                }
            })
            .catch(error => console.error("Error:", error));
    });

    // 解析 Geocoding API 的回應以獲取行政區名稱
    function getAreaName(data) {
        var results = data.results;
        if (results && results.length > 0) {
            for (var i = 0; i < results.length; i++) {
                var addressComponents = results[i].address_components;
                for (var j = 0; j < addressComponents.length; j++) {
                    var types = addressComponents[j].types;
                    if (types.includes("administrative_area_level_2")) {
                        var areaName = addressComponents[j].long_name;
                        return areaName;
                    }
                }
            }
        }
        return null;
    }

    function getApiUrl(areaName) {
        var dict = {
            '北投區': 'https://opendata.cwa.gov.tw/api/v1/rest/datastore/F-D0047-061?Authorization=your_api_key&locationName=%E5%8C%97%E6%8A%95%E5%8D%80&elementName=',
            '士林區': 'https://opendata.cwa.gov.tw/api/v1/rest/datastore/F-D0047-061?Authorization=your_api_key&locationName=%E5%A3%AB%E6%9E%97%E5%8D%80&elementName=',
            '內湖區': 'https://opendata.cwa.gov.tw/api/v1/rest/datastore/F-D0047-061?Authorization=your_api_key&locationName=%E5%85%A7%E6%B9%96%E5%8D%80&elementName=',
            '中山區': 'https://opendata.cwa.gov.tw/api/v1/rest/datastore/F-D0047-061?Authorization=your_api_key&locationName=%E4%B8%AD%E5%B1%B1%E5%8D%80&elementName=',
            '大同區': 'https://opendata.cwa.gov.tw/api/v1/rest/datastore/F-D0047-061?Authorization=your_api_key&locationName=%E5%A4%A7%E5%90%8C%E5%8D%80&elementName=',
            '松山區': 'https://opendata.cwa.gov.tw/api/v1/rest/datastore/F-D0047-061?Authorization=your_api_key&locationName=%E6%9D%BE%E5%B1%B1%E5%8D%80&elementName=',
            '南港區': 'https://opendata.cwa.gov.tw/api/v1/rest/datastore/F-D0047-061?Authorization=your_api_key&locationName=%E5%8D%97%E6%B8%AF%E5%8D%80&elementName=',
            '中正區': 'https://opendata.cwa.gov.tw/api/v1/rest/datastore/F-D0047-061?Authorization=your_api_key&locationName=%E4%B8%AD%E6%AD%A3%E5%8D%80&elementName=',
            '萬華區': 'https://opendata.cwa.gov.tw/api/v1/rest/datastore/F-D0047-061?Authorization=your_api_key&locationName=%E8%90%AC%E8%8F%AF%E5%8D%80&elementName=',
            '信義區': 'https://opendata.cwa.gov.tw/api/v1/rest/datastore/F-D0047-061?Authorization=your_api_key&locationName=%E4%BF%A1%E7%BE%A9%E5%8D%80&elementName=',
            '大安區': 'https://opendata.cwa.gov.tw/api/v1/rest/datastore/F-D0047-061?Authorization=your_api_key&locationName=%E5%A4%A7%E5%AE%89%E5%8D%80&elementName=',
            '文山區': 'https://opendata.cwa.gov.tw/api/v1/rest/datastore/F-D0047-061?Authorization=your_api_key&locationName=%E6%96%87%E5%B1%B1%E5%8D%80&elementName='
        };
        return dict.hasOwnProperty(areaName) ? dict[areaName] : null;
    }

    function sendWeatherRequest(apiUrl) {
        var weatherForecast = new XMLHttpRequest();
        var fObj;

        // 發送請求
        weatherForecast.open("GET", apiUrl, true);
        weatherForecast.send();

        // 處理回應
        weatherForecast.onload = function () {
            if (weatherForecast.status === 200) {
                fObj = JSON.parse(weatherForecast.responseText);
                console.log(fObj);

                // 在這裡處理天氣資料並更新網頁內容
            }
        


            // title
            var Taipeiarea = fObj.records.locations[0].location[0].locationName;

            var area_raw = fObj.records.locations[0].location[0].locationName;

            // weather situation
            var weatherSituation = fObj.records.locations[0].location[0].weatherElement[1].description;

            // temperature
            var currentTemp = fObj.records.locations[0].location[0].weatherElement[3].description;

            // rainPrecent
            var rainPrecent = fObj.records.locations[0].location[0].weatherElement[7].description;
            rainPrecent = rainPrecent.substring(3);

            //document.getElementById("area").innerHTML = "臺北市大安區" + area_raw;
            //document.getElementById("Taipeiarea").innerHTML =  Taipeiarea;
            document.getElementById("r1c1").innerHTML = "日期";
            document.getElementById("r1c2").innerHTML = weatherSituation;
            document.getElementById("r1c3").innerHTML = currentTemp;
            document.getElementById("r1c4").innerHTML = rainPrecent;

            // date
            var date_raw = fObj.records.locations[0].location[0].weatherElement[1].time[3].startTime;
            date_raw = date_raw.substring(5, 11);

            // weather situation
            weatherSituation = fObj.records.locations[0].location[0].weatherElement[1].time[3].elementValue[0].value;

            // temperature
            currentTemp = fObj.records.locations[0].location[0].weatherElement[3].time[3].elementValue[0].value;

            // rainPrecent
            rainPrecent = fObj.records.locations[0].location[0].weatherElement[7].time[2].elementValue[0].value;

            document.getElementById("area").innerHTML = area_raw + "天氣預報";
            document.getElementById("r2c1").innerHTML = date_raw;
            document.getElementById("r2c2").innerHTML = weatherSituation;
            document.getElementById("r2c3").innerHTML = currentTemp + "&deg";
            document.getElementById("r2c4").innerHTML = rainPrecent + "%";

            date_raw = fObj.records.locations[0].location[0].weatherElement[1].time[11].startTime;
            date_raw = date_raw.substring(5, 11);

            // weather situation
            weatherSituation = fObj.records.locations[0].location[0].weatherElement[1].time[11].elementValue[0].value;

            // temperature
            currentTemp = fObj.records.locations[0].location[0].weatherElement[3].time[11].elementValue[0].value;

            // rainPrecent
            rainPrecent = fObj.records.locations[0].location[0].weatherElement[7].time[6].elementValue[0].value;

            document.getElementById("r3c1").innerHTML = date_raw;
            document.getElementById("r3c2").innerHTML = weatherSituation;
            document.getElementById("r3c3").innerHTML = currentTemp + "&deg";
            document.getElementById("r3c4").innerHTML = rainPrecent + "%";

            date_raw = fObj.records.locations[0].location[0].weatherElement[1].time[19].startTime;
            date_raw = date_raw.substring(5, 11);

            // weather situation
            weatherSituation = fObj.records.locations[0].location[0].weatherElement[1].time[19].elementValue[0].value;

            // temperature
            currentTemp = fObj.records.locations[0].location[0].weatherElement[3].time[19].elementValue[0].value;

            // rainPrecent
            rainPrecent = fObj.records.locations[0].location[0].weatherElement[7].time[10].elementValue[0].value;

            document.getElementById("r4c1").innerHTML = date_raw;
            document.getElementById("r4c2").innerHTML = weatherSituation;
            document.getElementById("r4c3").innerHTML = currentTemp + "&deg";
            document.getElementById("r4c4").innerHTML = rainPrecent + "%";

            date_raw = fObj.records.locations[0].location[0].weatherElement[1].time[27].startTime;
            date_raw = date_raw.substring(5, 11);

            // weather situation
            weatherSituation = fObj.records.locations[0].location[0].weatherElement[1].time[27].elementValue[0].value;

            // temperature
            currentTemp = fObj.records.locations[0].location[0].weatherElement[3].time[27].elementValue[0].value;

            // rainPrecent
            rainPrecent = fObj.records.locations[0].location[0].weatherElement[7].time[14].elementValue[0].value;

            document.getElementById("r5c1").innerHTML = date_raw;
            document.getElementById("r5c2").innerHTML = weatherSituation;
            document.getElementById("r5c3").innerHTML = currentTemp + "&deg";
            document.getElementById("r5c4").innerHTML = rainPrecent + "%";
        }
    };
});
